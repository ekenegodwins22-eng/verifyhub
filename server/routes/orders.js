import express from 'express';
import { requestNumber, getSMS, calculateUserPrice, banNumber } from '../utils/smspool.js';
import db from '../db/index.js';
import { orders, users, transactions } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { eq, and } from 'drizzle-orm';

const router = express.Router();

/**
 * POST /api/orders/buy
 * Buy a new SMS number
 */
router.post('/buy', authMiddleware, async (req, res) => {
  try {
    const { service, country } = req.body;
    const userId = req.user.userId;

    if (!service || !country) {
      return res.status(400).json({
        success: false,
        error: 'Missing service or country',
      });
    }

    // Get user balance
    const user = db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .all()[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Sample pricing (in production, fetch from SMSPool)
    const samplePrices = {
      'telegram-US': 0.10,
      'telegram-UK': 0.12,
      'telegram-CA': 0.11,
      'google-US': 0.15,
      'google-UK': 0.17,
      'whatsapp-US': 0.20,
      'facebook-US': 0.18,
      'twitter-US': 0.25,
      'discord-US': 0.22,
      'instagram-US': 0.19,
      'tiktok-US': 0.30,
      'amazon-US': 0.35,
      'ebay-US': 0.28,
    };

    const key = `${service.toLowerCase()}-${country.toUpperCase()}`;
    const apiPrice = samplePrices[key] || 0.10;
    const userPrice = calculateUserPrice(apiPrice);

    // Check if user has enough balance
    if (user.balance < userPrice) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance',
        required: userPrice,
        balance: user.balance,
      });
    }

    // Request number from SMSPool
    const numberResult = await requestNumber(service, country);

    if (!numberResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Failed to get number from SMSPool',
        details: numberResult.error,
      });
    }

    // Deduct balance from user
    const newBalance = user.balance - userPrice;
    db.update(users)
      .set({
        balance: newBalance,
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .where(eq(users.id, userId))
      .run();

    // Create transaction record
    db.insert(transactions)
      .values({
        userId,
        type: 'purchase',
        amount: userPrice,
        status: 'completed',
        description: `${service} - ${country}`,
        createdAt: Math.floor(Date.now() / 1000),
      })
      .run();

    // Create order record
    const orderResult = db
      .insert(orders)
      .values({
        userId,
        service: service.toLowerCase(),
        country: country.toUpperCase(),
        phoneNumber: numberResult.number,
        smsPoolOrderId: numberResult.id,
        apiPrice,
        userPrice,
        status: 'waiting_sms',
        expiresAt: Math.floor(Date.now() / 1000) + 600, // 10 minutes expiry
        createdAt: Math.floor(Date.now() / 1000),
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .run();

    // Fetch the created order
    const createdOrder = db
      .select()
      .from(orders)
      .where(eq(orders.smsPoolOrderId, numberResult.id))
      .all()[0];

    res.json({
      success: true,
      order: {
        id: createdOrder.id,
        service: createdOrder.service,
        country: createdOrder.country,
        phoneNumber: createdOrder.phoneNumber,
        userPrice: createdOrder.userPrice,
        status: createdOrder.status,
        expiresAt: createdOrder.expiresAt,
      },
      newBalance,
    });
  } catch (error) {
    console.error('Buy order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order',
    });
  }
});

/**
 * GET /api/orders/:orderId/sms
 * Check for SMS code
 */
router.get('/:orderId/sms', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.userId;

    // Get order
    const order = db
      .select()
      .from(orders)
      .where(and(eq(orders.id, parseInt(orderId)), eq(orders.userId, userId)))
      .all()[0];

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    // If SMS already received, return it
    if (order.smsCode) {
      return res.json({
        success: true,
        code: order.smsCode,
        status: 'received',
      });
    }

    // Check if order expired
    if (Math.floor(Date.now() / 1000) > order.expiresAt) {
      // Ban the number
      await banNumber(order.smsPoolOrderId);

      // Update order status
      db.update(orders)
        .set({
          status: 'expired',
          updatedAt: Math.floor(Date.now() / 1000),
        })
        .where(eq(orders.id, order.id))
        .run();

      return res.json({
        success: false,
        status: 'expired',
      });
    }

    // Poll SMSPool for SMS
    const smsResult = await getSMS(order.smsPoolOrderId);

    if (smsResult.success && smsResult.code) {
      // Update order with SMS code
      db.update(orders)
        .set({
          smsCode: smsResult.code,
          status: 'received',
          updatedAt: Math.floor(Date.now() / 1000),
        })
        .where(eq(orders.id, order.id))
        .run();

      return res.json({
        success: true,
        code: smsResult.code,
        status: 'received',
      });
    }

    // Still waiting
    res.json({
      success: false,
      status: smsResult.status || 'waiting_sms',
    });
  } catch (error) {
    console.error('Get SMS error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check SMS',
    });
  }
});

/**
 * GET /api/orders
 * Get user's orders
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const userOrders = db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .all();

    res.json({
      success: true,
      orders: userOrders.map((order) => ({
        id: order.id,
        service: order.service,
        country: order.country,
        phoneNumber: order.phoneNumber,
        userPrice: order.userPrice,
        smsCode: order.smsCode,
        status: order.status,
        createdAt: order.createdAt,
        expiresAt: order.expiresAt,
      })),
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get orders',
    });
  }
});

/**
 * GET /api/orders/:orderId
 * Get specific order
 */
router.get('/:orderId', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.userId;

    const order = db
      .select()
      .from(orders)
      .where(and(eq(orders.id, parseInt(orderId)), eq(orders.userId, userId)))
      .all()[0];

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    res.json({
      success: true,
      order: {
        id: order.id,
        service: order.service,
        country: order.country,
        phoneNumber: order.phoneNumber,
        userPrice: order.userPrice,
        smsCode: order.smsCode,
        status: order.status,
        createdAt: order.createdAt,
        expiresAt: order.expiresAt,
      },
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get order',
    });
  }
});

export default router;

