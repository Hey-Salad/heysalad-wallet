# Circle Passkey Wallet Integration Guide

This guide shows how to integrate Circle SDK passkey wallets into HeySalad Wallet (React Native), based on the working implementation in heysalad-cash (Next.js).

## Overview

**Current Implementation** (heysalad-wallet):
- Local TRON wallet generation using `CryptoService`
- Private key stored in device secure storage
- No passkey/biometric authentication
- Single chain support (TRON)

**Target Implementation** (like heysalad-cash):
- Circle SDK smart contract wallets
- Passkey authentication with Face ID/Touch ID
- Multi-chain support (Polygon, Base, Arc)
- Credential stored in Supabase
- Gasless transactions via Circle paymaster

## Architecture Comparison

### heysalad-cash (Next.js) Flow:
```
1. User completes profile onboarding
2. PasskeySetup component shows:
   - "Set up with passkey" button
   - "Skip for now" button (allows bypass)
3. On setup:
   - Call toWebAuthnCredential(mode: Register)
   - Create toWebAuthnAccount from credential
   - Create toCircleSmartAccount
   - Get wallet address
   - Store credential in Supabase via API
4. Redirect to dashboard
5. Web3Provider initializes from stored credential
```

### heysalad-wallet (React Native) Target Flow:
```
1. User completes profile onboarding
2. Wallet onboarding screen shows:
   - "Create with Face ID/Touch ID" button
   - "Skip for now" button (create standard TRON wallet)
3. On passkey setup:
   - Call Circle SDK createPasskey()
   - Get smart account address
   - Store credential in Supabase
   - Store address in WalletProvider
4. Auto-redirect to main app
5. WalletProvider loads credential on startup
```

## Key Implementation Files from heysalad-cash

### 1. PasskeySetup Component
**File**: `/components/passkey-setup.tsx`

**Key Functions**:
```typescript
// Create passkey credential
const credential = await toWebAuthnCredential({
    transport: passkeyTransport,
    mode: WebAuthnMode.Register,
    username,
});

// Create WebAuthn account
const webAuthnAccount = toWebAuthnAccount({ credential });

// Create Circle smart account
const circleAccount = await toCircleSmartAccount({
    client: publicClient,
    owner: webAuthnAccount,
});

// Get the actual address
const circleAddress = circleAccount.address.toLowerCase();

// Store in database via API
await fetch('/api/setup-wallets', {
    method: 'POST',
    body: JSON.stringify({
        credential: JSON.stringify(credential),
        circleAddress
    }),
});
```

**Important**: Has "Skip for now" option that allows users to bypass passkey setup

### 2. Web3Provider
**File**: `/components/web3-provider.tsx`

**Initialization**:
```typescript
// On mount, load credential from database
const credentialData = await loadCredential();

if (credentialData) {
    // Initialize all chains with the credential
    await initializeWeb3ForAllChains(credentialData);
}
```

**Multi-chain initialization**:
```typescript
const initializeChain = async (chainType, credentialData) => {
    // Create WebAuthn account
    const webAuthnAccount = toWebAuthnAccount({ credential: credentialData });

    // Create Circle smart account
    const circleAccount = await toCircleSmartAccount({
        client: publicClient,
        owner: webAuthnAccount,
    });

    // Create bundler client for transactions
    const bundlerClient = createBundlerClient({
        account: circleAccount,
        chain: config.chain,
        transport: modularTransport,
    });

    return {
        smartAccount: circleAccount,
        address: circleAccount.address,
        bundlerClient,
        publicClient
    };
};
```

## React Native Adaptations Required

### 1. Install Circle SDK for React Native
```bash
bun add @circle-fin/modular-wallets-core
bun add viem
```

### 2. Create CircleWalletProvider
**New File**: `providers/CircleWalletProvider.tsx`

```typescript
import {
    WebAuthnMode,
    toPasskeyTransport,
    toWebAuthnCredential,
    toCircleSmartAccount
} from '@circle-fin/modular-wallets-core';
import { toWebAuthnAccount } from 'viem/account-abstraction';

export function CircleWalletProvider({ children }) {
    const createPasskeyWallet = async (username: string) => {
        // 1. Create passkey transport
        const passkeyTransport = toPasskeyTransport(
            process.env.EXPO_PUBLIC_CIRCLE_CLIENT_URL,
            process.env.EXPO_PUBLIC_CIRCLE_CLIENT_KEY
        );

        // 2. Register passkey
        const credential = await toWebAuthnCredential({
            transport: passkeyTransport,
            mode: WebAuthnMode.Register,
            username,
        });

        // 3. Create WebAuthn account
        const webAuthnAccount = toWebAuthnAccount({ credential });

        // 4. Create Circle smart account
        const circleAccount = await toCircleSmartAccount({
            client: publicClient,
            owner: webAuthnAccount,
        });

        // 5. Get address
        const address = circleAccount.address.toLowerCase();

        // 6. Store in Supabase
        await supabase.from('wallets').insert({
            profile_id: user.id,
            wallet_address: address,
            wallet_type: 'circle_passkey',
            passkey_credential: JSON.stringify(credential),
            is_primary: true,
        });

        return { address, credential };
    };

    // ... rest of provider
}
```

