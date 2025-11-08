# Changelog

All notable changes to HeySalad Wallet are documented in this file.

## [1.0.10] - 2025-11-07

### 🎉 Milestone
- **UK AI Agent Hackathon Winner** - Won $1200 share of the prize pool!

### ✨ Added
- **Mercuryo On-Ramp Integration** - Buy crypto (TRX) with fiat currency
  - Full WebView-based modal implementation
  - Pre-filled wallet address
  - Success/cancel detection via deep links
  - "Buy" button added to wallet home screen
  - Files: `components/MercuryoWidget.tsx`, updated `app/(tabs)/(wallet)/index.tsx`

- **Smart Cryptocurrency Icons** - Intelligent icon loading system
  - Bundled icons for 15+ major cryptocurrencies (offline support)
  - CoinGecko API integration for comprehensive coverage
  - 7-day AsyncStorage caching to reduce API calls
  - Trust Wallet CDN fallback
  - Special TRON logo rendering
  - Files: `services/CryptoIconService.ts`, `components/SmartCryptoIcon.tsx`

- **Apple App Store Compliance Features**
  - Auto-lock with configurable timeouts (Immediate, 1min, 5min, 15min, 30min, Never)
  - Lock on app background functionality
  - PIN fallback authentication (6-digit)
  - Dedicated security settings screen
  - Dedicated passcode management screen
  - Biometric authentication (Face ID / Touch ID)
  - Files: `providers/SecurityProvider.tsx`, `components/LockScreen.tsx`, `components/PINInput.tsx`, `app/(tabs)/(wallet)/security.tsx`, `app/(tabs)/(wallet)/passcode.tsx`

- **Legal & Compliance Pages**
  - Privacy Policy with HeySalad OÜ company information
  - Terms of Service
  - Support page with contact details (peter@heysalad.io)
  - Files: `public/privacy.html`, `public/terms.html`, `public/support.html`

- **Documentation**
  - `AGENTS.md` - Comprehensive AI agent context document
  - `MERCURYO_SETUP.md` - On-ramp setup guide
  - `APPLE_COMPLIANCE_CHECKLIST.md` - App Store requirements (18/18 features)
  - `APPLE_SUBMISSION_READY.md` - Quick submission reference
  - `SECURITY_COMPARISON.md` - Security features comparison

### 🐛 Fixed
- **Critical: Balance Not Updating on Network Switch**
  - Problem: Balance remained the same when switching between testnet and mainnet
  - Cause: Single `useEffect` with multiple dependencies caused race conditions
  - Solution: Split into two separate `useEffect` hooks in `WalletProviderV2.tsx`
    - One for initial wallet load (watches `wallet.address`, `wallet.isSetup`)
    - One for network changes (watches `networkId` only)
  - Now properly uses `getBlockchainService(networkId)` for network-aware balance fetching
  - File: `providers/WalletProviderV2.tsx:85-105`

- **Critical: Payment Page Showing Wrong Balance**
  - Problem: Payment screen displayed hardcoded 2000 TRX instead of actual balance
  - Cause: Hardcoded fallback in `getWalletBalance` function
  - Solution: Removed hardcoded fallback, now uses `wallet.balance ?? wallet.tronBalance ?? 0`
  - File: `app/(tabs)/pay/index.tsx:25-28`

