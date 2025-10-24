import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import axios from 'axios';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.js';
import servicesRoutes from './routes/services.js';
import ordersRoutes from './routes/orders.js';
import { authMiddleware } from './middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = 'https://api.telegram.org/bot';
const MINI_APP_URL = process.env.MINI_APP_URL || 'https://your-app-url.koyeb.app';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Telegram webhook endpoint
app.post('/telegram/webhook', async (req, res) => {
  try {
    const { message, callback_query } = req.body;

    // Handle /start command
    if (message?.text === '/start') {
      const chatId = message.chat.id;
      const firstName = message.from?.first_name || 'User';

      const welcomeMessage = `🎉 Welcome to VerifyHub!

Your instant SMS verification solution. Get verification codes for any service in seconds!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ **What is VerifyHub?**
VerifyHub is a premium SMS verification service that provides instant phone numbers and SMS codes for account verification across 150+ countries and services.

🌟 **Key Features:**
✅ Instant SMS delivery (30 seconds - 5 minutes)
✅ 150+ countries worldwide
✅ 10+ popular services (Telegram, Google, WhatsApp, Discord, etc.)
✅ Affordable pricing starting from $0.50
✅ Secure & private - no data stored
✅ 24/7 support

💰 **How It Works:**
1. Deposit money to your account
2. Select a service and country
3. Get a phone number instantly
4. Use it to sign up/verify
5. Receive SMS code automatically
6. Copy & paste to complete verification

🚀 **Get Started:**
Click the button below to open the app and start buying SMS numbers!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

      await axios.post(`${TELEGRAM_API}${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        chat_id: chatId,
        text: welcomeMessage,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🚀 OPEN VerifyHub APP',
                web_app: {
                  url: MINI_APP_URL,
                },
              },
            ],
            [
              {
                text: '❓ Help',
                callback_data: 'help',
              },
              {
                text: '💬 Support',
                url: 'https://t.me/your_support_bot',
              },
            ],
          ],
        },
      });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/orders', ordersRoutes);

// Serve static files from client build (if available)
const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).json({
        success: false,
        error: 'Not found',
      });
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 VerifyHub server running on port ${PORT}`);
  console.log(`📱 Mini App URL: ${MINI_APP_URL}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
  console.log(`📞 Telegram Bot Token: ${TELEGRAM_BOT_TOKEN ? '✓ Set' : '✗ Not set'}`);
});

