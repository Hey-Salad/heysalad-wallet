# AGENTS.md - AI Agent Context for HeySalad Wallet

This document provides AI agents (like Claude, Codex, etc.) with comprehensive context about the HeySalad Wallet project to enable efficient assistance.

## Project Overview

**HeySalad Wallet** is a mobile cryptocurrency wallet application built for the UK AI Agent Hackathon. It's a React Native/Expo app that provides a secure, user-friendly way to manage TRON (TRX) cryptocurrency with AI-powered features.

### Key Information
- **Company**: HeySalad OÜ
- **Registration**: 17327633
- **Location**: Pärnu mnt 139b, 11317 Tallinn, Estonia
- **Contact**: peter@heysalad.io
- **Platform**: iOS (primary), Android (future)
- **Framework**: Expo 54.0.13, React Native 0.81.4, React 19.1.0
- **Primary Blockchain**: TRON (testnet & mainnet)
- **Package Manager**: Bun

## Tech Stack

```
React Native 0.81.4
├── Expo 54.0.13
├── React 19.1.0
├── TypeScript 5.9.2
├── Expo Router 6.0.11 (file-based routing)
├── TronWeb 6.0.4 (blockchain interaction)
├── tRPC 11.4.4 (type-safe API)
├── React Query 5.85.5 (data fetching)
└── Zustand 5.0.2 (state management)

Security & Auth
├── expo-local-authentication (Face ID / Touch ID)
├── expo-secure-store (encrypted storage)
├── @react-native-async-storage/async-storage (general storage)
└── expo-crypto (hashing)

UI & Icons
├── Lucide React Native (icons)
├── react-native-svg (SVG support)
├── cryptocurrency-icons (bundled crypto logos)
└── NativeWind 4.1.23 (Tailwind CSS)

AI Features
├── @elevenlabs/react-native (Selina voice assistant)
├── @livekit/react-native (real-time communication)
└── expo-speech (text-to-speech)

Payment Processing
├── react-native-webview (Mercuryo on-ramp)
└── expo-web-browser (external links)
```

## Project Structure

```
heysalad-wallet/
├── app/                          # Expo Router file-based routing
│   ├── (tabs)/                   # Tab navigator routes
│   │   ├── (wallet)/             # Wallet tab screens
│   │   │   ├── index.tsx         # Wallet home (balance, tokens, Buy button)
│   │   │   ├── settings.tsx      # Main settings screen
│   │   │   ├── security.tsx      # Security settings (biometric, auto-lock)
│   │   │   └── passcode.tsx      # PIN/passcode management
│   │   ├── pay/                  # Payment screens
│   │   │   └── index.tsx         # Send crypto screen
│   │   └── social/               # Social features (bill splitting)
│   ├── _layout.tsx               # Root layout (providers, navigation)
│   ├── index.tsx                 # App entry point
│   └── onboarding.tsx            # First-run onboarding
│
├── components/                   # React components
│   ├── LockScreen.tsx            # Biometric/PIN lock screen
│   ├── PINInput.tsx              # 6-digit PIN entry
│   ├── MercuryoWidget.tsx        # On-ramp WebView modal
│   ├── SmartCryptoIcon.tsx       # Crypto icon with fallbacks
│   ├── NetworkSwitcher.tsx       # Testnet/mainnet toggle
│   ├── ReceiveModal.tsx          # QR code for receiving
│   ├── SelinaVoiceModal.tsx      # AI voice assistant
│   └── TransactionReview.tsx     # Pre-send transaction review
│
├── providers/                    # React Context providers
│   ├── WalletProvider.tsx        # DEPRECATED - use WalletProviderV2
│   ├── WalletProviderV2.tsx      # Main wallet state (balance, address)
│   ├── SecurityProvider.tsx      # Auto-lock, PIN, biometric auth
│   ├── NetworkProvider.tsx       # Network selection (testnet/mainnet)
│   └── AuthProvider.tsx          # Authentication state
│
├── services/                     # Business logic services
│   ├── blockchain.ts             # TronWeb wrapper (balance, transactions)
│   ├── BiometricService.ts       # Face ID / Touch ID
│   ├── CryptoIconService.ts      # Icon fetching with caching
│   └── wallet/                   # Wallet management
│       ├── create.ts             # Generate new wallets
│       ├── import.ts             # Import from seed/private key
│       └── storage.ts            # Secure wallet storage
│
├── config/                       # Configuration files
│   └── networks.ts               # Network definitions (testnet/mainnet)
│
├── constants/                    # App constants
│   └── colors.ts                 # Brand colors (cherryRed, ink, etc.)
│
├── types/                        # TypeScript types
│   └── wallet.ts                 # Wallet-related interfaces
│
├── public/                       # Static assets served on web
│   ├── privacy.html              # Privacy policy
│   ├── terms.html                # Terms of service
│   └── support.html              # Support page
│
└── docs/                         # Documentation (generated)
    ├── MERCURYO_SETUP.md         # On-ramp setup guide
    ├── APPLE_COMPLIANCE_CHECKLIST.md  # App Store requirements
    ├── GETTING_STARTED.md        # Developer guide
    └── SESSION_SUMMARY.md        # Development progress log
```