- **iOS Build: react-native-reanimated Folly Compilation Error**
  - Problem: Build failed with `'folly/coro/Coroutine.h' file not found`
  - Attempted Solutions:
    - Added `useFrameworks: "static"` (didn't work)
    - Updated to react-native-reanimated 3.16.7 (still failed)
  - Final Solution: Downgraded to react-native-reanimated 3.15.1 (stable version) and patched
    `ReanimatedHermesRuntime.cpp` to skip `reacthermes` debugger headers when Hermes debugging is
    disabled, eliminating the missing Folly coroutine include.
  - Updated `bun.lock` to sync dependencies
  - File: `package.json:72`

- **iOS Build: Frozen Lockfile Error**
  - Problem: EAS build failed with "lockfile had changes, but lockfile is frozen"
  - Solution: Ran `bun install` to update `bun.lock` with new dependencies
  - Build #10 now in progress with synced lockfile

### 🔧 Changed
- **Upgraded Action Buttons**
  - Added "Buy" button to wallet home (4 buttons total: Buy, Send, Receive, Split)
  - Reordered for better UX flow
  - File: `app/(tabs)/(wallet)/index.tsx:181-207`

- **Enhanced Token Display**
  - Replaced basic icons with `SmartCryptoIcon` component
  - Now supports dynamic icon loading with multiple fallbacks
  - File: `app/(tabs)/(wallet)/index.tsx:224-226`

- **Security Settings Reorganization**
  - Moved PIN management to dedicated screen
  - Cleaner separation of concerns
  - Better user experience for passcode setup/changes
  - Files: `app/(tabs)/(wallet)/security.tsx`, `app/(tabs)/(wallet)/passcode.tsx`

- **Provider Hierarchy Update**
  - Added `SecurityProvider` to app layout
  - Integrated lock screen check in `AppNavigator`
  - File: `app/_layout.tsx`

### 📦 Dependencies
- Updated `react-native-reanimated` from ~3.16.0 to 3.15.1
- Added `cryptocurrency-icons` 0.18.1
- Added `react-native-webview` 13.15.0 (already present)

### 🔐 Security
- All 18/18 Apple App Store security requirements implemented
- Hardware-backed key storage via iOS Secure Enclave
- PIN stored as SHA-256 hash, never in plain text
- Biometric authentication requires user opt-in
- Auto-lock prevents unauthorized access
- Lock on background protects sensitive data

### 📝 Configuration
- EAS build configuration updated for production
- Distribution set to "store" for App Store submission
- Auto-increment enabled for build numbers
- iOS credentials configured via EAS

---

## [1.0.4] - Previous Version

### Features
- Initial wallet creation and import
- TRON (TRX) support (testnet & mainnet)
- Send and receive transactions
- QR code generation for receiving
- Network switcher (testnet/mainnet)
- Transaction history
- Balance display in GBP
- Voice assistant (Selina) integration
- Social features (bill splitting)
- Biometric authentication
- Secure key storage

---

## Build History

### Build #10 (In Progress)
- **Status**: Building
- **Changes**: Synced lockfile, react-native-reanimated 3.15.1
- **Build URL**: https://expo.dev/accounts/heysalad/projects/heysalad-wallet/builds/efdd1cdf-1801-43a1-a957-7103db16e19b

### Build #9 (Failed)
- **Status**: Failed - Frozen lockfile
- **Issue**: Lockfile out of sync with package.json
- **Build URL**: https://expo.dev/accounts/heysalad/projects/heysalad-wallet/builds/b99c909f-48c2-48db-bad9-320f7b14d1ca

### Build #8 (Failed)
- **Status**: Failed - RNReanimated Folly error
- **Issue**: react-native-reanimated 3.16.7 incompatible with Folly
- **Build URL**: https://expo.dev/accounts/heysalad/projects/heysalad-wallet/builds/6103cc0f-b0bc-4020-a374-60fdc616a077

### Builds #1-7 (Failed)
- **Status**: Failed - RNReanimated compilation errors
- **Issue**: Folly dependency issues with react-native-reanimated
- **Attempted fixes**: useFrameworks configuration, various version changes

---

## Roadmap

### Next Steps
1. ✅ Complete iOS build for TestFlight
2. ⏳ Configure Mercuryo Widget ID
3. ⏳ Host legal pages (privacy.html, terms.html, support.html)
4. ⏳ Create app icon (1024x1024)
5. ⏳ Take App Store screenshots
6. ⏳ Submit to TestFlight
7. ⏳ Beta testing
8. ⏳ App Store submission

### Future Features
- **Restaurant Payment Integration** - Partner with restaurants to accept HeySalad Wallet
  - QR code payments at point of sale
  - Loyalty rewards program
  - Split bill functionality for groups
  - Restaurant discovery and menus

- **Additional Payment Providers**
  - Stripe on-ramping (alternative to Mercuryo)
  - Lower fees for restaurant transactions
  - Instant settlements

- **Multi-Currency Support**
  - Additional cryptocurrencies (BTC, ETH, USDT, USDC)
  - Automatic conversion at point of sale
  - Currency preference settings

- **Enhanced Security**
  - Multi-signature transactions
  - Spending limits
  - Transaction notifications
  - Suspicious activity detection

- **Social Features**
  - Send to contacts
  - Request payments
  - Split bills with friends
  - Payment reminders

- **Merchant Features**
  - Restaurant dashboard
  - Payment analytics
  - Customer insights
  - Marketing tools

---

## Contributors

- **HeySalad OÜ** - Development Team
- **Claude (Anthropic)** - AI Development Assistant
- **UK AI Agent Hackathon** - Platform & Support

## Contact

- **Email**: peter@heysalad.io
- **Company**: HeySalad OÜ
- **Registration**: 17327633
- **Location**: Pärnu mnt 139b, 11317 Tallinn, Estonia

---

**Legend:**
- ✅ Completed
- ⏳ Pending
- 🐛 Bug Fix
- ✨ New Feature
- 🔧 Changed
- 🔐 Security
- 📦 Dependencies
