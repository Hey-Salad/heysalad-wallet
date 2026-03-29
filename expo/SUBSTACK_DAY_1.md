# Day 1 of Building HeySalad: From Hackathon Winner to e-Revolutionary

**November 8, 2025**

I'm writing this at 2 AM in my apartment, still buzzing from yesterday's announcement: **HeySalad Wallet won $1,200 in the UK AI Agent Hackathon**. But more importantly, I'm writing to share something bigger - a journey that started with a simple question:

> *"What if paying at restaurants was as easy as having a conversation?"*

## 🏆 The Win That Changes Everything

Twenty-four hours ago, I submitted HeySalad Wallet - an AI-powered voice cryptocurrency wallet - to the UK AI Agent Hackathon. The judges saw something special in our vision: a wallet where you can literally *speak* your transactions into existence.

"Send 20 TRX to Alice for lunch."

That's it. No copying addresses. No worrying about decimal places. Just natural language, powered by AI, secured by biometrics.

The $1,200 prize isn't just validation - it's fuel. Fuel to build something that could change how millions of people interact with money.

## 🇪🇪 Building as an e-Revolutionary

Here's where it gets interesting: HeySalad isn't being built in Silicon Valley or London. It's being built through **Estonian e-Residency** - a digital business framework that lets entrepreneurs like me run a legitimate EU company from anywhere in the world.

