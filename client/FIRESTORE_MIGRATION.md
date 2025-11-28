# Firestore Migration Progress

## ✅ Completed

### 1. Firebase Setup
- ✅ Initialized Firestore in `src/lib/firebase.ts`
- ✅ Created Firestore helper functions in `src/lib/firestore.ts`
- ✅ Defined collection structure:
  - `users` - User profiles
  - `pages` - Connected Facebook pages
  - `comments` - Facebook comments
  - `rules` - Moderation rules
  - `logs` - Moderation action logs

### 2. Dashboard Migration
- ✅ Replaced Supabase with Firestore for fetching pages
- ✅ Implemented real-time comment updates using Firestore `onSnapshot`
- ✅ Removed manual refresh button (now using live updates)
- ✅ Updated to use `getUserPages()` and `subscribeToPageComments()`

## 🔄 Still Using Backend API

The following features still call the Next.js backend API:
- **Moderation Actions** (`handleAction` in Dashboard)
  - Hide/Unhide/Delete comments
  - Currently calls `/api/moderation/[action]`
  
These will need to be migrated to either:
1. Direct Firestore updates + Facebook Graph API calls from the frontend
2. Firebase Cloud Functions (recommended for security)

## 📋 Next Steps

### Option A: Move Everything to Frontend (Simpler but less secure)
1. Create Facebook Graph API helper functions
2. Update moderation actions to:
   - Call Facebook API directly
   - Update Firestore comment status
   - Log action to Firestore

### Option B: Use Firebase Cloud Functions (Recommended)
1. Create Cloud Functions for:
   - `moderateComment` - Hide/unhide/delete on Facebook
   - `syncPages` - Sync Facebook pages
   - `webhookHandler` - Handle Facebook webhooks
2. Frontend calls Cloud Functions instead of Next.js API
3. Cloud Functions handle Facebook API + Firestore updates

## 🗄️ Data Migration

To migrate existing data from Supabase to Firestore:

1. Export data from Supabase
2. Transform to Firestore format
3. Import using batch writes

Example migration script structure:
```typescript
// Read from Supabase
const { data: pages } = await supabase.from('FacebookPage').select('*');

// Write to Firestore
const batch = writeBatch(db);
pages.forEach(page => {
  const docRef = doc(collection(db, 'pages'));
  batch.set(docRef, {
    userId: page.userId,
    pageId: page.pageId,
    pageName: page.pageName,
    // ... other fields
    createdAt: Timestamp.fromDate(new Date(page.createdAt)),
  });
});
await batch.commit();
```

## 🔐 Security Rules

Don't forget to set up Firestore Security Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Users can only access their own pages
    match /pages/{pageId} {
      allow read, write: if request.auth.uid == resource.data.userId;
    }
    
    // Similar rules for comments, rules, logs
  }
}
```

## 📊 Current Architecture

```
Frontend (Vite)
  ├── Firebase Auth (✅ Done)
  ├── Firestore (✅ Partially Done)
  │   ├── Read pages (✅)
  │   ├── Real-time comments (✅)
  │   └── Moderation actions (❌ Still using API)
  └── Next.js API (🔄 Still needed for moderation)
      └── Facebook Graph API calls
```

## 🎯 Goal Architecture

```
Frontend (Vite)
  ├── Firebase Auth (✅)
  ├── Firestore (✅)
  └── Firebase Cloud Functions
      └── Facebook Graph API calls
```
