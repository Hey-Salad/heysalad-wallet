# HeySalad® Wallet - Getting Started Guide

## 🚀 Quick Start (5 minutes)

### Prerequisites
- Node.js 18+ with npm/yarn/bun
- Expo CLI: `npm install -g @expo/cli`
- iOS Simulator (Mac) or Android Emulator
- Physical device (recommended for testing biometrics)

### Step 1: Clone & Install
```bash
git clone https://github.com/Hey-Salad/heysalad-wallet.git
cd heysalad-wallet
npm install
```

### Step 2: Environment Setup
```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your values
nano .env
```

**Required Configuration:**
```env
# Get from https://www.trongrid.io/
EXPO_PUBLIC_TRONGRID_API_KEY=your_api_key_here

# For testnet development
EXPO_PUBLIC_TRONGRID_URL=https://nile.trongrid.io

# Generate your test wallet private key (TESTNET ONLY!)
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
TRON_PRIVATE_KEY=your_64_char_hex_private_key

# Derive address from your private key (see below)
TRON_OWNER_ADDRESS=T...
```

### Step 3: Generate Test Wallet

Run this script to generate a test wallet:
```bash
node -e "
const crypto = require('crypto');
const privateKey = crypto.randomBytes(32).toString('hex');
console.log('Private Key:', privateKey);
console.log('⚠️  TESTNET ONLY - Never use for real funds!');
console.log('Add this to your .env file as TRON_PRIVATE_KEY');
"
```

Then derive the address using the app or TronWeb.

### Step 4: Get Testnet TRX
1. Visit [TRON Nile Faucet](https://nileex.io/join/getJoinPage)
2. Enter your `TRON_OWNER_ADDRESS`
3. Request testnet TRX (free)
4. Wait 1-2 minutes for confirmation

### Step 5: Run the App
```bash
# Start Expo development server
npm start

# Or for web
npm run start-web

# Or directly on iOS
npm run ios

# Or directly on Android
npm run android
```

---

## 📱 Testing on Physical Device

### iOS (Recommended for Biometrics)
1. Install Expo Go from App Store
2. Scan QR code from terminal
3. Enable Face ID in device settings

### Android
1. Install Expo Go from Play Store
2. Scan QR code or enter URL manually
3. Enable fingerprint in device settings

---

## 🧪 Testing Features

### 1. Wallet Setup
- [x] Create new wallet
- [x] Import existing wallet
- [x] Enable biometric authentication
- [x] Complete onboarding

### 2. Send Transaction
- [x] Tap "Send" button
- [x] Try voice payment: "Send 1 TRX to [address]"
- [x] Or use manual entry
- [x] Authenticate with Face ID/Fingerprint
- [x] Confirm transaction
- [x] View on explorer

### 3. Voice Assistant (Selina)
- [x] Tap microphone icon
- [x] Ask "What's my balance?"
- [x] Test conversation flow
- [x] Voice responses (with ElevenLabs API key)

### 4. Split Payments
- [x] Navigate to Split tab
- [x] Create IOU request
- [x] Settle payment

---

## 🔧 Troubleshooting

### "No funds available"
- Check your address has testnet TRX
- Visit https://nile.tronscan.org/#/address/YOUR_ADDRESS
- Request more from faucet if needed

### "Biometric authentication failed"
- Enable Face ID/Touch ID in device settings
- Grant app permission when prompted
- Fallback to passcode if biometrics unavailable

### "Transaction signature error"
- Ensure private key matches address
- Check TRON_PRIVATE_KEY in .env is correct
- Verify you're on testnet (nile.trongrid.io)

### "Voice features not working"
- Check microphone permissions
- For full voice AI, add EXPO_PUBLIC_ELEVENLABS_API_KEY
- Demo mode works without API keys

### App won't start
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npx expo start -c
```

---

## 📚 Next Steps

1. **Read the Code**
   - Start with `/services` - Clean, production-ready services
   - Check `/providers/WalletProviderV2.tsx` - New architecture
   - Review `/components/AudioPay.tsx` - Voice features

2. **Run Tests** (Coming soon)
   ```bash
   npm test
   ```

3. **Deploy to Testflight/Play Store**
   - See `PRODUCTION_ROADMAP.md`
   - Configure EAS Build
   - Submit for review

4. **Security Review**
   - Never commit .env files
   - Use testnet for development
   - Audit before mainnet deployment

---

## 🎯 Development Workflow

### Making Changes
```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes
# Test thoroughly

# Commit with descriptive message
git add .
git commit -m "feat: add awesome feature"

# Push and create PR
git push origin feature/my-feature
```

### Code Quality
```bash
# Lint code
npm run lint

# Type check
npx tsc --noEmit

# Format code
npx prettier --write .
```

---

## 🆘 Getting Help

- **Issues:** [GitHub Issues](https://github.com/Hey-Salad/heysalad-wallet/issues)
- **Documentation:** Check README.md and PRODUCTION_ROADMAP.md
- **Email:** support@heysalad.com

---

## ⚠️ Important Reminders

1. **Testnet Only**: Current setup is for TRON Nile testnet
2. **Private Keys**: Never share or commit private keys
3. **Security**: Always use biometric auth on physical devices
4. **Backups**: Save your recovery phrase securely
5. **Testing**: Test all features before considering mainnet

---

**Ready to build something amazing? Let's go! 🚀**
