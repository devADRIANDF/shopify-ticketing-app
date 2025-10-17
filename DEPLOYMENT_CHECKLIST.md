# Deployment Checklist

Complete checklist for deploying Validiam to production.

## Pre-Deployment

### Code Review
- [ ] All TypeScript errors resolved
- [ ] No console.log statements in production code
- [ ] Environment variables properly configured
- [ ] Database migrations tested
- [ ] All routes tested

### Security
- [ ] Strong encryption key (32+ characters)
- [ ] Secure database password
- [ ] SMTP credentials secure
- [ ] `.env` not committed to git
- [ ] API keys rotated from development
- [ ] HTTPS enforced

### Testing
- [ ] Ticket generation works
- [ ] Email delivery successful
- [ ] QR validation API works
- [ ] Dashboard loads correctly
- [ ] CSV export functions
- [ ] Settings save properly
- [ ] Webhooks receive orders

## Database Setup

### Production Database
- [ ] PostgreSQL instance created
- [ ] Database user with proper permissions
- [ ] Connection string obtained
- [ ] Connection pooling configured
- [ ] Backups enabled

### Migration
- [ ] Run migrations: `npm run prisma:migrate`
- [ ] Verify schema: `npx prisma db pull`
- [ ] Test connection: `npx prisma studio`

## Environment Configuration

### Required Variables
```env
# Shopify
- [ ] SHOPIFY_API_KEY
- [ ] SHOPIFY_API_SECRET
- [ ] SCOPES

# Database
- [ ] DATABASE_URL (production)

# Encryption
- [ ] ENCRYPTION_KEY (NEW, not from dev!)

# Email
- [ ] EMAIL_HOST
- [ ] EMAIL_PORT
- [ ] EMAIL_USER
- [ ] EMAIL_PASSWORD
- [ ] EMAIL_FROM

# App
- [ ] SHOPIFY_APP_URL (production URL)
- [ ] NODE_ENV=production
```

## Deployment Platform

### Option 1: Railway

**Steps**:
1. [ ] Create Railway account
2. [ ] Install Railway CLI: `npm install -g @railway/cli`
3. [ ] Login: `railway login`
4. [ ] Create project: `railway init`
5. [ ] Add PostgreSQL: `railway add`
6. [ ] Set environment variables: `railway variables set KEY=value`
7. [ ] Deploy: `railway up`
8. [ ] Get deployment URL
9. [ ] Configure custom domain (optional)

**Post-Deployment**:
- [ ] Run migrations: `railway run npm run prisma:migrate`
- [ ] Test app URL
- [ ] Check logs: `railway logs`

### Option 2: Vercel

**Steps**:
1. [ ] Create Vercel account
2. [ ] Install Vercel CLI: `npm install -g vercel`
3. [ ] Deploy: `vercel`
4. [ ] Set environment variables in dashboard
5. [ ] Get deployment URL
6. [ ] Connect external database (Railway/Supabase)
7. [ ] Configure custom domain (optional)

**Post-Deployment**:
- [ ] Test deployment
- [ ] Check function logs
- [ ] Verify database connection

### Option 3: Fly.io

**Steps**:
1. [ ] Install flyctl: `curl -L https://fly.io/install.sh | sh`
2. [ ] Login: `flyctl auth login`
3. [ ] Launch: `flyctl launch`
4. [ ] Add PostgreSQL: `flyctl postgres create`
5. [ ] Attach database: `flyctl postgres attach`
6. [ ] Set secrets: `flyctl secrets set KEY=value`
7. [ ] Deploy: `flyctl deploy`

**Post-Deployment**:
- [ ] Run migrations: `flyctl ssh console` then `npm run prisma:migrate`
- [ ] Check logs: `flyctl logs`

## Shopify App Configuration

### Update App Settings
- [ ] Go to Shopify Partners > Your App > Configuration
- [ ] Update **App URL** to production URL
- [ ] Update **Redirect URLs**:
  ```
  https://your-production-url.com/auth/callback
  https://your-production-url.com/auth/shopify/callback
  https://your-production-url.com/api/auth/callback
  ```
- [ ] Save changes

### Verify Scopes
- [ ] `read_orders`
- [ ] `write_products`
- [ ] `write_webhooks`
- [ ] `read_customers`

### Distribution
- [ ] Set distribution type (Public/Custom)
- [ ] Add app listing information
- [ ] Add screenshots
- [ ] Add description
- [ ] Set pricing (if applicable)

## Email Service

### Production SMTP

**SendGrid (Recommended)**:
- [ ] Create SendGrid account
- [ ] Verify sender domain
- [ ] Create API key
- [ ] Configure in .env:
  ```env
  EMAIL_HOST=smtp.sendgrid.net
  EMAIL_PORT=587
  EMAIL_USER=apikey
  EMAIL_PASSWORD=your_sendgrid_api_key
  ```
- [ ] Test email delivery

**Mailgun**:
- [ ] Create Mailgun account
- [ ] Verify domain
- [ ] Get SMTP credentials
- [ ] Configure in .env
- [ ] Test delivery

**AWS SES**:
- [ ] Set up AWS SES
- [ ] Verify domain
- [ ] Request production access
- [ ] Get SMTP credentials
- [ ] Configure in .env

### Email Testing
- [ ] Send test ticket email
- [ ] Check spam score
- [ ] Verify images load
- [ ] Test on multiple clients (Gmail, Outlook, etc.)

## Webhooks

### Register Webhooks
- [ ] Webhooks auto-register on app install
- [ ] Verify in Shopify Admin: Settings > Notifications > Webhooks
- [ ] Check webhook endpoint is accessible
- [ ] Test webhook delivery

