# 🍎 HeySalad® Wallet - iOS App Store Launch Plan

**Target:** TestFlight in 7 days, App Store in 14 days
**Current Status:** Day 1 Complete - App Running ✅
**Focus:** iOS-first launch strategy

---

## ✅ What's Working Now (Day 1)

### Core Functionality
- ✅ **Wallet Creation** - Real TRON address generation with proper ECDSA
- ✅ **Address Derivation** - Keccak-256 + Base58 encoding working correctly
- ✅ **Private Key Security** - Secure storage with biometric protection
- ✅ **Balance Fetching** - TronGrid API integration working
- ✅ **Error Handling** - Graceful handling of new addresses (400 errors)
- ✅ **UI/UX** - Wallet setup, onboarding flow, main screens
- ✅ **Biometric Ready** - Face ID/Touch ID infrastructure in place

### Architecture
- ✅ **Production Services** - CryptoService, TronService, BiometricService
- ✅ **Clean Provider** - WalletProviderV2 with proper state management
- ✅ **TypeScript** - Fully typed codebase
- ✅ **Expo SDK 54** - Latest stable version
- ✅ **React Native 0.76** - Modern RN version

### Security
- ✅ **No Hardcoded Credentials** - All sensitive data in .env
- ✅ **Secure Key Storage** - expo-secure-store integration
- ✅ **Environment Variables** - Proper separation of public/private
- ✅ **Error Boundary** - App-wide error catching

---

## ❌ What's Missing for iOS Launch

### Critical (Must Fix)
1. ❌ **Face ID Permission** - Missing `NSFaceIDUsageDescription` in Info.plist
2. ❌ **Transaction Testing** - Need to test actual TRX sending on testnet
3. ❌ **App Icon** - Required 1024x1024px icon for App Store
4. ❌ **Launch Screen** - Need proper splash screen
5. ❌ **Privacy Policy** - Required by Apple for App Store
6. ❌ **Terms of Service** - Required for financial apps
7. ❌ **Build Configuration** - Need EAS Build setup

### Important (Should Have)
8. ⚠️ **Voice Features** - Currently simulated, need real STT/TTS
9. ⚠️ **Transaction History** - Not fetching from blockchain
10. ⚠️ **Push Notifications** - For transaction confirmations
11. ⚠️ **App Store Screenshots** - Need 6.5" and 5.5" screenshots
12. ⚠️ **Error Tracking** - Sentry or similar for production
13. ⚠️ **Analytics** - Privacy-respecting analytics
14. ⚠️ **Rate Limiting** - Prevent API abuse

### Nice to Have (Can Wait)
15. 🟡 **Dark Mode** - Better UX
16. 🟡 **Haptic Feedback** - Polish
17. 🟡 **Animations** - Smoother transitions
18. 🟡 **Localization** - i18n support
19. 🟡 **iPad Support** - Tablet optimization
20. 🟡 **Widget** - Balance widget

---

## 📅 7-Day TestFlight Plan

### Day 2 (Tomorrow): Testing & Polish
**Time: 6-8 hours**

#### Morning (4 hours)
- [ ] Get testnet TRX from faucet
- [ ] Test complete transaction flow
  - Create transaction ✅
  - Sign with biometrics ✅
  - Broadcast to network ❓
  - Verify on explorer ❓
- [ ] Fix any transaction issues
- [ ] Add NSFaceIDUsageDescription to app.json

#### Afternoon (3 hours)
- [ ] Create app icon (1024x1024)
- [ ] Design launch/splash screen
- [ ] Test on physical iPhone
- [ ] Fix biometric edge cases

**Success Criteria:**
- ✅ Can send testnet TRX successfully
- ✅ Transaction appears on TronScan
- ✅ Face ID works on device
- ✅ App icon displays properly

---

### Day 3: Legal & Content
**Time: 4-6 hours**

#### Morning (3 hours)
- [ ] Write Privacy Policy
  - Data collection (minimal)
  - Private key storage
  - Third-party services (TronGrid, ElevenLabs)
  - User rights
- [ ] Write Terms of Service
  - Liability disclaimers
  - Crypto warnings
  - Age restrictions (18+)
  - Prohibited uses

#### Afternoon (2 hours)
- [ ] Create App Store description
  - Short description (170 chars)
  - Full description (4000 chars)
  - Keywords
  - What's New section
- [ ] Prepare promotional text

**Success Criteria:**
- ✅ Privacy policy published online
- ✅ Terms of service published
- ✅ Marketing copy ready

