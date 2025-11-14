# ✅ Organization Migration: saladhr → bereit

## Summary

Successfully migrated the HeySalad Wallet project from the `saladhr` organization to the `bereit` organization on EAS (Expo Application Services) to access fresh build quota.

## Changes Made

### 1. Organization Update
- **Old Owner**: `saladhr`
- **New Owner**: `bereit`
- **Old Project ID**: `909b7fa0-fae8-4b5a-a474-b0dedfb5c73a`
- **New Project ID**: `8d0e29da-752d-4d69-9eb7-ade6a4a07fe5`

### 2. Project Configuration

**app.json**:
```json
{
  "expo": {
    "owner": "bereit",
    "extra": {
      "eas": {
        "projectId": "8d0e29da-752d-4d69-9eb7-ade6a4a07fe5"
      }
    }
  }
}
```

### 3. EAS Project Created
- **Project URL**: https://expo.dev/accounts/bereit/projects/heysalad-wallet
- **Full Project Name**: `@bereit/heysalad-wallet`
- **Platform**: iOS (configured)

## Build Quota Status

### Before Migration (saladhr)
- ❌ **iOS builds exhausted** for the month
- ⏰ Reset in 16 days (December 1, 2025)

### After Migration (bereit)
- ✅ **Fresh build quota** available
- 🆓 Free tier limits apply
- 📊 Can now submit builds immediately

## Commands to Use

### Build Commands
```bash
# Development build (iOS Simulator)
eas build --platform ios --profile development

# Development build (Physical Device)
eas build --platform ios --profile development --no-simulator

# Preview build (TestFlight)
eas build --platform ios --profile preview

# Production build (App Store)
eas build --platform ios --profile production
```

### Project Management
```bash
# Check current project
eas project:info

# View build history
eas build:list

# Check account info
eas whoami
```

## Important Notes

### 1. Build Configuration Issue
⚠️ **Current Status**: Builds are still failing with Folly coroutine error

**Root Cause**: The stable configuration (react-native-reanimated 3.15.1) is set in package.json, but the build is still encountering the Folly issue.

**Next Steps**:
1. Verify bun.lock is properly synced
2. Clear EAS build cache
3. Try a clean build with `--clear-cache` flag

### 2. Environment Variables
The new `bereit` organization project doesn't have the environment variables from the old project. You may need to set them up:

```bash
# View current environment variables
eas env:list

# Add environment variables
eas env:create EXPO_PUBLIC_TRONGRID_API_KEY --value "your-key" --environment development
```

### 3. Credentials
iOS credentials (certificates, provisioning profiles) may need to be reconfigured for the new organization:

```bash
# Check credentials
eas credentials

# Configure iOS credentials
eas credentials:configure-build --platform ios
```

## Troubleshooting

### If builds still fail with Folly error:

1. **Clear build cache**:
```bash
eas build --platform ios --profile development --clear-cache
```

2. **Verify dependencies**:
```bash
bun install
npx expo install --check
```

3. **Check package.json**:
```bash
grep "react-native-reanimated" package.json
# Should show: "react-native-reanimated": "~3.15.1"
```

4. **Verify app.json**:
```bash
grep "newArchEnabled" app.json
# Should show: "newArchEnabled": false
```

### If you need to switch back:

```bash
# Update app.json
# Change "owner": "bereit" back to "owner": "saladhr"
# Change projectId back to old ID

# Reinitialize
eas init
```

## Migration Checklist

- [x] Update owner in app.json
- [x] Remove old project ID
- [x] Create new EAS project under bereit
- [x] Configure iOS platform
- [x] Commit and push changes
- [ ] Set up environment variables (if needed)
- [ ] Configure iOS credentials (if needed)
- [ ] Test development build
- [ ] Test preview build
- [ ] Test production build

## Benefits

1. ✅ **Fresh Build Quota**: Can build immediately
2. ✅ **Separate Organization**: Isolates this project's builds
3. ✅ **Clean Slate**: New project without old build history
4. ✅ **Flexible**: Can upgrade bereit organization plan if needed

## Next Actions

1. **Resolve Folly Issue**: Fix the react-native-reanimated configuration
2. **Test Build**: Run a development build to verify it works
3. **Set Up CI/CD**: Configure GitHub Actions with new project ID
4. **Update Documentation**: Update any docs referencing the old organization

---

**Migration Date**: November 14, 2024  
**Performed By**: Development Team  
**Status**: ✅ Complete (Build testing in progress)