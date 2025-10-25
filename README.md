# VerifyHub - SMS Verification Mini App for Telegram

A complete, production-ready Telegram Mini App that acts as a white-labeled SMS verification reseller platform using the SMSPool API. Users can deposit money, purchase SMS verification numbers, and receive codes instantly—all within Telegram.

## 🌟 Features

- **🔐 Telegram Authentication**: Instant, passwordless login via Telegram WebApp
- **💰 Balance Management**: Users deposit money and manage their account balance
- **📱 SMS Number Purchase**: Buy verification numbers for 10+ services and 150+ countries
- **⚡ Auto-Polling**: Automatically receive SMS codes in real-time
- **💳 Payment Integration**: Integrated with NowPayments for crypto deposits.
- **🎨 Modern UI**: Beautiful, responsive design optimized for mobile
- **🔒 White-Labeled**: Zero SMSPool branding—your brand only
- **📊 Order History**: Track all purchases and SMS codes
- **⚙️ Simple Pricing**: Raw SMSPool price + fixed **$1.00 transaction fee** on all orders.

## 🏗️ Architecture

### Tech Stack

| Layer | Technology |
|:---|:---|
| **Frontend** | React 18 + Vite + Telegram WebApp SDK |
| **Backend** | Node.js + Express + Drizzle ORM |
| **Database** | SQLite (development) / PostgreSQL (production) |
| **Authentication** | Telegram WebApp Auth + JWT |
| **Deployment** | Koyeb (Backend) + Vercel (Frontend) |

### System Flow

```
User (Telegram)
    ↓
Mini App Frontend (React)
    ↓
Backend API (Express)
    ↓
SMSPool API + Payment Gateway (NowPayments) + IPN Callback
```

## 📋 Prerequisites