---

### Day 4: Screenshots & Media
**Time: 4-6 hours**

#### All Day
- [ ] Take App Store screenshots
  - 6.5" display (iPhone 14 Pro Max, 15 Pro Max)
    - Wallet home with balance
    - Send transaction screen
    - Voice payment
    - Transaction success
    - Settings
  - 5.5" display (iPhone 8 Plus)
    - Same 5 screens
- [ ] Create App Preview video (optional but recommended)
- [ ] Design App Store icon
- [ ] Test on multiple iOS versions
  - iOS 17.x
  - iOS 16.x

**Success Criteria:**
- ✅ 10 screenshots total (5 per size)
- ✅ All screenshots show real app
- ✅ No placeholder data visible

---

### Day 5: Build Configuration
**Time: 6-8 hours**

#### Morning (4 hours)
- [ ] Set up Expo Application Services (EAS)
  ```bash
  npm install -g eas-cli
  eas login
  eas build:configure
  ```
- [ ] Configure `eas.json`
  ```json
  {
    "build": {
      "preview": {
        "distribution": "internal",
        "ios": {
          "simulator": false
        }
      },
      "production": {
        "ios": {
          "bundleIdentifier": "com.heysalad.wallet"
        }
      }
    }
  }
  ```
- [ ] Set up Apple Developer account
  - Enroll in Apple Developer Program ($99/year)
  - Create App ID
  - Create provisioning profiles

#### Afternoon (3 hours)
- [ ] Configure app.json for production
  - Bundle ID
  - Version number (1.0.0)
  - Build number
  - Required permissions
  - Background modes
- [ ] First EAS build
  ```bash
  eas build --platform ios --profile preview
  ```
- [ ] Test build on physical device

**Success Criteria:**
- ✅ EAS build succeeds
- ✅ Build installs on iPhone
- ✅ All features work in build

---

### Day 6: Testing & Bug Fixes
**Time: 6-8 hours**

#### All Day
- [ ] Comprehensive testing on build
  - Wallet creation 10+ times
  - Import wallet
  - Send transactions
  - Voice features
  - Settings
  - Edge cases (no internet, low balance, etc.)
- [ ] Fix all critical bugs
- [ ] Test on multiple devices
  - iPhone 15 Pro
  - iPhone 14
  - iPhone 12
  - iPhone SE
- [ ] Performance testing
  - App launch time
  - Transaction speed
  - Memory usage
  - Battery usage

**Success Criteria:**
- ✅ Zero crashes in 1 hour of testing
- ✅ All core flows work
- ✅ Performance acceptable

---

### Day 7: TestFlight Submission
**Time: 4-6 hours**

#### Morning (3 hours)
- [ ] Create App Store Connect app
  - Name: HeySalad® Wallet
  - Category: Finance
  - Price: Free
  - Age rating: 17+ (unrestricted web access)
- [ ] Upload screenshots and metadata
- [ ] Set up TestFlight
  - Internal testing group
  - External testing (optional)

#### Afternoon (2 hours)
- [ ] Production build
  ```bash
  eas build --platform ios --profile production
  ```
- [ ] Submit to TestFlight
  ```bash
  eas submit --platform ios
  ```
- [ ] Wait for Apple review (usually 24-48 hours)
- [ ] Invite beta testers

**Success Criteria:**
- ✅ Build submitted to TestFlight
- ✅ No rejection from Apple
- ✅ Beta testers can install

---

## 📅 14-Day App Store Plan

### Days 8-10: Beta Testing
- Collect feedback from 10-20 testers
- Fix bugs discovered in testing
- Iterate on UX issues
- Performance improvements

### Days 11-12: Final Polish
- Implement critical feedback
- Final security review
- Update screenshots if needed
- Prepare What's New text

### Days 13-14: App Store Submission
- Final production build
- Submit for App Review
- Respond to reviewer questions
- Launch! 🚀

---

## 📋 iOS App Store Requirements Checklist

### Technical Requirements
- [x] Built with latest Expo SDK (54)
- [ ] Works on iOS 16.0+
- [ ] Supports iPhone 12, 13, 14, 15 series
- [x] 64-bit architecture
- [ ] No crashes or major bugs
- [ ] Face ID permission string
- [ ] Privacy-respecting (no tracking without consent)
- [x] Secure data storage
- [ ] All APIs use HTTPS

