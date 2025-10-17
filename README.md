# Validiam - Shopify Ticket Management App

A complete Shopify app for managing event tickets with QR code generation, email delivery, and real-time validation.

## Features

### Core Functionality
- **Automatic QR Code Generation**: Generate unique QR codes for each ticket purchased
- **Encrypted QR Data**: Secure ticket information with AES encryption
- **Email Delivery**: Automatically send beautifully designed ticket emails to customers
- **Ticket Management Dashboard**: View, search, and filter all tickets
- **Real-time Validation**: API endpoints for scanning and validating tickets
- **CSV Export**: Export ticket data with custom filters
- **Webhook Integration**: Automatic ticket generation on order creation

### Technical Features
- **Scalable Architecture**: Built with Remix and Shopify App Bridge
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Secure OAuth integration with Shopify
- **Email Service**: Nodemailer with customizable templates
- **Responsive UI**: Shopify Polaris design system

## Installation

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Shopify Partner account
- SMTP email service (Gmail, SendGrid, etc.)

### Setup Steps

1. **Clone and Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

   Required variables:
   - `SHOPIFY_API_KEY`: Your Shopify app API key
   - `SHOPIFY_API_SECRET`: Your Shopify app secret
   - `DATABASE_URL`: PostgreSQL connection string
   - `ENCRYPTION_KEY`: 32-character key for QR encryption
   - `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASSWORD`: SMTP configuration

3. **Initialize Database**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Configure Shopify App**
   - Update `shopify.app.toml` with your app details
   - Set up webhooks in Shopify Partner Dashboard
   - Configure redirect URLs

## How It Works

### Ticket Generation Flow

1. **Customer purchases a product** tagged with "ticket" or "entrada"
2. **Webhook fires** to `/api/webhooks/orders/create`
3. **System generates**:
   - Unique ticket ID for each quantity
   - Encrypted QR code with ticket data
   - QR code image (PNG, base64)
4. **Database stores** ticket information
5. **Email sent** to customer with QR codes
6. **Ticket ready** for validation

### Ticket Structure

Each QR code contains encrypted JSON:
```json
{
  "entry_id": "TKT-ABC123",
  "shopify_order": "#1234",
  "buyer": "customer@example.com",
  "ticket_type": "VIP Pass",
  "valid": true,
  "used": false,
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

## API Endpoints

### Validate Ticket
**POST** `/api/tickets/validate`

Request:
```json
{
  "qrData": "encrypted_qr_string",
  "scannedBy": "Scanner Name (optional)"
}
```

Response:
```json
{
  "valid": true,
  "ticket": {
    "id": "TKT-ABC123",
    "status": "SCANNED",
    "buyerEmail": "customer@example.com",
    "ticketType": "VIP Pass"
  },
  "message": "Ticket scanned successfully"
}
```

### Check Ticket Status
**GET** `/api/tickets/validate?qrData=encrypted_string`

Response:
```json
{
  "valid": true,
  "ticket": { ... },
  "error": null
}
```

## Admin Panel Routes

- `/app` - Dashboard with stats and recent tickets
- `/app/tickets` - All tickets with search and filters
- `/app/settings` - App configuration
- `/app/export` - CSV export with filters

## Database Schema

### Ticket Model
- `id`: Unique ticket identifier
- `shopifyOrderId`: Shopify order ID
- `qrCode`: QR code image (base64)
- `qrData`: Encrypted ticket data
- `status`: PENDING | VALID | SCANNED | INVALID | CANCELLED
- `buyerEmail`: Customer email
- `scannedAt`: Timestamp of scan
- `eventDate`: Event date (optional)

### AppSettings Model
- `shop`: Shopify shop domain
- `ticketTag`: Product tag to identify tickets
- `autoEmailEnabled`: Auto-send emails
- `brandColor`: Email branding color
- `brandLogo`: Logo URL for emails

## Customization

### Email Templates
Edit `app/services/email.server.ts` to customize email design:
- HTML structure
- Styling
- Content
- Branding

### Ticket Tags
Configure in Settings:
- Default: "ticket"
- Also checks for: "entrada", "entry"
- Add custom tags in webhook handler

### QR Code Styling
Modify `app/services/qr.server.ts`:
- Size (default: 512x512)
- Error correction level
- Colors
- Margins

## Production Deployment

1. **Set up production database**
   ```bash
   DATABASE_URL=your_production_db npm run setup
   ```

2. **Configure environment**
   - Set `NODE_ENV=production`
   - Update `SHOPIFY_APP_URL` to production URL
   - Configure secure SMTP credentials

3. **Deploy to hosting platform**
   - Vercel, Railway, Fly.io, etc.
   - Ensure webhooks are accessible
   - SSL certificate required

4. **Register webhooks**
   ```bash
   npm run deploy
   ```

## Security Considerations

- **Encryption**: All QR data is AES encrypted
- **Authentication**: OAuth with Shopify
- **Webhook Verification**: HMAC signature validation
- **Database**: Prepared statements (Prisma)
- **Environment Variables**: Never commit `.env`

## Scaling for High Volume

The app is designed to handle 1000+ tickets per day:

- **Database Indexing**: Optimized queries on `shop`, `status`, `qrCode`
- **Async Email Sending**: Non-blocking email delivery
- **Webhook Processing**: Fast response, background processing
- **CDN**: Serve QR images from CDN if needed

## Troubleshooting

### Emails not sending
1. Check SMTP credentials in `.env`
2. Verify email service allows app passwords
3. Check firewall/port settings
4. Enable "Allow less secure apps" for Gmail

### Tickets not generating
1. Verify webhook is registered
2. Check product has correct tag
3. Review webhook logs
4. Ensure database connection

### QR codes not validating
1. Check encryption key is consistent
2. Verify QR data format
3. Review API authentication

## Support

For issues and questions:
- GitHub Issues: [Create an issue](#)
- Email: support@validiam.com
- Documentation: [docs.validiam.com](#)

## License

MIT License - See LICENSE file for details

---

**Built with**
- Remix
- Shopify App Bridge
- Prisma
- PostgreSQL
- Nodemailer
- QRCode
- Shopify Polaris
