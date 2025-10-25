import express from 'express';
import { requestNumber, getSMS, banNumber } from '../utils/smspool.js';
import { servicesCache } from './services.js'; // Import servicesCache from services route
import db from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';

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

    // Get user
    const user = db.database.users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

        // Get pricing from cache
    const pricing = servicesCache?.pricing?.[service.toLowerCase()]?.[country.toUpperCase()];

    if (!pricing) {
      return res.status(404).json({
        success: false,
        error: 'Service or country pricing not found in cache. Try refreshing services.',
      });
    }

    const apiPrice = pricing.smsPoolPrice;
    const userPrice = pricing.userPrice;

    // Check if user has enough balance
    if (user.balance < userPrice) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance',
        required: userPrice,
        balance: user.balance,
      });
    }

    // Request number from SMSPool (mock for now)
    const numberResult = {
      success: true,
      number: `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
      id: `order_${Date.now()}`,
    };

    // Deduct balance from user
    const newBalance = user.balance - userPrice;
    db.updateUser(userId, { balance: newBalance });

    // Create transaction record
    db.createTransaction({
      userId,
      type: 'purchase',
      amount: userPrice,
      status: 'completed',
      description: `${service} - ${country}`,
    });

    // Create order record
    const order = db.createOrder({
      userId,
      service: service.toLowerCase(),
      country: country.toUpperCase(),
      phoneNumber: numberResult.number,
      smsPoolOrderId: numberResult.id,
      apiPrice,
      userPrice,
      status: 'waiting_sms',
      expiresAt: Math.floor(Date.now() / 1000) + 600, // 10 minutes expiry
    });

    res.json({
      success: true,
      order: {
        id: order.id,
        service: order.service,
        country: order.country,
        phoneNumber: order.phoneNumber,
        userPrice: order.userPrice,
        status: order.status,
        expiresAt: order.expiresAt,
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
    const order = db.database.orders.find(
      o => o.id === parseInt(orderId) && o.userId === userId
    );

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
      // Update order status
      db.updateOrder(order.id, {
        status: 'expired',
      });

      return res.json({
        success: false,
        status: 'expired',
      });
    }

    // Mock SMS response (in production, poll SMSPool)
    const mockSmsCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Update order with SMS code
    db.updateOrder(order.id, {
      smsCode: mockSmsCode,
      status: 'received',
    });

    return res.json({
      success: true,
      code: mockSmsCode,
      status: 'received',
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

    const userOrders = db.database.orders.filter(o => o.userId === userId);

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

    const order = db.database.orders.find(
      o => o.id === parseInt(orderId) && o.userId === userId
    );

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

