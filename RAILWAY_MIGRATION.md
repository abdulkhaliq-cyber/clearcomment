# Railway Worker Migration Guide

## ✅ Completed Setup

We have created a dedicated Node.js worker (`railway-worker`) to handle all backend logic, replacing the Next.js API routes.

### Features Moved to Worker:
1. **Facebook Webhooks** (`/webhook/facebook`)
   - Handles incoming comments
   - Stores them in Firestore
   - Triggers auto-moderation

2. **Automation Rules** (`/automation/rules`)
   - Processes comments against rules
   - Hides/Deletes comments automatically
   - Logs actions to Firestore

3. **AI Moderation** (`/ai/moderation`)
   - Checks comments using AI (OpenAI or fallback)

4. **Manual Moderation** (`/moderation/action`)
   - Handles Hide/Delete actions from the Dashboard

## 🚀 Deployment Steps

### 1. Fix Environment Variables
Your `.env` file in `railway-worker` has an invalid JSON string for `FIREBASE_SERVICE_ACCOUNT`.
- Ensure it is a **single line** string.
- No newlines inside the JSON.

### 2. Deploy to Railway
1. Push the `railway-worker` folder to GitHub.
2. Create a new project on Railway from the repo.
3. Set the Root Directory to `railway-worker`.
4. Add all environment variables from `.env`.

### 3. Update Facebook Webhook
1. Go to Facebook Developers Console.
2. Update Webhook URL to: `https://your-railway-app.up.railway.app/webhook/facebook`
3. Verify Token: Use the one from your `.env`.

## 🔄 Update Frontend (Client)

To fully switch to the Railway worker, update `client/src/pages/Dashboard.tsx`:

Change the API URL for moderation actions:

```typescript
// Old (Next.js API)
const res = await fetch(`/api/moderation/${action.toLowerCase()}`, ...

// New (Railway Worker)
const RAILWAY_URL = import.meta.env.VITE_RAILWAY_URL || 'http://localhost:3001';
const res = await fetch(`${RAILWAY_URL}/moderation/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        pageId: selectedPage,
        commentId,
        action // 'HIDE' or 'DELETE'
    }),
});
```

You'll need to add `VITE_RAILWAY_URL` to your `client/.env`.

## 🗑️ Cleanup (Optional)

Once everything is working, you can remove these Next.js API routes:
- `app/api/webhooks/facebook`
- `app/api/moderation`
- `app/api/pages` (if you move page syncing to Railway too)
