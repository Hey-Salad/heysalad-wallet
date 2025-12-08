# Network Connection Troubleshooting - Supabase Auth

## Issue: "Network request failed" when signing in

### Symptoms
```
ERROR  [TypeError: Network request failed]
ERROR  [SignIn] Email magic link error: [AuthRetryableFetchError: Network request failed]
```

---

## ✅ **FIXES APPLIED**

### 1. Added Network Security Exceptions
Updated `app.json` to allow HTTPS connections to:
- ✅ `supabase.co` (all subdomains)
- ✅ `heysalad-o.workers.dev` (Cloudflare workers)
- ✅ `heysalad.app` (OAuth services)
- ✅ Added `NSExceptionRequiresForwardSecrecy: false` for Supabase

### 2. Improved Error Messages
Added better error handling in sign-in screen:
- Network errors show helpful messages
- Timeout errors explained clearly
- Suggests restart if issue persists

---

## 🔧 **REQUIRED: Rebuild the App**

**The fix requires a new build** because iOS network security settings are compiled into the app.

### Quick Rebuild

```bash
# 1. Rebuild for your device
eas build --profile development --platform ios

# 2. Once complete, install the new build on your phone
# 3. Try email login again
```

---

## 🔍 **Why This Happened**

### Root Cause
iOS has **App Transport Security (ATS)** which blocks all HTTP and some HTTPS connections by default. Even though Supabase uses HTTPS, some SSL configurations require explicit exceptions.

### What Changed
Your previous `app.json` had:
```json
{
  "supabase.co": {
    "NSIncludesSubdomains": true,
    "NSExceptionAllowsInsecureHTTPLoads": false
    // Missing: NSExceptionRequiresForwardSecrecy
  }
}
```

Now includes:
```json
{
  "supabase.co": {
    "NSIncludesSubdomains": true,
    "NSExceptionAllowsInsecureHTTPLoads": false,
    "NSExceptionRequiresForwardSecrecy": false  // ✅ Added
  }
}
```

---

## 🧪 **Testing After Rebuild**

### Test Email Login
1. Open the app
2. Tap "Use email instead"
3. Enter: `peter@heysalad.io`
4. Tap "Continue"
5. **Expected**: ✅ "Check your email" message appears
6. Check your email for magic link

### Test Phone Login
1. Tap "Use phone instead"
2. Enter a valid phone number
3. Tap "Continue"
4. **Expected**: Navigate to OTP verification screen

---

## 🆘 **If Still Failing After Rebuild**

### Step 1: Check Supabase Status
```bash
# Visit: https://status.supabase.com
# Or check if your project is accessible:
curl https://yfujqbciditibrehrzvf.supabase.co
```

### Step 2: Verify Supabase Email Auth is Enabled

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Authentication → Providers**
4. Verify **Email** is enabled
5. Check **Email Settings**:
   - ✅ Enable email confirmations: ON
   - ✅ Email change confirmations: ON
   - ✅ Secure email change: ON

### Step 3: Check Email Provider Settings

Supabase needs to send emails. Options:

**Option A: Use Supabase Default (Rate Limited)**
- Works out of the box
- Limited to ~4 emails/hour per recipient
- Good for testing

**Option B: Custom SMTP (Recommended)**
1. Go to **Project Settings → Auth → SMTP Settings**
2. Add your SMTP provider (SendGrid, Mailgun, etc.)
3. Test the connection

### Step 4: Check Device Network

```
Settings → Wi-Fi → Your Network → Configure DNS
Try switching between:
- Automatic
- Manual with 8.8.8.8, 8.8.4.4 (Google DNS)
```

### Step 5: Enable Verbose Logging

Add to `SupabaseProvider.tsx`:

```typescript
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    debug: true, // ✅ Add this
  },
});
```

Then rebuild and check logs for more details.

---

## 🔐 **Supabase Configuration Checklist**

### Required Settings

- [ ] **Auth → Email Provider**: Enabled
- [ ] **Auth → Redirect URLs**: Contains `heysalad://auth/callback`
- [ ] **API Settings**: Project URL matches `.env`
- [ ] **API Settings**: Anon key matches `.env`

### Verify `.env` File

```bash
# Check your .env has correct values
cat .env | grep SUPABASE

# Should show:
# EXPO_PUBLIC_SUPABASE_URL=https://yfujqbciditibrehrzvf.supabase.co
# EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### Test Supabase Connection Manually

```typescript
// Add this to sign-in.tsx temporarily for testing
const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('profiles').select('count');
    console.log('Supabase connection test:', { data, error });
  } catch (e) {
    console.error('Connection test failed:', e);
  }
};

// Call in useEffect
useEffect(() => {
  testConnection();
}, []);
```

---

## 📱 **Development vs Production**

### Development Build (Current)
- Connects to dev server on your Mac
- Network requests go through Metro bundler
- **May have additional network constraints**

### Standalone Build (Production/Preview)
- No dev server needed
- Direct network requests
- Often more reliable

### Try Preview Build

If development build continues to fail:

```bash
# Build a standalone preview (no dev server)
eas build --profile preview --platform ios

# This creates a production-like build
# Might work better for network requests
```

---

## 🔍 **Common Supabase Auth Errors**

### "Invalid API key"
**Fix**: Check `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env` matches dashboard

### "Email rate limit exceeded"
**Fix**:
- Wait 1 hour before resending
- OR setup custom SMTP

### "Signups not allowed"
**Fix**: Auth → Providers → Email → Enable sign ups

### "Invalid redirect URL"
**Fix**:
1. Auth → URL Configuration
2. Add `heysalad://auth/callback` to Redirect URLs
3. Add `heysalad://*` to wildcard patterns

---

## 📋 **Quick Checklist**

Before filing a bug:

- [ ] Rebuilt app with updated `app.json`
- [ ] Verified `.env` has correct Supabase credentials
- [ ] Checked Supabase email auth is enabled
- [ ] Tested on Wi-Fi (not cellular)
- [ ] Tried both email and phone auth
- [ ] Checked Supabase project status
- [ ] Verified redirect URLs configured
- [ ] Tested with preview build (standalone)

---

## 🚀 **Next Steps**

1. **Rebuild the app** with fixed network config:
   ```bash
   eas build --profile development --platform ios
   ```

2. **Install new build** on your phone

3. **Test email login** with `peter@heysalad.io`

4. **If still failing**: Check Supabase dashboard settings above

5. **Alternative**: Use phone auth (SMS) instead of email

---

## 💡 **Alternative: Phone Authentication**

Phone auth might be more reliable:

1. Enable in Supabase:
   - Auth → Providers → Phone
   - Add Twilio credentials (free tier available)

2. In app, tap "Use phone instead"

3. Enter phone number

4. Receive SMS with OTP

5. More reliable than email in development builds

---

## 📞 **Support**

If none of these work:

1. **Check app logs**: Look for more specific error messages
2. **Supabase logs**: Dashboard → Logs → Check for auth failures
3. **Try web**: Test same email on https://your-project.supabase.co
4. **Discord**: https://discord.supabase.com

---

## ✅ **Summary**

**Issue**: iOS network security blocking Supabase requests

**Fix**: Updated `app.json` with proper network exceptions

**Action Required**: Rebuild and reinstall app

**Command**:
```bash
eas build --profile development --platform ios
```

Once rebuilt, email login should work! 🎉
