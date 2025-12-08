# HeySalad Wallet - Build & Installation Troubleshooting

## Issue: Development Build Won't Install on Physical Device

### Root Cause
Your original `eas.json` had `"simulator": true` in the development profile, which creates builds that **only work on iOS Simulator**, not physical devices.

### ✅ **FIXED**
I've updated your `eas.json` with:
- `"simulator": false` for physical device builds
- New `development-simulator` profile for simulator-only builds
- Android APK configuration for development

---

## 🚀 Quick Fix - Rebuild for Physical Device

### Step 1: Register Your Device (First Time Only)

```bash
# Register your iPhone/iPad with Apple
eas device:create
```

Follow the prompts to:
1. Enter your device name (e.g., "My iPhone 15 Pro")
2. Scan the QR code with your iPhone Camera app
3. Follow the profile installation instructions on your phone

**Alternative**: Register via Apple Developer Portal
1. Go to https://developer.apple.com/account/resources/devices
2. Add your device UDID manually
3. Get UDID from Finder → Your iPhone → General → Serial Number (click to reveal UDID)

### Step 2: Build for Physical Device

```bash
# Build iOS development build for physical device
eas build --profile development --platform ios

# OR build for both iOS and Android
eas build --profile development --platform all
```

### Step 3: Install on Your Phone

Once build completes, EAS will provide a download link. Two options:

**Option A: Direct Install (Recommended)**
1. Open the link on your iPhone in Safari
2. Tap "Install"
3. Go to Settings → General → VPN & Device Management
4. Trust the "Expo (Development)" profile
5. Open the app

**Option B: TestFlight (If enrolled in Apple Developer Program)**
```bash
# Submit to TestFlight
eas submit --platform ios --latest
```

---

## 📱 Build Profiles Explained

### Current Profiles

| Profile | Platform | Use Case | Install Location |
|---------|----------|----------|------------------|
| `development` | Physical Device | Daily testing on your phone | Direct install via link |
| `development-simulator` | Simulator Only | Testing in Xcode Simulator | Mac only |
| `preview` | Physical Device | Internal testing (no dev client) | Direct install via link |
| `production` | App Store | Public release | TestFlight → App Store |

### Build Commands

```bash
# For YOUR PHONE (physical device)
eas build --profile development --platform ios

# For Xcode SIMULATOR (testing on Mac)
eas build --profile development-simulator --platform ios

# For INTERNAL TESTING (no dev client, like production)
eas build --profile preview --platform ios

# For APP STORE release
eas build --profile production --platform ios
```

---

## 🔧 Common Installation Issues & Fixes

### Issue 1: "Unable to Install" Error

**Symptoms**: Tap to install, but iOS shows "Unable to Install [App Name]"

**Causes**:
1. ❌ Device not registered in provisioning profile
2. ❌ Certificate expired
3. ❌ Build was for simulator, not device

**Fix**:
```bash
# Re-register your device
eas device:create

# Clear EAS credentials cache
eas credentials

# Rebuild
eas build --profile development --platform ios --clear-cache
```

### Issue 2: "Untrusted Developer" Error

**Symptoms**: App installed but won't open, shows "Untrusted Enterprise Developer"

**Fix**:
1. Go to: **Settings → General → VPN & Device Management**
2. Find "Expo (Development)" or your Apple Developer account
3. Tap **Trust**
4. Open app again

### Issue 3: Build Succeeded but Link Expired

**Symptoms**: Build completed days ago, now link shows "Build artifact expired"

**Fix**:
```bash
# List recent builds
eas build:list

# Get fresh download link for latest build
eas build:view --platform ios

# Or just rebuild (recommended)
eas build --profile development --platform ios
```

### Issue 4: "This app cannot be installed because its integrity could not be verified"

**Symptoms**: iOS 16+ shows integrity error during installation

**Causes**:
1. Provisioning profile mismatch
2. Certificate issue
3. Bundle identifier mismatch

**Fix**:
```bash
# 1. Check bundle identifier matches
grep -A 2 "bundleIdentifier" app.json
# Should show: "com.heysalad.wallet"

# 2. Regenerate credentials
eas credentials --platform ios

# 3. Clear all caches and rebuild
eas build --profile development --platform ios --clear-cache
```

### Issue 5: "App Not Available" on TestFlight

**Symptoms**: Submitted to TestFlight but shows "This app is currently not available"

**Fix**:
1. Check build was submitted with `preview` or `production` profile, NOT `development`
2. Wait 10-15 minutes for TestFlight processing
3. Check App Store Connect for processing status
4. Verify email used for TestFlight matches Apple ID

---

## 🔍 Debugging Build Failures

### View Build Logs

