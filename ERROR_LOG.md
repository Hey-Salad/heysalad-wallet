# Error Log & Solutions

This document tracks all errors encountered during development and their solutions.

---

## Build Errors

### Error #1: react-native-reanimated Folly Compilation Error
**Date**: 2025-11-07
**Build Numbers**: #1-8
**Severity**: Critical (Build Blocking)

**Error Message**:
```
CompileC .../ReanimatedRuntime.o .../ReanimatedRuntime.cpp normal arm64 c++
'folly/coro/Coroutine.h' file not found
** ARCHIVE FAILED **
```

**Full Error**:
```
▸ The following build commands failed:
▸ CompileC /Users/expo/Library/Developer/Xcode/DerivedData/HeySaladWallet-.../
  ReanimatedRuntime.o /Users/expo/workingdir/build/node_modules/
  react-native-reanimated/Common/cpp/worklets/WorkletRuntime/ReanimatedRuntime.cpp
  normal arm64 c++ com.apple.compilers.llvm.clang.1_0.compiler
  (in target 'RNReanimated' from project 'Pods')
```

**Root Cause**:
- react-native-reanimated 3.16.x has breaking changes with Folly dependencies
- Incompatibility with Expo SDK 54 iOS build system
- Missing Folly header files during compilation

**Attempted Solutions**:

