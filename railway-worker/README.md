# Railway Worker Deployment Guide

## 🚂 Deploy to Railway

### 1. Install Dependencies
```bash
cd railway-worker
npm install
```

### 2. Test Locally
```bash
npm run dev
```

### 3. Deploy to Railway

#### Option A: Using Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

#### Option B: Using GitHub Integration
1. Push this folder to GitHub
2. Go to [Railway.app](https://railway.app)
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Set root directory to `railway-worker`

### 4. Set Environment Variables in Railway

Go to your Railway project → Variables tab and add:

```
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-vite-app.vercel.app
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
FACEBOOK_APP_SECRET=your-app-secret
FACEBOOK_VERIFY_TOKEN=your-verify-token
OPENAI_API_KEY=sk-... (optional)
```

### 5. Get Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file
6. Copy the entire JSON content and paste it as `FIREBASE_SERVICE_ACCOUNT` in Railway

### 6. Configure Facebook Webhook

1. Get your Railway URL: `https://your-app.railway.app`
2. Go to [Facebook Developers](https://developers.facebook.com/)
3. Select your app → **Webhooks**
4. Click **Edit Subscription**
5. Set Callback URL: `https://your-app.railway.app/webhook/facebook`
6. Set Verify Token: (same as `FACEBOOK_VERIFY_TOKEN` in Railway)
7. Subscribe to `feed` events

### 7. Keep Worker Warm (Prevent Cold Starts)

Railway may sleep your worker if it's inactive. To prevent this:

#### Option A: Use Cron-Job.org
1. Go to [cron-job.org](https://cron-job.org)
2. Create a free account
3. Add a new cron job:
   - URL: `https://your-app.railway.app/health`
   - Schedule: Every 5 minutes
   - Method: GET

#### Option B: Use UptimeRobot
1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Create a free account
3. Add a new monitor:
   - Type: HTTP(s)
   - URL: `https://your-app.railway.app/health`
   - Interval: 5 minutes

## 📡 API Endpoints

Once deployed, your worker will have these endpoints:

- `GET /health` - Health check
- `GET /webhook/facebook` - Facebook webhook verification
- `POST /webhook/facebook` - Receive Facebook events
- `POST /automation/rules` - Manually trigger rule processing
- `POST /ai/moderation` - AI-powered moderation

## 🔒 Security Notes

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use Railway's environment variables** - They're encrypted
3. **Verify webhook signatures** - Already implemented
4. **Use HTTPS only** - Railway provides this automatically

## 🐛 Debugging

View logs in Railway:
```bash
railway logs
```

Or in the Railway dashboard → Deployments → View Logs

## 📊 Monitoring

Check if your worker is running:
```bash
curl https://your-app.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345
}
```
