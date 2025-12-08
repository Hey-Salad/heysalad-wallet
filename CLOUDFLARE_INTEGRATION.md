# HeySalad Wallet ↔ PayMe Cloudflare Integration

This document explains how HeySalad Wallet integrates with the existing HeySalad PayMe Cloudflare ecosystem while maintaining Supabase for wallet-specific features.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    HeySalad Wallet                          │
│                  (React Native + Expo)                       │
│                                                              │
│  ┌────────────────┐         ┌──────────────────┐           │
│  │   Supabase     │         │   Cloudflare     │           │
│  │   Provider     │         │   API Client     │           │
│  └────────────────┘         └──────────────────┘           │
│         │                            │                       │
│         │ Profiles                   │ Crypto Onramp        │
│         │ Wallet Data                │ OAuth (Future)       │
│         │ Transactions               │ Card Issuing         │
│         │                            │                       │
└─────────┼────────────────────────────┼──────────────────────┘
          │                            │
          ▼                            ▼
   ┌──────────────┐          ┌─────────────────────┐
   │   Supabase   │          │ Cloudflare Workers  │
   │  PostgreSQL  │          │   (HeySalad PayMe)  │
   │              │          │                     │
   │ • profiles   │          │ • crypto-onramp     │
   │ • wallets    │          │ • heysalad-oauth    │
   │ • txns       │          │ • heysalad-pay      │
   └──────────────┘          │ • heysalad-kyc      │
                             └─────────────────────┘
```

## Integration Points

### 1. Crypto Onramp (Stripe)

**Purpose**: Allow users to buy crypto with fiat currency (USD, GBP, EUR) using Stripe.

**Implementation**:
- **Service**: `services/cloudflareClient.ts`
- **Component**: `components/StripeOnrampWidget.tsx`
- **Worker**: `https://crypto-onramp.heysalad-o.workers.dev`

**Usage Example**:
```typescript
import StripeOnrampWidget from '@/components/StripeOnrampWidget';
import { useWallet } from '@/providers/WalletProvider';

function WalletScreen() {
  const { wallet } = useWallet();
  const [showOnramp, setShowOnramp] = useState(false);

  return (
    <>
      <Button onPress={() => setShowOnramp(true)}>
        Buy Crypto
      </Button>

      <StripeOnrampWidget
        visible={showOnramp}
        onClose={() => setShowOnramp(false)}
        walletAddress={wallet.address}
        currency="usdc"
        network="polygon"
        onSuccess={(sessionId) => {
          console.log('Purchase completed:', sessionId);
          // Refresh wallet balance
        }}
      />
    </>
  );
}
```

**API Methods**:
```typescript
// Create onramp session
const session = await CloudflareAPI.createOnrampSession({
  customerEmail: 'user@example.com',
  customerName: 'John Doe',
  walletAddress: '0x123...',
  destinationCurrency: 'usdc',
  destinationNetwork: 'polygon',
  sourceCurrency: 'usd'
});

// Get session status
const status = await CloudflareAPI.getOnrampSessionStatus(sessionId);

// Get supported currencies & networks
const config = await CloudflareAPI.getOnrampConfig();
```

### 2. Authentication Bridge (Optional - Future)

**Purpose**: Unified authentication across HeySalad Wallet and PayMe apps.

**Current State**:
- HeySalad Wallet uses **Supabase Auth** (OTP via phone/email)
- HeySalad PayMe uses **Cloudflare OAuth Worker** (JWT tokens)

**Future Integration**:
```typescript
// Option 1: Dual Auth (Current)
// Keep both systems separate for now
// Users have different accounts for Wallet vs PayMe

// Option 2: Unified Auth (Future)
// Use heysalad-oauth worker for both apps
const token = await CloudflareAPI.verifyOTP(phone, otp);
// Store token for Cloudflare services
// Also create/link Supabase user
```

### 3. Data Synchronization

**Supabase (Wallet Data)**:
- User profiles
- Wallet addresses (TRON, Polygon, Base)
- Transaction history (crypto)
- Onramp sessions (Stripe)
- Voice payment history

**Cloudflare D1 (PayMe Data)**:
- Card issuing (Stripe/Marqeta)
- Card transactions
- KYC verification status
- Subscription tiers

**Sync Strategy**: Keep separate for now
- No direct data sync needed
- Each system maintains its own data
- Future: Add read-only views if needed

## Environment Setup

### 1. Update `.env` File

Copy from `.env.example` and add:

```bash
# Cloudflare Services
EXPO_PUBLIC_CLOUDFLARE_CRYPTO_ONRAMP_URL=https://crypto-onramp.heysalad-o.workers.dev
EXPO_PUBLIC_CLOUDFLARE_OAUTH_URL=https://oauth.heysalad.app
EXPO_PUBLIC_CLOUDFLARE_PAY_URL=https://heysalad-pay.heysalad-o.workers.dev
EXPO_PUBLIC_CLOUDFLARE_KYC_URL=https://heysalad-kyc.heysalad-o.workers.dev
```

### 2. Install Dependencies (if needed)

All required dependencies are already installed:
- `react-native-webview` - For Stripe onramp UI
- `@react-native-async-storage/async-storage` - For JWT storage
- `lucide-react-native` - For icons