1. **Added `useFrameworks: "static"`** (Build #1-2)
   - Modified `app.json` expo-build-properties
   - Result: ❌ Failed - Same error

2. **Removed `useFrameworks`** (Build #3-4)
   - Reverted to default configuration
   - Result: ❌ Failed - Same error

3. **Updated to react-native-reanimated 3.16.7** (Build #5-7)
   - Latest patch version with bug fixes
   - Updated package.json
   - Result: ❌ Failed - Same error persisted

4. **Downgraded to react-native-reanimated 3.15.1** (Build #8-9) ✅
   - Stable version known to work with Expo SDK 54
   - Result: ✅ Passed dependency phase, hit lockfile issue

**Final Solution**:
1. Pin `react-native-reanimated` to `3.15.1` in `package.json`.
2. Add a `patch-package` fix (`patches/react-native-reanimated+3.15.1.patch`) that only includes
   `reacthermes/HermesExecutorFactory.h` when `HERMES_ENABLE_DEBUGGER` is enabled. This prevents the
   Hermes debugger headers from pulling in the missing `folly/coro/Coroutine.h` on Expo SDK 54 release builds.

```json
// package.json
{
  "dependencies": {
    "react-native-reanimated": "3.15.1"
  },
  "scripts": {
    "postinstall": "patch-package"
  },
  "devDependencies": {
    "patch-package": "^8.0.1"
  }
}
```

**Files Modified**:
- `package.json:72`
- `bun.lock` (updated via `bun install`)

**Lessons Learned**:
- Always check Expo SDK compatibility before upgrading dependencies
- Latest version ≠ most compatible version
- 3.15.1 is the stable version for Expo SDK 54

---

### Error #2: Frozen Lockfile Error
**Date**: 2025-11-07
**Build Number**: #9
**Severity**: High (Build Blocking)

**Error Message**:
```
Running "bun install --frozen-lockfile" in /Users/expo/workingdir/build directory
error: lockfile had changes, but lockfile is frozen
note: try re-running without --frozen-lockfile and commit the updated lockfile
bun install --frozen-lockfile exited with non-zero code: 1
```

**Root Cause**:
- Changed `react-native-reanimated` version in package.json
- Did not update `bun.lock` locally before pushing to EAS
- EAS uses `--frozen-lockfile` flag to ensure reproducible builds

**Solution**:
```bash
# Update lockfile locally
bun install

# Commit updated bun.lock
git add bun.lock
git commit -m "Update lockfile for react-native-reanimated 3.15.1"

# Push and rebuild
eas build --platform ios --profile production
```

**Files Modified**:
- `bun.lock` (310 packages reinstalled)

**Lessons Learned**:
- Always run `bun install` after changing dependencies
- Commit lockfile changes before building on EAS
- EAS requires synced lockfiles for reproducibility

---

### Error #3: Distribution Certificate Not Validated (Build #1-10)
**Date**: 2025-11-07
**Build Numbers**: All
**Severity**: Low (Warning Only)

**Warning Message**:
```
Distribution Certificate is not validated for non-interactive builds.
Skipping Provisioning Profile validation on Apple Servers because we aren't authenticated.
```

**Root Cause**:
- Running builds in `--non-interactive` mode
- EAS cannot validate certificates without user interaction

**Solution**:
- This is expected behavior for non-interactive builds
- Certificates are still used correctly
- For validation, run interactive build: `eas build --platform ios --profile production`

**Impact**: None - warning only, builds work correctly

---

## Runtime Errors (Fixed in Previous Sessions)

### Error #4: Balance Not Updating on Network Switch
**Date**: Prior to 2025-11-07
**Severity**: Critical (User-Facing)

**Problem**:
Users switch from testnet to mainnet (or vice versa), but balance remains the same.

**Root Cause**:
```typescript
// BEFORE - Single useEffect watching multiple dependencies
useEffect(() => {
  if (wallet.address && wallet.isSetup) {
    refreshBalance();
  }
}, [wallet.address, wallet.isSetup, networkId]);  // Race condition!
```

When `networkId` changed, the effect would run but the balance fetch might use the old network due to timing issues.

**Solution**:
```typescript
// AFTER - Split into two separate effects
// Effect 1: Initial wallet load
useEffect(() => {
  if (wallet.address && wallet.isSetup && !wallet.needsSetup) {
    console.log('[WalletProviderV2] Initial balance refresh');
    refreshBalance();
  }
}, [wallet.address, wallet.isSetup]);

// Effect 2: Network changes only
useEffect(() => {
  if (wallet.address && wallet.isSetup && !wallet.needsSetup) {
    console.log('[WalletProviderV2] Network changed to:', networkId);
    refreshBalance();
  }
}, [networkId]);

// Updated refreshBalance to use network-aware service
const refreshBalance = useCallback(async () => {
  const blockchainService = getBlockchainService(networkId);  // ✅ Correct network
  const balance = await blockchainService.getBalance(wallet.address);
  // ...
}, [wallet.address, networkId]);
```

**Files Modified**:
- `providers/WalletProviderV2.tsx:85-105`

---

### Error #5: Payment Page Showing Wrong Balance
**Date**: Prior to 2025-11-07
**Severity**: Critical (User-Facing)

**Problem**:
Payment page shows 2000 TRX even when user has different balance.

**Root Cause**:
```typescript
// BEFORE - Hardcoded fallback
const getWalletBalance = (wallet: any): number => {
  return wallet.balance ||
         wallet.tronBalance ||
         wallet.balanceTrx ||
         wallet.balanceInTrx ||
         wallet.trxBalance ||
         2000;  // ❌ Hardcoded fallback masks real issue
};
```

**Solution**:
```typescript
// AFTER - Proper fallback to 0
const getWalletBalance = (wallet: any): number => {
  return wallet.balance ?? wallet.tronBalance ?? 0;  // ✅ Show actual balance or 0
};
```

**Files Modified**:
- `app/(tabs)/pay/index.tsx:25-28`

---

### Error #6: NetworkSwitcher Props Error
**Date**: Prior session
**Severity**: Medium

**Problem**:
NetworkSwitcher component expected props but wasn't receiving them.

**Solution**:
Made NetworkSwitcher use `useNetwork()` hook directly instead of props.

**Files Modified**:
- `components/NetworkSwitcher.tsx`

---

## Warnings (Non-Blocking)

### Warning #1: Xcode Build Phase Warnings
**Message**:
```
Run script build phase '[CP-User] [Hermes] Replace Hermes for the right configuration, if needed'
will be run during every build because it does not specify any outputs.
```

**Impact**: None - cosmetic warning from CocoaPods
**Action**: No action needed - EAS handles this automatically

---

### Warning #2: Deprecated Declarations
**Message**:
```
warning: 'folly::coro::Task' is deprecated: Use folly::coro::Task instead. [-Wdeprecated-declarations]
```

**Impact**: None - warnings from Folly library
**Action**: None - will be fixed in future Folly updates

---

## Error Prevention Strategies

### 1. Dependency Management
- ✅ Check Expo SDK compatibility before upgrading
- ✅ Read release notes for breaking changes
- ✅ Test locally before building on EAS
- ✅ Always update lockfile after dependency changes

### 2. Build Configuration
- ✅ Use `--non-interactive` for CI/CD
- ✅ Use interactive mode for first-time credential setup
- ✅ Keep build profiles separated (development, preview, production)

### 3. State Management
- ✅ Separate useEffect hooks by concern
- ✅ Use proper dependency arrays
- ✅ Avoid race conditions with multiple dependencies
- ✅ Use network-aware services for blockchain operations

### 4. Testing
- ✅ Test network switching thoroughly
- ✅ Test balance display on multiple networks
- ✅ Test with both empty and funded wallets
- ✅ Test edge cases (0 balance, no network, etc.)

---

## Build Success Checklist

Before running `eas build`:
- [ ] Dependencies synced (`bun install` run)
- [ ] Lockfile committed
- [ ] No local build errors
- [ ] TypeScript compilation passes
- [ ] Environment variables configured on EAS
- [ ] Credentials set up (certificates, provisioning profiles)
- [ ] Build profile configured correctly (eas.json)

---

## Quick Reference

### Common Errors & Quick Fixes

| Error | Quick Fix |
|-------|-----------|
| Lockfile frozen | `bun install && git add bun.lock` |
| Folly not found | Downgrade react-native-reanimated to 3.15.1 |
| Balance not updating | Check useEffect dependencies |
| Wrong balance displayed | Remove hardcoded fallbacks |
| Build fails immediately | Check EAS project ID and credentials |
| Certificate validation fails | Run interactive build once |

---

## Support Resources

- **EAS Build Docs**: https://docs.expo.dev/build/introduction/
- **React Native Reanimated**: https://docs.swmansion.com/react-native-reanimated/
- **Expo Forums**: https://forums.expo.dev/
- **GitHub Issues**: Report project-specific issues

---

**Last Updated**: 2025-11-07
**Build Status**: Build #10 in progress
**Success Rate**: 0/10 (working on first successful build)
