# Kiro AI Prompt: AWE Network AI Agent Integration

Copy and paste this prompt into Kiro to integrate AWE Network's decentralized AI agent infrastructure into HeySalad Wallet, enabling monetization of the Selina voice assistant.

---

## 🎯 PROMPT FOR KIRO

```
I need you to integrate AWE Network's decentralized AI agent infrastructure into my HeySalad Wallet React Native app to monetize the existing "Selina" voice assistant and enable other apps to pay AWE tokens to use our voice AI capabilities.

CONTEXT:
- This is a working React Native/Expo wallet app with Selina voice assistant (ElevenLabs)
- Already has: Voice command processing, natural language payments, British accent TTS
- Recent addition: Midnight Network privacy features (private transactions)
- Architecture: Multi-provider pattern with context hooks
- Location: /Users/chilumbam/heysalad-wallet

EXISTING VOICE ASSISTANT:
- File: components/SelinaVoiceModal.tsx
- Features: Voice command parsing, ElevenLabs integration, transaction assistance
- Current mode: Centralized (direct ElevenLabs API calls)

GOAL:
Create an AWE Network integration that allows:
1. Register Selina as a decentralized AI agent on AWE Network
2. Other apps can pay AWE tokens to use Selina's voice processing
3. Toggle between local (ElevenLabs) and decentralized (AWE) execution
4. Earn AWE tokens when external apps use our voice AI
5. Display earnings dashboard and agent statistics

TECHNICAL REQUIREMENTS:

1. CREATE NEW SERVICE: services/AWEAgentService.ts
   - Methods needed:
     * registerAgent(): Register Selina on AWE Network, returns { agentId, nftTokenId }
     * processVoiceCommand({ audio, userId, walletAddress }): Process voice via AWE
     * getAgentStats(agentId): Get request count, earnings, reputation
     * withdrawEarnings(agentId, amount): Withdraw AWE tokens
     * discoverAgents(capabilities): Find other AI agents on AWE marketplace
   - Handle agent NFT ownership (ERC-721 representing agent)
   - Payment escrow management for requests
   - Reputation score tracking

2. CREATE CLOUDFLARE WORKER: selina-awe-worker/ (external directory)
   Structure:
   selina-awe-worker/
   ├── src/
   │   └── index.ts          # Hono server for AWE requests
   ├── wrangler.toml         # Cloudflare config
   └── package.json

   Worker requirements:
   - POST /api/process-voice endpoint
   - Accept: { audio: string, context: { userId, walletAddress } }
   - Transcribe audio (if needed)
   - Parse voice command for payment intent
   - Generate Selina voice response using ElevenLabs
   - Return: { transcript, intent, action, voiceResponse (audio URL) }
   - Use existing ElevenLabs integration pattern

3. UPDATE components/SelinaVoiceModal.tsx
   - Add "AWE Mode" toggle switch at top of modal
   - State: const [useAWE, setUseAWE] = useState(false)
   - When useAWE is true:
     * Call AWEAgentService.processVoiceCommand() instead of local processing
     * Show "⚡ Decentralized AI" badge
     * Display cost per request (e.g., "0.01 AWE tokens per query")
   - When useAWE is false:
     * Use existing ElevenLabs local processing (keep current implementation)
   - Add visual indicator showing which mode is active
   - Style: Follow existing Colors.brand.cherryRed theme

4. CREATE NEW SCREEN: app/(tabs)/agent-marketplace.tsx
   Purpose: Show Selina's AWE agent statistics and earnings

   Layout:
   - Header: "Selina AI Agent - AWE Network"
   - Stats cards:
     * Total Requests (count)
     * AWE Tokens Earned (amount)
     * Reputation Score (0-5 stars)
     * Active Users (count)
   - "Withdraw Earnings" button
   - Section: "Discover Other AI Agents"
   - List of other agents on AWE marketplace
   - Each agent card shows: name, capabilities, cost per request, reputation
   - "Integrate Agent" button to add external agents

   Style: Match existing wallet card designs with brand colors

5. CREATE PROVIDER: providers/AWEProvider.tsx
   - Manage AWE agent state
   - Context values:
     * agentId: string | null
     * isRegistered: boolean
     * stats: { totalRequests, tokensEarned, reputation, activeUsers }
     * registerSelina(): Register agent on AWE
     * useAWEMode: boolean
     * toggleAWEMode(): Switch between local/AWE
   - Load agent stats on app start if registered
   - Persist agentId in AsyncStorage

6. UPDATE app/_layout.tsx
   - Import AWEProvider
   - Add to provider hierarchy AFTER NetworkProvider:
     <NetworkProvider>
       <AWEProvider>          {/* NEW */}
         <SecurityProvider>
           ...
         </SecurityProvider>
       </AWEProvider>
     </NetworkProvider>

7. ADD AGENT REGISTRATION FLOW
   - Create: app/onboarding-agent.tsx (optional onboarding screen)
   - Or add to settings: app/(tabs)/(wallet)/settings.tsx
   - Section: "Monetize Selina"
   - Button: "Register on AWE Network"
   - Flow:
     1. User taps register
     2. Call AWEAgentService.registerAgent()
     3. Show success: "Selina is now on AWE Network!"
     4. Display agent ID and NFT token ID
     5. Redirect to agent-marketplace screen

8. TYPES: types/awe.ts (create new file)
   Define interfaces:
   - AWEAgent
   - AWEAgentStats
   - AWEAgentCapability
   - VoiceCommandRequest
   - VoiceCommandResponse
   - AgentMarketplaceListing

9. ADD DEPENDENCIES to package.json:
   - "@awe-network/sdk": "^1.0.0" (if available, otherwise mock it)
   - If SDK not available, create mock implementation with TODO comments

10. ENVIRONMENT VARIABLES (.env):
    Add placeholders:
    - EXPO_PUBLIC_AWE_API_KEY=your_awe_api_key_here
    - EXPO_PUBLIC_AWE_NETWORK_URL=https://api.awe.network
    - EXPO_PUBLIC_SELINA_AGENT_ID=  # Set after registration
    - SELINA_AWE_WORKER_URL=https://selina-awe-worker.your-subdomain.workers.dev

AGENT CAPABILITIES TO REGISTER:
When registering Selina, declare these capabilities:
- "voice_payment_processing"
- "natural_language_commands"
- "transaction_assistance"
- "balance_queries"
- "british_accent_voice"
- "crypto_wallet_operations"

PRICING STRATEGY:
- Cost per voice command: 0.01 AWE tokens
- Batch discount: 10+ requests = 0.008 AWE per request
- Free tier: First 10 requests per user per month

ARCHITECTURE PATTERN TO FOLLOW:
- Look at providers/NetworkProvider.tsx for context pattern
- Look at components/SelinaVoiceModal.tsx for existing voice logic
- Look at services/cloudflareClient.ts for API call patterns
- Follow existing TypeScript conventions
- Use AsyncStorage for persistence
- Use Colors.brand for styling

CONSTRAINTS:
- Must maintain existing Selina functionality (local mode)
- AWE mode is optional (users can still use free local mode)
- Must work with Expo 54 / React Native 0.81.5
- No breaking changes to existing voice commands
- Earnings displayed in both AWE tokens and estimated USD value

TESTING APPROACH:
If AWE SDK is not publicly available yet:
- Create mock implementation with realistic data
- Use console.log to show where real AWE calls would happen
- Add TODO comments: "// TODO: Replace with actual AWE SDK call"
- Make architecture production-ready even if using mocks

CLOUDFLARE WORKER DEPLOYMENT:
The worker should be deployable with:
```bash
cd selina-awe-worker
npm install
npx wrangler deploy
```

DELIVERABLES:
1. AWEAgentService.ts with full implementation (or mocks)
2. Updated SelinaVoiceModal.tsx with AWE toggle
3. New agent-marketplace.tsx screen
4. AWEProvider.tsx context provider
5. Cloudflare Worker in selina-awe-worker/
6. Types in types/awe.ts
7. Updated _layout.tsx with AWEProvider
8. Registration flow in settings
9. README section explaining AWE integration
10. Example of how external apps would use Selina via AWE

Please implement this step-by-step:
1. Start with types and service layer (AWEAgentService.ts)
2. Create the provider (AWEProvider.tsx)
3. Update SelinaVoiceModal.tsx with toggle
4. Create agent-marketplace screen
5. Build Cloudflare Worker
6. Add registration flow

Use mock data where AWE SDK is not available, but make the architecture production-ready.
```

