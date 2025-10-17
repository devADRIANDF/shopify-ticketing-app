# Quick Start Guide - 5 Minutes to Running App

The fastest way to get Validiam running locally.

## Prerequisites Check

```bash
# Check Node.js version (need 18+)
node --version

# Check npm
npm --version

# Check if PostgreSQL is running (optional - can use cloud)
psql --version
```

## Fast Setup (Local Development)

### 1. Clone and Install (1 minute)

```bash
cd "C:\Users\adlrr\Desktop\VALIDIAM\SHOPIFY APP"
npm install
```

### 2. Quick Database Setup (1 minute)

**Option A: Use Railway (Easiest)**
1. Go to https://railway.app/
2. Sign up with GitHub
3. New Project > Add PostgreSQL
4. Copy `DATABASE_URL` from Variables tab

**Option B: Local PostgreSQL**
```bash
# Create local database
createdb validiam

# Your DATABASE_URL:
# postgresql://yourusername@localhost:5432/validiam
```

### 3. Configure Environment (2 minutes)

```bash
# Copy template
cp .env.example .env
```

Edit `.env` - **Only fill these for now**:
```env
# Get from Shopify Partners Dashboard
SHOPIFY_API_KEY=paste_your_api_key
SHOPIFY_API_SECRET=paste_your_api_secret

# Your database URL from step 2
DATABASE_URL=postgresql://...

# Generate random 32 characters
ENCRYPTION_KEY=abc123def456ghi789jkl012mno345pq

# Gmail for testing (or use any SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your.email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=Validiam <your.email@gmail.com>
```

**Generate Encryption Key:**
```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

**Gmail App Password:**
1. Google Account > Security > 2-Step Verification > App passwords
2. Generate password for "Mail"
3. Use the 16-digit code

### 4. Setup Database (30 seconds)

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 5. Start with ngrok (1 minute)

**Terminal 1 - Start App:**
```bash
npm run dev
```

**Terminal 2 - Start ngrok:**
```bash
npx ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abc-123-456.ngrok.io`)

### 6. Update Shopify App (30 seconds)

1. Go to Shopify Partners > Your App > Configuration
2. Set **App URL**: `https://your-ngrok-url.ngrok.io`
3. Add **Redirect URLs**:
   ```
   https://your-ngrok-url.ngrok.io/auth/callback
   https://your-ngrok-url.ngrok.io/auth/shopify/callback
   https://your-ngrok-url.ngrok.io/api/auth/callback
   ```
4. Save

Also update your `.env`:
```env
SHOPIFY_APP_URL=https://your-ngrok-url.ngrok.io
```

## Test It!

### 1. Install App (30 seconds)

1. Partners Dashboard > Your App > Test on development store
2. Select your dev store
3. Click Install
4. Approve permissions

### 2. Create Test Ticket Product (1 minute)

1. Shopify Admin > Products > Add product
2. Title: "VIP Concert Ticket"
3. Price: $50
4. **Important**: Add tag `ticket`
5. Save

### 3. Make Test Purchase (1 minute)

1. Go to your store
2. Add ticket to cart
3. Checkout (use test credit card: 4242 4242 4242 4242)
4. Complete order

### 4. Verify Everything Works

1. **Check Validiam Dashboard**: Should show 1 ticket
2. **Check Email**: Customer should receive QR code
3. **Check Database**: `npx prisma studio` to see ticket

## Success! What Now?

### View Your Tickets
- Dashboard: `https://your-ngrok-url.ngrok.io/app`
- All Tickets: `https://your-ngrok-url.ngrok.io/app/tickets`

### Customize Settings
- Go to Settings in Validiam app
- Change brand color
- Add logo URL
- Customize ticket tag

### Test QR Validation
```bash
# Get a ticket's QR data from database
# Then test validation:
curl -X POST https://your-ngrok-url.ngrok.io/api/tickets/validate \
  -H "Content-Type: application/json" \
  -d '{"qrData": "paste_encrypted_qr_data_here"}'
```

## Common Issues

### "Cannot connect to database"
- Check `DATABASE_URL` is correct
- Test: `npx prisma db pull`
- If local PostgreSQL, ensure it's running

### "Webhook not receiving orders"
- Restart ngrok and update URLs everywhere
- Check webhook in Shopify: Settings > Notifications > Webhooks
- Look for `orders/create` webhook

### "Email not sending"
- Check spam folder
- Verify Gmail app password (not regular password)
- Test SMTP:
  ```bash
  npm run test:email  # If you create this script
  ```

### "ngrok URL keeps changing"
- Free ngrok URLs change on restart
- Upgrade to ngrok Pro for static domain
- Or update URLs each time you restart

## Next Steps

1. **Read Full Docs**: Check `README.md` for detailed info
2. **Customize Emails**: Edit `app/services/email.server.ts`
3. **Add Branding**: Upload logo in Settings
4. **Production Deploy**: Follow `SETUP.md` for Railway/Vercel
5. **Build Scanner App**: Use mobile app to scan QR codes

## Development Tips

### Useful Commands

```bash
# View database
npx prisma studio

# Check logs
npm run dev  # Watch the terminal

# Reset database (careful!)
npx prisma migrate reset

# Generate new migration
npx prisma migrate dev --name your_migration_name
```

### Hot Reload
- Edit files in `app/`
- Remix auto-reloads
- Check terminal for errors

### Debug Mode
```env
# Add to .env
NODE_ENV=development
LOG_LEVEL=debug
```

## Testing Checklist

- [ ] App installs on dev store
- [ ] Product with "ticket" tag creates ticket
- [ ] Email arrives with QR code
- [ ] Dashboard shows ticket stats
- [ ] Can search/filter tickets
- [ ] Can export CSV
- [ ] Settings save correctly
- [ ] QR validation API works

## Get Help

- **Error Messages**: Check terminal output
- **Database Issues**: Run `npx prisma studio` to inspect
- **Email Problems**: Check SMTP settings
- **Webhook Issues**: Check Shopify webhook logs

**Still stuck?** Check `SETUP.md` for detailed troubleshooting.

---

**Time to running app: ~5-10 minutes**

Enjoy building with Validiam! 🎫
