# Implementation Plan

- [x] 1. Project Setup and Core Infrastructure
  - [x] 1.1 Initialize Cloudflare Worker project with TypeScript
    - Create `heysalad-web3-agent/` directory structure
    - Configure wrangler.toml with D1 database and KV namespace bindings
    - Set up TypeScript config, ESLint, and Prettier
    - Install dependencies: hono, viem, fast-check, vitest
    - _Requirements: All_

  - [x] 1.2 Create D1 database migrations
    - Create payment_requests table
    - Create shopping_sessions table
    - Create user_credentials table (encrypted)
    - Create agent_logs table for audit trail
    - _Requirements: 2.1, 5.1, 7.5_

  - [x] 1.3 Implement core types and interfaces
    - Define PaymentRequest, PaymentProof, PaymentStatus types
    - Define ShoppingRequest, ShoppingResult, SessionState types
    - Define AgentCapabilities, AgentIdentity types
    - Define UAgentMessage, UAgentResponse types
    - _Requirements: 2.1, 3.1, 4.1, 5.2_

- [x] 2. x402 Payment Protocol Implementation
  - [x] 2.1 Implement x402 payment request creation
    - Create PaymentRequest with unique ID, amount, asset, recipient
    - Generate expiration timestamp (5 minutes default)
    - Store in D1 with pending status
    - _Requirements: 2.1_

  - [x] 2.2 Write property test for x402 serialization round-trip
    - **Property 3: x402 Payment Request Round-Trip**
    - **Validates: Requirements 2.6, 2.7**

  - [x] 2.3 Implement payment serialization/deserialization
    - Serialize PaymentRequest to JSON following x402 spec
    - Deserialize PaymentProof from X-Payment header
    - Validate all required fields are present
    - _Requirements: 2.6, 2.7_

  - [x] 2.4 Implement QR code generation for payments
    - Generate QR code data URL from PaymentRequest
    - Include deep link for HeySalad Wallet
    - Support both BNB Chain and Avalanche
    - _Requirements: 2.4_

  - [x] 2.5 Implement on-chain payment verification
    - Connect to BNB Chain RPC using viem
    - Verify transaction hash exists and is confirmed
    - Check amount, recipient, and asset match request
    - Update payment status to completed
    - _Requirements: 2.2, 2.5_

  - [x] 2.6 Write property test for payment status transitions
    - **Property 7: Payment Status Transitions**
    - **Validates: Requirements 2.5**

  - [x] 2.7 Write property test for protected endpoint 402 response
    - **Property 4: Protected Endpoint 402 Response**
    - **Validates: Requirements 2.1**

  - [x] 2.8 Write property test for invalid payment error messages
    - **Property 6: Invalid Payment Error Messages**
    - **Validates: Requirements 2.3**

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. ChainGPT Integration
  - [x] 4.1 Implement ChainGPT API client
    - Create HTTP client with API key authentication
    - Implement chat endpoint wrapper
    - Implement smart contract generator wrapper
    - Implement news/research API wrapper
    - Add timeout and retry logic
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 4.2 Implement Solidity validation
    - Static analysis and syntax validation for Solidity code
    - Parse compiler-like errors and warnings
    - Return structured validation result with security issues
    - _Requirements: 1.5_

  - [x] 4.3 Write property test for smart contract compilation
    - **Property 1: Smart Contract Compilation Validity**
    - **Validates: Requirements 1.2, 1.5**

  - [x] 4.4 Implement ChainGPT fallback mechanism
    - Detect API errors and timeouts
    - Fall back to local GPT-4o via OpenAI API
    - Log fallback events for monitoring
    - _Requirements: 1.4_

  - [x] 4.5 Write property test for ChainGPT fallback
    - **Property 2: ChainGPT Fallback on Error**
    - **Validates: Requirements 1.4**

