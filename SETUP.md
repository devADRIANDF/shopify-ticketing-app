# Validiam Setup Guide

Complete step-by-step guide to get your Validiam Shopify app running.

## Prerequisites

1. **Node.js 18+**
   ```bash
   node --version  # Should be 18.0.0 or higher
   ```

2. **PostgreSQL Database**
   - Local: Install PostgreSQL 14+
   - Cloud: Use Railway, Supabase, or Render

3. **Shopify Partner Account**
   - Sign up at: https://partners.shopify.com/

4. **SMTP Email Service**
   - Gmail (with App Password)
   - SendGrid
   - Mailgun
   - AWS SES

## Step 1: Database Setup

### Option A: Local PostgreSQL

```bash
# Install PostgreSQL (macOS)
brew install postgresql@14
brew services start postgresql@14

# Create database
createdb validiam

# Your DATABASE_URL will be:
# postgresql://username@localhost:5432/validiam
```

### Option B: Railway (Recommended for Production)

1. Go to https://railway.app/
2. Create new project
3. Add PostgreSQL service
4. Copy the `DATABASE_URL` from settings

### Option C: Supabase

1. Go to https://supabase.com/
2. Create new project
3. Go to Settings > Database
4. Copy the connection string (change mode to `Session`)

## Step 2: Shopify App Configuration

### Create Shopify App

1. Go to https://partners.shopify.com/
2. Click "Apps" > "Create App"
3. Choose "Public App" or "Custom App"
4. Fill in app details:
   - **App name**: Validiam
   - **App URL**: `https://your-app-url.com` (use ngrok for dev)

### Get API Credentials

1. In your app dashboard, go to "Configuration"
2. Copy **Client ID** (API Key)
3. Copy **Client Secret** (API Secret)
4. Set **App URL** and **Redirect URLs**

### Configure OAuth

Add these redirect URLs:
```
https://your-app-url.com/auth/callback
https://your-app-url.com/auth/shopify/callback
https://your-app-url.com/api/auth/callback
```

### Set Scopes

Required scopes:
- `read_orders`
- `write_products`
- `write_webhooks`
- `read_customers`

## Step 3: Email Configuration

### Gmail Setup (Easiest for Testing)

1. Enable 2-Factor Authentication in your Google Account
2. Generate App Password:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Copy the generated password

3. Your email config:
   ```
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-digit-app-password
   EMAIL_FROM=Validiam <your-email@gmail.com>
   ```

### SendGrid Setup (Recommended for Production)

1. Sign up at https://sendgrid.com/
2. Create API key with "Mail Send" permissions
3. Your config:
   ```
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_USER=apikey
   EMAIL_PASSWORD=your-sendgrid-api-key
   EMAIL_FROM=Validiam <noreply@yourdomain.com>
   ```

## Step 4: Environment Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your credentials:
   ```env
   # Shopify
   SHOPIFY_API_KEY=your_client_id_from_shopify
   SHOPIFY_API_SECRET=your_client_secret_from_shopify
   SCOPES=write_products,read_orders,write_webhooks,read_customers

   # Database
   DATABASE_URL=postgresql://user:password@host:5432/validiam

   # Encryption (generate random 32 characters)
   ENCRYPTION_KEY=abcdef1234567890abcdef1234567890

   # Email
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   EMAIL_FROM=Validiam <noreply@yourdomain.com>

   # App URL (use ngrok for local dev)
   SHOPIFY_APP_URL=https://your-tunnel-url.ngrok.io

   # Environment
   NODE_ENV=development
   ```

3. Generate encryption key:
   ```bash
   # Option 1: Node.js
   node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

   # Option 2: OpenSSL
   openssl rand -hex 16
   ```

## Step 5: Install Dependencies

```bash
npm install
```

## Step 6: Database Migration

```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Verify database connection
npx prisma studio
```

## Step 7: Local Development with ngrok

1. Install ngrok:
   ```bash
   npm install -g ngrok
   ```

2. Start ngrok tunnel:
   ```bash
   ngrok http 3000
   ```

3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

4. Update `.env`:
   ```env
   SHOPIFY_APP_URL=https://abc123.ngrok.io
   ```

5. Update `shopify.app.toml`:
   ```toml
   application_url = "https://abc123.ngrok.io"
   ```

6. Update Shopify app settings with ngrok URL

## Step 8: Start Development Server

```bash
npm run dev
```

The app should start on http://localhost:3000

## Step 9: Install App on Development Store

1. Create a development store in Shopify Partners
2. Go to your app in Partners dashboard
3. Click "Test your app"
4. Select your development store
5. Click "Install app"
6. Approve permissions

## Step 10: Test Ticket Generation

1. In your Shopify admin, create a test product
2. Add tag "ticket" to the product
3. Set a price and make it active
4. Go to your storefront and purchase the product
5. Check:
   - Ticket should appear in Validiam dashboard
   - Email should be sent to customer
   - QR code should be generated

## Troubleshooting

### Database connection fails
```bash
# Test connection
npx prisma db pull

# Check if PostgreSQL is running
psql -U postgres -c "SELECT 1"
```

### Webhooks not working
1. Check ngrok is running and URL matches `.env`
2. Verify webhooks in Shopify admin: Settings > Notifications > Webhooks
3. Check webhook logs in Validiam app
4. Test webhook manually:
   ```bash
   curl -X POST https://your-app.ngrok.io/api/webhooks/orders/create \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```

### Emails not sending
1. Verify SMTP credentials
2. Check spam folder
3. Test email config:
   ```bash
   node -e "
   const nodemailer = require('nodemailer');
   const transport = nodemailer.createTransport({
     host: 'smtp.gmail.com',
     port: 587,
     auth: { user: 'your@email.com', pass: 'your-password' }
   });
   transport.verify().then(console.log).catch(console.error);
   "
   ```

### QR codes not displaying
1. Check browser console for errors
2. Verify QR code library is installed
3. Check ticket has `qrCode` field in database

## Production Deployment

### Deploy to Railway

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login and initialize:
   ```bash
   railway login
   railway init
   ```

3. Add PostgreSQL:
   ```bash
   railway add
   # Select PostgreSQL
   ```

4. Set environment variables:
   ```bash
   railway variables set SHOPIFY_API_KEY=xxx
   railway variables set SHOPIFY_API_SECRET=xxx
   # ... set all other variables
   ```

5. Deploy:
   ```bash
   railway up
   ```

### Deploy to Vercel

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Set environment variables in Vercel dashboard

4. Note: You'll need external PostgreSQL (Railway, Supabase, etc.)

## Next Steps

1. **Customize branding** in app settings
2. **Test with real orders** in development store
3. **Set up custom email templates** in `app/services/email.server.ts`
4. **Configure webhook endpoints** for production
5. **Add custom product tags** if needed
6. **Set up monitoring** (Sentry, LogRocket, etc.)

## Support Resources

- Shopify App Dev Docs: https://shopify.dev/docs/apps
- Remix Docs: https://remix.run/docs
- Prisma Docs: https://www.prisma.io/docs
- Polaris Components: https://polaris.shopify.com/

---

Need help? Create an issue or contact support@validiam.com
