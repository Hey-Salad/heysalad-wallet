# Kiro AI Prompt: Midnight Network Privacy Integration

Copy and paste this prompt into Kiro to build the Midnight Network privacy integration for HeySalad Wallet.

---

## 🎯 PROMPT FOR KIRO

```
I need you to integrate Midnight Network's privacy-preserving ZK proofs into my HeySalad Wallet React Native app to enable private voice-controlled cryptocurrency transactions.

CONTEXT:
- This is a working React Native/Expo mobile wallet app (iOS)
- Already has: TRON blockchain integration, Selina voice assistant (ElevenLabs), Face ID security
- Architecture: Multi-chain design with BlockchainFactory pattern
- Location: /Users/chilumbam/heysalad-wallet

GOAL:
Add Midnight Network support so users can send crypto transactions where the AMOUNT is hidden from public blockchain using zero-knowledge proofs, while maintaining voice control and Face ID security.

TECHNICAL REQUIREMENTS:

1. CREATE NEW SERVICE: services/MidnightService.ts
   - Implement IBlockchainService interface (same as TronService.ts)
   - Methods needed:
     * getBalance(address: string): Promise<number>
     * sendPrivateTransaction({ from, to, amount, privateKey }): Promise<{ txHash, proofHash }>
     * verifyTransactionProof(proofHash): Promise<{ valid, from, to, timestamp }>
     * getTransactions(address): Promise<Transaction[]> // Show "PRIVATE" for amounts
   - Use @midnight-network/sdk-react-native package
   - Network-aware: support both midnight-testnet and midnight-mainnet

2. UPDATE config/networks.ts
   - Add two new networks:
     * midnight-testnet (rpcUrl: https://rpc.testnet.midnight.network)
     * midnight-mainnet (rpcUrl: https://rpc.midnight.network)
   - Add features: ['private_transactions', 'zk_proofs']

3. UPDATE services/BlockchainFactory.ts
   - Import MidnightService
   - Add case for 'midnight-testnet' and 'midnight-mainnet' in getBlockchainService()
   - Return new MidnightService(networkId)

4. UPDATE app/(tabs)/pay/index.tsx (Send Screen)
   - Add privacy mode toggle (Switch component)
   - Only show toggle if network.features includes 'private_transactions'
   - When privacyMode is true:
     * Check if service has sendPrivateTransaction method
     * Call service.sendPrivateTransaction() instead of sendTransaction()
     * Show success alert with proofHash
   - Add privacy notice text when toggle is on
   - Style: Follow existing Colors.brand.cherryRed theme

5. UPDATE components/SelinaVoiceModal.tsx (Voice Assistant)
   - Add function parseVoiceCommand() to detect privacy keywords:
     * "privately", "private", "hide amount", "secret payment"
   - If privacy keywords detected, set privacyMode = true
   - Add Selina voice response for private transactions:
     * "I'll send that privately using Midnight Network. Your transaction amount will be hidden from public view."

6. CREATE/UPDATE Transaction List Component
   - Check if transaction.type === 'private_transfer'
   - Show lock icon (🔒) instead of arrow for private transactions
   - Display "PRIVATE" instead of amount
   - Add visual indicator that amount is hidden

7. ADD DEPENDENCIES to package.json:
   - "@midnight-network/sdk-react-native": "^1.0.0"
   - "@midnight-network/compact-compiler": "^1.0.0"

8. CREATE ZK CIRCUIT (if needed): midnight-contracts/PrivateTransfer.compact
   - Write Midnight Compact language circuit
   - Proves: sender has sufficient balance, amount is positive
   - Public outputs: senderAddress, recipientAddress, isValid, timestamp
   - Private witness: senderBalance, transferAmount

ARCHITECTURE PATTERN TO FOLLOW:
- Look at services/TronService.ts as reference for blockchain service pattern
- Look at services/adapters/TronServiceAdapter.ts for adapter pattern
- Follow existing provider usage: useNetwork(), useWallet()
- Maintain TypeScript types in types/ folder
- Use existing Colors.brand constants for styling

CONSTRAINTS:
- Must work with existing Expo 54 / React Native 0.81.5 setup
- Must maintain Face ID authentication flow
- Must be compatible with existing voice command system
- Network switching must work (user can switch between TRON and Midnight)
- Balance should update when switching networks (already implemented in WalletProviderV2)

TESTING:
- Should be testable on Midnight testnet first
- Need to show proof-of-concept: send transaction, verify amount is hidden
- Voice command "Send 10 TRX privately to [address]" should work

DELIVERABLES:
1. All new/modified files created
2. Dependencies added to package.json
3. Basic README section explaining how to test privacy mode
4. Example voice commands that trigger privacy mode

Please implement this step-by-step, testing each component before moving to the next. Start with MidnightService.ts and network configuration, then move to UI components.
```