## Core Architecture

### Provider Hierarchy (app/_layout.tsx)

```tsx
<TRPCProvider>
  <QueryClientProvider>
    <AuthProvider>
      <NetworkProvider>
        <SecurityProvider>
          <WalletProvider>  // Uses WalletProviderV2
            {children}
          </WalletProvider>
        </SecurityProvider>
      </NetworkProvider>
    </AuthProvider>
  </QueryClientProvider>
</TRPCProvider>
```

**Provider Responsibilities:**
- **NetworkProvider**: Network selection (tron-testnet, tron-mainnet), blockchain service routing
- **SecurityProvider**: Auto-lock timer, PIN management, biometric auth, lock screen state
- **WalletProviderV2**: Wallet address, balance, refresh logic, transaction history
- **AuthProvider**: User authentication state

### Navigation Structure

File-based routing via Expo Router:

```
/(tabs)/              # Tab bar navigator
  ├── (wallet)/       # Wallet stack
  │     ├── /         → Wallet home (balance, tokens)
  │     ├── /settings → Settings
  │     ├── /security → Security settings
  │     └── /passcode → PIN management
  ├── /pay            → Send crypto
  └── /social         → Social features
```

### State Management Strategy

1. **React Context** for global state (wallet, security, network)
2. **useState/useReducer** for local component state
3. **React Query** for server state caching
4. **AsyncStorage** for persistence
5. **SecureStore** for sensitive data (private keys, PIN hashes)

## Key Files Deep Dive

### providers/WalletProviderV2.tsx

**Purpose**: Main wallet state management

**Key State:**
```typescript
{
  address: string;           // User's TRON address
  balance: number;           // TRX balance
  isSetup: boolean;          // Wallet initialized
  privateKey: string;        // Encrypted in SecureStore
  seedPhrase: string;        // Encrypted in SecureStore
  onboarding: {
    hasCompletedOnboarding: boolean;
  }
}
```

**Critical Functions:**
- `refreshBalance()`: Fetches balance from blockchain (network-aware)
- `createWallet()`: Generates new wallet
- `importWallet()`: Imports from seed/private key
- `sendTransaction()`: Sends TRX to recipient

**Recent Fix (CRITICAL):**
Balance wasn't updating on network switch. Fixed by splitting into two separate `useEffect` hooks:
1. One for initial wallet load (watches `wallet.address`)
2. One for network changes (watches `networkId`)

Both call `refreshBalance()` which uses `getBlockchainService(networkId)` for network-aware balance fetching.

### providers/SecurityProvider.tsx

**Purpose**: Security features (auto-lock, PIN, biometric)

**Key State:**
```typescript
{
  isLocked: boolean;
  settings: {
    autoLockTimeout: 'immediate' | '1min' | '5min' | '15min' | '30min' | 'never';
    lockOnBackground: boolean;
    biometricEnabled: boolean;
    pinEnabled: boolean;
    pinHash?: string;  // SHA-256 hash of PIN
  }
}
```

**Key Functions:**
- `lock()`: Locks wallet (shows LockScreen)
- `unlock()`: Attempts biometric unlock
- `setPIN(pin)`: Sets 6-digit PIN
- `verifyPIN(pin)`: Verifies PIN against hash
- Auto-lock timer runs every 10 seconds
- `AppState` listener for lock on background

### services/blockchain.ts

**Purpose**: TronWeb wrapper for blockchain operations

**Key Functions:**
```typescript
// Get balance
async getBalance(address: string): Promise<number>

// Send transaction
async sendTransaction(
  fromAddress: string,
  toAddress: string,
  amount: number,
  privateKey: string
): Promise<string>  // Returns transaction ID

// Validate address
isValidAddress(address: string): boolean

// Get transaction history
async getTransactions(address: string): Promise<Transaction[]>
```

