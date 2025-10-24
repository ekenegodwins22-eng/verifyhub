import express from 'express';
import axios from 'axios';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const SMSPOOL_API_KEY = process.env.SMSPOOL_API_KEY;
const SMSPOOL_API_URL = 'https://api.smspool.net';

// Pricing markup rules
const getPriceMarkup = (smsPoolPrice) => {
  const price = parseFloat(smsPoolPrice);
  
  if (price >= 0.10 && price <= 1.00) {
    return 5; // 5x markup
  } else if (price >= 1.01 && price <= 4.99) {
    return 2; // 2x markup
  } else if (price >= 5.00) {
    return 1.5; // 1.5x markup
  }
  
  return 2; // Default to 2x
};

// Sample services for fallback
const getSampleServices = () => {
  const services = [
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
    { id: 'linkedin', name: 'LinkedIn' },
    { id: 'snapchat', name: 'Snapchat' },
    { id: 'viber', name: 'Viber' },
    { id: 'wechat', name: 'WeChat' },
    { id: 'line', name: 'LINE' },
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
    { code: 'JP', name: 'Japan' },
    { code: 'CN', name: 'China' },
    { code: 'KR', name: 'South Korea' },
    { code: 'SG', name: 'Singapore' },
    { code: 'HK', name: 'Hong Kong' },
  ];

  // Sample pricing
  const samplePrices = {
    'telegram-US': 0.10,
    'telegram-UK': 0.12,
    'google-US': 0.15,
    'whatsapp-US': 0.20,
    'facebook-US': 0.18,
    'twitter-US': 0.25,
    'discord-US': 0.22,
    'instagram-US': 0.19,
    'tiktok-US': 0.30,
    'amazon-US': 0.35,
    'ebay-US': 0.28,
    'linkedin-US': 0.40,
    'snapchat-US': 0.32,
    'viber-US': 0.15,
    'wechat-US': 0.18,
    'line-US': 0.16,
  };

  const pricing = {};
  services.forEach((service) => {
    pricing[service.id] = {};
    countries.forEach((country) => {
      const key = `${service.id}-${country.code}`;
      const apiPrice = samplePrices[key] || 0.10;
      const markup = getPriceMarkup(apiPrice);
      const userPrice = apiPrice * markup;
      
      pricing[service.id][country.code] = {
        smsPoolPrice: parseFloat(apiPrice.toFixed(4)),
        markup: markup,
        userPrice: parseFloat(userPrice.toFixed(2)),
      };
    });
  });

  return {
    services,
    countries,
    pricing,
  };
};

// Cache for services (refresh every 1 hour)
let servicesCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Fetch all services from SMSPool
const fetchServicesFromSMSPool = async () => {
  try {
    console.log('📡 Fetching services from SMSPool API...');
    
    if (!SMSPOOL_API_KEY) {
      console.warn('⚠️ SMSPOOL_API_KEY not set, using sample services');
      return getSampleServices();
    }

    // Fetch prices endpoint which includes all services and countries
    const response = await axios.get(`${SMSPOOL_API_URL}/request/prices`, {
      params: {
        key: SMSPOOL_API_KEY,
      },
      timeout: 15000,
    });

    console.log('✅ SMSPool API response received');

    if (!response.data || typeof response.data !== 'object') {
      console.warn('⚠️ Invalid response from SMSPool API, using sample services');
      return getSampleServices();
    }

    // Parse the response and build services list
    const servicesMap = {};
    const countriesMap = {};
    const pricingData = {};

    // SMSPool returns data as: { "service_name": { "country_code": price, ... }, ... }
    Object.entries(response.data).forEach(([serviceName, countries]) => {
      if (typeof countries === 'object' && countries !== null) {
        const serviceId = serviceName.toLowerCase().replace(/\s+/g, '_');
        
        if (!servicesMap[serviceId]) {
          servicesMap[serviceId] = {
            id: serviceId,
            name: serviceName,
          };
          pricingData[serviceId] = {};
        }

        Object.entries(countries).forEach(([countryCode, price]) => {
          const numPrice = parseFloat(price);
          
          if (!isNaN(numPrice) && numPrice > 0) {
            // Add country to map
            if (!countriesMap[countryCode]) {
              countriesMap[countryCode] = {
                code: countryCode,
                name: countryCode,
              };
            }

            // Calculate markup
            const markup = getPriceMarkup(numPrice);
            const userPrice = numPrice * markup;

            // Store pricing
            pricingData[serviceId][countryCode] = {
              smsPoolPrice: parseFloat(numPrice.toFixed(4)),
              markup: markup,
              userPrice: parseFloat(userPrice.toFixed(2)),
            };
          }
        });
      }
    });

    const services = Object.values(servicesMap).sort((a, b) => a.name.localeCompare(b.name));
    const countries = Object.values(countriesMap).sort((a, b) => a.code.localeCompare(b.code));

    console.log(`✅ Parsed ${services.length} services and ${countries.length} countries`);

    return {
      services,
      countries,
      pricing: pricingData,
    };
  } catch (error) {
    console.error('❌ Error fetching services from SMSPool:', error.message);
    console.log('⚠️ Falling back to sample services');
    return getSampleServices();
  }
};

/**
 * GET /api/services
 * Get all available services with pricing
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('📋 GET /api/services');

    // Check cache
    const now = Date.now();
    if (servicesCache && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('📦 Using cached services');
      return res.json({
        success: true,
        ...servicesCache,
        cached: true,
        cacheAge: now - cacheTimestamp,
      });
    }

    // Fetch fresh data
    const data = await fetchServicesFromSMSPool();
    
    // Update cache
    servicesCache = data;
    cacheTimestamp = now;

    res.json({
      success: true,
      ...data,
      cached: false,
    });
  } catch (error) {
    console.error('Error in /api/services:', error);
    
    // Return sample services as fallback
    const sampleData = getSampleServices();
    res.json({
      success: true,
      ...sampleData,
      cached: false,
      fallback: true,
      error: error.message,
    });
  }
});

/**
 * POST /api/services/refresh
 * Refresh services cache (admin only)
 */
router.post('/refresh', authMiddleware, async (req, res) => {
  try {
    console.log('🔄 Refreshing services cache...');
    
    const data = await fetchServicesFromSMSPool();
    
    // Update cache
    servicesCache = data;
    cacheTimestamp = Date.now();

    res.json({
      success: true,
      message: 'Services cache refreshed',
      ...data,
    });
  } catch (error) {
    console.error('Error refreshing services:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh services',
      message: error.message,
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

    // Ensure cache is loaded
    if (!servicesCache) {
      const data = await fetchServicesFromSMSPool();
      servicesCache = data;
      cacheTimestamp = Date.now();
    }

    const pricing = servicesCache.pricing[service]?.[country.toUpperCase()];

    if (!pricing) {
      return res.status(404).json({
        success: false,
        error: 'Service or country not found',
      });
    }

    res.json({
      success: true,
      service,
      country: country.toUpperCase(),
      pricing,
    });
  } catch (error) {
    console.error('Error getting pricing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pricing',
    });
  }
});

export default router;