---

## 📋 CHECKLIST FOR YOU

Before running Kiro, make sure:
- [ ] You have Midnight Network API keys/access
- [ ] Your `.env` file is ready for new keys
- [ ] You've read https://midnight.network/hackathon docs
- [ ] You have testnet tokens if needed
- [ ] Your app runs successfully now (test with `npm run start`)

## 🔧 AFTER KIRO COMPLETES

Run these commands:

```bash
cd /Users/chilumbam/heysalad-wallet

# Install new dependencies
npm install

# Test that it compiles
npx expo start

# If native modules were added, rebuild:
npx expo prebuild --clean
npx expo run:ios
```

## 🧪 MANUAL TESTING STEPS

1. **Start app** → Should load without errors
2. **Switch to Midnight Testnet** → Balance should load (or show 0)
3. **Open Send screen** → Privacy toggle should appear
4. **Enable privacy toggle** → Notice text should show
5. **Try voice command** → "Send 1 TRX privately to [address]"
6. **Verify transaction** → Check Midnight explorer, amount should be "PRIVATE"

## ⚠️ TROUBLESHOOTING

If Kiro gets stuck or makes errors:

**Error: "Cannot find package @midnight-network/sdk-react-native"**
```
Tell Kiro: "The Midnight SDK might not be published to npm yet. Please create a mock implementation of MidnightService that follows the same interface pattern as TronService, with console.log statements showing where real Midnight SDK calls would go. Add TODO comments for actual integration."
```

**Error: "Type errors in BlockchainFactory"**
```
Tell Kiro: "Fix the TypeScript types. MidnightService must implement IBlockchainService interface. Check services/TronService.ts for the correct interface signature."
```

**Error: "Component crashes when switching to Midnight"**
```
Tell Kiro: "Add proper error handling in WalletProviderV2.tsx. When network is Midnight and balance fetch fails, fallback to 0 and log the error. Don't crash the app."
```

## 🎯 EXPECTED RESULT

After Kiro completes, you should have:

✅ New Midnight Network option in network switcher
✅ Privacy toggle on send screen (only shows for Midnight)
✅ Voice commands work with "privately" keyword
✅ Transaction list shows lock icon for private transfers
✅ App still works with existing TRON functionality

## 📞 IF YOU NEED HELP

If Kiro struggles with specific parts, you can break the prompt into smaller chunks:

**Chunk 1: Basic Service**
```
Create services/MidnightService.ts that implements IBlockchainService interface.
Follow the pattern in services/TronService.ts. Use mock data for now.
```

**Chunk 2: Network Config**
```
Update config/networks.ts and services/BlockchainFactory.ts to add Midnight
networks. Make sure network switcher shows Midnight options.
```

**Chunk 3: UI Components**
```
Add privacy toggle to app/(tabs)/pay/index.tsx. Update transaction list to
show private transactions differently. Follow existing brand colors.
```

---

## 🚀 ALTERNATIVE: Manual Implementation

If Kiro can't do it, I can help you manually. Just ask:

"Claude, write the complete MidnightService.ts file for me"
"Claude, show me the exact changes needed in BlockchainFactory.ts"
"Claude, write the privacy toggle component code"

I'll give you copy-paste ready code for each file.

---

**Good luck! This will be an impressive demo for the Midnight hackathon. 🌙**
