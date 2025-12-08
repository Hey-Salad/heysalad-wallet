# Midnight Network & AWE Network Integration
## HeySalad Wallet - Privacy-First Voice Crypto Wallet

**Author:** Integration Strategy Document
**Date:** December 8, 2025
**Target Hackathons:**
- [Midnight Network Hackathon](https://midnight.network/hackathon) - $5,000 USDC in $NIGHT
- [AWE Network](https://www.awenetwork.ai/) - AI Agent Infrastructure
- **UK AI Agent Hackathon EP3** by ASI Alliance (Currently submitted for TRON)

---

## Executive Summary

Your **HeySalad Wallet** is uniquely positioned for Midnight + AWE integration because you already have:

✅ **Voice-Controlled AI Assistant** ("Selina" with ElevenLabs)
✅ **Biometric Security** (Face ID/Touch ID)
✅ **TRON Integration** (TronWeb 6.0.4, testnet + mainnet)
✅ **React Native Mobile App** (Expo 54, iOS ready)
✅ **Secure Key Storage** (SecureStore, encrypted private keys)
✅ **Multi-Chain Ready** (architecture supports new blockchains)

**Perfect for:**
1. **Midnight Network**: Add private transactions while maintaining voice UX
2. **AWE Network**: Turn Selina into a decentralized AI agent others can pay to use

---

## Part 1: Midnight Network - Private TRON Transactions

### 🎯 Hackathon Challenge Match

**Challenge**: "Build a DApp that leverages ZK circuits to generate proofs for any entity or virtual transaction"

**Our Solution**: Privacy-preserving voice-controlled crypto wallet with selective disclosure

### Problem Statement

**Current Issue:**
- All TRON transactions are public on blockchain
- Voice commands expose transaction patterns
- Recipients can see your balance
- No privacy for salary payments, savings, or sensitive purchases

**Example:**
```
❌ Public: "Send 10,000 TRX to TAddress123..." → Everyone sees amount
✅ Private (Midnight): Zero-knowledge proof of transfer → Amount hidden
```

### Solution Architecture

#### 1. New Service: `services/MidnightService.ts`

Create a Midnight wrapper similar to your existing `TronService.ts`:

```typescript
// services/MidnightService.ts

import { MidnightProvider, ZkProof } from '@midnight-network/sdk-react-native';
import { IBlockchainService } from './BlockchainFactory';

/**
 * Midnight Network service for privacy-preserving transactions
 * Integrates with existing HeySalad Wallet architecture
 */
export class MidnightService implements IBlockchainService {
  private provider: MidnightProvider;
  private readonly networkId: string;

  constructor(networkId: 'midnight-testnet' | 'midnight-mainnet') {
    this.networkId = networkId;
    this.provider = new MidnightProvider({
      networkUrl: this.getNetworkUrl(),
      chainId: networkId === 'midnight-mainnet' ? 1 : 999,
    });
  }

  /**
   * Get balance (public) - standard blockchain query
   */
  async getBalance(address: string): Promise<number> {
    const balance = await this.provider.getBalance(address);
    return parseFloat(balance.formatted);
  }

  /**
   * Send PRIVATE transaction using ZK proof
   * Amount is hidden from public blockchain
   */
  async sendPrivateTransaction(params: {
    from: string;
    to: string;
    amount: number;
    privateKey: string;
    memo?: string;
  }): Promise<{ txHash: string; proofHash: string }> {

    // Generate ZK proof that proves:
    // 1. Sender has sufficient balance
    // 2. Transaction is valid
    // 3. WITHOUT revealing amount to public

    const proof = await this.provider.generateTransferProof({
      from: params.from,
      to: params.to,
      amount: params.amount,
      privateKey: params.privateKey,
      // Private witness (hidden)
      witness: {
        balance: await this.getBalance(params.from),
        amount: params.amount,
        memo: params.memo,
      },
      // Public outputs (visible)
      publicSignals: {
        from: params.from,
        to: params.to,
        isValid: true, // Proves transaction is valid
        timestamp: Date.now(),
      },
    });

    // Submit proof to Midnight Network
    const tx = await this.provider.submitProof(proof);

    return {
      txHash: tx.hash,
      proofHash: proof.hash,
    };
  }

  /**
   * Verify a private transaction proof
   */
  async verifyTransactionProof(proofHash: string): Promise<{
    valid: boolean;
    from: string;
    to: string;
    timestamp: number;
  }> {
    const proof = await this.provider.getProof(proofHash);

    return {
      valid: proof.verified,
      from: proof.publicSignals.from,
      to: proof.publicSignals.to,
      timestamp: proof.publicSignals.timestamp,
    };
  }

  /**
   * Get transaction history (only shows proof metadata, not amounts)
   */
  async getTransactions(address: string): Promise<Transaction[]> {
    const proofs = await this.provider.getProofsForAddress(address);

    return proofs.map(proof => ({
      id: proof.hash,
      from: proof.publicSignals.from,
      to: proof.publicSignals.to,
      amount: 'PRIVATE', // Amount hidden
      timestamp: proof.publicSignals.timestamp,
      status: proof.verified ? 'completed' : 'pending',
      type: 'private_transfer',
    }));
  }

  // ... other IBlockchainService methods
}
```

#### 2. Update Network Configuration

**File: `config/networks.ts`**

Add Midnight networks alongside TRON:

```typescript
export const NETWORKS = {
  // Existing TRON networks
  'tron-testnet': {
    id: 'tron-testnet',
    name: 'Nile Testnet',
    blockchain: 'tron',
    rpcUrl: 'https://nile.trongrid.io',
    isTestnet: true,
  },
  'tron-mainnet': {
    id: 'tron-mainnet',
    name: 'TRON Mainnet',
    blockchain: 'tron',
    rpcUrl: 'https://api.trongrid.io',
    isTestnet: false,
  },

  // NEW: Midnight networks
  'midnight-testnet': {
    id: 'midnight-testnet',
    name: 'Midnight Testnet',
    blockchain: 'midnight',
    rpcUrl: 'https://rpc.testnet.midnight.network',
    isTestnet: true,
    features: ['private_transactions', 'zk_proofs'],
  },
  'midnight-mainnet': {
    id: 'midnight-mainnet',
    name: 'Midnight Mainnet',
    blockchain: 'midnight',
    rpcUrl: 'https://rpc.midnight.network',
    isTestnet: false,
    features: ['private_transactions', 'zk_proofs'],
  },
};
```

#### 3. Update BlockchainFactory

**File: `services/BlockchainFactory.ts`**

Add Midnight service instantiation:

```typescript
import { MidnightService } from './MidnightService';

export function getBlockchainService(networkId: string): IBlockchainService {
  switch (networkId) {
    case 'tron-testnet':
    case 'tron-mainnet':
      return new TronService(networkId);

    // NEW: Midnight support
    case 'midnight-testnet':
    case 'midnight-mainnet':
      return new MidnightService(networkId);

    default:
      throw new Error(`Unsupported network: ${networkId}`);
  }
}
```

#### 4. Add Privacy Toggle to Send Screen

**File: `app/(tabs)/pay/index.tsx`**

Add privacy mode toggle for transactions:

```tsx
import { Switch, View, Text } from 'react-native';
import { useState } from 'react';
import { useNetwork } from '@/providers/NetworkProvider';

export default function PayScreen() {
  const { network } = useNetwork();
  const [privacyMode, setPrivacyMode] = useState(false);

  // Check if current network supports privacy
  const supportsPrivacy = network.features?.includes('private_transactions');

  const handleSend = async () => {
    const service = getBlockchainService(network.id);

    if (privacyMode && 'sendPrivateTransaction' in service) {
      // Send private transaction (Midnight)
      const result = await service.sendPrivateTransaction({
        from: wallet.address,
        to: recipientAddress,
        amount: parseFloat(amount),
        privateKey: wallet.privateKey,
        memo: `Voice payment: "${voiceCommand}"`,
      });

      Alert.alert(
        '🔒 Private Transaction Sent',
        `Proof Hash: ${result.proofHash.slice(0, 10)}...\n\nTransaction amount is hidden from public blockchain.`,
        [{ text: 'OK' }]
      );
    } else {
      // Send public transaction (TRON)
      const txId = await service.sendTransaction({
        from: wallet.address,
        to: recipientAddress,
        amount: parseFloat(amount),
        privateKey: wallet.privateKey,
      });

      Alert.alert('Transaction Sent', `TX: ${txId}`);
    }
  };

  return (
    <View>
      {/* Existing send form */}

      {/* NEW: Privacy Toggle */}
      {supportsPrivacy && (
        <View style={styles.privacyToggle}>
          <View>
            <Text style={styles.privacyLabel}>🔒 Private Transaction</Text>
            <Text style={styles.privacySubtext}>
              Hide amount from public blockchain using Midnight Network
            </Text>
          </View>
          <Switch value={privacyMode} onValueChange={setPrivacyMode} />
        </View>
      )}

      {privacyMode && (
        <View style={styles.privacyNotice}>
          <Text style={styles.privacyNoticeText}>
            ℹ️ Transaction amount will be hidden. Only sender, receiver, and proof hash will be public.
          </Text>
        </View>
      )}
    </View>
  );
}
```

#### 5. Voice Command Integration

**File: `components/SelinaVoiceModal.tsx`**

Add privacy voice commands to Selina:

```tsx
// Example voice commands:
// "Send 10 TRX privately to Alice"
// "Private payment of 50 TRX to TAddress123..."
// "Hide my transaction amount"

function parseVoiceCommand(transcript: string): {
  isPrivate: boolean;
  amount?: number;
  recipient?: string;
} {
  const lowerTranscript = transcript.toLowerCase();

  // Detect privacy keywords
  const isPrivate =
    lowerTranscript.includes('private') ||
    lowerTranscript.includes('privately') ||
    lowerTranscript.includes('hide amount') ||
    lowerTranscript.includes('secret payment');

  // Extract amount
  const amountMatch = transcript.match(/(\d+(?:\.\d+)?)\s*(?:trx|tron)/i);
  const amount = amountMatch ? parseFloat(amountMatch[1]) : undefined;

  // Extract recipient
  const addressMatch = transcript.match(/T[A-Za-z0-9]{33}/);
  const recipient = addressMatch ? addressMatch[0] : undefined;

  return { isPrivate, amount, recipient };
}

// Selina response for private transactions:
async function respondToPrivateTransaction() {
  await speakText(
    "I'll send that privately using Midnight Network. " +
    "Your transaction amount will be hidden from public view, " +
    "but the transfer will still be verified on-chain. " +
    "Please confirm with Face ID."
  );
}
```

#### 6. Transaction History UI

**File: `components/TransactionList.tsx` (create if doesn't exist)**

Show private transactions differently:

```tsx
function TransactionListItem({ transaction }: { transaction: Transaction }) {
  const isPrivate = transaction.type === 'private_transfer';

  return (
    <View style={styles.transactionItem}>
      <View style={styles.transactionIcon}>
        {isPrivate ? (
          <LockIcon size={24} color={Colors.brand.cherryRed} />
        ) : (
          <ArrowUpRight size={24} color={Colors.brand.ink} />
        )}
      </View>

      <View style={styles.transactionDetails}>
        <Text style={styles.transactionType}>
          {isPrivate ? '🔒 Private Transfer' : 'Transfer'}
        </Text>
        <Text style={styles.transactionAddress}>
          To: {transaction.to.slice(0, 8)}...{transaction.to.slice(-6)}
        </Text>
        <Text style={styles.transactionTime}>
          {formatDate(transaction.timestamp)}
        </Text>
      </View>

      <View style={styles.transactionAmount}>
        {isPrivate ? (
          <Text style={styles.amountPrivate}>PRIVATE</Text>
        ) : (
          <Text style={styles.amount}>-{transaction.amount} TRX</Text>
        )}
      </View>
    </View>
  );
}
```

### Midnight ZK Circuit

**Create: `midnight-contracts/PrivateTransfer.compact`**

```compact
// Midnight Compact language circuit
// Proves a valid transfer without revealing amount

export contract PrivateTransfer {
  // Private witness (stays secret)
  witness private {
    senderBalance: Field,
    transferAmount: Field,
    memo: Ledger.Digest,  // Encrypted memo
  }

  // Public signals (visible on-chain)
  witness public {
    senderAddress: Address,
    recipientAddress: Address,
    isValid: Bool,
    timestamp: Field,
    proofId: Ledger.Digest,
  }

  // ZK proof circuit
  circuit prove() {
    // Constraint 1: Sender has sufficient balance
    constrain senderBalance >= transferAmount;

    // Constraint 2: Amount is positive
    constrain transferAmount > 0;

    // Constraint 3: Addresses are valid
    constrain isValidAddress(senderAddress);
    constrain isValidAddress(recipientAddress);

    // Set public outputs
    public.isValid = true;
    public.timestamp = getCurrentTime();
    public.proofId = hash(senderAddress, recipientAddress, transferAmount, timestamp);

    // Generate proof that above constraints are satisfied
    // WITHOUT revealing senderBalance or transferAmount
    return zk_proof();
  }

  // Verify proof on-chain
  circuit verify(proof: Proof): Bool {
    return verifyProof(proof, public);
  }
}
```

### Installation & Dependencies

**Add to `package.json`:**

```json
{
  "dependencies": {
    "@midnight-network/sdk-react-native": "^1.0.0",
    "@midnight-network/compact-compiler": "^1.0.0"
  }
}
```

**Install:**
```bash
cd /Users/chilumbam/heysalad-wallet
npm install @midnight-network/sdk-react-native @midnight-network/compact-compiler
```

### Demo Flow for Hackathon

**Video Script (3 minutes):**

1. **Opening (30s)**
   - "Current crypto wallets expose all transaction details"
   - Show TRON transaction on TronScan - amount is public
   - "What if you could send crypto with VOICE and keep amounts PRIVATE?"

2. **Voice Command (60s)**
   - Open HeySalad Wallet
   - Switch to Midnight Network
   - Say: "Selina, send 100 TRX privately to Alice"
   - Selina responds: "I'll hide the amount using Midnight ZK proofs"
   - Face ID authentication
   - Transaction sent

3. **Privacy Demonstration (60s)**
   - Show transaction on Midnight explorer
   - From: Visible ✓
   - To: Visible ✓
   - Amount: **PRIVATE** ✓
   - Proof Hash: `0x7f9f...` ✓
   - "Only Alice can see she received funds"

4. **Technical Deep Dive (30s)**
   - Show Compact circuit code
   - Explain ZK proof generation
   - "Privacy + Voice Control = Accessible Private Crypto"

---

## Part 2: AWE Network - Decentralized Selina

### 🎯 AWE Network Value Proposition

**What AWE Provides:**
- Decentralized compute for AI agents
- Token incentives for agent operators
- Cross-agent communication
- On-chain reputation

**How HeySalad Wallet Benefits:**
- Monetize Selina voice assistant
- Other apps pay to use your voice AI
- Reduce ElevenLabs API costs via decentralized compute
- Censorship-resistant AI agent

### Current AI Architecture

**Your Existing Setup (from AGENTS.md):**
- **Selina Voice Assistant**: ElevenLabs API integration
- **Voice Commands**: Natural language payment processing
- **TTS**: expo-speech for voice responses
- **Speech Recognition**: Built-in iOS/Android STT

**File: `components/SelinaVoiceModal.tsx`**

### Solution Architecture

#### 1. Register Selina on AWE Network

**Create: `services/AWEAgentService.ts`**

```typescript
import { AWEClient } from '@awe-network/sdk';

/**
 * Register Selina voice assistant as an AWE agent
 * Enables other apps to pay for voice AI services
 */
export class SelinaAWEService {
  private awe: AWEClient;

  constructor(apiKey: string) {
    this.awe = new AWEClient(apiKey);
  }

  /**
   * Register Selina on AWE Network
   */
  async registerSelina(): Promise<{ agentId: string; nftTokenId: string }> {
    const registration = await this.awe.registerAgent({
      name: 'Selina Voice Assistant',
      description: 'AI-powered voice assistant for crypto wallet operations',
      capabilities: [
        'voice_payment_processing',
        'natural_language_commands',
        'transaction_assistance',
        'balance_queries',
        'british_accent_voice',
      ],
      costPerRequest: 0.01, // 0.01 AWE tokens per voice command
      model: 'elevenlabs-british-accent',
      endpoint: 'https://heysalad-selina.workers.dev', // Cloudflare Worker
    });

    return {
      agentId: registration.agentId,
      nftTokenId: registration.nftTokenId,
    };
  }

  /**
   * Process voice command via AWE (decentralized)
   */
  async processVoiceCommand(params: {
    audio: Blob | string; // Audio file or transcript
    userId: string;
    walletAddress: string;
  }): Promise<{
    transcript: string;
    intent: string;
    action?: {
      type: 'send_payment' | 'check_balance' | 'query';
      data: any;
    };
    voiceResponse: string; // Audio URL or text
  }> {

    // Submit request to AWE network
    // Other nodes process the request and get paid
    const result = await this.awe.executeAgent({
      agentId: 'selina-voice-assistant',
      input: {
        audio: params.audio,
        context: {
          userId: params.userId,
          walletAddress: params.walletAddress,
        },
      },
      paymentEscrow: 0.01, // Escrow AWE tokens
    });

    return result.output;
  }
}
```

#### 2. Create Cloudflare Worker for Selina

**New Service: `selina-awe-worker/` (external to mobile app)**

```typescript
// selina-awe-worker/src/index.ts

import { Hono } from 'hono';
import { ElevenLabs } from '@11labs/sdk';

const app = new Hono();

/**
 * AWE-compatible endpoint for Selina voice processing
 * Other apps on AWE network can call this to use Selina
 */
app.post('/api/process-voice', async (c) => {
  const { audio, context } = await c.req.json();

  // 1. Transcribe audio (if provided as audio file)
  const transcript = audio.startsWith('http')
    ? await transcribeAudio(audio)
    : audio; // Already transcribed

  // 2. Parse voice command
  const intent = parseVoiceCommand(transcript);

  // 3. Generate Selina's voice response
  const elevenlabs = new ElevenLabs(c.env.ELEVENLABS_API_KEY);
  const voiceResponse = await elevenlabs.textToSpeech({
    voice_id: 'british_female_voice_id',
    text: generateResponseText(intent),
  });

  // 4. Return structured response
  return c.json({
    transcript,
    intent: intent.type,
    action: intent.action,
    voiceResponse: voiceResponse.audioUrl,
    processingTime: Date.now() - startTime,
  });
});

// Deploy to Cloudflare: npx wrangler deploy
export default app;
```

#### 3. Mobile App Integration

**Update: `components/SelinaVoiceModal.tsx`**

Add toggle between local (ElevenLabs) and decentralized (AWE):

```tsx
import { SelinaAWEService } from '@/services/AWEAgentService';

export function SelinaVoiceModal() {
  const [useAWE, setUseAWE] = useState(false);
  const aweService = new SelinaAWEService(process.env.AWE_API_KEY);

  async function processVoiceCommand(transcript: string) {
    if (useAWE) {
      // Use decentralized AWE network
      const result = await aweService.processVoiceCommand({
        audio: transcript,
        userId: wallet.address,
        walletAddress: wallet.address,
      });

      // Selina responds
      await playAudio(result.voiceResponse);

      // Execute action
      if (result.action?.type === 'send_payment') {
        await sendTransaction(result.action.data);
      }
    } else {
      // Use centralized ElevenLabs (original implementation)
      await processVoiceLocally(transcript);
    }
  }

  return (
    <View>
      {/* Toggle for AWE vs Local */}
      <View style={styles.modeToggle}>
        <Text>Use Decentralized Selina (AWE Network)</Text>
        <Switch value={useAWE} onValueChange={setUseAWE} />
      </View>

      {useAWE && (
        <Text style={styles.notice}>
          ⚡ Using AWE Network - Decentralized AI processing
        </Text>
      )}
    </View>
  );
}
```

#### 4. Monetization Strategy

**Earn Revenue from Selina:**

Other crypto wallet apps pay AWE tokens to use your voice AI:

```typescript
// Example: Another app using Selina via AWE

import { AWEClient } from '@awe-network/sdk';

async function addVoiceToMyWallet() {
  const awe = new AWEClient(MY_API_KEY);

  // Discover Selina agent
  const agents = await awe.discoverAgents({
    capability: 'voice_payment_processing',
    language: 'british_english',
  });

  const selina = agents.find(a => a.name === 'Selina Voice Assistant');

  // Pay to use Selina
  const result = await awe.executeAgent({
    agentId: selina.id,
    input: { audio: userVoiceCommand },
    payment: 0.01, // 0.01 AWE tokens
  });

  // HeySalad earns 0.01 AWE per request
}
```

**Revenue Potential:**
- 1,000 requests/month × 0.01 AWE × $5/AWE = **$50/month**
- 10,000 requests/month = **$500/month**
- Scales with adoption of voice crypto payments

#### 5. Agent Marketplace Integration

**New Screen: `app/agent-marketplace.tsx`**

Show Selina's earnings and stats:

```tsx
export function AgentMarketplaceScreen() {
  const { stats } = useSelinaStats();

  return (
    <ScrollView>
      <View style={styles.card}>
        <Text style={styles.title}>🤖 Selina on AWE Network</Text>

        <View style={styles.stats}>
          <StatItem label="Total Requests" value={stats.totalRequests} />
          <StatItem label="AWE Tokens Earned" value={stats.tokensEarned} />
          <StatItem label="Reputation Score" value={stats.reputation} />
          <StatItem label="Active Users" value={stats.activeUsers} />
        </View>

        <Button onPress={() => withdrawEarnings()}>
          Withdraw {stats.tokensEarned} AWE Tokens
        </Button>
      </View>

      <Text style={styles.sectionTitle}>Other AI Agents</Text>
      {/* List of other agents user can integrate */}
    </ScrollView>
  );
}
```

---

## Part 3: Combined Integration - "Privacy Voice Payments"

### The Killer Feature

**Combine Midnight + AWE + Voice Control:**

1. User says: "Selina, send 1000 TRX privately to Alice for rent"
2. **AWE Network**: Selina processes command on decentralized compute
3. **Midnight Network**: Transaction sent with ZK proof (amount hidden)
4. **Voice Confirmation**: Selina responds: "I've sent the payment privately. Alice will receive it, but the amount is hidden from public view."

**This Creates:**
- 🔒 **Privacy**: Amount hidden via Midnight
- 🌍 **Decentralization**: AI runs on AWE, not ElevenLabs
- 🎙️ **Accessibility**: Voice control for crypto
- 💰 **Monetization**: Earn AWE tokens from other users

### Implementation

**File: `components/PrivacyVoicePayment.tsx`**

```typescript
export async function executePrivacyVoicePayment(params: {
  voiceCommand: string;
  walletAddress: string;
  privateKey: string;
}) {
  // 1. Process voice via AWE (decentralized)
  const awe = new SelinaAWEService(AWE_API_KEY);
  const voiceResult = await awe.processVoiceCommand({
    audio: params.voiceCommand,
    userId: params.walletAddress,
    walletAddress: params.walletAddress,
  });

  if (voiceResult.action?.type !== 'send_payment') {
    throw new Error('Voice command not recognized as payment');
  }

  // 2. Send private transaction via Midnight
  const midnight = new MidnightService('midnight-mainnet');
  const txResult = await midnight.sendPrivateTransaction({
    from: params.walletAddress,
    to: voiceResult.action.data.recipient,
    amount: voiceResult.action.data.amount,
    privateKey: params.privateKey,
    memo: params.voiceCommand, // Original voice command stored privately
  });

  // 3. Selina confirms (voice response from AWE)
  await playAudio(voiceResult.voiceResponse);

  return {
    txHash: txResult.txHash,
    proofHash: txResult.proofHash,
    voiceTranscript: voiceResult.transcript,
  };
}
```

---

## Implementation Roadmap

### Phase 1: Midnight Privacy (Week 1)
- [ ] Install Midnight SDK: `npm install @midnight-network/sdk-react-native`
- [ ] Create `services/MidnightService.ts` (copy from TronService pattern)
- [ ] Add Midnight networks to `config/networks.ts`
- [ ] Update `BlockchainFactory.ts` to support Midnight
- [ ] Add privacy toggle to send screen (`app/(tabs)/pay/index.tsx`)
- [ ] Update transaction list to show private transactions differently
- [ ] Test on Midnight testnet

### Phase 2: Voice + Privacy (Week 1)
- [ ] Update `SelinaVoiceModal.tsx` to detect "private" keywords
- [ ] Add voice confirmation for private transactions
- [ ] Test voice flow: "Send 10 TRX privately to Alice"
- [ ] Record demo video showing voice + privacy

### Phase 3: AWE Network (Week 2)
- [ ] Research AWE SDK availability
- [ ] Create `services/AWEAgentService.ts`
- [ ] Register Selina on AWE Network
- [ ] Create Cloudflare Worker: `selina-awe-worker/`
- [ ] Add AWE toggle to Selina modal
- [ ] Test decentralized voice processing

### Phase 4: Marketplace & Monetization (Week 2)
- [ ] Create `app/agent-marketplace.tsx` screen
- [ ] Show Selina's earnings and stats
- [ ] Add withdraw AWE tokens functionality
- [ ] Integrate with other AWE agents (optional)

### Phase 5: Hackathon Submission (Week 3)
- [ ] Record 3-minute demo video
- [ ] Write README for Midnight integration
- [ ] Deploy to TestFlight for iOS testing
- [ ] Submit to Midnight hackathon
- [ ] Submit to AWE (if they have process)

**Total Time: ~3 weeks**

---

## Technical Requirements

### Dependencies to Add

```bash
# Midnight Network
npm install @midnight-network/sdk-react-native @midnight-network/compact-compiler

# AWE Network (check their actual package name)
npm install @awe-network/sdk @awe-network/react-native

# Cloudflare Worker (for Selina backend)
npm install -g wrangler
cd selina-awe-worker && npm init -y
npm install hono @11labs/sdk
```

### Environment Variables

**Add to `.env`:**

```bash
# Midnight Network
MIDNIGHT_RPC_URL=https://rpc.testnet.midnight.network
MIDNIGHT_API_KEY=xxx

# AWE Network
AWE_API_KEY=xxx
AWE_NETWORK_URL=https://api.awe.network
SELINA_AGENT_ID=xxx

# Existing (keep)
EXPO_PUBLIC_ELEVENLABS_API_KEY=xxx
EXPO_PUBLIC_TRONGRID_API_KEY=xxx
```

### Native Rebuild Required

Since you're adding new native modules, rebuild the app:

```bash
cd /Users/chilumbam/heysalad-wallet

# Clean previous build
rm -rf ios/build android/build

# Rebuild iOS
npx expo prebuild --clean
npx expo run:ios

# Or use EAS
eas build --platform ios --profile development
```

---

## Competitive Advantages for Hackathons

### Why This Wins

1. **First Voice-Controlled Private Crypto Wallet**
   - No competitor combines voice + ZK privacy
   - Extremely accessible for non-technical users
   - "Say it, don't type it" UX

2. **Already Production-Ready**
   - Not a hackathon toy - real iOS app
   - Biometric security implemented
   - Voice AI working (Selina)
   - TRON integration battle-tested

3. **Triple Integration**
   - **Midnight**: ZK privacy proofs
   - **AWE**: Decentralized AI compute
   - **TRON**: Working blockchain layer
   - Most hackathons only show one integration

4. **Monetization Built-In**
   - Other apps can pay to use Selina
   - Clear revenue model via AWE tokens
   - Sustainable long-term

5. **Open Source + Trademark**
   - Apache 2.0 license ✓
   - HeySalad® UK trademark ✓
   - Professional company backing ✓

---

## Demo Video Script (3 minutes)

### Act 1: Problem (30s)
- Show traditional crypto wallet (MetaMask, Trust Wallet)
- Type long address, type amount, confirm
- "Crypto is too complex. And all transactions are public."
- Show TronScan with visible transaction amounts

### Act 2: Voice Control (60s)
- Open HeySalad Wallet
- Say: "Selina, send 50 TRX to Alice"
- Selina responds in British accent
- Face ID confirms
- Transaction sent instantly
- "Voice makes crypto accessible"

### Act 3: Privacy with Midnight (60s)
- Switch to Midnight Network
- Say: "Selina, send 1000 TRX privately to Bob"
- Selina: "I'll hide the amount using zero-knowledge proofs"
- Show transaction on Midnight explorer:
  - From: Visible ✓
  - To: Visible ✓
  - Amount: **PRIVATE** ✓
- "Privacy without compromising verifiability"

### Act 4: Decentralization with AWE (30s)
- Show AWE toggle in settings
- "Selina now runs on decentralized compute"
- Show earnings dashboard
- "Other apps pay AWE tokens to use our voice AI"
- "Crypto needs to be: Private. Voice-Controlled. Decentralized."
- HeySalad® logo

---

## Budget & ROI

### Development Costs
- Midnight testnet tokens: **Free**
- AWE testnet tokens: **Free**
- ElevenLabs API: **$10 for testing**
- Cloudflare Workers: **$0 (free tier)**
- **Total: $10**

### Prize Money
- Midnight: **$5,000 USDC in $NIGHT**
- AWE: **TBD (check their grants)**
- TRON: **Already submitted**
- **Potential Total: $5,000+**

### Long-Term Revenue
- AWE tokens from voice AI: **$50-500/month**
- Premium privacy tier: **$5/month per user**

**ROI: 500x+ 🚀**

---

## Next Steps (Today)

1. **Read Midnight Docs**
   - https://midnight.network/hackathon
   - https://midnight.network/blog/everything-you-need-to-know-for-the-2025-midnight-summit-hackathon

2. **Research AWE Network**
   - https://www.awenetwork.ai/
   - Find developer documentation
   - Check Discord/Telegram

3. **Test Current Voice System**
   - Ensure Selina works perfectly
   - Document voice command patterns
   - Record baseline demo

4. **Plan Integration**
   - Which to build first: Midnight or AWE?
   - My recommendation: **Midnight** (clear $5k prize, solves privacy problem)

---

## Questions to Answer

1. Does Midnight SDK work with React Native / Expo?
2. Is AWE Network production-ready?
3. Should we keep TRON or switch entirely to Midnight?
   - **Recommendation**: Support BOTH (multi-chain architecture already exists)
4. What's the Midnight hackathon deadline?

---

## Conclusion

Your **HeySalad Wallet** is perfectly positioned for this integration:

✅ **Voice AI** (Selina) already working
✅ **Security** (biometric) already implemented
✅ **Mobile app** (iOS) already built
✅ **Multi-chain architecture** ready for new networks

**Just add:**
- ⭐ Midnight Network (privacy layer)
- ⭐ AWE Network (decentralized AI)

**Result:**
- 🏆 Win $5,000+ in hackathon prizes
- 🔒 First privacy-focused voice crypto wallet
- 💰 Monetize Selina via AWE tokens
- 🌍 Fully decentralized stack

**Recommendation:** Start with **Midnight** this week. Voice + Privacy = killer demo.

Want me to help you:
- Write the MidnightService.ts implementation?
- Create the Compact ZK circuit?
- Update the voice command parser?
- Build the demo video?

Let's ship this! 🚀