- [x] 5. Intent Classification and Entity Extraction
  - [x] 5.1 Implement intent classifier
    - Create `src/classifier.ts` with intent classification logic
    - Classify messages into: shopping, payment, blockchain, contract, unknown
    - Return confidence score (0-100)
    - Use GPT-4o for classification with structured output
    - _Requirements: 8.1_

  - [x] 5.2 Write property test for intent classification routing
    - **Property 14: Intent Classification Routing**
    - **Validates: Requirements 8.1**

  - [x] 5.3 Implement entity extraction
    - Extract shopping entities: items, quantities, store, preferences
    - Extract payment entities: amount, currency, recipient
    - Extract blockchain entities: chain, token, project
    - _Requirements: 8.2, 8.3_

  - [x] 5.4 Write property test for entity extraction completeness
    - **Property 15: Entity Extraction Completeness**
    - **Validates: Requirements 8.2, 8.3**

  - [x] 5.5 Implement low-confidence handling
    - Detect confidence below 70%
    - Generate clarifying questions
    - Return structured clarification request
    - _Requirements: 8.5_

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Credential Management and Security
  - [x] 7.1 Implement AES-256-GCM encryption utilities
    - Create `src/credentials.ts` with encryption functions
    - Generate unique encryption keys per user
    - Implement encrypt function with IV and auth tag
    - Implement decrypt function with validation
    - _Requirements: 5.1, 7.1_

  - [x] 7.2 Write property test for credential encryption round-trip
    - **Property 10: Credential Encryption Round-Trip**
    - **Validates: Requirements 5.1, 5.6**

  - [x] 7.3 Implement credential storage
    - Store encrypted credentials in D1
    - Implement getCredentials with decryption
    - Implement deleteCredentials for GDPR compliance
    - Log all credential access events
    - _Requirements: 5.1, 5.6, 7.3, 7.5_

  - [x] 7.4 Implement PII redaction for logging
    - Create `src/logging.ts` with redaction utilities
    - Create redaction patterns for email, phone, card numbers
    - Wrap console.log with redaction filter
    - Apply to all log statements
    - _Requirements: 7.4_

  - [x] 7.5 Write property test for PII redaction
    - **Property 13: PII Redaction in Logs**
    - **Validates: Requirements 7.4**

- [x] 8. Autonomous Shopping Service
  - [x] 8.1 Implement shopping session management
    - Create `src/shopping.ts` with session management
    - Create session with unique ID and initial state
    - Save session state to D1 on each checkpoint
    - Implement session recovery from saved state
    - _Requirements: 10.1_

  - [x] 8.2 Write property test for session state recovery
    - **Property 17: Session State Recovery**
    - **Validates: Requirements 10.1, 10.5**

  - [x] 8.3 Implement store integration (Tesco)
    - Port existing Tesco integration from shopping-agent
    - Add login with encrypted credentials
    - Implement product search and add to cart
    - _Requirements: 5.2_

  - [x] 8.4 Implement cart total calculation
    - Sum item prices × quantities
    - Add delivery fee
    - Generate payment link with total
    - _Requirements: 5.2, 5.4_

  - [x] 8.5 Write property test for cart consistency
    - **Property 11: Shopping Cart State Consistency**
    - **Validates: Requirements 5.2**

  - [x] 8.6 Implement substitute suggestion engine
    - Detect unavailable items
    - Query store for similar products
    - Rank by price, brand, dietary match
    - _Requirements: 5.3_

  - [x] 8.7 Write property test for unavailable item substitution
    - **Property 12: Unavailable Item Substitution**
    - **Validates: Requirements 5.3**

- [x] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. ERC-8004 Agent Identity
  - [x] 10.1 Implement agent identity registration
    - Create `src/erc8004.ts` with registry interactions
    - Generate agent wallet (or use existing)
    - Create capabilities metadata
    - Deploy/interact with ERC-8004 registry on BNB Chain
    - Store registration transaction hash
    - _Requirements: 3.1, 3.2_

  - [x] 10.2 Implement signature verification
    - Sign messages with agent private key
    - Verify signatures against registered public key
    - _Requirements: 3.4_

  - [x] 10.3 Write property test for signature verification
    - **Property 8: Agent Identity Signature Verification**
    - **Validates: Requirements 3.4**

  - [x] 10.4 Implement capability updates
    - Update on-chain registry when capabilities change
    - Wait for block confirmation
    - _Requirements: 3.3_

