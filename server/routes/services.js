import express from 'express';
import { getServices, calculateUserPrice } from '../utils/smspool.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/services
 * Get all available services with pricing
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    // For now, return hardcoded services with sample prices
    // In production, you would fetch from SMSPool and cache in database
    
    const servicesData = {
      services: [
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
      ],
      countries: [
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
      ],
    };

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

    // Build pricing structure
    const pricingData = {};
    servicesData.services.forEach((service) => {
      pricingData[service.id] = {};
      servicesData.countries.forEach((country) => {
        const key = `${service.id}-${country.code}`;
        const apiPrice = samplePrices[key] || 0.10; // Default fallback
        const userPrice = calculateUserPrice(apiPrice);
        pricingData[service.id][country.code] = {
          apiPrice,
          userPrice,
          countryName: country.name,
        };
      });
    });

    res.json({
      success: true,
      services: servicesData.services,
      countries: servicesData.countries,
      pricing: pricingData,
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get services',
    });
  }
});

/**
 * GET /api/services/:service/:country
 * Get price for a specific service and country
 */
router.get('/:service/:country', authMiddleware, async (req, res) => {
  try {
    const { service, country } = req.params;

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

    res.json({
      success: true,
      service,
      country,
      apiPrice,
      userPrice,
    });
  } catch (error) {
    console.error('Get service price error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get service price',
    });
  }
});

export default router;

