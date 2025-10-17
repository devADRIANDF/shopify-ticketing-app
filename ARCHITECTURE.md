# Validiam Architecture Documentation

## System Overview

Validiam is a full-stack Shopify app built with modern web technologies, designed to handle event ticketing at scale.

```
┌─────────────────────────────────────────────────────────────┐
│                        Shopify Store                         │
│  (Customer purchases product tagged "ticket")                │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ Webhook: orders/create
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Validiam Shopify App                      │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐   ┌──────────────┐  │
│  │   Webhook    │───▶│   Ticket     │──▶│   Email      │  │
│  │   Handler    │    │   Service    │   │   Service    │  │
│  └──────────────┘    └──────────────┘   └──────────────┘  │
│         │                    │                    │         │
│         │                    ▼                    │         │
│         │            ┌──────────────┐             │         │
│         │            │  QR Service  │             │         │
│         │            └──────────────┘             │         │
│         │                    │                    │         │
│         ▼                    ▼                    ▼         │
│  ┌─────────────────────────────────────────────────────┐  │
│  │           PostgreSQL Database (Prisma)              │  │
│  │  - Tickets  - Sessions  - Settings  - Templates     │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Admin UI (Remix + Polaris)             │  │
│  │  - Dashboard  - Tickets  - Settings  - Export       │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                   Public API                         │  │
│  │  - Validate Ticket  - Scan QR  - Get Status         │  │
│  └─────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ API Calls
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Mobile Scanner App                          │
│              (Scans QR codes at events)                      │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Remix**: React framework for server-side rendering
- **Shopify Polaris**: UI component library
- **Shopify App Bridge**: Embedded app integration
- **React 18**: UI library

### Backend
- **Node.js**: Runtime environment
- **Remix Loaders/Actions**: API endpoints
- **Prisma**: ORM for database access
- **PostgreSQL**: Relational database

### External Services
- **Shopify Admin API**: Product and order management
- **Nodemailer**: Email delivery
- **SMTP Service**: Gmail, SendGrid, Mailgun, etc.

### Security
- **OAuth 2.0**: Shopify authentication
- **AES Encryption**: QR code data encryption
- **HMAC**: Webhook verification
- **Environment Variables**: Secrets management

## Project Structure

```
validiam-shopify-app/
├── app/
│   ├── components/          # Reusable UI components
│   │   ├── Icons.tsx        # SVG icon components
│   │   └── TicketCard.tsx   # Ticket display card
│   │
│   ├── lib/                 # Utility libraries
│   │   ├── db.server.ts     # Database client
│   │   └── encryption.server.ts  # QR encryption
│   │
│   ├── routes/              # Application routes
│   │   ├── app._index.tsx   # Dashboard
│   │   ├── app.tickets.tsx  # Tickets list
│   │   ├── app.settings.tsx # Settings page
│   │   ├── app.export.tsx   # CSV export
│   │   ├── api.webhooks.orders.create.tsx  # Webhook
│   │   └── api.tickets.validate.tsx        # Validation API
│   │
│   ├── services/            # Business logic
│   │   ├── qr.server.ts     # QR generation
│   │   ├── email.server.ts  # Email sending
│   │   └── ticket.server.ts # Ticket management
│   │
│   ├── shopify.server.ts    # Shopify config
│   ├── entry.client.tsx     # Client entry
│   ├── entry.server.tsx     # Server entry
│   └── root.tsx             # Root component
│
├── prisma/
│   └── schema.prisma        # Database schema
│
├── .env.example             # Environment template
├── package.json             # Dependencies
├── shopify.app.toml         # Shopify app config
├── tsconfig.json            # TypeScript config
├── vite.config.ts           # Vite config
└── README.md                # Documentation
```

## Data Flow

### 1. Ticket Creation Flow

```
Order Created in Shopify
    │
    ▼
Webhook Handler Receives Order
    │
    ▼
Check Line Items for "ticket" Tag
    │
    ▼
For Each Ticket Quantity:
    │
    ├─▶ Generate Unique Ticket ID
    │
    ├─▶ Create QR Data Object
    │       {
    │         entry_id, order, buyer,
    │         ticket_type, valid, used, timestamp
    │       }
    │
    ├─▶ Encrypt QR Data (AES)
    │
    ├─▶ Generate QR Code Image (PNG)
    │
    └─▶ Save to Database
            │
            ▼
        Send Email with QR Codes
```

### 2. Ticket Validation Flow

```
Scanner App Reads QR Code
    │
    ▼
POST /api/tickets/validate
    {qrData: "encrypted_string"}
    │
    ▼
Decrypt QR Data
    │
    ▼
Lookup Ticket in Database
    │
    ├─▶ Not Found? ─▶ Return Error
    │
    ├─▶ Already Scanned? ─▶ Return Error
    │
    └─▶ Valid? ─▶ Mark as SCANNED
                      │
                      ▼
                  Return Success
```

### 3. Admin Dashboard Flow

```
User Opens Dashboard
    │
    ▼
Authenticate with Shopify OAuth
    │
    ▼
Load Ticket Statistics
    │
    ├─▶ Total Tickets
    ├─▶ Valid Count
    ├─▶ Scanned Count
    └─▶ Pending Count
    │
    ▼
Display Recent Tickets
    │
    └─▶ User Can:
        ├─▶ View All Tickets
        ├─▶ Search/Filter
        ├─▶ Export CSV
        └─▶ Configure Settings