**Network Awareness:**
Use `getBlockchainService(networkId)` to get the correct service instance:
```typescript
import { getBlockchainService } from '@/services/blockchain';

const { networkId } = useNetwork();
const blockchainService = getBlockchainService(networkId);
const balance = await blockchainService.getBalance(address);
```

### components/MercuryoWidget.tsx

**Purpose**: On-ramp integration (buy crypto with fiat)

**Setup Required:**
1. Sign up at mercuryo.io
2. Get Widget ID
3. Replace `'YOUR_WIDGET_ID'` at line 53

**Flow:**
1. User taps "Buy" button on wallet home
2. WebView opens with Mercuryo widget
3. User completes KYC and payment
4. Deep link detects success: `heysalad://mercuryo-success`
5. Alert confirms purchase
6. Balance refreshes automatically

### services/CryptoIconService.ts

**Purpose**: Smart icon loading with 4-tier fallback

**Strategy:**
1. Check bundled icons (offline, fast)
2. Check AsyncStorage cache (7-day TTL)
3. Fetch from CoinGecko API (comprehensive)
4. Fallback to Trust Wallet CDN

**Usage:**
```typescript
import { getCryptoIconUrl } from '@/services/CryptoIconService';

const iconUrl = await getCryptoIconUrl('BTC', 32);
// Returns: bundled path, cached URL, or API URL
```

**Cache Management:**
```typescript
// Preload common icons
await preloadCommonIcons();  // BTC, ETH, USDT, etc.

// Clear cache
await clearIconCache();

// Clear expired only
await clearExpiredCache();
```

## Common Tasks

### Adding a New Screen

1. Create file in `app/(tabs)/[tab-name]/screen-name.tsx`
2. Use `useRouter()` for navigation
3. Import from providers as needed
4. Follow existing styling patterns

Example:
```tsx
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useWallet } from '@/providers/WalletProvider';
import Colors from '@/constants/colors';

export default function NewScreen() {
  const router = useRouter();
  const { wallet } = useWallet();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.brand.white }}>
      <Text>New Screen</Text>
    </View>
  );
}
```

### Adding a New Network

1. Edit `config/networks.ts`:
```typescript
export const NETWORKS = {
  'ethereum-mainnet': {
    id: 'ethereum-mainnet',
    name: 'Ethereum',
    blockchain: 'ethereum',
    rpcUrl: 'https://eth.llamarpc.com',
    isTestnet: false,
  },
};
```

2. Create blockchain service in `services/`
3. Update `getBlockchainService()` to support new network

### Accessing Wallet State

```tsx
import { useWallet } from '@/providers/WalletProvider';

function Component() {
  const { wallet, refreshBalance, sendTransaction } = useWallet();

  // Access balance
  const balance = wallet.balance;

  // Access address
  const address = wallet.address;

  // Refresh balance
  await refreshBalance();

  // Send transaction
  const txId = await sendTransaction(toAddress, amount);
}
```

### Accessing Security State

```tsx
import { useSecurity } from '@/providers/SecurityProvider';

function Component() {
  const { isLocked, settings, lock, unlock, setPIN } = useSecurity();

  // Check if locked
  if (isLocked) {
    // Show lock screen
  }

  // Lock wallet
  lock();

  // Unlock with biometric
  await unlock();

  // Set PIN
  await setPIN('123456');
}
```

### Network Switching

```tsx
import { useNetwork } from '@/providers/NetworkProvider';

function Component() {
  const { network, networkId, setNetwork } = useNetwork();

  // Get current network
  console.log(network.name); // "Nile Testnet"

  // Switch network
  setNetwork('tron-mainnet');
}
```

## Brand Guidelines

### Colors (constants/colors.ts)

```typescript
Colors.brand = {
  cherryRed: '#E01D1D',      // Primary brand color
  ink: '#000000',            // Black text
  inkMuted: '#00000088',     // Gray text (88 = 53% opacity)
  white: '#FFFFFF',
  lightPeach: '#FFF3F0',     // Light background
  darkPeach: '#FFE5DD',      // Darker accent
}
```

### Typography

- **Headings**: fontWeight '900', fontSize 20-36
- **Body**: fontWeight '600', fontSize 14-16
- **Labels**: fontWeight '700', fontSize 12, all caps, letterSpacing 1
- **Muted text**: color `Colors.brand.inkMuted`

### UI Patterns

**Cards:**
```tsx
<View style={{
  backgroundColor: Colors.brand.white,
  borderRadius: 16,
  padding: 16,
  shadowColor: '#00000008',
  shadowOpacity: 0.05,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
}}>
```

