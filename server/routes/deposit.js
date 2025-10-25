import express from 'express';
import axios from 'axios';
import crypto from 'crypto';
import { authMiddleware } from '../middleware/auth.js';
import db from '../db/index.js';

const router = express.Router();
const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY;
const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET; // Added IPN Secret
const NOWPAYMENTS_API_URL = 'https://api.nowpayments.io/v1';
const IPN_CALLBACK_URL = process.env.IPN_CALLBACK_URL;
const SUCCESS_URL = process.env.SUCCESS_URL || 'https://your-app-url.koyeb.app';
const CANCEL_URL = process.env.CANCEL_URL || 'https://your-app-url.koyeb.app';


/**
 * POST /api/deposit/create
 * Creates a new payment with NowPayments
 */
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.userId;

    const depositAmount = parseFloat(amount);

    if (!depositAmount || depositAmount < 1) {
      return res.status(400).json({
        success: false,
        error: 'Minimum deposit amount is $1.00',
      });
    }

    if (!NOWPAYMENTS_API_KEY) {
        console.error('NOWPAYMENTS_API_KEY is not set.');
        return res.status(500).json({
            success: false,
            error: 'Payment gateway not configured. Please set NOWPAYMENTS_API_KEY.',
        });
    }
    
    if (!IPN_CALLBACK_URL) {
        console.error('IPN_CALLBACK_URL is not set.');
        return res.status(500).json({
            success: false,
            error: 'Payment gateway not configured. Please set IPN_CALLBACK_URL.',
        });
    }

    // Generate a unique order ID for tracking
    const orderId = `deposit_${userId}_${Date.now()}`;

    // 1. Create the payment with NowPayments
    const paymentData = {
      price_amount: depositAmount,
      price_currency: 'usd',
      pay_currency: 'usdt', // User will select network (Polygon/Solana) on the payment page
      ipn_callback_url: IPN_CALLBACK_URL,
      order_id: orderId,
      order_description: `VerifyHub Deposit for User ${userId} - ${depositAmount} USD`,
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
    };

    const response = await axios.post(`${NOWPAYMENTS_API_URL}/payment`, paymentData, {
      headers: {
        'x-api-key': NOWPAYMENTS_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (response.data && response.data.payment_id) {
        // 2. Store a pending transaction record in your DB
        db.createTransaction({
            userId,
            type: 'deposit',
            amount: depositAmount,
            status: 'pending',
            description: `Deposit via NowPayments`,
            externalId: response.data.payment_id,
        });

        // 3. Return the payment URL to the client for redirection
        return res.json({
            success: true,
            paymentUrl: response.data.payment_url,
            paymentId: response.data.payment_id,
        });
    } else {
        console.error('NowPayments API failed to create payment:', response.data);
        return res.status(500).json({
            success: false,
            error: 'Failed to initiate payment with gateway.',
            details: response.data,
        });
    }

  } catch (error) {
    console.error('Error creating deposit:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error during deposit creation.',
      details: error.response?.data?.message || error.message,
    });
  }
});

/**
 * POST /api/deposit/ipn
 * Instant Payment Notification (IPN) endpoint for NowPayments to call
 * NOTE: This is a simplified mock. A real IPN endpoint requires HMAC validation.
 */
// Middleware to validate HMAC signature
const validateIpn = (req, res, next) => {
    if (!NOWPAYMENTS_IPN_SECRET) {
        console.error('NOWPAYMENTS_IPN_SECRET is not set. Skipping IPN validation.');
        return next(); // Proceed without validation if secret is missing (DEV ONLY)
    }

    const signature = req.get('x-nowpayments-sig');
    if (!signature) {
        console.error('IPN validation failed: x-nowpayments-sig header missing.');
        return res.status(403).send('IPN validation failed: Signature missing');
    }

    // NowPayments IPN sends the body as a JSON string, which Express converts to an object.
    // We need the raw body for HMAC validation. This requires a small change in server/index.js
    // to get the raw body, but for now, we'll stringify the parsed body as a temporary measure.
    // Use raw body buffer for true HMAC security.
    const body = req.rawBody || JSON.stringify(req.body);
    
    const hash = crypto
        .createHmac('sha512', NOWPAYMENTS_IPN_SECRET)
        .update(body)
        .digest('hex');

    if (hash !== signature) {
        console.error('IPN validation failed: Signature mismatch. Received:', signature, 'Expected:', hash);
        return res.status(403).send('IPN validation failed: Signature mismatch');
    }

    console.log('IPN validation successful.');
    next();
};

/**
 * POST /api/deposit/ipn
 * Instant Payment Notification (IPN) endpoint for NowPayments to call
 */
router.post('/ipn', validateIpn, async (req, res) => {
    const ipnData = req.body;
    console.log('Received IPN:', ipnData);

    // 1. Check payment status
    if (ipnData.payment_status === 'finished') {
        const paymentId = ipnData.payment_id;
        const priceAmount = parseFloat(ipnData.price_amount); // USD amount

        // 2. Find the corresponding pending transaction in your DB
        const transaction = db.database.transactions.find(t => t.externalId === paymentId && t.status === 'pending');
        
        if (transaction) {
            const userId = transaction.userId;
            const user = db.database.users.find(u => u.id === userId);

            // 3. Update the user's balance and mark the transaction as 'completed'
            if (user) {
                const newBalance = user.balance + priceAmount;
                db.updateUser(userId, { balance: newBalance });
                db.updateTransaction(transaction.id, { status: 'completed', amount: priceAmount });
                console.log(`User ${userId} balance updated: $${newBalance.toFixed(2)}`);
            } else {
                console.error(`IPN Error: User not found for transaction ${paymentId}`);
            }
        } else {
            console.error(`IPN Error: Pending transaction not found or already processed for ${paymentId}`);
        }
    } else if (ipnData.payment_status === 'failed' || ipnData.payment_status === 'expired') {
        // Handle failed/expired payments (e.g., mark transaction as failed)
        console.log(`IPN: Payment ${ipnData.payment_id} status is ${ipnData.payment_status}`);
    }

    // Always return 200 OK to NowPayments to acknowledge receipt
    res.status(200).send('IPN received and processed');
});


export default router;