```

## Database Schema

### Ticket Table
```sql
CREATE TABLE Ticket (
  id            TEXT PRIMARY KEY,
  shopifyOrderId TEXT NOT NULL,
  shopifyOrderName TEXT NOT NULL,
  lineItemId    TEXT NOT NULL,
  productId     TEXT NOT NULL,
  variantId     TEXT NOT NULL,
  productTitle  TEXT NOT NULL,
  variantTitle  TEXT,
  quantity      INTEGER DEFAULT 1,
  buyerEmail    TEXT NOT NULL,
  buyerName     TEXT,
  ticketType    TEXT NOT NULL,
  qrCode        TEXT UNIQUE NOT NULL,
  qrData        TEXT NOT NULL,
  status        TicketStatus DEFAULT 'PENDING',
  scannedAt     TIMESTAMP,
  scannedBy     TEXT,
  shop          TEXT NOT NULL,
  createdAt     TIMESTAMP DEFAULT NOW(),
  updatedAt     TIMESTAMP DEFAULT NOW(),
  eventDate     TIMESTAMP,
  eventName     TEXT
);

CREATE INDEX idx_shop ON Ticket(shop);
CREATE INDEX idx_order ON Ticket(shopifyOrderId);
CREATE INDEX idx_qr ON Ticket(qrCode);
CREATE INDEX idx_status ON Ticket(status);
```

### AppSettings Table
```sql
CREATE TABLE AppSettings (
  id                TEXT PRIMARY KEY,
  shop              TEXT UNIQUE NOT NULL,
  ticketTag         TEXT DEFAULT 'ticket',
  autoEmailEnabled  BOOLEAN DEFAULT TRUE,
  brandColor        TEXT DEFAULT '#5C6AC4',
  brandLogo         TEXT,
  emailTemplateId   TEXT,
  createdAt         TIMESTAMP DEFAULT NOW(),
  updatedAt         TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### Admin Routes (Authenticated)

| Route | Method | Description |
|-------|--------|-------------|
| `/app` | GET | Dashboard with stats |
| `/app/tickets` | GET | List all tickets |
| `/app/settings` | GET/POST | App configuration |
| `/app/export` | POST | CSV export |

### Webhook Routes (HMAC Verified)

| Route | Method | Description |
|-------|--------|-------------|
| `/api/webhooks/orders/create` | POST | Order creation webhook |

### Public API Routes (OAuth)

| Route | Method | Description |
|-------|--------|-------------|
| `/api/tickets/validate` | POST | Validate and scan ticket |
| `/api/tickets/validate` | GET | Check ticket status |

## Security Model

### 1. Shopify OAuth
- Merchants authenticate via Shopify OAuth 2.0
- Session tokens stored in database
- Automatic token refresh

### 2. QR Code Encryption
```javascript
// Encryption
const encrypted = CryptoJS.AES.encrypt(
  JSON.stringify(ticketData),
  ENCRYPTION_KEY
).toString();

// Decryption
const decrypted = CryptoJS.AES.decrypt(
  encryptedData,
  ENCRYPTION_KEY
).toString(CryptoJS.enc.Utf8);
```

### 3. Webhook Verification
- Shopify HMAC signature validation
- Prevents unauthorized webhook calls

### 4. Database Security
- Prepared statements via Prisma
- No SQL injection risk
- Row-level security (by shop)

## Performance Optimizations

### 1. Database Indexing
- Indexed on: `shop`, `shopifyOrderId`, `qrCode`, `status`
- Fast queries for common operations

### 2. Async Email Sending
- Non-blocking email delivery
- Webhook responds immediately
- Emails sent in background

### 3. QR Code Caching
- QR images stored in database
- No regeneration needed
- Base64 encoding for fast delivery

### 4. Pagination
- Tickets list paginated (20 per page)
- Prevents memory overflow
- Fast page loads

## Scalability Considerations

### Horizontal Scaling
- Stateless architecture
- Can run multiple instances
- Database connection pooling

### Database Scaling
- PostgreSQL supports read replicas
- Can add caching layer (Redis)
- Partitioning by shop domain

### Email Scaling
- Queue system for high volume
- Use services like SendGrid, Mailgun
- Rate limiting to prevent spam

## Error Handling

### Webhook Errors
```javascript
try {
  // Process webhook
} catch (error) {
  console.error("Webhook error:", error);
  return new Response("Error", { status: 500 });
}
```

### Email Errors
```javascript
const result = await sendEmail();
if (!result.success) {
  console.error("Email failed:", result.error);
  // Continue processing, email is non-critical
}
```

### Validation Errors
```javascript
if (!ticket) {
  return json({
    valid: false,
    error: "Ticket not found"
  });
}
```

## Monitoring & Logging

### Recommended Tools
- **Sentry**: Error tracking
- **LogRocket**: Session replay
- **Datadog**: Application monitoring
- **Shopify Analytics**: App usage

### Key Metrics
- Tickets generated per day
- Email delivery rate
- Validation API response time
- Database query performance

## Future Enhancements

### Planned Features
1. **Bulk ticket upload** via CSV
2. **Custom ticket designs** with templates
3. **Analytics dashboard** with charts
4. **Multiple event management**
5. **Ticket transfer** between customers
6. **Refund handling** with auto-invalidation
7. **SMS delivery** option
8. **Multi-language support**

### Technical Improvements
1. **Redis caching** for frequently accessed data
2. **GraphQL API** for mobile app
3. **WebSocket** for real-time updates
4. **CDN** for QR image delivery
5. **Rate limiting** on API endpoints

---

This architecture is designed to be:
- **Scalable**: Handle thousands of tickets daily
- **Secure**: Industry-standard encryption and auth
- **Maintainable**: Clean separation of concerns
- **Extensible**: Easy to add new features
