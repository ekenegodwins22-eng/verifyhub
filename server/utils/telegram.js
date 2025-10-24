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
    
    if (!hash) {
      console.error('No hash found in initData');
      return null;
    }

    // Remove hash from params for verification
    params.delete('hash');

    // Sort parameters and create the data check string
    const dataCheckString = Array.from(params.entries())
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
      console.error('Hash verification failed');
      return null;
    }

    // Parse user data
    const userStr = params.get('user');
    if (!userStr) {
      console.error('No user data found in initData');
      return null;
    }

    const userData = JSON.parse(userStr);
    return userData;
  } catch (error) {
    console.error('Error verifying Telegram auth:', error);
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
    process.env.JWT_SECRET,
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('Error verifying JWT:', error);
    return null;
  }
}

