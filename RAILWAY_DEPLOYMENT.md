# Railway Worker Deployment Guide

## Prerequisites
1. Railway account (sign up at railway.app)
2. Firebase Service Account JSON
3. Facebook App credentials

## Step 1: Get Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com/project/first-73c50/settings/serviceaccounts/adminsdk)
2. Click **"Generate New Private Key"**
3. Save the JSON file
4. Copy the entire JSON content (you'll need it for Railway)

## Step 2: Deploy to Railway

### Option A: Using Railway CLI (Recommended)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Navigate to railway-worker directory
cd railway-worker

# Initialize Railway project
railway init

# Deploy
railway up
```

### Option B: Using Railway Dashboard

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Connect your GitHub account
5. Select `abdulkhaliq-cyber/clearcomment` repository
6. Set **Root Directory** to `railway-worker`
7. Railway will auto-detect Node.js and deploy

## Step 3: Configure Environment Variables

In Railway Dashboard, go to **Variables** and add:

```
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://first-73c50.web.app
FIREBASE_PROJECT_ID=first-73c50
FIREBASE_SERVICE_ACCOUNT=<paste entire Firebase service account JSON>
FACEBOOK_APP_SECRET=<your Facebook app secret>
FACEBOOK_VERIFY_TOKEN=<create a random string, e.g., "my_secure_token_12345">
```

**To get Facebook App Secret:**
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Select your app
3. Go to **Settings** → **Basic**
4. Copy **App Secret** (click "Show")

## Step 4: Get Your Railway URL

After deployment:
1. Go to **Settings** → **Domains**
2. Click **"Generate Domain"**
3. Copy the URL (e.g., `https://clearcomment-production.up.railway.app`)

## Step 5: Update Client Environment Variable

Add to `client/.env`:
```
VITE_RAILWAY_URL=https://your-railway-url.up.railway.app
```

Then rebuild and redeploy client:
```bash
cd client
npm run build
firebase deploy --only hosting
```

## Step 6: Configure Facebook Webhooks

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Select your app
3. Go to **Webhooks** (in Products menu)
4. Click **"Add Subscription"** → **Page**
5. Enter:
   - **Callback URL**: `https://your-railway-url.up.railway.app/webhook/facebook`
   - **Verify Token**: (the same token you set in `FACEBOOK_VERIFY_TOKEN`)
6. Click **"Verify and Save"**
7. Subscribe to these fields:
   - ✅ `feed` (for new comments)
   - ✅ `comments` (for comment updates)

## Step 7: Subscribe Pages to Webhooks

For each Facebook Page you want to monitor:

```bash
curl -X POST "https://graph.facebook.com/v18.0/{PAGE_ID}/subscribed_apps?subscribed_fields=feed,comments&access_token={PAGE_ACCESS_TOKEN}"
```

Or use this endpoint in your app (to be added).

## Verification

Test your deployment:

1. **Health Check**: Visit `https://your-railway-url.up.railway.app/health`
   - Should return: `{"status":"ok","timestamp":"...","uptime":...}`

2. **Test Sync**: Click "Sync Comments" in dashboard
   - Should fetch and display comments

3. **Test Webhook**: Post a comment on your Facebook Page
   - Should appear in dashboard automatically

## Troubleshooting

### Railway logs not showing
```bash
railway logs
```

### Webhook not receiving events
- Check Facebook App is in **Live** mode (or you're a test user)
- Verify webhook subscription is active
- Check Railway logs for incoming requests

### CORS errors
- Ensure `FRONTEND_URL` matches your Firebase hosting URL exactly
- No trailing slash

## Keep Worker Alive (Optional)

Railway may sleep inactive services. To keep it warm:

1. Use a service like [cron-job.org](https://cron-job.org)
2. Create a job to ping `https://your-railway-url.up.railway.app/health` every 5 minutes

---

**Next Steps:**
1. Deploy to Railway
2. Configure webhooks
3. Test the sync feature
4. Monitor logs for any issues
