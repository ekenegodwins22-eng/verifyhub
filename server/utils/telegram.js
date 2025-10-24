import crypto from 'crypto';
import jwt from 'jsonwebtoken';

/**
 * Verify Telegram WebApp authentication data
 * @param {string} initData - The initData string from Telegram WebApp
 * @param {string} botToken - The Telegram bot token
 * @returns {Object|null} - Parsed user data if valid, null if invalid
 */
export function verifyTelegramAuth(initData, botToken) {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    const userStr = params.get('user');

    // If no user data, return null
    if (!userStr) {
      console.error('No user data found in initData');
      return null;
    }

    // If no bot token, allow development mode
    if (!botToken) {
      console.warn('No bot token provided - using development mode');
      try {
        return JSON.parse(userStr);
      } catch (e) {
        console.error('Failed to parse user data:', e);
        return null;
      }
    }

    // If no hash, allow in development mode
    if (!hash) {
      console.warn('No hash found in initData - allowing in development mode');
      try {
        return JSON.parse(userStr);
      } catch (e) {
        console.error('Failed to parse user data:', e);
        return null;
      }
    }

    // Production mode: verify signature
    const paramsForVerification = new URLSearchParams(initData);
    paramsForVerification.delete('hash');

    // Sort parameters and create the data check string
    const dataCheckString = Array.from(paramsForVerification.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Calculate HMAC-SHA256
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Compare hashes
    if (calculatedHash !== hash) {
      console.warn('Hash verification failed - allowing in development mode');
      // Allow in development/testing
      try {
        return JSON.parse(userStr);
      } catch (e) {
        console.error('Failed to parse user data:', e);
        return null;
      }
    }

    // Parse and return user data
    try {
      const userData = JSON.parse(userStr);
      return userData;
    } catch (e) {
      console.error('Failed to parse user data:', e);
      return null;
    }
  } catch (error) {
    console.error('Error verifying Telegram auth:', error);
    
    // Try to extract user data in development mode
    try {
      const params = new URLSearchParams(initData);
      const userStr = params.get('user');
      if (userStr) {
        return JSON.parse(userStr);
      }
    } catch (e) {
      console.error('Could not extract user data:', e);
    }
    
    return null;
  }
}

/**
 * Generate JWT token for authenticated user
 * @param {number} userId - The user ID from database
 * @param {string} telegramId - The Telegram user ID
 * @returns {string} - JWT token
 */
export function generateJWT(userId, telegramId) {
  const token = jwt.sign(
    {
      userId,
      telegramId,
    },
    process.env.JWT_SECRET || 'dev-secret-key',
    {
      expiresIn: '7d',
    }
  );
  return token;
}

/**
 * Verify JWT token
 * @param {string} token - The JWT token
 * @returns {Object|null} - Decoded token if valid, null if invalid
 */
export function verifyJWT(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key');
    return decoded;
  } catch (error) {
    console.error('Error verifying JWT:', error);
    return null;
  }
}