---

## 📋 CHECKLIST BEFORE RUNNING KIRO

- [ ] Midnight Network integration is working (prerequisite)
- [ ] You have AWE Network API access (or ready to use mocks)
- [ ] You understand the monetization model
- [ ] Your `.env` file can accept new variables
- [ ] You've researched AWE Network documentation

---

## 🔧 AFTER KIRO COMPLETES

### **1. Test Local Mode Still Works**
```bash
cd /Users/chilumbam/heysalad-wallet
npm install
npm run start

# In app:
1. Open Selina voice modal
2. AWE toggle should be OFF by default
3. Test voice command: "Send 10 TRX to [address]"
4. Should work exactly as before (local ElevenLabs)
```

### **2. Test AWE Mode (Mock)**
```bash
# In app:
1. Toggle AWE mode ON
2. Test same voice command
3. Should show "⚡ Decentralized AI" indicator
4. Should still process command (using mock/worker)
5. Check console logs for AWE service calls
```

### **3. View Agent Marketplace**
```bash
# In app:
1. Navigate to agent-marketplace tab/screen
2. Should see Selina's stats (even if mock data)
3. Should see "Register on AWE Network" if not registered
4. Should see earnings dashboard
```

### **4. Deploy Cloudflare Worker**
```bash
cd selina-awe-worker
npm install
npx wrangler login
npx wrangler deploy

# Note the deployment URL
# Update .env with: SELINA_AWE_WORKER_URL=https://...workers.dev
```

