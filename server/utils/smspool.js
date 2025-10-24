import axios from 'axios';

const SMSPOOL_API_URL = process.env.SMSPOOL_API_URL || 'https://api.smspool.net';
const SMSPOOL_API_KEY = process.env.SMSPOOL_API_KEY;

/**
 * Calculate user price based on SMSPool API price with markup
 * Markup rules:
 * - $0.10 - $1.00: 5x
 * - $1.01 - $4.99: 2x
 * - $5.00+: 1.5x
 */
export function calculateUserPrice(apiPrice) {
  if (apiPrice >= 0.1 && apiPrice <= 1.0) {
    return parseFloat((apiPrice * 5).toFixed(2));
  } else if (apiPrice > 1.0 && apiPrice < 5.0) {
    return parseFloat((apiPrice * 2).toFixed(2));
  } else if (apiPrice >= 5.0) {
    return parseFloat((apiPrice * 1.5).toFixed(2));
  }
  return apiPrice; // Fallback
}

/**
 * Get SMSPool account balance
 */
export async function getBalance() {
  try {
    const response = await axios.get(`${SMSPOOL_API_URL}/request/balance`, {
      params: {
        key: SMSPOOL_API_KEY,
      },
      timeout: 10000,
    });

    if (response.data && response.data.balance !== undefined) {
      return parseFloat(response.data.balance);
    }
    throw new Error('Invalid balance response');
  } catch (error) {
    console.error('Error getting SMSPool balance:', error.message);
    throw error;
  }
}

/**
 * Request a phone number from SMSPool
 * @param {string} service - Service name (e.g., 'telegram', 'google')
 * @param {string} country - Country code (e.g., 'US', 'UK')
 * @returns {Object} - { id, number, success }
 */
export async function requestNumber(service, country) {
  try {
    const response = await axios.get(`${SMSPOOL_API_URL}/request/number`, {
      params: {
        key: SMSPOOL_API_KEY,
        service: service.toLowerCase(),
        country: country.toUpperCase(),
      },
      timeout: 15000,
    });

    if (response.data && response.data.success) {
      return {
        success: true,
        id: response.data.id,
        number: response.data.number,
      };
    }

    return {
      success: false,
      error: response.data?.error || 'Failed to get number',
    };
  } catch (error) {
    console.error('Error requesting number from SMSPool:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get SMS code for a number
 * @param {string} id - The order ID from SMSPool
 * @returns {Object} - { success, code, status }
 */
export async function getSMS(id) {
  try {
    const response = await axios.get(`${SMSPOOL_API_URL}/request/sms`, {
      params: {
        key: SMSPOOL_API_KEY,
        id: id,
      },
      timeout: 10000,
    });

    if (response.data) {
      if (response.data.success && response.data.code) {
        return {
          success: true,
          code: response.data.code,
        };
      } else if (response.data.status) {
        return {
          success: false,
          status: response.data.status, // 'waiting_sms', 'timeout', etc.
        };
      }
    }

    return {
      success: false,
      status: 'unknown_error',
    };
  } catch (error) {
    console.error('Error getting SMS from SMSPool:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Ban/cancel a number
 * @param {string} id - The order ID from SMSPool
 */
export async function banNumber(id) {
  try {
    const response = await axios.get(`${SMSPOOL_API_URL}/request/ban`, {
      params: {
        key: SMSPOOL_API_KEY,
        id: id,
      },
      timeout: 10000,
    });

    return response.data?.success || false;
  } catch (error) {
    console.error('Error banning number from SMSPool:', error.message);
    return false;
  }
}

/**
 * Get available services and prices from SMSPool
 * This should be called periodically to cache prices
 */
export async function getServices() {
  try {
    // Note: SMSPool doesn't have a dedicated endpoint for all services/prices
    // You would need to call /request/prices with specific service/country combinations
    // For now, we'll return a hardcoded list of popular services
    // In production, you'd implement a more comprehensive solution

    const popularServices = [
      { id: 'telegram', name: 'Telegram' },
      { id: 'google', name: 'Google' },
      { id: 'whatsapp', name: 'WhatsApp' },
      { id: 'facebook', name: 'Facebook' },
      { id: 'twitter', name: 'Twitter' },
      { id: 'discord', name: 'Discord' },
      { id: 'instagram', name: 'Instagram' },
      { id: 'tiktok', name: 'TikTok' },
      { id: 'amazon', name: 'Amazon' },
      { id: 'ebay', name: 'eBay' },
    ];

    const countries = [
      { code: 'US', name: 'United States' },
      { code: 'UK', name: 'United Kingdom' },
      { code: 'CA', name: 'Canada' },
      { code: 'AU', name: 'Australia' },
      { code: 'FR', name: 'France' },
      { code: 'DE', name: 'Germany' },
      { code: 'IT', name: 'Italy' },
      { code: 'ES', name: 'Spain' },
      { code: 'NL', name: 'Netherlands' },
      { code: 'SE', name: 'Sweden' },
      { code: 'NO', name: 'Norway' },
      { code: 'RU', name: 'Russia' },
      { code: 'IN', name: 'India' },
      { code: 'BR', name: 'Brazil' },
      { code: 'MX', name: 'Mexico' },
    ];

    return {
      services: popularServices,
      countries: countries,
    };
  } catch (error) {
    console.error('Error getting services from SMSPool:', error.message);
    throw error;
  }
}