### Webhook Verification
```bash
# Test webhook endpoint
curl -X POST https://your-app.com/api/webhooks/orders/create \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

## Monitoring & Logging

### Set Up Monitoring

**Sentry (Error Tracking)**:
- [ ] Create Sentry account
- [ ] Install Sentry SDK: `npm install @sentry/remix`
- [ ] Configure in `entry.server.tsx`
- [ ] Test error reporting

**LogRocket (Session Replay)**:
- [ ] Create LogRocket account
- [ ] Install SDK
- [ ] Add tracking code
- [ ] Test session recording

### Application Logs
- [ ] Configure log level
- [ ] Set up log aggregation (optional)
- [ ] Monitor error rates
- [ ] Set up alerts

## Performance

### Optimization
- [ ] Enable CDN (if available)
- [ ] Configure caching headers
- [ ] Optimize database queries
- [ ] Enable gzip compression
- [ ] Minify assets

### Load Testing
- [ ] Test with 100+ concurrent users
- [ ] Simulate high ticket volume
- [ ] Check database performance
- [ ] Monitor response times

## Security Hardening

### Best Practices
- [ ] HTTPS only (no HTTP)
- [ ] Secure headers configured
- [ ] Rate limiting on API endpoints
- [ ] CORS properly configured
- [ ] SQL injection protection (Prisma handles this)
- [ ] XSS protection
- [ ] CSRF tokens (Shopify handles this)

### Secrets Rotation
- [ ] Generate new encryption key
- [ ] Rotate database password
- [ ] Update API keys
- [ ] Store backups securely

## DNS & Domain

### Custom Domain (Optional)
- [ ] Purchase domain
- [ ] Configure DNS records
- [ ] Point to deployment URL
- [ ] Enable SSL certificate
- [ ] Test domain resolution

## Backup Strategy

### Database Backups
- [ ] Enable automated backups
- [ ] Test backup restoration
- [ ] Set backup retention policy
- [ ] Document backup procedure

### Code Backups
- [ ] Push to GitHub/GitLab
- [ ] Tag production releases
- [ ] Document deployment process

## Post-Deployment Testing

### Functional Tests
- [ ] Install app on test store
- [ ] Create ticket product
- [ ] Make test purchase
- [ ] Verify ticket created
- [ ] Check email delivery
- [ ] Test QR validation
- [ ] Test CSV export
- [ ] Update settings
- [ ] Check all routes load

### Integration Tests
- [ ] Webhook receives orders
- [ ] Database saves correctly
- [ ] Emails send successfully
- [ ] API endpoints respond
- [ ] OAuth flow works

### User Acceptance
- [ ] Merchant can install app
- [ ] Merchant can configure settings
- [ ] Merchant can view tickets
- [ ] Merchant can export data
- [ ] Customer receives email
- [ ] QR codes scan correctly

## App Store Submission (If Public App)

### Preparation
- [ ] App listing complete
- [ ] Screenshots added (5+ images)
- [ ] Description written
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] Pricing configured
- [ ] Test on multiple stores

### Shopify Review
- [ ] Submit for review
- [ ] Address any feedback
- [ ] Resubmit if needed
- [ ] Wait for approval

### Launch
- [ ] App approved
- [ ] Announced on social media
- [ ] Documentation published
- [ ] Support channels ready

## Maintenance

### Regular Tasks
- [ ] Monitor error logs daily
- [ ] Check email delivery rates
- [ ] Review database performance
- [ ] Update dependencies monthly
- [ ] Backup database weekly
- [ ] Review security alerts

### Updates
- [ ] Test updates in staging
- [ ] Deploy during low-traffic hours
- [ ] Notify merchants of changes
- [ ] Monitor for issues

## Rollback Plan

### In Case of Issues
1. [ ] Document rollback procedure
2. [ ] Keep previous version deployed
3. [ ] Have database backup ready
4. [ ] Test rollback in staging
5. [ ] Communicate with users

### Rollback Steps
```bash
# Railway
railway rollback

# Vercel
vercel rollback [deployment-url]

# Fly.io
flyctl releases list
flyctl releases rollback [version]
```

## Support Setup

### Documentation
- [ ] README published
- [ ] Setup guide available
- [ ] API documentation complete
- [ ] Troubleshooting guide

### Support Channels
- [ ] Support email configured
- [ ] Help desk set up (optional)
- [ ] FAQ page created
- [ ] Discord/Slack community (optional)

## Compliance

### Legal
- [ ] Privacy policy written
- [ ] Terms of service written
- [ ] GDPR compliance (if EU customers)
- [ ] Data retention policy

### Shopify Requirements
- [ ] Follows Shopify App Design Guidelines
- [ ] Uses Shopify Polaris
- [ ] Handles webhooks correctly
- [ ] Proper OAuth flow

## Final Checks

### Pre-Launch
- [ ] All tests passing
- [ ] All documentation complete
- [ ] All environment variables set
- [ ] All services healthy
- [ ] All integrations working
- [ ] Monitoring active
- [ ] Support ready

### Launch Day
- [ ] Deploy to production
- [ ] Verify all systems operational
- [ ] Monitor logs closely
- [ ] Be ready for support requests
- [ ] Celebrate! 🎉

---

## Quick Reference

### Deployment Commands

```bash
# Railway
railway up
railway logs
railway variables list

# Vercel
vercel
vercel logs
vercel env list

# Fly.io
flyctl deploy
flyctl logs
flyctl secrets list

# Database
npm run prisma:migrate
npx prisma studio
npx prisma db pull
```

### Useful Links
- Railway: https://railway.app/
- Vercel: https://vercel.com/
- Fly.io: https://fly.io/
- Shopify Partners: https://partners.shopify.com/

---

**Status**: Ready for deployment when all checkboxes are completed.