**Buttons:**
```tsx
<TouchableOpacity style={{
  backgroundColor: Colors.brand.cherryRed,
  borderRadius: 16,
  padding: 16,
  alignItems: 'center',
}}>
  <Text style={{ color: Colors.brand.white, fontWeight: '600' }}>
    Button Text
  </Text>
</TouchableOpacity>
```

## Recent Changes & Features

### November 2024 - Major Updates

**1. Apple App Store Compliance** ✅
- Auto-lock with configurable timeouts
- Lock on background
- PIN fallback authentication
- Dedicated security settings
- Legal pages (privacy, terms, support)
- 95% approval confidence
- See: [APPLE_COMPLIANCE_CHECKLIST.md](APPLE_COMPLIANCE_CHECKLIST.md)

**2. Network Switching Fix** ✅ CRITICAL
- **Problem**: Balance didn't update when switching networks
- **Solution**: Split `useEffect` hooks in WalletProviderV2.tsx
- **Files**: providers/WalletProviderV2.tsx:85-105

**3. Payment Page Balance Fix** ✅
- **Problem**: Showed hardcoded 2000 TRX fallback
- **Solution**: Use actual wallet balance, fallback to 0
- **Files**: app/(tabs)/pay/index.tsx:25-28

**4. Mercuryo On-Ramp Integration** ✅ NEW
- Buy crypto with fiat (credit card, bank transfer)
- Full WebView integration
- Success/cancel detection
- "Buy" button on wallet home
- **Files**: components/MercuryoWidget.tsx, app/(tabs)/(wallet)/index.tsx:183-186
- **Setup**: [MERCURYO_SETUP.md](MERCURYO_SETUP.md)

**5. Smart Crypto Icons** ✅ NEW
- Bundled icons for 15+ major coins
- CoinGecko API integration
- 7-day caching
- Trust Wallet CDN fallback
- **Files**: services/CryptoIconService.ts, components/SmartCryptoIcon.tsx

**6. Dedicated Passcode Screen** ✅
- Set/change/disable PIN
- Requires biometric auth for changes
- Benefits and security tips
- **Files**: app/(tabs)/(wallet)/passcode.tsx

## Known Issues & Workarounds

### 1. Balance Shows 0 on Mainnet (Expected)
**Issue**: When switching to mainnet, balance shows 0
**Cause**: User doesn't have funds on mainnet
**Solution**: This is correct behavior. Test on testnet or use "Buy" to add funds.

### 2. Bundled Icons Require Known Paths
**Issue**: Can't dynamically import SVGs in React Native
**Workaround**: Manual mapping in SmartCryptoIcon.tsx:68-83
**Impact**: New bundled icons require code changes

### 3. WebView Not Loading on Android
**Issue**: Mercuryo widget may not load on Android
**Cause**: Missing permissions or WebView version
**Solution**: Ensure `react-native-webview` is properly configured in app.json

## Testing

### Running the App

```bash
# Start Expo dev server
bun run start

# Start with tunnel (for testing on physical device)
bun run start

# Web version (limited functionality)
bun run start-web

# iOS build
eas build --platform ios --profile development

# Android build
eas build --platform android --profile development
```

### Testing Checklist

**Wallet Functions:**
- [ ] Create new wallet
- [ ] Import wallet from seed
- [ ] Show balance (testnet)
- [ ] Switch to mainnet (balance updates)
- [ ] Send transaction
- [ ] Receive (QR code shows)
- [ ] Transaction history

**Security:**
- [ ] Biometric auth works
- [ ] PIN setup and verification
- [ ] Auto-lock triggers
- [ ] Lock on background works
- [ ] Lock screen shows correct state

**On-Ramp:**
- [ ] Buy button opens Mercuryo
- [ ] Widget loads correctly
- [ ] Address pre-filled
- [ ] Close button works

**Icons:**
- [ ] TRX logo displays
- [ ] Bundled icons load
- [ ] Fallback icons show for unknown tokens
- [ ] Icons cached properly

## Debugging

### Console Logs

Structured logging throughout codebase:
```
[Component] Action description
[WalletProviderV2] Refreshing balance on network: tron-mainnet
[Security] Auto-locking wallet due to inactivity
[Mercuryo] Navigation: https://exchange.mercuryo.io/...
```

### Common Debug Commands

```tsx
// Check wallet state
console.log('[Debug] Wallet:', JSON.stringify(wallet, null, 2));

// Check network
console.log('[Debug] Network:', network.name, networkId);

// Check if locked
console.log('[Debug] Is Locked:', isLocked);

// Check balance source
console.log('[Debug] Balance sources:', {
  balance: wallet.balance,
  tronBalance: wallet.tronBalance,
});
```