- [x] 11. Fetch.ai uAgent Integration
  - [x] 11.1 Implement uAgent message handler
    - Create `src/uagent.ts` with message handling
    - Parse incoming uAgent messages
    - Route to appropriate service based on type
    - Format response as UAgentResponse
    - _Requirements: 4.2_

  - [x] 11.2 Write property test for uAgent message handling
    - **Property 9: uAgent Message Handling**
    - **Validates: Requirements 4.2, 4.3, 4.4**

  - [x] 11.3 Implement Agentverse registration
    - Register agent with Agentverse
    - Handle connection failures with exponential backoff
    - _Requirements: 4.1, 4.5_

  - [x] 11.4 Implement shopping via uAgent
    - Handle shopping request messages
    - Execute autonomous shopping
    - Return results in uAgent format
    - _Requirements: 4.3_

  - [x] 11.5 Implement payment via uAgent
    - Handle payment request messages
    - Generate x402 payment details
    - Return payment link in uAgent format
    - _Requirements: 4.4_

- [x] 12. Multi-Chain Support
  - [x] 12.1 Implement chain configuration
    - Define BNB Chain config (RPC, USDC contract) - implemented in x402.ts
    - Define Avalanche config (RPC, USDC contract) - implemented in x402.ts
    - Create chain switcher utility - getChainConfig() implemented
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 12.2 Write property test for chain-specific routing
    - **Property 16: Chain-Specific Contract Routing**
    - **Validates: Requirements 9.1, 9.2**
    - Note: Chain routing is validated through x402-roundtrip.property.test.ts which tests both chains

  - [x] 12.3 Implement unsupported chain handling
    - Detect unsupported chain requests - validation in index.ts
    - Return list of supported chains - /api endpoint returns supportedChains
    - _Requirements: 9.4_

- [x] 13. API Gateway and Routing
  - [x] 13.1 Implement remaining API routes
    - Implement /api/chat endpoint with intent routing
    - Implement /api/shop/* endpoints for shopping
    - Implement /api/agent/* endpoints for ERC-8004
    - Note: /api/payment/* and /api/uagent/* endpoints already implemented
    - _Requirements: All_

  - [x] 13.2 Implement rate limiting
    - Use KV for rate limit counters
    - Limit by IP and wallet address
    - Return 429 when exceeded
    - _Requirements: 10.2_

  - [x] 13.3 Implement wallet authentication
    - Verify signed messages from wallet
    - Create session tokens
    - _Requirements: 6.1_

  - [x] 13.4 Implement deep link generation
    - Generate heysalad:// deep links for payments - implemented in qrcode.ts
    - Include pre-filled payment details - generatePaymentDeepLink() implemented
    - _Requirements: 6.3_

- [x] 14. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Mobile Wallet Integration
  - [x] 15.1 Create wallet API client in heysalad-wallet
    - Add API client for heysalad-web3-agent
    - Implement chat, payment, and shopping methods
    - Handle deep link callbacks
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 15.2 Add Web3 Agent chat screen
    - Create new chat screen in wallet app
    - Integrate with agent API
    - Display shopping progress and payment links
    - _Requirements: 6.2_

  - [x] 15.3 Implement payment confirmation flow
    - Handle payment deep links
    - Show payment confirmation UI
    - Update session status after payment
    - _Requirements: 6.4_

- [x] 16. Deployment and Configuration
  - [x] 16.1 Configure production secrets
    - Set CHAINGPT_API_KEY
    - Set OPENAI_API_KEY
    - Set BNB_RPC_URL
    - Set AGENT_PRIVATE_KEY
    - Set ENCRYPTION_KEY
    - _Requirements: All_

  - [x] 16.2 Deploy to Cloudflare Workers
    - Run database migrations
    - Deploy worker
    - Verify all endpoints
    - _Requirements: All_

  - [x] 16.3 Register agent on BNB Chain
    - Deploy ERC-8004 identity
    - Register with Agentverse
    - Verify agent discovery
    - _Requirements: 3.1, 4.1_

- [x] 17. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