---

## 🧪 MANUAL TESTING STEPS

### **Test 1: Toggle AWE Mode**
1. Open Selina modal
2. Toggle AWE switch ON
3. Visual indicator should change
4. Send voice command
5. Should process successfully

### **Test 2: View Statistics**
1. Go to agent-marketplace screen
2. Should see:
   - Total requests: 0 (or mock number)
   - Tokens earned: 0.00 AWE
   - Reputation: Not yet rated
3. Stats should update after requests (if real AWE)

### **Test 3: Registration Flow**
1. Go to Settings → Monetize Selina
2. Tap "Register on AWE Network"
3. Should show loading
4. Success message with agent ID
5. Agent marketplace now shows stats

### **Test 4: External App Usage (Mock)**
Create a simple test script:
```typescript
// test-external-app.ts
import { AWEClient } from '@awe-network/sdk';

const awe = new AWEClient(TEST_API_KEY);

// Discover Selina
const agents = await awe.discoverAgents({
  capability: 'voice_payment_processing'
});

const selina = agents.find(a => a.name === 'Selina Voice Assistant');

// Use Selina (pay AWE tokens)
const result = await awe.executeAgent({
  agentId: selina.id,
  input: { audio: 'Send 10 TRX to Alice' },
  payment: 0.01, // 0.01 AWE tokens
});

console.log('Selina processed:', result);
// HeySalad wallet earns 0.01 AWE tokens
```

---

## ⚠️ TROUBLESHOOTING

### **Error: "Cannot find package @awe-network/sdk"**
```
Tell Kiro: "The AWE SDK is not published to npm yet. Create a complete mock implementation of AWEAgentService with realistic data and console.log statements. Make the architecture production-ready so when the real SDK is available, we just swap the import. Add detailed TODO comments showing exactly where real AWE calls would go."
```

### **Error: "AWEProvider causing crashes"**
```
Tell Kiro: "Fix the AWEProvider initialization. It should gracefully handle when AWE is not configured (no API key). Set default values: isRegistered=false, stats=null. Don't crash if AsyncStorage is empty."
```

### **Error: "Cloudflare Worker not deploying"**
```
Check:
1. Is wrangler installed globally? npm install -g wrangler
2. Are you logged in? npx wrangler login
3. Does wrangler.toml have correct name/account_id?
4. Are all dependencies in worker's package.json?
```

### **Error: "Selina voice broke after AWE integration"**
```
Tell Kiro: "The local Selina mode (useAWE=false) should work EXACTLY as before. Do not modify the existing voice processing logic. Only ADD new AWE mode as an alternative path. Keep all existing ElevenLabs calls intact."
```

---

## 📊 EXPECTED RESULT

After Kiro completes, you should have:

### **New Files Created:**
```
services/AWEAgentService.ts           ✅ Agent registration & management
providers/AWEProvider.tsx             ✅ AWE state context
app/(tabs)/agent-marketplace.tsx      ✅ Earnings dashboard
types/awe.ts                          ✅ TypeScript interfaces
selina-awe-worker/                    ✅ Cloudflare Worker
  ├── src/index.ts
  ├── wrangler.toml
  └── package.json
```

### **Modified Files:**
```
components/SelinaVoiceModal.tsx       ✅ AWE toggle added
app/_layout.tsx                       ✅ AWEProvider in hierarchy
app/(tabs)/(wallet)/settings.tsx      ✅ Registration button
.env.example                          ✅ AWE variables
```

### **Features Working:**
```
✅ Local mode (ElevenLabs) still works
✅ AWE mode toggle available
✅ Agent marketplace screen shows stats
✅ Registration flow functional (or mock)
✅ Cloudflare Worker deployable
✅ External apps can discover Selina (architecture)
```

---

## 🎯 ALTERNATIVE: Smaller Chunks

If Kiro struggles, break into 3 phases:

