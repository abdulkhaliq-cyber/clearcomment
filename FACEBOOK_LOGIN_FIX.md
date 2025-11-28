# Facebook Login Fix Checklist

## Problem
Error: "It looks like this app isn't available. This app needs at least one supported permission."

## Root Cause
Your Facebook App is missing required permissions or is not properly configured.

## Solution Steps

### 1. Configure Facebook App Permissions
1. Go to [Facebook Developers Console](https://developers.facebook.com/)
2. Select your app
3. Navigate to **App Review** → **Permissions and Features**
4. Ensure these permissions are enabled:
   - ✅ `email` (Basic permission - usually auto-approved)
   - ✅ `public_profile` (Basic permission - usually auto-approved)

### 2. Configure OAuth Redirect URIs
1. In Facebook Developers Console, go to **Facebook Login** → **Settings**
2. Under "Valid OAuth Redirect URIs", add:
   ```
   https://first-73c50.firebaseapp.com/__/auth/handler
   https://first-73c50.firebaseio.com/__/auth/handler
   https://first-73c50.web.app/__/auth/handler
   http://localhost:5173
   ```
   ℹ️ Firebase provides two domains (`.firebaseapp.com` and `.web.app`), both need to be whitelisted

### 3. Configure App Domains
1. Go to **Settings** → **Basic**
2. Under "App Domains", add:
   ```
   first-73c50.firebaseapp.com
   first-73c50.web.app
   localhost
   ```

### 4. Verify Firebase Configuration
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Navigate to **Authentication** → **Sign-in method**
3. Click on **Facebook**
4. Verify:
   - ✅ Facebook App ID is configured
   - ✅ Facebook App Secret is configured
   - ✅ OAuth redirect URI is copied to Facebook App settings

### 5. App Mode (Development vs Live)
- **For Testing**: Keep app in "Development" mode
  - Add test users in **Roles** → **Test Users**
  - Only test users can log in
  
- **For Production**: Switch to "Live" mode
  - Go to **Settings** → **Basic**
  - Toggle app status to "Live"
  - May require App Review for certain features

### 6. Test the Login
1. Clear browser cache and cookies
2. Try logging in with Facebook
3. Check browser console for detailed error messages
4. Verify the error message is more descriptive now

## Code Changes Made

### 1. Updated Firebase Configuration (`client/src/lib/firebase.ts`)
- Added explicit scopes to Facebook provider:
  ```typescript
  facebookProvider.addScope('email');
  facebookProvider.addScope('public_profile');
  ```

### 2. Enhanced Error Handling (`client/src/pages/Login.tsx`)
- Added detailed error messages for common Facebook login issues
- Better debugging with console.error logging

## Common Issues & Solutions

### Issue: "App Not Available"
**Solution**: Ensure app has `email` and `public_profile` permissions enabled

### Issue: "Redirect URI Mismatch"
**Solution**: Add all Firebase OAuth redirect URIs to Facebook App settings

### Issue: "This app is in development mode"
**Solution**: Either add yourself as a test user, or switch app to Live mode

### Issue: "Pop-up blocked"
**Solution**: Allow pop-ups in browser settings for your domain

## Verification Steps
1. ✅ Facebook App has required permissions
2. ✅ OAuth redirect URIs are configured
3. ✅ App domains are configured
4. ✅ Firebase has correct Facebook App ID and Secret
5. ✅ Test user is added (if in Development mode)
6. ✅ Browser allows pop-ups

## Need More Help?
- Check browser console for detailed error messages
- Review Firebase Authentication logs in Firebase Console
- Check Facebook App Dashboard for any warnings or errors
