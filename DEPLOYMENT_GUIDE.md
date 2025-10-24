# VerifyHub Deployment Guide - Koyeb

This guide walks you through deploying VerifyHub to Koyeb, a modern serverless platform.

## 📋 Prerequisites

Before you start, make sure you have:

1. **GitHub Account** - For version control
2. **Koyeb Account** - Sign up at [koyeb.com](https://koyeb.com)
3. **Telegram Bot Token** - From [@BotFather](https://t.me/botfather)
4. **SMSPool API Key** - From [smspool.net](https://www.smspool.net)
5. **All environment variables** - See `.env.example`

## 🔧 Step-by-Step Deployment

### Step 1: Push Code to GitHub

If you haven't already, push your code to GitHub:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: VerifyHub Mini App"

# Add remote (replace with your GitHub repo)
git remote add origin https://github.com/yourusername/verifyhub.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 2: Create Koyeb App

1. Go to [Koyeb Dashboard](https://app.koyeb.com/apps)
2. Click **Create App** button
3. Select **GitHub** as the deployment method
4. Authorize Koyeb to access your GitHub account
5. Select your `verifyhub` repository
6. Select the `main` branch

### Step 3: Configure Build Settings

In the **Builder** section:

- **Builder**: Select `Buildpack`
- **Build Command**: Leave as default or use:
  ```
  npm install && npm run build
  ```
- **Run Command**: 
  ```
  npm start
  ```

### Step 4: Configure Ports

In the **Ports** section:

- **Port**: `5000`
- **Protocol**: `HTTP`
- **Name**: `api`

### Step 5: Add Environment Variables

Click **Environment Variables** and add the following:

| Key | Value | Notes |
|:---|:---|:---|
| `NODE_ENV` | `production` | Required |
| `PORT` | `5000` | Must match port configuration |
| `TELEGRAM_BOT_TOKEN` | Your bot token | From @BotFather |
| `TELEGRAM_BOT_USERNAME` | Your bot username | e.g., `VerifyHubBot` |
| `SMSPOOL_API_KEY` | Your SMSPool API key | From smspool.net dashboard |
| `SMSPOOL_API_URL` | `https://api.smspool.net` | SMSPool endpoint |
| `JWT_SECRET` | A long random string | Generate a secure key |
| `VITE_API_URL` | `https://your-app-name.koyeb.app` | Your Koyeb app URL |
| `VITE_APP_TITLE` | `VerifyHub` | App display name |
| `VITE_MINI_APP_URL` | `https://your-app-name.koyeb.app` | Same as VITE_API_URL |

**To generate a secure JWT_SECRET:**

```bash
# On Linux/Mac
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((1..32 | ForEach-Object { [char](Get-Random -Minimum 33 -Maximum 126) }) -join ''))
```

### Step 6: Review and Deploy

1. Review all settings
2. Click **Create Service**
3. Koyeb will start building and deploying your app
4. Wait for deployment to complete (usually 3-5 minutes)
5. Once deployed, you'll see a green checkmark and a public URL

### Step 7: Get Your Koyeb URL

After deployment, Koyeb will provide you with a URL like:
```
https://verifyhub-yourusername.koyeb.app
```

This is your **Mini App URL**.

## 🤖 Update Telegram Bot Configuration

### Set Mini App URL

1. Open Telegram and message [@BotFather](https://t.me/botfather)
2. Select your bot
3. Choose **Edit Web App URL**
4. Enter your Koyeb URL: `https://verifyhub-yourusername.koyeb.app`
5. Confirm

### Set Webhook (Optional)

If you want to handle Telegram updates:

```bash
curl -X POST https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook \
  -d "url=https://verifyhub-yourusername.koyeb.app/webhook"
```

## ✅ Verify Deployment

### Test the Health Endpoint

```bash
curl https://verifyhub-yourusername.koyeb.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-10-24T12:34:56.789Z"
}
```

### Test the Mini App

1. Open your Telegram bot
2. Click **Open App** or send `/start`
3. The Mini App should load
4. Try logging in with Telegram

## 🔄 Continuous Deployment

Koyeb automatically redeploys when you push to GitHub:

```bash
# Make changes to your code
git add .
git commit -m "Update feature"
git push origin main

# Koyeb will automatically detect the change and redeploy
```

Monitor deployment status in the Koyeb dashboard.

## 📊 Monitor Your App

### View Logs

1. Go to your app in Koyeb dashboard
2. Click **Logs** tab
3. View real-time logs of your application

### Check Metrics

1. Click **Metrics** tab
2. Monitor CPU, memory, and request metrics

## 🐛 Troubleshooting

### App Won't Start

**Error**: `Build failed` or `Container failed to start`

**Solution**:
1. Check logs in Koyeb dashboard
2. Verify all environment variables are set
3. Ensure `npm start` command is correct
4. Check that `server/index.js` exists and is valid

### "Cannot find module" errors

**Solution**:
```bash
# Ensure all dependencies are in package.json
npm install

# Push changes
git add package.json package-lock.json
git commit -m "Update dependencies"
git push origin main
```

### Telegram Mini App Won't Load

**Solution**:
1. Verify Mini App URL is correct in @BotFather
2. Check that your Koyeb app is running (green status)
3. Clear Telegram cache and try again
4. Check browser console for errors

### "Invalid Telegram authentication"

**Solution**:
1. Verify `TELEGRAM_BOT_TOKEN` is correct
2. Ensure the Mini App is opened from your bot
3. Check that `JWT_SECRET` is set

### Database Errors

**Solution**:
1. Koyeb provides ephemeral storage (lost on redeploy)
2. For production, use PostgreSQL instead of SQLite
3. Update `server/db/index.js` to use PostgreSQL connection string

## 🗄️ Using PostgreSQL (Recommended for Production)

### 1. Create PostgreSQL Database

Use a service like:
- [Neon](https://neon.tech) - Free PostgreSQL hosting
- [Railway](https://railway.app) - PostgreSQL included
- [Render](https://render.com) - PostgreSQL available

### 2. Update Connection String

Add to Koyeb environment variables:

```
DATABASE_URL=postgresql://user:password@host:5432/verifyhub
```

### 3. Update Database Configuration

Edit `server/db/index.js`:

```javascript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const client = postgres(process.env.DATABASE_URL);
export const db = drizzle(client, { schema });
```

### 4. Update package.json

Add PostgreSQL driver:

```bash
npm install postgres
```

### 5. Run Migrations

```bash
npm run db:push
```

## 🔐 Security Checklist

- ✅ All sensitive data in environment variables (never in code)
- ✅ `JWT_SECRET` is a long, random string
- ✅ `TELEGRAM_BOT_TOKEN` is kept secret
- ✅ `SMSPOOL_API_KEY` is kept secret
- ✅ HTTPS is enforced (Koyeb provides free SSL)
- ✅ Database credentials are secure
- ✅ No secrets in `.gitignore` files

## 📈 Scaling

Koyeb automatically scales your app based on traffic:

1. **Vertical Scaling**: Increase instance size in dashboard
2. **Horizontal Scaling**: Enable auto-scaling for multiple instances
3. **Caching**: Add Redis for session caching

## 💰 Cost Estimation

Koyeb pricing (as of 2024):

- **Free Tier**: 1 instance, 512MB RAM, 2GB storage
- **Starter**: $5/month per instance
- **Production**: Varies based on usage

For a small SMS reseller:
- Free tier is usually sufficient for testing
- Starter tier ($5/month) for production

## 🆘 Getting Help

- **Koyeb Docs**: [docs.koyeb.com](https://docs.koyeb.com)
- **Telegram Bot API**: [core.telegram.org/bots](https://core.telegram.org/bots)
- **SMSPool Docs**: [smspool.net/article/how-to-use-the-smspool-api](https://www.smspool.net/article/how-to-use-the-smspool-api-0dd6eadf4c)

## ✨ Next Steps After Deployment

1. **Add Payment Gateway**: Integrate NowPayments or similar
2. **Monitor Performance**: Check Koyeb metrics regularly
3. **Update Pricing**: Adjust markup multipliers as needed
4. **Add More Services**: Expand SMSPool service offerings
5. **Set Up Analytics**: Track revenue and user behavior

---

**Your VerifyHub Mini App is now live! 🎉**

Share your bot with users and start earning! 💰

