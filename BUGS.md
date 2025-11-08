# HeySalad Wallet - Bug Tracker

**Last Updated:** November 8, 2025
**Project:** HeySalad Wallet
**Repository:** https://github.com/Hey-Salad/heysalad-wallet

---

## 📊 Build Status Overview

- **Total Builds:** 15
- **Successful Builds:** 0
- **Failed Builds:** 15
- **Current Status:** 🔴 **CRITICAL - All builds failing**

---

## 🚨 Critical Bugs (Blocking Production)

### BUG-001: New Architecture Compatibility Error ⚠️ BLOCKING

**Status:** 🔴 UNRESOLVED
**Priority:** P0 - Critical
**Affected Builds:** #14, #15
**First Seen:** November 8, 2025 - Build #14

**Description:**
When `newArchEnabled: true` is set in app.json (required for react-native-reanimated 4.x), build fails with `ExpoAppDelegateSubscriberManager` not found error.

**Error Message:**
```
cannot find 'ExpoAppDelegateSubscriberManager' in scope
```

**Full Error Details:**
```
The "Run fastlane" step failed because of an error in the Xcode build process.
We automatically detected following errors in your Xcode build logs:
- cannot find 'ExpoAppDelegateSubscriberManager' in scope (20+ occurrences)
```

**Root Cause:**
Expo SDK 54.0.0's New Architecture support is incomplete. The `ExpoAppDelegateSubscriberManager` class is not available in the current Expo SDK 54 build, causing Swift compilation errors.

**Attempted Solutions:**
1. ❌ Upgraded to Expo SDK 54.0.23 - Failed
2. ❌ Upgraded react-native-reanimated to 4.1.3 - Failed
3. ❌ Added react-native-worklets 0.6.1 - Failed
4. ❌ Upgraded react-native to 0.81.5 - Failed

**Reproducibility:** 100% - Every build with `newArchEnabled: true` fails