**HeySalad OÜ** (registration 17327633) is proudly based in Tallinn, Estonia, and I'm thrilled to announce we've been nominated for the **[e-Revolutionaries 2025](https://www.xolo.io/zz-en/e-revolutionaries-2025)** competition.

### What is e-Revolutionaries?

It's an online competition celebrating visionary businesses built on Estonian e-Residency. Winners receive:
- 🎁 1-year Xolo Leap subscription (worth €3,108)
- 🏅 e-Revolutionaries 2025 badge
- 📣 International exposure
- ✈️ Special winner: Return flight to Estonia + conference ticket

**The voting is open now**, and I need your help. You can vote once per day, and your support would mean the world to this small team dreaming big.

👉 **[Vote for HeySalad in e-Revolutionaries 2025](https://www.xolo.io/zz-en/e-revolutionaries-2025)** (Link will be updated once nomination is live)

## 💡 The Restaurant Revolution

Let me tell you what we're *really* building.

HeySalad isn't just another crypto wallet. We're building the **future of restaurant payments**.

Imagine this:
1. You finish dinner at your favorite restaurant
2. A QR code sits on your table
3. You open HeySalad Wallet and say: "Pay 50 pounds for dinner"
4. Face ID confirms
5. Transaction complete in 2 seconds
6. Restaurant receives payment instantly (in their preferred currency)

**No cards. No fumbling with payment terminals. No waiting for the bill.**

### Why Restaurants Will Love This

Current credit card processing costs restaurants **2.9% + £0.20 per transaction**. With HeySalad + crypto on-ramping, we can reduce that to **1.5-2.2%**.

For a restaurant doing £100,000/month in revenue, that's **£1,500-2,000 saved every single month**.

And customers? They get:
- ⚡ Instant payments (no waiting for the bill)
- 🎤 Voice-controlled transactions
- 🔒 Biometric security
- 💰 Potential cashback rewards in crypto
- 🌱 Lower carbon footprint (Stripe Climate integration)

## 🚀 What I Built on Day 1

Yesterday was intense. After the hackathon win, I spent 18 hours shipping features that bring us closer to the restaurant vision:

### 1. **Mercuryo Crypto On-Ramp**
Users can now buy TRX (TRON cryptocurrency) directly in the app using:
- Credit/debit cards
- Bank transfers
- Apple Pay / Google Pay

Full WebView integration, wallet address pre-filled, success detection working. *[components/MercuryoWidget.tsx]*

### 2. **Smart Cryptocurrency Icons**
Built an intelligent icon loading system with 4-tier fallbacks:
- Bundled icons for 15+ major cryptos (offline support)
- CoinGecko API for comprehensive coverage
- Trust Wallet CDN fallback
- 7-day caching to reduce API calls

*[services/CryptoIconService.ts, components/SmartCryptoIcon.tsx]*

### 3. **Complete Apple App Store Compliance**
Implemented all 18/18 security requirements:
- Auto-lock with configurable timeouts
- Lock on app background
- 6-digit PIN fallback authentication
- Biometric authentication (Face ID/Touch ID)
- Hardware-backed key storage (iOS Secure Enclave)

*[providers/SecurityProvider.tsx, components/LockScreen.tsx]*

### 4. **Critical Bug Fixes**
- Fixed balance not updating when switching networks (testnet/mainnet)
- Fixed payment page showing wrong balance
- Resolved iOS build issues with react-native-reanimated

### 5. **Comprehensive Documentation**
Created 2,000+ lines of documentation:
- `CHANGELOG.md` - Complete version history
- `ERROR_LOG.md` - Every error we've encountered and how we fixed it
- `STRIPE_ONRAMP_RESEARCH.md` - 557 lines comparing Stripe vs Mercuryo for restaurant payments
- `MERCURYO_SETUP.md` - Complete setup guide
- `APPLE_COMPLIANCE_CHECKLIST.md` - All 18/18 App Store requirements

**Total changes:** 58 files, 16,536 insertions, 2,372 deletions

All pushed to GitHub: [github.com/Hey-Salad/heysalad-wallet](https://github.com/Hey-Salad/heysalad-wallet)

## 🎯 The Next 90 Days

The hackathon win gives us momentum. The e-Revolutionaries nomination gives us exposure. Now we execute:

### Phase 1: TestFlight (Weeks 1-2)
- Configure Mercuryo Widget ID
- Host legal pages (privacy, terms, support)
- Create app icon and screenshots
- Submit to TestFlight for beta testing

### Phase 2: Restaurant Pilot (Weeks 3-6)
- Partner with 3-5 UK restaurants
- Install QR codes at tables
- Train staff on HeySalad payments
- Gather customer feedback
- Refine payment flow

### Phase 3: Public Launch (Weeks 7-12)
- App Store submission
- Public app launch
- Partnership with 10+ restaurants
- Marketing campaign: "The Future of Restaurant Payments"
- Media outreach (TechCrunch, The Verge, etc.)

**Goal for 2025:** 100+ UK restaurants accepting HeySalad payments

## 🤝 Why I'm Sharing This Publicly

Building in public is terrifying. Every bug, every pivot, every late-night doubt - it's all out there.

But I believe in transparency. I believe the best products are built with community feedback. And I believe that documenting this journey might inspire someone else to take that leap.

Today is Day 1 of building HeySalad as a real business. Not a side project. Not a hackathon entry. A **real company** with a **real mission** to change how people pay for food.

## 🙏 How You Can Help

1. **Vote for us in e-Revolutionaries 2025**
   - You can vote once per day
   - Takes 30 seconds
   - [Voting link](https://www.xolo.io/zz-en/e-revolutionaries-2025)

2. **Follow our progress**
   - Subscribe to this Substack for daily updates
   - GitHub: [Hey-Salad/heysalad-wallet](https://github.com/Hey-Salad/heysalad-wallet)
   - Email me: peter@heysalad.io

3. **Connect me with restaurant owners**
   - Know a restaurant that hates credit card fees?
   - Know a forward-thinking chef who'd try new payment tech?
   - Introduce us: peter@heysalad.io

4. **Share this story**
   - Tweet it, share it, tell your friends
   - Every share helps us reach more potential restaurant partners

## 💭 Final Thoughts

It's 3:30 AM now. I should sleep. But I'm too excited.

Yesterday we won a hackathon. Today we're building a company. Tomorrow... who knows?

But I do know this: **The future of restaurant payments isn't cards or cash. It's voice. It's AI. It's crypto made simple.**

And we're going to build it.

---

**Peter (Chilumba M.)**
Founder, HeySalad OÜ
Estonian e-Resident #[Your Number]
Tallinn, Estonia (digitally)
[peter@heysalad.io](mailto:peter@heysalad.io)

---

*P.S. - This is Day 1 of a daily series. Tomorrow I'll share our TestFlight submission process and the first restaurant partnership conversation. Subscribe to follow along.*

*P.P.S. - If you're an e-Resident or thinking about becoming one, reach out. Happy to share my experience with the program. It's genuinely life-changing for remote entrepreneurs.*

---

**Vote for HeySalad in e-Revolutionaries 2025:**
👉 [www.xolo.io/zz-en/e-revolutionaries-2025](https://www.xolo.io/zz-en/e-revolutionaries-2025)

**GitHub Repository:**
👉 [github.com/Hey-Salad/heysalad-wallet](https://github.com/Hey-Salad/heysalad-wallet)

**UK AI Agent Hackathon:**
👉 [Link to hackathon results]

---

*Built with ❤️ for the restaurant industry*
*Powered by Estonian e-Residency*
*Secured by TRON blockchain*

---

**Tags:** #BuildInPublic #HeySalad #EstonianEResidency #eRevolutionaries2025 #CryptoWallet #RestaurantTech #AIAgent #TRONHackathon #StartupJourney #DayOne
