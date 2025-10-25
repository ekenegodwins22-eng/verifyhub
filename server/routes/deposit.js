import express from 'express';
import axios from 'axios';
import { authMiddleware } from '../middleware/auth.js';
import db from '../db/index.js';

const router = express.Router();
const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY;
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
router.post('/ipn', async (req, res) => {
    // In a real application, you would:
    // 1. Validate the HMAC signature in the header (x-nowpayments-sig)
    // 2. Check the payment_status (e.g., 'finished')
    // 3. Find the corresponding pending transaction in your DB using order_id or payment_id
    // 4. Update the user's balance and mark the transaction as 'completed'

    const ipnData = req.body;
    console.log('Received IPN:', ipnData);

    if (ipnData.payment_status === 'finished') {
        const paymentId = ipnData.payment_id;
        const priceAmount = parseFloat(ipnData.price_amount); // USD amount

        // Mock DB update for demonstration
        const transaction = db.database.transactions.find(t => t.externalId === paymentId && t.status === 'pending');
        if (transaction) {
            const userId = transaction.userId;
            const user = db.database.users.find(u => u.id === userId);

            if (user) {
                const newBalance = user.balance + priceAmount;
                db.updateUser(userId, { balance: newBalance });
                db.updateTransaction(transaction.id, { status: 'completed', amount: priceAmount });
                console.log(`User ${userId} balance updated: $${newBalance.toFixed(2)}`);
            }
        }
    }

    // Always return 200 OK to NowPayments to acknowledge receipt
    res.status(200).send('IPN received and processed');
});


export default router;