### 3. Update WalletSetup Component
**File**: `components/WalletSetup.tsx`

Add Circle passkey option:

```typescript
const renderMethod = () => (
    <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Set Up Your Wallet</Text>

        <View style={styles.methodContainer}>
            {/* Circle Passkey Option (RECOMMENDED) */}
            <View style={styles.methodCard}>
                <FaceIdIcon />
                <Text style={styles.methodTitle}>Passkey Wallet (Recommended)</Text>
                <Text style={styles.methodDescription}>
                    Secure smart contract wallet with Face ID/Touch ID. Supports gasless transactions.
                </Text>
                <HSButton
                    title="Set up with passkey"
                    onPress={() => setStep("passkey")}
                    variant="primary"
                />
            </View>

            {/* TRON Wallet Option */}
            <View style={styles.methodCard}>
                <WalletIcon />
                <Text style={styles.methodTitle}>TRON Wallet</Text>
                <Text style={styles.methodDescription}>
                    Standard TRON wallet with private key. You control your keys.
                </Text>
                <HSButton
                    title="Create TRON Wallet"
                    onPress={() => setStep("create")}
                    variant="secondary"
                />
            </View>
        </View>

        {/* Skip Option */}
        <Button
            variant="ghost"
            onPress={handleSkip}
        >
            Skip for now
        </Button>
    </View>
);
```

### 4. Update Supabase Wallets Table

Add passkey credential storage:

```sql
ALTER TABLE wallets
ADD COLUMN passkey_credential TEXT,
ADD COLUMN wallet_provider TEXT CHECK (wallet_provider IN ('tron_local', 'circle_passkey'));

-- Update existing wallets
UPDATE wallets SET wallet_provider = 'tron_local' WHERE wallet_provider IS NULL;
```

## Environment Variables

Add to `.env`:

```env
# Circle SDK (already present)
EXPO_PUBLIC_CIRCLE_API_KEY=LIVE_API_KEY:fac2a126d48e03bca24ac0547b4e813b:629cdc867a0dc988a4b4cac0359cc109
EXPO_PUBLIC_CIRCLE_CLIENT_URL=https://modular-sdk.circle.com/v1/rpc/w3s/buidl
EXPO_PUBLIC_CIRCLE_CLIENT_KEY=LIVE_CLIENT_KEY:7485df15c5bb4a01ef8a71c7c9191b0e:caaf21320fdfb680b6b029ceec78a513
```

## Testing Plan

1. **Test Passkey Creation**:
   - Go through onboarding
   - Select "Set up with passkey"
   - Complete Face ID prompt
   - Verify wallet address is stored in Supabase

2. **Test Wallet Loading**:
   - Close app completely
   - Reopen app
   - Verify wallet loads from stored credential
   - Verify balance displays correctly

3. **Test Skip Flow**:
   - Go through onboarding
   - Click "Skip for now"
   - Verify traditional TRON wallet is created instead

4. **Test Transactions**:
   - Send test transaction
   - Verify Face ID prompt appears
   - Verify transaction succeeds
   - Verify balance updates

## Migration Strategy

### Phase 1: Add Circle Support (No Breaking Changes)
1. Install Circle SDK
2. Add CircleWalletProvider alongside existing WalletProvider
3. Update WalletSetup to show both options
4. Store wallet type in database
5. Test with new users only

### Phase 2: Migrate Existing Users (Optional)
1. Add "Upgrade to Passkey" option in settings
2. Allow users to create Circle wallet while keeping TRON wallet
3. Support both wallet types simultaneously

### Phase 3: Default to Passkey (Future)
1. Make passkey the default/recommended option
2. Keep TRON wallet as fallback
3. Consider deprecating TRON wallet for new users

## Key Differences: Web vs React Native

| Feature | heysalad-cash (Web) | heysalad-wallet (RN) |
|---------|-------------------|---------------------|
| Passkey API | Browser WebAuthn | Expo Secure Store + Circle SDK |
| Storage | Supabase via fetch API | Supabase via supabase-js |
| Biometrics | Browser Face ID/Touch ID | Expo LocalAuthentication |
| Multi-chain | Polygon, Base, Arc | Start with Arc, add others later |
| Navigation | Next.js router | Expo Router |
| State | React Context | React Context + AsyncStorage |

## Benefits of Circle Passkey Integration

1. **Better UX**: Face ID/Touch ID instead of managing private keys
2. **More Secure**: Keys never leave device, stored in secure enclave
3. **Gasless Transactions**: Circle paymaster covers gas fees
4. **Multi-chain**: Easy to add Polygon, Base support
5. **Smart Contract Features**: Account abstraction enables advanced features
6. **No Key Management**: Users don't need to backup/restore private keys

## Recommendation

Based on heysalad-cash's success:

1. **Keep the "Skip for now" option** - Don't force passkey on users
2. **Default to passkey** - Make it the primary/recommended option
3. **Support both wallet types** - Let users choose their security model
4. **Store both in Supabase** - Use wallets table for both types
5. **Use same UX patterns** - Follow heysalad-cash's proven flow

This gives users choice while encouraging the more secure passkey approach.
