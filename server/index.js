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

      const welcomeMessage = `👋 Welcome to VerifyHub!

VerifyHub is your instant SMS verification service. Get SMS codes for any service in seconds!

✨ Features:
• 📱 150+ countries
• 🚀 Instant SMS delivery
• 💰 Affordable pricing
• 🔒 Secure & private

Click the button below to open the app and start buying SMS numbers!`;

      await axios.post(`${TELEGRAM_API}${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        chat_id: chatId,
        text: welcomeMessage,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🚀 OPEN APP',
                web_app: {
                  url: `${process.env.MINI_APP_URL || 'https://your-app-url.koyeb.app'}`,
                },
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
  console.log(`📱 Mini App: http://localhost:${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
  console.log(`📞 Telegram Bot Token: ${TELEGRAM_BOT_TOKEN ? '✓ Set' : '✗ Not set'}`);
});