### Content Requirements
- [ ] App Store icon (1024x1024)
- [ ] Screenshots (10 total, 2 sizes)
- [ ] Privacy policy URL
- [ ] Support URL/email
- [ ] Marketing description
- [ ] Keywords (up to 100 chars)
- [ ] Age rating justification
- [ ] Export compliance (crypto)

### Legal Requirements
- [ ] Apple Developer Program membership
- [ ] Privacy Policy published
- [ ] Terms of Service published
- [ ] GDPR compliance (if EU users)
- [ ] Export compliance documentation
- [ ] Cryptocurrency app declaration

### Financial App Requirements
- [ ] Clear disclosure of fees
- [ ] Testnet-only disclaimer (if applicable)
- [ ] Security information
- [ ] User data protection statement
- [ ] No guarantees of returns/profits

---

## 🚨 Common Rejection Reasons to Avoid

### 1. Incomplete Information
- ❌ Missing privacy policy
- ❌ No support URL
- ❌ Incomplete description
- ✅ **Fix:** Ensure all metadata complete

### 2. Crashes or Bugs
- ❌ App crashes on launch
- ❌ Features don't work
- ✅ **Fix:** Extensive testing on Day 6

### 3. Misleading Description
- ❌ Screenshots don't match app
- ❌ Features not available
- ✅ **Fix:** Honest marketing copy

### 4. Crypto Compliance
- ❌ No warnings about risks
- ❌ Promises of returns
- ✅ **Fix:** Clear disclaimers

### 5. Guideline 2.1 - Performance
- ❌ Incomplete app
- ❌ Beta/demo features
- ✅ **Fix:** Remove "demo mode" from voice

---

## 💰 Costs for iOS Launch

### Required
- **Apple Developer Program:** $99/year
- **Expo EAS:** $0 (free tier for small apps)
- **Domain for Privacy Policy:** ~$12/year
- **Total:** ~$111/year

### Optional
- **Sentry Error Tracking:** $26/month (after free tier)
- **Better TronGrid API:** Free (current tier sufficient)
- **App Store Optimization:** $0-500 (DIY vs paid)
- **Beta Testing Tools:** $0 (TestFlight free)

---

## 🎯 Success Metrics

### TestFlight (Days 7-14)
- [ ] 20+ beta testers
- [ ] 90%+ crash-free rate
- [ ] <2s app launch time
- [ ] >4.5 star beta feedback

### App Store (First Month)
- [ ] Approved on first submission
- [ ] 100+ downloads
- [ ] <1% crash rate
- [ ] >4.0 store rating
- [ ] 10+ successful transactions

---

## 🛠️ Quick Commands Reference

### Build for iOS
```bash
# Preview build (internal testing)
eas build --platform ios --profile preview

# Production build (App Store)
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

### Testing
```bash
# Install on simulator
npx expo run:ios

# Install on physical device
eas build --platform ios --profile preview
# Then scan QR code to install
```

### Environment
```bash
# Check build configuration
eas build:configure

# View build status
eas build:list

# View submission status
eas submit:list
```

---

## 📞 Resources

### Apple
- **Developer Portal:** https://developer.apple.com/
- **App Store Connect:** https://appstoreconnect.apple.com/
- **Review Guidelines:** https://developer.apple.com/app-store/review/guidelines/
- **Crypto Guidelines:** https://developer.apple.com/app-store/review/guidelines/#cryptocurrencies

### Expo
- **EAS Build Docs:** https://docs.expo.dev/build/introduction/
- **Submit Guide:** https://docs.expo.dev/submit/introduction/
- **App Store Guide:** https://docs.expo.dev/guides/app-stores/

### TRON
- **Testnet Explorer:** https://nile.tronscan.org/
- **TronGrid API:** https://www.trongrid.io/

---

## 🎬 Next Actions (Right Now!)

### Today (Remaining Day 1):
1. **Get testnet TRX** - Visit https://nileex.io/join/getJoinPage
2. **Test transaction** - Send TRX to yourself or test address
3. **Document any issues** - Note what works/doesn't work

### Tomorrow (Day 2):
1. **Morning:** Fix transaction issues, test thoroughly
2. **Afternoon:** Create app icon, add Face ID description
3. **Evening:** Test on physical iPhone with Face ID

### This Week:
- Focus on getting a working, polished app
- Don't worry about advanced features
- TestFlight submission by Day 7

---

**Current Status:** 🟢 On Track
**Biggest Risk:** Transaction signing (need to test!)
**Biggest Opportunity:** Voice features differentiate from other wallets

**You're 20% done with technical work, 80% is polish and Apple process!** 🚀
