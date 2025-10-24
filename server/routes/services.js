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

// Country code to name mapping
const countryNames = {
  'US': 'United States',
  'UK': 'United Kingdom',
  'CA': 'Canada',
  'AU': 'Australia',
  'FR': 'France',
  'DE': 'Germany',
  'IT': 'Italy',
  'ES': 'Spain',
  'NL': 'Netherlands',
  'SE': 'Sweden',
  'NO': 'Norway',
  'RU': 'Russia',
  'IN': 'India',
  'BR': 'Brazil',
  'MX': 'Mexico',
  'JP': 'Japan',
  'CN': 'China',
  'KR': 'South Korea',
  'SG': 'Singapore',
  'HK': 'Hong Kong',
  'TH': 'Thailand',
  'PH': 'Philippines',
  'ID': 'Indonesia',
  'MY': 'Malaysia',
  'VN': 'Vietnam',
  'PK': 'Pakistan',
  'BD': 'Bangladesh',
  'TR': 'Turkey',
  'AE': 'United Arab Emirates',
  'SA': 'Saudi Arabia',
  'EG': 'Egypt',
  'ZA': 'South Africa',
  'NG': 'Nigeria',
  'KE': 'Kenya',
  'GH': 'Ghana',
  'UA': 'Ukraine',
  'PL': 'Poland',
  'CZ': 'Czech Republic',
  'HU': 'Hungary',
  'RO': 'Romania',
  'GR': 'Greece',
  'PT': 'Portugal',
  'BE': 'Belgium',
  'AT': 'Austria',
  'CH': 'Switzerland',
  'DK': 'Denmark',
  'FI': 'Finland',
  'IE': 'Ireland',
  'NZ': 'New Zealand',
};

// Cache for services (refresh every 1 hour)
let servicesCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Fetch all services from SMSPool
const fetchServicesFromSMSPool = async () => {
  try {
    console.log('📡 Fetching services from SMSPool API...');
    
    // Fetch prices endpoint which includes all services and countries
    const response = await axios.get(`${SMSPOOL_API_URL}/request/prices`, {
      params: {
        key: SMSPOOL_API_KEY,
      },
      timeout: 30000,
    });

    console.log('✅ SMSPool API response received');

    if (!response.data || typeof response.data !== 'object') {
      throw new Error('Invalid response from SMSPool API');
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
                name: countryNames[countryCode] || countryCode,
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
    const countries = Object.values(countriesMap).sort((a, b) => a.name.localeCompare(b.name));

    console.log(`✅ Parsed ${services.length} services and ${countries.length} countries`);

    return {
      services,
      countries,
      pricing: pricingData,
    };
  } catch (error) {
    console.error('❌ Error fetching services from SMSPool:', error.message);
    throw error;
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
    res.status(500).json({
      success: false,
      error: 'Failed to load services',
      message: error.message,
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