### 3. Update `app.json` (Already Done)

The security fix already allows HTTPS connections to:
- `supabase.co`
- `circle.com`
- `trongrid.io`
- **No additional domains needed** (crypto-onramp uses Stripe's domain)

## Testing

### 1. Test Crypto Onramp

```typescript
// Test in development
import { CloudflareAPI } from '@/services/cloudflareClient';

// Check health
const health = await CloudflareAPI.checkOnrampHealth();
console.log('Onramp status:', health);

// Get config
const config = await CloudflareAPI.getOnrampConfig();
console.log('Supported currencies:', config.data);

// Create test session
const session = await CloudflareAPI.createOnrampSession({
  customerEmail: 'test@heysalad.com',
  walletAddress: 'YOUR_TEST_WALLET_ADDRESS',
  destinationCurrency: 'usdc',
  destinationNetwork: 'polygon',
});
console.log('Session created:', session);
```

### 2. Test Widget Integration

1. Open HeySalad Wallet app
2. Navigate to wallet screen
3. Tap "Buy Crypto" button
4. Verify Stripe onramp modal opens
5. Test with Stripe test card: `4242 4242 4242 4242`
6. Verify success callback fires

## Security Considerations

### 1. API Authentication

**Current Implementation**:
- Crypto onramp endpoints are **public** (no auth required)
- Session IDs are one-time use and expire
- Client secrets are short-lived

**Future Enhancement**:
```typescript
// Add JWT validation to crypto-onramp worker
if (requiresAuth) {
  const token = await CloudflareAPI.getAuthToken();
  // Include in request headers
}
```

### 2. Data Privacy

- **Never log sensitive data**: Card numbers, private keys, full wallet addresses
- **Use logger utility**: Respects `EXPO_PUBLIC_DEBUG_MODE` flag
- **Secure storage**: JWT tokens stored in AsyncStorage (encrypted on iOS)

### 3. CORS Configuration

Crypto-onramp worker already allows:
- `https://heysalad.app`
- `http://localhost:*` (development)
- Add wallet-specific domains if needed

## Troubleshooting

### Issue: Onramp session creation fails

**Check**:
1. Verify Cloudflare worker is deployed: `curl https://crypto-onramp.heysalad-o.workers.dev/health`
2. Check Stripe API key is set in worker secrets
3. Verify wallet address is valid format

**Fix**:
```bash
# Redeploy crypto-onramp worker
cd /Users/chilumbam/heysalad-payme/crypto-onramp
wrangler publish

# Check secrets
wrangler secret list
```

### Issue: WebView not loading

**Check**:
1. `react-native-webview` is installed
2. iOS: Pods are installed (`cd ios && pod install`)
3. Network connectivity

**Fix**:
```bash
# Reinstall dependencies
npm install react-native-webview
cd ios && pod install
```

### Issue: Type errors in TypeScript

**Check**:
1. `cloudflareClient.ts` is in `services/` directory
2. Paths are configured in `tsconfig.json`

**Fix**:
```bash
# Regenerate types
npx expo customize tsconfig.json
```

## Future Enhancements

### 1. Card Integration

Show PayMe cards in wallet:
```typescript
// Read-only display of issued cards
const cards = await CloudflareAPI.getCards();
// Display in wallet UI
```

### 2. Unified Transaction History

Combine crypto and card transactions:
```typescript
// Fetch both sources
const [cryptoTxns, cardTxns] = await Promise.all([
  supabase.from('transactions').select(),
  CloudflareAPI.getCardTransactions()
]);
// Merge and sort by date
```

### 3. Cross-Platform Balance

Show total balance across crypto + card:
```typescript
const totalBalance = cryptoBalance + cardBalance;
```

## API Reference

### CloudflareAPI Methods

#### Crypto Onramp

| Method | Description | Returns |
|--------|-------------|---------|
| `createOnrampSession(params)` | Create Stripe onramp session | `{ sessionId, clientSecret, publishableKey }` |
| `getOnrampSessionStatus(sessionId)` | Get session status | `{ status, amount, currency }` |
| `getOnrampConfig()` | Get supported currencies/networks | `{ supportedCurrencies, supportedNetworks }` |
| `checkOnrampHealth()` | Health check | `{ status: 'ok' }` |

#### Authentication (Future)

| Method | Description | Returns |
|--------|-------------|---------|
| `sendOTP(contact, type)` | Send OTP code | `{ success: true }` |
| `verifyOTP(contact, otp, type)` | Verify OTP and get JWT | `{ token, user }` |
| `validateToken()` | Validate current JWT | `{ valid, user }` |

## Support

For issues related to:
- **Crypto Onramp**: Check `/Users/chilumbam/heysalad-payme/crypto-onramp/`
- **Wallet Integration**: Check this repository
- **Cloudflare Workers**: Check `/Users/chilumbam/heysalad-payme/`

## Related Files

- `services/cloudflareClient.ts` - API client
- `components/StripeOnrampWidget.tsx` - Onramp UI
- `components/MercuryoWidget.tsx` - Alternative onramp (MoonPay)
- `.env.example` - Environment configuration
- `app.json` - App Transport Security settings
