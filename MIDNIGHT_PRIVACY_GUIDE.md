# Midnight Network Privacy Integration

HeySalad Wallet now supports **private transactions** using Midnight Network's zero-knowledge proofs. This allows you to send cryptocurrency while hiding the transaction amount from public view.

## What is Midnight Network?

Midnight is a privacy-preserving blockchain that uses zero-knowledge (ZK) proofs to enable confidential transactions. Unlike traditional blockchains where all transaction details are public, Midnight allows you to:

- **Hide transaction amounts** - Only sender and recipient know the actual amount
- **Prove validity without revealing data** - ZK proofs verify the transaction is valid without exposing sensitive information
- **Maintain regulatory compliance** - Selective disclosure allows proving transaction legitimacy when needed

## How to Use Privacy Mode

### 1. Switch to Midnight Network

1. Open the wallet and tap the network selector (top of screen)
2. Select **Midnight Testnet** (for testing) or **Midnight Mainnet** (for real transactions)
3. Your balance will update to show your DUST tokens

### 2. Enable Privacy Mode

1. Go to the **Pay** tab
2. Choose **Manual Entry** or **Audio Pay**
3. Toggle on **Private Transaction** switch
4. Enter recipient address and amount
5. Review the transaction - amount will show as "🔒 HIDDEN"
6. Confirm with Face ID/biometric

### 3. Voice Commands for Privacy

You can also use voice commands with Selina:

- "Send 10 DUST **privately** to [address]"
- "Make a **private** payment of 50 DUST"
- "**Hide amount** and send 25 DUST to [address]"
- "**Secret payment** of 100 DUST"

Keywords that trigger privacy mode:
- `privately`, `private`, `hide amount`, `secret payment`
- `hidden`, `confidential`, `anonymous`
- `zk`, `zero knowledge`, `midnight`, `privacy mode`

## Technical Details

### How ZK Proofs Work

When you send a private transaction:

1. **Proof Generation**: A ZK proof is generated that proves:
   - You have sufficient balance
   - The amount is positive
   - The transaction is valid
   
2. **Public Data**: Only these are visible on-chain:
   - Sender address
   - Recipient address
   - Timestamp
   - Proof hash (for verification)

3. **Hidden Data**: These remain private:
   - Transaction amount
   - Your total balance

### Transaction Flow

```
┌─────────────────┐
│  User Input     │
│  Amount: 100    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  ZK Proof Gen   │
│  Proves: valid  │
│  Hides: amount  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Blockchain     │
│  Shows: PRIVATE │
│  Proof: ✓       │
└─────────────────┘
```

### Proof Verification

After sending a private transaction, you receive:
- **Transaction Hash**: Identifies the transaction on-chain
- **Proof Hash**: Cryptographic proof that can be verified

Anyone can verify the proof is valid without learning the amount.

## Testing on Testnet

1. Switch to **Midnight Testnet**
2. Get test DUST tokens from the faucet (coming soon)
3. Send a private transaction
4. Check the explorer - amount shows as "PRIVATE"

## Security Considerations

- **Private keys never leave your device** - ZK proofs are generated locally
- **Face ID required** - All transactions require biometric authentication
- **Proof verification** - Recipients can verify transaction validity
- **No trusted setup** - Midnight uses transparent ZK proofs

## Supported Networks

| Network | Token | Privacy | Status |
|---------|-------|---------|--------|
| Midnight Testnet | tDUST | ✅ ZK Proofs | Active |
| Midnight Mainnet | DUST | ✅ ZK Proofs | Active |
| TRON Mainnet | TRX | ❌ Public | Active |
| TRON Testnet | TRX | ❌ Public | Active |

## Example Voice Commands

```
"Send 50 DUST privately to midnight1abc..."
→ Selina: "I'll send that privately using Midnight Network. 
   Your transaction amount will be hidden from public view."

"What's my balance?"
→ Selina: "Your balance is 250 DUST on Midnight Network."

"Can I hide my transaction amount?"
→ Selina: "Absolutely! Enable Privacy Mode to use Midnight 
   Network's zero-knowledge proofs. Your amount will be 
   hidden from public view."
```

## Troubleshooting

### "Private transactions not supported"
- Make sure you're on Midnight Network (testnet or mainnet)
- Privacy mode only works with Midnight, not TRON

### "Proof generation failed"
- Check your internet connection
- Ensure you have sufficient balance
- Try again in a few moments

### "Invalid Midnight address"
- Midnight addresses start with `midnight1` (mainnet) or `test1` (testnet)
- Addresses are case-insensitive

## Resources

- [Midnight Network Docs](https://docs.midnight.network)
- [ZK Proof Explainer](https://docs.midnight.network/learn/zk-proofs)
- [HeySalad Support](mailto:peter@heysalad.io)

---

*Privacy is a feature, not a bug.* 🔒
