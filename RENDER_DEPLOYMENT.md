# Deploying to Render.com

This guide explains how to deploy the Shopify Ticketing App to Render.com, which properly supports Remix applications.

## Why Render.com?

Render.com provides persistent Node.js servers (not serverless functions), which is exactly what Remix applications need. Unlike Vercel's serverless architecture, Render properly handles the Remix build artifacts.

## Prerequisites

1. A GitHub account with this repository pushed
2. A Render.com account (free tier available)

## Step 1: Push Your Code to GitHub

If you haven't already:

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin master
```

## Step 2: Create a Render Account

1. Go to [https://render.com](https://render.com)
2. Sign up with your GitHub account
3. Authorize Render to access your repositories

## Step 3: Create a New Web Service

1. Click **New +** in the top right
2. Select **Web Service**
3. Connect your `shopify-ticketing-app` repository
4. Configure the service:
   - **Name**: `shopify-ticketing-app`
   - **Region**: Europe (Frankfurt) or closest to you
   - **Branch**: `master`
   - **Runtime**: Node
   - **Build Command**: `npm install && prisma generate && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid for production)

## Step 4: Add Environment Variables

In the Render dashboard, go to **Environment** and add these variables:

### Required Variables

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `SHOPIFY_API_KEY` | `cc4511f9341d22ee8d454f3d2c1200fe` |
| `SHOPIFY_API_SECRET` | `952db292a707db19abd266ca3347c200` |
| `SHOPIFY_APP_URL` | `https://shopify-ticketing-app.onrender.com` |
| `DATABASE_URL` | `postgresql://postgres.pbddvlgjallejkczsizt:Validiam123!@aws-1-eu-north-1.pooler.supabase.com:5432/postgres` |
| `ENCRYPTION_KEY` | `zpR1D3mL9kFwQ7cT6nHxY5VaUcEt0G2b` |
| `SCOPES` | `write_products,read_orders,read_customers,write_customers` |

### Optional Variables (Email)

| Variable | Value |
|----------|-------|
| `EMAIL_HOST` | `smtp.gmail.com` |
| `EMAIL_PORT` | `587` |
| `EMAIL_USER` | `validiamtickets@gmail.com` |
| `EMAIL_PASSWORD` | `sedeasde11` |
| `EMAIL_FROM` | `Validiam <noreply@validiam.com>` |

**Note**: After adding all variables, click **Save Changes**

## Step 5: Deploy

1. Click **Create Web Service**
2. Wait for the deployment (5-10 minutes for first deploy)
3. Once it shows **Live**, your app URL will be: `https://shopify-ticketing-app.onrender.com`

## Step 6: Update Shopify App Configuration

After deployment, update your Shopify app settings:

1. Open `shopify.app.toml`
2. Update the URLs:

```toml
application_url = "https://shopify-ticketing-app.onrender.com"

[auth]
redirect_urls = [
  "https://shopify-ticketing-app.onrender.com/auth/callback",
  "https://shopify-ticketing-app.onrender.com/auth/shopify/callback",
  "https://shopify-ticketing-app.onrender.com/api/auth/callback"
]
```

3. Commit and push:

```bash
git add shopify.app.toml
git commit -m "Update Shopify app URLs for Render deployment"
git push origin master
```

4. Also update in Shopify Partner Dashboard:
   - Go to [https://partners.shopify.com](https://partners.shopify.com)
   - Select your app
   - Update App URL and Allowed redirection URL(s)

## Step 7: Test the App

1. Go to your Shopify admin
2. Navigate to Apps
3. Click on your "validiam" app
4. You should see the dashboard without errors

## Troubleshooting

### Viewing Logs

1. In Render dashboard, go to your service
2. Click on **Logs** tab
3. Look for any error messages

### Common Issues

**Build fails with Prisma error**:
- Ensure `DATABASE_URL` is set correctly
- The build command includes `prisma generate`

**App shows 404**:
- Check that `SHOPIFY_APP_URL` matches your Render URL exactly
- Ensure redirect URLs in Shopify Partner Dashboard are updated

**500 Internal Server Error**:
- Check Render logs for the specific error
- Verify all required environment variables are set

### Free Tier Limitations

Render's free tier:
- App sleeps after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds (cold start)
- For production, consider upgrading to Starter plan ($7/month)

## Automatic Deployments

Render automatically deploys when you push to the `master` branch:

```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin master

# Render will automatically build and deploy
```

## Monitoring

In the Render dashboard you can:
- View real-time logs
- Monitor resource usage
- See deployment history
- Configure alerts

## Next Steps

- Consider upgrading to a paid plan for production use
- Set up custom domain if needed
- Enable auto-scaling for high traffic
