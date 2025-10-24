import express from 'express';
import { verifyTelegramAuth, generateJWT } from '../utils/telegram.js';
import db from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

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
    const existingUser = db
      .select()
      .from(users)
      .where(eq(users.telegramId, userData.id.toString()))
      .all();

    let user;

    if (existingUser.length > 0) {
      // Update existing user
      user = existingUser[0];
      db.update(users)
        .set({
          username: userData.username || user.username,
          firstName: userData.first_name || user.firstName,
          lastName: userData.last_name || user.lastName,
          updatedAt: Math.floor(Date.now() / 1000),
        })
        .where(eq(users.id, user.id))
        .run();
    } else {
      // Create new user
      const result = db
        .insert(users)
        .values({
          telegramId: userData.id.toString(),
          username: userData.username,
          firstName: userData.first_name,
          lastName: userData.last_name,
          balance: 0,
          createdAt: Math.floor(Date.now() / 1000),
          updatedAt: Math.floor(Date.now() / 1000),
        })
        .run();

      // Fetch the created user
      user = db
        .select()
        .from(users)
        .where(eq(users.telegramId, userData.id.toString()))
        .all()[0];
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
router.get('/me', (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    const user = db
      .select()
      .from(users)
      .where(eq(users.id, req.user.userId))
      .all()[0];

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