- Node.js 16+ and npm/pnpm
- Telegram Bot Token (from [@BotFather](https://t.me/botfather))
- SMSPool API Key (from [smspool.net](https://www.smspool.net))
- Koyeb account (for backend deployment)
- NowPayments API Key (for deposit integration)

## 🚀 Quick Start (Local Development)

### 1. Clone and Install

```bash
cd verifyhub
npm install
cd client && npm install && cd ..
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_BOT_USERNAME=VerifyHubBot

# SMSPool
SMSPOOL_API_KEY=your_smspool_api_key_here
SMSPOOL_API_URL=https://api.smspool.net

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this

# Server
PORT=5000
NODE_ENV=development
VITE_API_URL=http://localhost:5000

# Mini App
VITE_APP_TITLE=VerifyHub
VITE_MINI_APP_URL=http://localhost:5000
```

### 3. Initialize Database

```bash
npm run db:generate
npm run db:push
```

### 4. Start Development Server

```bash
npm run dev
```

This starts both the backend (port 5000) and frontend (port 5173).

### 5. Test the Mini App

1. Open your Telegram bot
2. Send `/start` or click the "Open App" button
3. The Mini App will open in Telegram

## 📦 Project Structure

```
verifyhub/
├── server/
│   ├── db/
│   │   ├── schema.js          # Database schema (Drizzle ORM)
│   │   └── index.js           # Database connection
│   ├── middleware/
│   │   └── auth.js            # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js            # Authentication endpoints
│   │   ├── services.js        # Services & pricing endpoints
│   │   ├── orders.js          # Order management endpoints
│   │   └── deposit.js         # NowPayments deposit endpoints
│   ├── utils/
│   │   ├── telegram.js        # Telegram auth verification
│   │   └── smspool.js         # SMSPool API integration
│   └── index.js               # Express server entry point
├── client/
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── HomeTab.jsx
│   │   │   ├── BuyTab.jsx
│   │   │   └── OrdersTab.jsx
│   │   ├── screens/           # Full-screen views
│   │   │   ├── LoginScreen.jsx
│   │   │   └── DashboardScreen.jsx
│   │   ├── styles/            # Component CSS
│   │   ├── App.jsx            # Main app component
│   │   ├── main.jsx           # React entry point
│   │   └── index.css          # Global styles
│   ├── index.html             # HTML template
│   ├── vite.config.js         # Vite configuration
│   └── package.json
├── data/                      # SQLite database (local)
├── .env.example               # Environment variables template
├── package.json               # Root dependencies
└── README.md                  # This file
```

## 🔌 API Endpoints

### Authentication

| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/api/auth/login` | Login with Telegram WebApp data |
| `GET` | `/api/auth/me` | Get current user info |

### Services

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/services` | Get all services with pricing |
| `GET` | `/api/services/:service/:country` | Get price for specific service/country |

### Orders

| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/api/orders/buy` | Buy a new SMS number |
| `POST` | `/api/deposit/create` | Initiate a crypto deposit via NowPayments |
| `POST` | `/api/deposit/ipn` | NowPayments IPN callback for payment confirmation |
| `GET` | `/api/orders` | Get user's orders |
| `GET` | `/api/orders/:orderId` | Get specific order |
| `GET` | `/api/orders/:orderId/sms` | Check for SMS code (auto-poll) |

## 💾 Database Schema

### Users Table
```sql
- id (PK)
- telegramId (UNIQUE)
- username
- firstName
- lastName
- balance (DECIMAL)
- createdAt
- updatedAt
```

### Orders Table
```sql
- id (PK)
- userId (FK)
- service (VARCHAR)
- country (VARCHAR)
- phoneNumber (VARCHAR)
- smsPoolOrderId (VARCHAR)
- apiPrice (DECIMAL)
- userPrice (DECIMAL)
- smsCode (VARCHAR, nullable)
- status (ENUM: waiting_sms, received, expired, cancelled)
- expiresAt (TIMESTAMP)
- createdAt
- updatedAt
```

### Transactions Table
```sql
- id (PK)
- userId (FK)
- type (ENUM: deposit, purchase, refund)
- amount (DECIMAL)
- status (ENUM: pending, completed, failed)
- description (VARCHAR)
- paymentId (VARCHAR, nullable)
- createdAt
```

## 🌐 Deployment on Koyeb

**Your Deployment URL:** `https://primary-ainsley-suhailtechlnf-cc1ffe95.koyeb.app`

### Step 1: Prepare Your Repository

Push your code to GitHub:

```bash
git init
git add .
git commit -m "Initial commit: VerifyHub Mini App"
git remote add origin https://github.com/yourusername/verifyhub.git
git push -u origin main
```

### Step 2: Create Koyeb App

1. Go to [Koyeb Dashboard](https://app.koyeb.com)
2. Click **Create App**
3. Select **GitHub** as deployment method
4. Authorize and select your `verifyhub` repository
5. Configure as follows:

**Build Settings:**
- **Builder**: Buildpack
- **Build Command**: `npm install && npm run build`
- **Run Command**: `npm start`

**Environment Variables:**
Add all variables from your `.env` file, using your specific Koyeb URL for the `VITE_*` and NowPayments variables:
```
TELEGRAM_BOT_TOKEN=your_token
SMSPOOL_API_KEY=your_key
JWT_SECRET=your_secret
NODE_ENV=production

# Frontend/API URL (Use your Koyeb URL)
VITE_API_URL=https://primary-ainsley-suhailtechlnf-cc1ffe95.koyeb.app
VITE_MINI_APP_URL=https://primary-ainsley-suhailtechlnf-cc1ffe95.koyeb.app

# NowPayments Deposit Integration (Use your Koyeb URL and API Key)
NOWPAYMENTS_API_KEY=your_nowpayments_key
IPN_CALLBACK_URL=https://primary-ainsley-suhailtechlnf-cc1ffe95.koyeb.app/api/deposit/ipn
SUCCESS_URL=https://primary-ainsley-suhailtechlnf-cc1ffe95.koyeb.app
CANCEL_URL=https://primary-ainsley-suhailtechlnf-cc1ffe95.koyeb.app
```

**Ports:**
- Port: `5000`
- Protocol: `HTTP`

### Step 3: Deploy

1. Click **Deploy**
2. Wait for deployment to complete (~3-5 minutes)
3. Your app will be available at `https://primary-ainsley-suhailtechlnf-cc1ffe95.koyeb.app`

### Step 4: Update Telegram Bot

Update your Telegram bot's webhook to point to your Koyeb app:

```bash
curl -X POST https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook \
  -d "url=https://primary-ainsley-suhailtechlnf-cc1ffe95.koyeb.app/webhook"
```

### Step 5: Configure Mini App URL

In Telegram BotFather:
1. Select your bot
2. Edit **Web App URL**
3. Set it to: `https://primary-ainsley-suhailtechlnf-cc1ffe95.koyeb.app`

## 🔑 Environment Variables

| Variable | Description | Example |
|:---|:---|:---|
| `TELEGRAM_BOT_TOKEN` | Your Telegram bot token | `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11` |
| `TELEGRAM_BOT_USERNAME` | Your bot's username | `VerifyHubBot` |
| `SMSPOOL_API_KEY` | SMSPool API key (32 chars) | `abcdef1234567890abcdef1234567890` |
| `SMSPOOL_API_URL` | SMSPool API endpoint | `https://api.smspool.net` |
| `JWT_SECRET` | Secret key for JWT signing | `your_super_secret_key_here` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `production` or `development` |
| `VITE_API_URL` | Frontend API URL | `https://primary-ainsley-suhailtechlnf-cc1ffe95.koyeb.app` |
| `VITE_APP_TITLE` | Mini App title | `VerifyHub` |
| `VITE_MINI_APP_URL` | Mini App URL | `https://primary-ainsley-suhailtechlnf-cc1ffe95.koyeb.app` |
| `NOWPAYMENTS_API_KEY` | NowPayments API Key | `your_nowpayments_key` |
| `IPN_CALLBACK_URL` | NowPayments IPN URL (Crucial for balance update) | `https://primary-ainsley-suhailtechlnf-cc1ffe95.koyeb.app/api/deposit/ipn` |
| `SUCCESS_URL` | URL to redirect after successful payment | `https://primary-ainsley-suhailtechlnf-cc1ffe95.koyeb.app` |
| `CANCEL_URL` | URL to redirect after cancelled payment | `https://primary-ainsley-suhailtechlnf-cc1ffe95.koyeb.app` |

## 💳 Payment Gateway Integration

The app is ready for payment integration. To add deposits:

### Option 1: NowPayments (Integrated)

The integration is complete and ready to use. You only need to set the environment variables:

1.  Sign up at [nowpayments.io](https://nowpayments.io) and get your API key.
2.  Set the following environment variables in your Koyeb deployment:
    ```env
    NOWPAYMENTS_API_KEY=your_key
    IPN_CALLBACK_URL=https://primary-ainsley-suhailtechlnf-cc1ffe95.koyeb.app/api/deposit/ipn
    SUCCESS_URL=https://primary-ainsley-suhailtechlnf-cc1ffe95.koyeb.app
    CANCEL_URL=https://primary-ainsley-suhailtechlnf-cc1ffe95.koyeb.app
    ```
3.  The app currently uses `usdt` as the payment currency, allowing the user to select the **Polygon** or **Solana** network on the NowPayments payment page.
4.  **Note:** The IPN callback endpoint (`/api/deposit/ipn`) is implemented but does not include HMAC signature validation for simplicity. **For production use, you must implement HMAC validation** using your `NOWPAYMENTS_IPN_SECRET` to ensure security.

### Option 2: Coinbase Commerce

1. Sign up at [commerce.coinbase.com](https://commerce.coinbase.com)
2. Get your API key
3. Implement webhook handler for payment confirmations

### Option 3: TON Payments (Telegram Native)

1. Use Telegram's native TON payment system
2. Implement in `HomeTab.jsx` deposit modal

## 🔐 Security Considerations

- ✅ All SMSPool API keys are server-side only
- ✅ JWT tokens expire after 7 days
- ✅ Telegram auth signature is verified server-side
- ✅ HTTPS is enforced in production
- ✅ Database uses prepared statements (Drizzle ORM)
- ✅ User balances are validated before purchases
- ✅ All transactions are logged

## 🐛 Troubleshooting

### "Invalid Telegram authentication"
- Ensure `TELEGRAM_BOT_TOKEN` is correct
- Check that the Mini App is opened from your Telegram bot

### "SMSPool API error"
- Verify `SMSPOOL_API_KEY` is valid
- Check SMSPool account has sufficient balance
- Ensure service/country combination is available

### "Insufficient balance"
- User needs to deposit money first
- Check pricing multipliers are correct

### Database errors
- Run `npm run db:push` to sync schema
- Check database file permissions

## 📈 Pricing Logic

The app uses a simple fixed transaction fee:

*   **User Price** = Raw SMSPool Price + **$1.00 Fixed Transaction Fee**

This logic is configured in `server/routes/services.js`:

```javascript
const TRANSACTION_FEE = 1.00;

const calculateUserPrice = (smsPoolPrice) => {
  const price = parseFloat(smsPoolPrice);
  return parseFloat((price + TRANSACTION_FEE).toFixed(2));
};
```
## 🎨 Customization

### Change App Name
1. Edit `VITE_APP_TITLE` in `.env`
2. Update `client/src/screens/LoginScreen.jsx`
3. Update `client/src/screens/DashboardScreen.jsx`

### Change Colors
Edit CSS variables in `client/src/index.css`:

```css
:root {
  --primary-color: #2563EB;      /* Change this */
  --primary-dark: #1E40AF;
  --primary-light: #3B82F6;
  /* ... other colors */
}
```

### Add More Services
The app now dynamically fetches all available services and prices from the SMSPool API. No manual updates are needed.

## 📞 Support

For issues or questions:
1. Check the [SMSPool Documentation](https://www.smspool.net/article/how-to-use-the-smspool-api-0dd6eadf4c)
2. Review [Telegram Bot API Docs](https://core.telegram.org/bots/api)
3. Check logs: `npm run dev` shows all errors

## 📄 License

MIT License - Feel free to use and modify for your projects.

## 🚀 Next Steps

1. **Add Payment Gateway**: Integrate NowPayments or similar
2. **Add More Services**: Expand SMSPool service list
3. **Analytics**: Add order tracking and revenue dashboard
4. **Referral System**: Reward users for inviting friends
5. **Multi-Language**: Support multiple languages
6. **Admin Panel**: Manage pricing and monitor usage

---

**Built with ❤️ for Telegram Mini Apps**

Happy selling! 🎉
