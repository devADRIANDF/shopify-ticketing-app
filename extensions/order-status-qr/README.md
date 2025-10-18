# Order Status QR Code Extension

This checkout UI extension displays event ticket QR codes on the order confirmation page (thank you page) after a customer completes their purchase.

## How It Works

1. Customer completes purchase with ticket products
2. Webhook creates tickets and generates QR codes
3. QR codes are sent via email
4. **Extension displays QR codes on order status page** (this extension)

## Features

- Shows QR codes immediately after purchase
- Displays all tickets for the order
- Mobile-friendly design
- Automatically hidden if order has no tickets

## Deployment

To deploy this extension to your Shopify app:

```bash
# From the root of the project
npm run shopify app deploy

# Or using Shopify CLI directly
shopify app deploy
```

## Configuration

The extension is configured to appear on:
- `purchase.thank-you.block.render` - Order status/thank you page

## API Endpoint

The extension calls:
```
GET /api/tickets/by-order?orderId={orderId}&shop={shop}
```

This endpoint returns all tickets with QR codes for the specified order.

## Testing

1. Install the app on a development store
2. Deploy the extension
3. Enable the extension in your store's checkout settings
4. Create a test order with a product tagged "ticket"
5. Check the order status page for QR codes
