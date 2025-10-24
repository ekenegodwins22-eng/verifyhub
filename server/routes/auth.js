import express from 'express';
import { verifyTelegramAuth, generateJWT } from '../utils/telegram.js';
import db from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/auth/login
 * Verify Telegram WebApp auth and create/update user
 */
router.post('/login', async (req, res) => {
  try {
    const { initData } = req.body;

    if (!initData) {
      return res.status(400).json({
        success: false,
        error: 'Missing initData',
      });
    }

    // Verify Telegram authentication
    const userData = verifyTelegramAuth(initData, process.env.TELEGRAM_BOT_TOKEN);

    if (!userData) {
      return res.status(401).json({
        success: false,
        error: 'Invalid Telegram authentication',
      });
    }

    // Check if user exists in database
    let user = db.getUser(userData.id);

    if (user) {
      // Update existing user
      user = db.updateUser(user.id, {
        username: userData.username || user.username,
        firstName: userData.first_name || user.firstName,
        lastName: userData.last_name || user.lastName,
      });
    } else {
      // Create new user
      user = db.createUser({
        telegramId: userData.id,
        username: userData.username || null,
        firstName: userData.first_name || null,
        lastName: userData.last_name || null,
        balance: 0,
      });
    }

    // Generate JWT token
    const token = generateJWT(user.id, user.telegramId);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        balance: user.balance,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authMiddleware, (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    const user = db.getUser(req.user.telegramId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        balance: user.balance,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user',
    });
  }
});

export default router;