### AsyncStorage Inspection

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';

// List all keys
const keys = await AsyncStorage.getAllKeys();
console.log('Storage keys:', keys);

// Get wallet data
const walletData = await AsyncStorage.getItem('wallet');
console.log('Wallet:', JSON.parse(walletData));

// Clear cache
await AsyncStorage.clear();
```

## Security Considerations

### Private Key Storage
- **NEVER** log private keys
- Stored in SecureStore (iOS Keychain, Android Keystore)
- Never sent over network
- Only used for signing transactions locally

### PIN Handling
- Stored as SHA-256 hash
- Never stored in plain text
- Requires biometric auth to change
- 6-digit numeric only

### API Keys
- Mercuryo Widget ID: Not secret (client-side)
- CoinGecko: Free tier, no key required
- ElevenLabs: Stored in env variables

## Environment Variables

Create `.env` file:
```bash
# ElevenLabs API (for Selina voice assistant)
ELEVENLABS_API_KEY=your_key_here

# CoinGecko API (optional, for higher rate limits)
COINGECKO_API_KEY=your_key_here

# Mercuryo Widget ID (required for on-ramp)
MERCURYO_WIDGET_ID=your_widget_id_here
```

## Deployment

### Pre-Submission Checklist

1. **Configure Mercuryo**
   - Sign up and get Widget ID
   - Update MercuryoWidget.tsx:53

2. **Host Legal Pages**
   - Upload privacy.html to heysalad.com/privacy
   - Upload terms.html to heysalad.com/terms
   - Update app.json with URLs

3. **Create App Assets**
   - App icon (1024x1024)
   - Screenshots (6.7" and 5.5" iPhone)
   - App preview video (optional)

4. **Build for TestFlight**
   ```bash
   eas build --platform ios --profile production
   ```

5. **Submit to App Store**
   - Follow: [APPLE_SUBMISSION_READY.md](APPLE_SUBMISSION_READY.md)

## Resources

### Documentation
- [Getting Started](GETTING_STARTED.md) - Setup guide
- [Mercuryo Setup](MERCURYO_SETUP.md) - On-ramp configuration
- [Apple Compliance](APPLE_COMPLIANCE_CHECKLIST.md) - App Store requirements
- [Expo Docs](https://docs.expo.dev/) - Framework documentation
- [TronWeb Docs](https://tronweb.network/) - Blockchain API

### External APIs
- **Mercuryo**: https://mercuryo.io - On-ramp provider
- **CoinGecko**: https://www.coingecko.com/en/api - Crypto data/icons
- **TronGrid**: https://www.trongrid.io/ - TRON node API
- **ElevenLabs**: https://elevenlabs.io - Voice AI

### Support
- **Company Email**: peter@heysalad.io
- **GitHub Issues**: Report bugs and feature requests
- **Expo Forums**: https://forums.expo.dev/

## Agent Guidelines

When assisting with this codebase:

1. **Always check WalletProviderV2** (not WalletProvider) for wallet state
2. **Use network-aware services** via `getBlockchainService(networkId)`
3. **Follow brand colors** from constants/colors.ts
4. **Check existing patterns** before creating new components
5. **Test on both testnet and mainnet** when touching balance logic
6. **Never log sensitive data** (private keys, PINs, seed phrases)
7. **Update this file** when adding major features
8. **Reference line numbers** when discussing code (e.g., "file.tsx:42")
9. **Use proper TypeScript types** - the codebase is fully typed
10. **Consider security implications** - this handles real money

## Quick Reference

**Get Balance:**
```tsx
const { wallet } = useWallet();
const balance = wallet.balance; // In TRX
```

**Send Transaction:**
```tsx
const { sendTransaction } = useWallet();
const txId = await sendTransaction('TReceiver...', 100);
```

**Lock Wallet:**
```tsx
const { lock } = useSecurity();
lock();
```

**Switch Network:**
```tsx
const { setNetwork } = useNetwork();
setNetwork('tron-mainnet');
```

**Open Mercuryo:**
```tsx
const [showMercuryo, setShowMercuryo] = useState(false);
<MercuryoWidget
  visible={showMercuryo}
  onClose={() => setShowMercuryo(false)}
  walletAddress={wallet.address}
  currency="TRX"
  network="TRON"
/>
```

---

**Last Updated**: November 2024
**Version**: 1.0.0
**Status**: Ready for TestFlight submission (pending Mercuryo Widget ID)