```bash
# List all builds
eas build:list

# View specific build details
eas build:view BUILD_ID

# View latest build logs
eas build:view --platform ios
```

### Common Build Errors

#### Error: "Missing Push Notification Entitlement"

**Fix**: Add to `app.json`:
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["remote-notification"]
      }
    }
  }
}
```

#### Error: "No devices registered"

**Fix**:
```bash
eas device:create
# Then rebuild
```

#### Error: "Provisioning profile doesn't include the application-identifier"

**Fix**:
```bash
# Regenerate provisioning profile
eas credentials --platform ios
# Select "Delete all credentials and start over"
# Rebuild
```

---

## 📋 Pre-Build Checklist

Before running `eas build`, verify:

- [ ] Device registered: `eas device:list`
- [ ] Bundle ID matches: `com.heysalad.wallet`
- [ ] Version incremented if needed: `1.0.4` → `1.0.5`
- [ ] Environment vars set in `.env`
- [ ] No uncommitted changes that might cause issues
- [ ] Network stable (builds take 10-20 minutes)

---

## 🎯 Recommended Workflow

### For Daily Development

```bash
# 1. Start dev server locally
npm start
# OR
npx expo start --dev-client

# 2. Test on simulator first (faster)
# - Open iOS Simulator on Mac
# - Press 'i' in terminal

# 3. Build for phone when ready
eas build --profile development --platform ios

# 4. Install via link on phone
```

### For Testing on Multiple Devices

```bash
# 1. Register all devices
eas device:create  # Repeat for each device

# 2. Build once
eas build --profile development --platform ios

# 3. Share link with team
# Everyone with registered device can install

# 4. Or use preview build (no dev server needed)
eas build --profile preview --platform ios
```

---

## 🔐 Device Registration Methods

### Method 1: EAS CLI (Easiest)

```bash
eas device:create
# Scan QR code with iPhone Camera
# Follow on-screen instructions
```

### Method 2: Apple Developer Portal

1. Get device UDID:
   - Connect iPhone to Mac
   - Open Finder → Select iPhone
   - Click on serial number to reveal UDID
   - Copy UDID

2. Register on Apple Developer:
   - Go to https://developer.apple.com/account/resources/devices
   - Click "+" to add device
   - Paste UDID
   - Enter device name

3. Rebuild app:
   ```bash
   eas build --profile development --platform ios
   ```

### Method 3: Via Xcode

1. Connect device to Mac
2. Open Xcode → Window → Devices and Simulators
3. Select your device
4. Copy "Identifier" (this is UDID)
5. Register in Apple Developer Portal (Method 2)

---

## 🆘 Still Not Working?

### Check EAS Build Status

```bash
# Check if EAS is down
curl https://status.expo.dev/api/v2/status.json

# Check your builds
eas build:list --platform ios --limit 5

# View specific build
eas build:view <BUILD_ID>
```

### Get Help

1. **Check build logs**: `eas build:view --platform ios`
2. **EAS Docs**: https://docs.expo.dev/build/introduction/
3. **Expo Discord**: https://chat.expo.dev
4. **Stack Overflow**: Tag `expo-eas`

---

## 📱 Quick Reference

### Install Methods by Profile

| Profile | Install Method | Dev Server Needed? |
|---------|----------------|-------------------|
| `development` | Direct link | ✅ Yes (expo start) |
| `development-simulator` | Drag to simulator | ✅ Yes (expo start) |
| `preview` | Direct link | ❌ No (standalone) |
| `production` | TestFlight/App Store | ❌ No (standalone) |

### Build Commands Cheat Sheet

```bash
# Physical device (most common)
eas build --profile development --platform ios

# Simulator only
eas build --profile development-simulator --platform ios

# Internal testing (no dev server)
eas build --profile preview --platform ios

# Production (App Store)
eas build --profile production --platform ios

# Android (development)
eas build --profile development --platform android

# Both platforms
eas build --profile development --platform all

# Force rebuild (ignore cache)
eas build --profile development --platform ios --clear-cache

# Non-interactive (CI/CD)
eas build --profile development --platform ios --non-interactive
```

---

## ✅ Your Fixed Configuration

Your `eas.json` now has:

```json
{
  "development": {
    "simulator": false,  // ✅ Physical device
    "distribution": "internal",
    "developmentClient": true
  },
  "development-simulator": {
    "simulator": true,  // ✅ Simulator only
    "developmentClient": true
  }
}
```

**Next Steps**:
1. Register your device: `eas device:create`
2. Build for device: `eas build --profile development --platform ios`
3. Install from link on your phone
4. Trust developer certificate in Settings
5. Run dev server: `npx expo start --dev-client`
6. Open app on phone

Good luck! 🚀