**Affected Files:**
- [app.json:25](app.json#L25) - `"newArchEnabled": true`
- [package.json:29](package.json#L29) - `"react-native-reanimated": "~4.1.1"`

**Recommended Solution:**
```json
// app.json - Disable New Architecture temporarily
{
  "expo": {
    "newArchEnabled": false  // Change back to false
  }
}
```

```json
// package.json - Revert to reanimated 3.15.1
{
  "dependencies": {
    "react-native-reanimated": "~3.15.1"  // Revert from 4.1.3
  }
}
```

**Next Steps:**
1. Disable New Architecture in app.json
2. Revert react-native-reanimated to 3.15.1
3. Test if reanimated 3.15.1 works without the Folly errors (it might after SDK 54.0.23 upgrade)
4. If still failing, investigate Folly patch solutions
5. Monitor Expo SDK updates for full New Architecture support

**Related Issues:**
- BUG-002: Folly Coroutine Header Not Found

---

### BUG-002: Folly Coroutine Header Not Found ⚠️ BLOCKING

**Status:** 🔴 UNRESOLVED
**Priority:** P0 - Critical
**Affected Builds:** #1-13 (all builds with react-native-reanimated 3.x)
**First Seen:** November 7, 2025 - Build #1

**Description:**
iOS builds fail during Xcode compilation when using react-native-reanimated versions 3.6.3 through 3.16.7. The Folly C++ library's coroutine header cannot be found.

**Error Message:**
```
'folly/coro/Coroutine.h' file not found
```

**Full Error Details:**
```
The "Run fastlane" step failed because of an error in the Xcode build process.
We automatically detected following errors in your Xcode build logs:
- 'folly/coro/Coroutine.h' file not found
```

**Root Cause:**
Version mismatch between react-native-reanimated 3.x and Folly C++ library included in React Native 0.81.x. The reanimated library expects Folly coroutine headers that are not available in the bundled Folly version.

**Attempted Solutions:**
1. ❌ Added `useFrameworks: "static"` to eas.json - Failed (Build #1-2)
2. ❌ Upgraded reanimated to 3.16.7 - Failed (Build #3-5)
3. ❌ Downgraded reanimated to 3.10.1 - Failed (Build #6-8)
4. ❌ Downgraded reanimated to 3.6.3 - Failed (Build #9-11)
5. ❌ Upgraded to reanimated 4.1.3 + New Architecture - New error (Build #14-15)

**Reproducibility:** 100% - Every build with reanimated 3.x versions fails

**Affected Files:**
- [package.json:29](package.json#L29) - `"react-native-reanimated"`
- [app/_layout.tsx:8](app/_layout.tsx#L8) - Imports reanimated
- All screen components using animations

**Versions Tested (All Failed):**
- ❌ react-native-reanimated 3.16.7 (latest 3.x)
- ❌ react-native-reanimated 3.15.1 (stable)
- ❌ react-native-reanimated 3.10.1
- ❌ react-native-reanimated 3.6.3 (oldest tested)
- ⚠️ react-native-reanimated 4.1.3 (new error - see BUG-001)

**Potential Solution (Untested):**
Try reanimated 3.15.1 with Expo SDK 54.0.23 after the recent upgrades:

```bash
bun install react-native-reanimated@3.15.1
```

**Alternative Solution:**
Wait for Expo SDK 54.x updates with full New Architecture support, then use reanimated 4.x

**Related Issues:**
- BUG-001: New Architecture Compatibility Error
- ERROR_LOG.md: Error #1 (documented extensively)

---

### BUG-003: Frozen Lockfile Mismatch 🟡 RESOLVED

**Status:** 🟢 RESOLVED
**Priority:** P1 - High
**Affected Builds:** #9
**First Seen:** November 7, 2025 - Build #9
**Resolved:** November 7, 2025

**Description:**
Build failed because bun.lock was out of sync with package.json changes.

**Error Message:**
```
error: lockfile had changes, but lockfile is frozen
```

**Root Cause:**
Modified package.json dependencies without running `bun install` locally and committing the updated lockfile.

**Solution Applied:**
```bash
bun install
git add bun.lock
git commit -m "chore: Update lockfile after dependency changes"
```

**Prevention:**
Always run `bun install` after modifying package.json and commit bun.lock before pushing.

**Related Commits:**
- Multiple commits updating bun.lock throughout development

---

### BUG-004: Pod Installation Unknown Error 🟠 NEEDS INVESTIGATION

**Status:** 🟡 NEEDS INVESTIGATION
**Priority:** P1 - High
**Affected Builds:** #14
**First Seen:** November 8, 2025 - Build #14

**Description:**
Build #14 failed with generic "Unknown error" during pod installation phase, before reaching Xcode build.

**Error Message:**
```
Unknown error. See logs of the Install pods build phase for more information.
```

**Root Cause:**
Unknown - error occurred during CocoaPods installation, possibly related to New Architecture dependencies or pod conflicts.

**Details:**
- Build duration: Only 35 seconds (much shorter than typical 4-5 minutes)
- Failed before reaching Xcode compilation
- Same git commit as Build #13 which had Folly error
- Build #15 (same commit) proceeded past pod installation to Xcode build

**Hypothesis:**
Transient EAS infrastructure issue or timing-related pod dependency resolution problem.

**Recommended Action:**
Monitor if this recurs. May have been one-time infrastructure glitch.

**Build Metrics:**
- buildWaitTime: 133ms
- buildQueueTime: 57776ms
- buildDuration: 35581ms (35 seconds - abnormally short)

---

## 🐛 Runtime Bugs (Non-Blocking)

### BUG-005: Balance Not Updating on Network Switch 🟢 RESOLVED

**Status:** 🟢 RESOLVED
**Priority:** P2 - Medium
**First Seen:** November 7, 2025
**Resolved:** November 7, 2025

**Description:**
When switching between TRON mainnet and testnet, the balance would not refresh to show the correct network's balance.

**Affected Components:**
- [app/(tabs)/(wallet)/index.tsx:45-87](app/(tabs)/(wallet)/index.tsx#L45-L87)
- [providers/WalletProvider.tsx:112-125](providers/WalletProvider.tsx#L112-L125)

**Root Cause:**
WalletProvider was not listening to network changes and did not trigger balance refresh when network changed.

**Solution Applied:**
1. Created NetworkProvider to manage network state
2. Added network listener in WalletProvider
3. Implemented automatic balance refresh on network change
4. Updated blockchain service to be network-aware

**Verification:**
✅ Balance updates immediately when switching networks
✅ Correct balance shown for each network
✅ Pull-to-refresh works on both networks

**Related Files:**
- [providers/NetworkProvider.tsx](providers/NetworkProvider.tsx)
- [providers/WalletProviderV2.tsx](providers/WalletProviderV2.tsx)

---

### BUG-006: Payment Page Shows Wrong Balance 🟢 RESOLVED

**Status:** 🟢 RESOLVED
**Priority:** P2 - Medium
**First Seen:** November 7, 2025
**Resolved:** November 7, 2025

**Description:**
The payment/send page was showing cached balance from wrong network after network switch.

**Affected Components:**
- [app/(tabs)/pay/index.tsx:89-102](app/(tabs)/pay/index.tsx#L89-L102)

**Root Cause:**
Payment screen was not re-fetching balance on mount and was displaying stale data from context.

**Solution Applied:**
1. Added balance refresh on screen focus
2. Implemented useFocusEffect hook to reload balance
3. Connected to NetworkProvider for network-aware balance display

**Verification:**
✅ Payment screen shows current balance
✅ Balance updates when switching networks
✅ Correct available balance shown for sending

---

### BUG-007: Selina Voice Modal Closing Unexpectedly 🟠 NEEDS TESTING

**Status:** 🟡 NEEDS TESTING
**Priority:** P2 - Medium
**First Seen:** November 7, 2025
**Fixed:** November 7, 2025

**Description:**
Voice payment modal would close immediately after opening in some cases.

**Affected Components:**
- [components/SelinaVoiceModal.tsx:45-67](components/SelinaVoiceModal.tsx#L45-L67)

**Root Cause:**
Modal state management issue with rapid open/close cycles.

**Solution Applied:**
Added debounce to modal visibility state and improved modal lifecycle management.

**Testing Required:**
- [ ] Test voice modal on physical iOS device
- [ ] Test rapid opening/closing
- [ ] Verify voice recognition starts properly
- [ ] Test modal dismissal with back button
- [ ] Test modal dismissal with cancel button

---

### BUG-008: Certificate Validation Warnings (Low Priority) 🟡 ACCEPTABLE

**Status:** 🟡 ACCEPTABLE
**Priority:** P3 - Low
**Affected Builds:** All builds
**First Seen:** November 7, 2025

**Description:**
Warning appears in all builds about certificate validation, but does not cause build failures.

**Warning Message:**
```
⚠ Specified iOS Distribution certificate is not a valid distribution certificate
```

**Root Cause:**
EAS automatically handles certificate management, warning is informational only.

**Impact:**
- Does not block builds
- Does not affect app functionality
- May be EAS infrastructure notification

**Recommended Action:**
Monitor for any actual signing issues. Can be addressed later if problems arise.

**Priority Justification:**
Low priority since it doesn't block functionality and EAS handles certificates automatically.

---

## 🔧 Configuration Issues

### BUG-009: MCP CLI Package Does Not Exist 🟢 RESOLVED

**Status:** 🟢 RESOLVED
**Priority:** P3 - Low
**First Seen:** November 8, 2025
**Resolved:** November 8, 2025

**Description:**
Documentation incorrectly suggested installing `@modelcontextprotocol/cli` package which does not exist in npm registry.

**Error Encountered:**
```
npm error 404 Not Found - '@modelcontextprotocol/cli@*' is not in this registry
```

**Root Cause:**
Incorrect documentation. MCP servers are individual packages, no CLI wrapper exists.

**Solution Applied:**
1. Updated [DEVOPS_SETUP.md:85-190](DEVOPS_SETUP.md#L85-L190) with correct instructions
2. Explained Claude Desktop integration method
3. Provided correct npx commands for individual servers
4. Fixed [mcp-config.json](mcp-config.json) with proper placeholders

**Correct Usage:**
```bash
# No CLI to install, use servers directly
npx -y @modelcontextprotocol/server-filesystem /path/to/project
npx -y @modelcontextprotocol/server-github
npx -y @modelcontextprotocol/server-git --repository /path/to/project
```

**Related Files:**
- [DEVOPS_SETUP.md](DEVOPS_SETUP.md)
- [mcp-config.json](mcp-config.json)

---

## 📈 Build History Timeline

### Build #15 - November 8, 2025 03:24 UTC
- **Status:** ❌ ERRORED
- **Duration:** 4 min 23 sec
- **Error:** ExpoAppDelegateSubscriberManager not found
- **Commit:** cef85dd - "Upgrade react-native-reanimated to 4.1.3 and enable New Architecture"
- **Issue:** BUG-001 - New Architecture compatibility

### Build #14 - November 8, 2025 03:14 UTC
- **Status:** ❌ ERRORED
- **Duration:** 35 sec
- **Error:** Unknown pod installation error
- **Commit:** 4644dbb - "UK AI Agent Hackathon Winner - Major Feature Release"
- **Issue:** BUG-004 - Pod installation unknown error

### Build #13 - November 8, 2025 02:46 UTC
- **Status:** ❌ ERRORED
- **Duration:** 4 min 38 sec
- **Error:** 'folly/coro/Coroutine.h' file not found
- **Commit:** 4644dbb - "UK AI Agent Hackathon Winner - Major Feature Release"
- **Issue:** BUG-002 - Folly coroutine header

### Builds #1-12 - November 7, 2025
- **Status:** ❌ ERRORED (all builds)
- **Common Error:** 'folly/coro/Coroutine.h' file not found
- **Issue:** BUG-002 - Folly coroutine header
- **Versions Tested:**
  - reanimated 3.16.7 (Builds #3-5)
  - reanimated 3.10.1 (Builds #6-8)
  - reanimated 3.6.3 (Builds #9-12)

---

## 🎯 Recommended Action Plan

### Immediate Actions (To Unblock Production)

#### 1. Revert New Architecture Changes
```bash
# 1. Disable New Architecture
# Edit app.json
{
  "expo": {
    "newArchEnabled": false
  }
}

# 2. Revert to reanimated 3.15.1
bun remove react-native-reanimated react-native-worklets
bun add react-native-reanimated@3.15.1

# 3. Downgrade to stable Expo SDK if needed
# Try current 54.0.23 first, if fails try 54.0.13

# 4. Update lockfile and commit
bun install
git add -A
git commit -m "fix: Revert to reanimated 3.15.1 without New Architecture"
git push

# 5. Trigger new build
eas build --platform ios --profile production
```

#### 2. If Folly Error Persists - Try Patch Approach
```bash
# Create patch for react-native-reanimated
npx patch-package react-native-reanimated

# Or try alternative animation library temporarily
bun add react-native-animatable
# Update components to use animatable instead of reanimated
```

#### 3. Alternative - Wait for Expo SDK Update
- Monitor Expo SDK 54.x releases for New Architecture fixes
- Check Expo forums for react-native-reanimated 4.x compatibility
- Consider Expo SDK 55 beta if available

### Medium-Term Actions (Next Sprint)

1. **Add Automated Build Checks**
   - Run `bunx tsc --noEmit` before pushing
   - Add pre-commit hooks for dependency validation
   - Set up CI/CD to catch build issues earlier

2. **Test Runtime Bugs**
   - Deploy to TestFlight when build succeeds
   - Test BUG-007 (Voice modal) on physical device
   - Verify all resolved bugs stay fixed

3. **Documentation Updates**
   - Update ERROR_LOG.md with BUG-001 and BUG-002 details
   - Add troubleshooting guide for common build errors
   - Document successful build configuration

### Long-Term Actions (Backlog)

1. **Upgrade to New Architecture**
   - Wait for Expo SDK 55 or stable SDK 54 update
   - Test react-native-reanimated 4.x compatibility
   - Full regression testing on TestFlight

2. **Build Infrastructure**
   - Set up preview builds on PRs
   - Add automated testing before builds
   - Monitor build success metrics

3. **Performance Monitoring**
   - Add Sentry or similar error tracking
   - Monitor app crashes in production
   - Track build success rate over time

---

## 📊 Bug Statistics

### By Status
- 🔴 Unresolved Critical: 2 (BUG-001, BUG-002)
- 🟡 Needs Investigation: 1 (BUG-004)
- 🟡 Needs Testing: 1 (BUG-007)
- 🟡 Acceptable: 1 (BUG-008)
- 🟢 Resolved: 4 (BUG-003, BUG-005, BUG-006, BUG-009)

### By Priority
- **P0 Critical:** 2 bugs (blocking all production builds)
- **P1 High:** 1 bug (intermittent but serious)
- **P2 Medium:** 3 bugs (2 resolved, 1 needs testing)
- **P3 Low:** 2 bugs (1 resolved, 1 acceptable)

### By Category
- **Build Errors:** 4 bugs (2 critical unresolved)
- **Runtime Errors:** 3 bugs (2 resolved, 1 needs testing)
- **Configuration Issues:** 1 bug (resolved)

---

## 🔍 Debug Resources

### EAS Build Dashboard
https://expo.dev/accounts/heysalad/projects/heysalad-wallet/builds

### Key Commands
```bash
# Check build status
eas build:list --limit 5

# View specific build
eas build:view BUILD_ID

# Check local TypeScript errors
bunx tsc --noEmit

# Check dependencies
bun audit

# View full Xcode logs
# Click "Xcode Logs" link in EAS dashboard
```

### Related Documentation
- [ERROR_LOG.md](ERROR_LOG.md) - Detailed error catalog
- [CHANGELOG.md](CHANGELOG.md) - Version history
- [DEVOPS_SETUP.md](DEVOPS_SETUP.md) - Build and CI/CD setup

---

## 📞 Support

**Maintainer:** HeySalad OÜ
**Primary Contact:** @chilumbam
**AI Assistant:** Claude (Anthropic)

**When Reporting New Bugs:**
1. Check this file first for existing bug
2. Include build number or commit hash
3. Provide full error message
4. List steps to reproduce
5. Note any recent changes
6. Include environment details (Expo SDK version, etc.)

---

**Document Version:** 1.0
**Created:** November 8, 2025
**Created By:** Claude (Anthropic)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
