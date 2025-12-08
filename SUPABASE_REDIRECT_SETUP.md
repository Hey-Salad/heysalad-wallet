# Supabase Magic Link Redirect Setup

## The Problem

When users click the magic link in their email, Supabase needs to redirect them back to your app. However, **Supabase redirects are configured in the dashboard**, not in the code.

## Critical Configuration Needed

### 1. Configure Supabase Redirect URLs

Go to your Supabase dashboard:
1. Navigate to: https://supabase.com/dashboard/project/yfujqbciditibrehrzvf
2. Go to **Authentication** → **URL Configuration**
3. Add these redirect URLs:

```
heysalad://auth/callback
heysalad://auth/callback/
```

**Important:** You need BOTH formats (with and without trailing slash)

### 2. For Development Testing

Since you're testing in development mode, the magic link flow has some limitations:

**Option A: Use the Development Bypass** (Recommended for now)
- Tap the "🛠️ Development Mode" button on the sign-in screen
- This creates a local session without network requests
- Perfect for testing the wallet features

**Option B: Build a Preview/Production Build**
- Run: `eas build --profile preview --platform ios`
- Install the build on your physical device
- Magic links will work properly in preview/production builds

### 3. Testing Magic Links

Once you've configured Supabase redirects:

1. Enter your email → Tap "Continue"
2. Check your email for the magic link
3. **Click the link on your iPhone** (must be on the device where the app is installed)
4. The link should open your app and sign you in

## Why Development Mode Has Issues

Development builds use Metro bundler which can interfere with network requests and deep linking. This is why:
- Network requests may fail or timeout
- Deep links from emails may not work consistently
- Preview/production builds work much better

## Current Status

✅ Magic link sending works (Supabase sends the email)
✅ Callback handler is ready to receive tokens
⚠️ Need to configure Supabase redirect URLs (see step 1 above)
⚠️ Deep linking may not work perfectly in development mode

## Recommended Next Steps

1. **For immediate testing:** Use the Development Bypass button
2. **For production readiness:**
   - Configure Supabase redirect URLs (step 1)
   - Build a preview build: `eas build --profile preview --platform ios`
   - Test the full magic link flow on the preview build

## Alternative: Use Phone OTP

Phone OTP authentication works more reliably than magic links because it doesn't require deep linking:

1. User enters phone number
2. Gets 6-digit code via SMS
3. Enters code in the app
4. Session is created

This flow has no deep linking complexity and works in all environments.