### **Phase 1: Service Layer**
```
Create services/AWEAgentService.ts and types/awe.ts with mock implementations.
Show console.log statements where real AWE SDK calls would happen.
```

### **Phase 2: UI Components**
```
Update SelinaVoiceModal.tsx with AWE toggle.
Create agent-marketplace.tsx screen with mock stats.
Use the AWEAgentService from Phase 1.
```

### **Phase 3: Cloudflare Worker**
```
Create selina-awe-worker/ directory.
Build Hono server with /api/process-voice endpoint.
Use ElevenLabs API for voice processing.
Make it deployable to Cloudflare.
```

---

## 💰 MONETIZATION MODEL

### **How It Works:**

1. **You (HeySalad) earn when:**
   - External apps use Selina via AWE Network
   - Each voice command = 0.01 AWE tokens
   - Tokens accumulate in your agent wallet

2. **External apps pay when:**
   - They discover Selina on AWE marketplace
   - They send voice processing requests
   - AWE Network handles escrow & payment

3. **Revenue Potential:**
   - 100 requests/day × 0.01 AWE × $5/AWE = **$5/day**
   - 1,000 requests/day = **$50/day**
   - 10,000 requests/day = **$500/day**

### **Example External App:**

```typescript
// A competitor wallet app using Selina

import { AWEClient } from '@awe-network/sdk';

const client = new AWEClient(THEIR_API_KEY);

// They discover your agent
const selina = await client.findAgent('Selina Voice Assistant');

// They pay to use your voice AI
const result = await client.execute(selina.id, {
  audio: userVoiceCommand,
  payment: 0.01, // AWE tokens
});

// You earn 0.01 AWE tokens
// They get voice AI without building it themselves
// Win-win!
```

---

## 🚀 HACKATHON SUBMISSION VALUE

### **Why This Wins AWE Network Bounties:**

1. **Real Agent Monetization**
   - Not theoretical - actual voice AI service
   - Clear pricing model (0.01 AWE per request)
   - Production-ready architecture

2. **Decentralized AI Showcase**
   - Cloudflare Worker as agent backend
   - On-chain agent identity (NFT)
   - Reputation system
   - Cross-agent communication ready

3. **User Choice**
   - Toggle between centralized (free) and decentralized (earn)
   - Users see value proposition
   - Earnings dashboard shows real incentives

4. **Complete Stack**
   - Mobile app (consumer side)
   - Cloudflare Worker (agent execution)
   - AWE Network (payment & discovery)
   - Agent marketplace (discoverability)

---

## 📞 IF YOU NEED HELP

### **Option 1: Ask Kiro to Fix**
```
"The AWEAgentService has type errors in the payment escrow flow.
Please check the AWE SDK documentation pattern and fix the types."
```

### **Option 2: Ask Me for Code**
```
"Claude, write the complete AWEAgentService.ts implementation"
"Claude, show me the agent-marketplace screen layout"
"Claude, write the Cloudflare Worker index.ts"
```

I'll provide production-ready code for any component.

---

## 🎬 DEMO VIDEO SCRIPT (AWE Integration)

**Act 1: Problem (20s)**
- "Voice AI is expensive to build and maintain"
- "ElevenLabs costs $22/month minimum"
- "What if you could earn money from your AI instead?"

**Act 2: AWE Integration (40s)**
- Open HeySalad Wallet
- Go to Agent Marketplace
- Show Selina registered on AWE Network
- Show earnings: "127 requests, 1.27 AWE tokens earned"
- Toggle AWE mode in voice modal
- "Other apps now pay to use our voice AI"

**Act 3: External App Demo (30s)**
- Show mock external app
- "This crypto wallet needs voice AI"
- "Instead of building, they use Selina via AWE"
- "HeySalad earns 0.01 AWE per request"
- "Decentralized AI + Monetization = Win-Win"

**Closing (10s)**
- "Build once, monetize forever"
- "HeySalad Wallet - Powered by AWE Network"

---

## 🎯 FINAL CHECKLIST

Before submission:
- [ ] Local Selina mode still works perfectly
- [ ] AWE toggle implemented in voice modal
- [ ] Agent marketplace shows stats
- [ ] Cloudflare Worker deployed
- [ ] Registration flow tested
- [ ] Mock data looks realistic
- [ ] Console logs show AWE integration points
- [ ] README section written
- [ ] Demo video recorded
- [ ] Architecture diagram created (optional)

---

**This integration will showcase AWE Network's potential while maintaining your existing UX. The dual-mode approach (local vs. AWE) shows users the value proposition clearly. Let's monetize Selina! 💰**

**Good luck! Want me to help with implementation, testing, or demo materials after Kiro finishes?** 🚀
