# Quick Fix for Email Login Network Error

## 🔍 **Root Cause Identified**

The issue is **NOT network security** - you already have `NSAllowsArbitraryLoads: true` in your Info.plist which allows all network connections.

The real issue is likely one of these:

### 1. **Development Build Network Proxy Issue**
Development builds route network through Metro bundler which can cause issues with Supabase auth.

### 2. **Supabase Email Auth Not Configured**
Supabase requires email auth to be explicitly enabled and configured.

---

## ✅ **Immediate Solutions (Try These First)**

### Option 1: Use Standalone Preview Build (Recommended)

Preview builds bypass Metro bundler and make direct network requests:

```bash
# Build a standalone preview (no dev server needed)
eas build --profile preview --platform ios

# This often fixes network issues that occur in dev builds
```

**Why this works:**
- No Metro bundler proxy
- Direct network requests to Supabase
- Production-like environment
- More reliable for testing auth flows

### Option 2: Enable Supabase Email Auth

1. Go to: https://supabase.com/dashboard
2. Select your project: `yfujqbciditibrehrzvf`
3. Navigate to: **Authentication → Providers**
4. Find **Email** provider
5. Click **Enable**
6. Configure settings:
   ```
   ✅ Enable email provider
   ✅ Confirm email: OFF (for testing)
   ✅ Secure email change: ON
   ```
7. Save changes

### Option 3: Configure Email Templates

1. In Supabase Dashboard: **Authentication → Email Templates**
2. Check "Magic Link" template is enabled
3. Verify template contains correct link format
4. Test template sends

### Option 4: Add SMTP Settings (If using custom email)

1. **Authentication → Settings → SMTP**
2. Add your SMTP provider credentials
3. OR use Supabase default (limited to 4 emails/hour)

---

## 🧪 **Test Network Connection**

Add this temporary test to `app/sign-in.tsx` to verify Supabase connectivity:

```typescript
// Add at top of component
useEffect(() => {
  const testSupabaseConnection = async () => {
    try {
      console.log('[Test] Testing Supabase connectivity...');

      // Test 1: Health check
      const healthResponse = await fetch(
        'https://yfujqbciditibrehrzvf.supabase.co/rest/v1/',
        {
          headers: {
            apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
          },
        }
      );
      console.log('[Test] Health check status:', healthResponse.status);

      // Test 2: Auth endpoint
      const { data, error } = await supabase.auth.getSession();
      console.log('[Test] GetSession result:', { data: !!data, error });

      // Test 3: Database query (if tables exist)
      const { data: tables, error: tableError } = await supabase
        .from('profiles')
        .select('count');
      console.log('[Test] Database query:', { success: !tableError });

    } catch (e) {
      console.error('[Test] Connection test failed:', e);
    }
  };

  testSupabaseConnection();
}, []);
```

---

## 🔧 **If Tests Pass But Auth Still Fails**

### Check Supabase Auth Configuration

```bash
# 1. Verify redirect URLs are configured
# Dashboard → Authentication → URL Configuration
# Add these:
heysalad://auth/callback
heysalad://*
```

### Check Rate Limiting

Supabase free tier limits:
- **4 emails per hour** to same recipient (default)
- Wait 1 hour if exceeded
- OR setup custom SMTP

### Enable Auth Debugging

In `providers/SupabaseProvider.tsx`:

```typescript
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    debug: true, // ✅ Add this line
  },
  global: {
    headers: {
      'X-Client-Info': 'heysalad-wallet-dev', // ✅ Add this
    },
  },
});
```

Then check console for detailed auth logs.

---

## 📱 **Workaround: Use Phone Auth Instead**

Phone auth might work better in development:

### Setup

1. **Supabase Dashboard**:
   - Authentication → Providers → Phone
   - Enable phone provider
   - Add Twilio credentials (free tier available)

2. **Get Twilio Credentials**:
   - Sign up at https://www.twilio.com/try-twilio
   - Get Account SID and Auth Token
   - Get a Twilio phone number

3. **Configure in Supabase**:
   ```
   Account SID: ACxxxxxxxxxxxxx
   Auth Token: your_auth_token
   Phone Number Sid: PNxxxxxxxxxxxxx
   ```

4. **Test in App**:
   - Tap "Use phone instead"
   - Enter phone: +1 555-123-4567
   - Should receive SMS with code

---

## 🚀 **Recommended Next Steps**

### Step 1: Try Preview Build (Fastest)

```bash
eas build --profile preview --platform ios
```

Install and test - this often fixes dev-mode network issues.

### Step 2: Check Supabase Dashboard

Verify email auth is enabled and configured correctly.

### Step 3: Add Diagnostic Logging

Use the test code above to verify which part is failing.

### Step 4: Consider Phone Auth

More reliable than email for development testing.

---

## 🔍 **Debug Checklist**

- [ ] Supabase email provider enabled
- [ ] Email templates configured
- [ ] Redirect URLs added (`heysalad://auth/callback`)
- [ ] Rate limiting not exceeded (4/hour)
- [ ] Network connectivity working (test in browser)
- [ ] Metro bundler not blocking requests
- [ ] Tried preview build (standalone)
- [ ] Checked Supabase logs in dashboard

---

## 💡 **Why Development Builds Can Fail**

Development builds with `expo-dev-client`:

1. Route network through **Metro bundler proxy**
2. Can have **timing issues** with auth flows
3. **WebSocket connections** can interfere
4. **Hot reload** can break auth state

Preview/Production builds:
1. **Direct network requests** (no proxy)
2. More **stable auth flows**
3. Better **performance**
4. Production-like environment

---

## ⚡ **Quick Command Reference**

```bash
# Fastest solution: Build preview
eas build --profile preview --platform ios

# If you must use dev build
eas build --profile development --platform ios

# Clean and rebuild iOS locally (for testing)
npx expo prebuild --clean --platform ios
cd ios && pod install && cd ..
npx expo run:ios

# Start dev server
npx expo start --dev-client
```

---

## 📞 **Still Not Working?**

1. **Share Supabase logs**:
   - Dashboard → Logs
   - Filter by "auth"
   - Look for failed requests

2. **Check Supabase status**:
   - Visit: https://status.supabase.com

3. **Try web version**:
   - Open: https://yfujqbciditibrehrzvf.supabase.co
   - Try auth flow there
   - If web fails, it's a Supabase config issue

4. **Contact Supabase support**:
   - Discord: https://discord.supabase.com
   - Include project ID: `yfujqbciditibrehrzvf`

---

## ✅ **Summary**

**Current Status**: Network security is fine (`NSAllowsArbitraryLoads: true`)

**Real Issue**: Likely one of:
- Supabase email auth not enabled
- Development build Metro proxy interference
- Rate limiting (4 emails/hour)
- Missing SMTP configuration

**Best Solution**: Build preview profile and test there

**Command**:
```bash
eas build --profile preview --platform ios
```

This creates a standalone build without dev server that makes direct network requests to Supabase.
