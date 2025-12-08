# Testing the Shopping Agent Integration

This document provides instructions for testing the HeySalad Shopping Agent integration in the wallet app.

## Overview

The Shopping Agent allows users to shop for groceries autonomously using HeySalad's store accounts. Users don't need to connect their own supermarket accounts - they just need to provide a delivery postcode.

## API Endpoint

**Production URL**: `https://shopping-agent.heysalad-o.workers.dev`

## Test Cases

### 1. Basic Chat Test

Test that the agent responds to shopping queries:

```bash
curl -X POST https://shopping-agent.heysalad-o.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I need ingredients for a chicken curry",
    "userId": "test-user-001",
    "phone": "+447123456789"
  }'
```

**Expected**: Agent responds with recipe and offers to shop autonomously.

### 2. Autonomous Shopping Test (with postcode)

Test autonomous shopping with a delivery address:

```bash
curl -X POST https://shopping-agent.heysalad-o.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Shop for beef wellington ingredients from Tesco. My postcode is SW1A 1AA",
    "userId": "test-user-002",
    "phone": "+447123456789"
  }'
```

**Expected**: Agent attempts autonomous shopping using HeySalad's Tesco account.

### 3. Price Comparison Test

```bash
curl -X POST https://shopping-agent.heysalad-o.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Compare prices for milk, bread, and eggs across supermarkets",
    "userId": "test-user-003",
    "phone": "+447123456789"
  }'
```

**Expected**: Agent returns price comparison across stores.

### 4. Health Check

```bash
curl https://shopping-agent.heysalad-o.workers.dev/api/health
```

**Expected**:
```json
{
  "status": "ok",
  "service": "shopping-agent",
  "version": "1.0.0"
}
```

## Admin API Tests

### List Store Accounts

```bash
curl -X GET "https://shopping-agent.heysalad-o.workers.dev/api/admin/accounts" \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY"
```

**Expected**: Returns list of HeySalad-owned store accounts with status.

### Get Account Statistics

```bash
curl -X GET "https://shopping-agent.heysalad-o.workers.dev/api/admin/accounts" \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY" | jq '.data.stats'
```

**Expected**:
```json
{
  "total": 6,
  "byStore": {
    "tesco": 1,
    "sainsburys": 1,
    "asda": 1,
    "ocado": 1,
    "waitrose": 1,
    "lidl": 1
  },
  "byStatus": {
    "available": 6
  }
}
```

## In-App Testing (HeySalad Wallet)

### Prerequisites
1. Install the app on a device or simulator
2. Sign in with a valid account
3. Navigate to the Agent tab

### Test Scenarios

#### Scenario 1: Simple Grocery Request
1. Open the Agent tab
2. Type: "I need groceries for a Sunday roast"
3. **Expected**: Agent provides a shopping list and offers to shop

#### Scenario 2: Autonomous Shopping Flow
1. Open the Agent tab
2. Type: "Shop for pasta ingredients from Tesco, deliver to SW1A 1AA"
3. **Expected**: 
   - Agent acknowledges the request
   - Attempts to use HeySalad's Tesco account
   - Returns either a success with payment link OR a fallback shopping list

#### Scenario 3: Store Selection
1. Open the Agent tab
2. Type: "What stores can you shop from?"
3. **Expected**: Agent lists supported stores (Tesco, Sainsbury's, ASDA, Ocado, Waitrose, Lidl)

## Supported Stores

| Store | Status | Notes |
|-------|--------|-------|
| Tesco | ✅ Full adapter | Browser automation ready |
| Sainsbury's | ✅ Full adapter | Browser automation ready |
| ASDA | ✅ Full adapter | Browser automation ready |
| Ocado | ⏳ Coming soon | Account seeded, adapter pending |
| Waitrose | ⏳ Coming soon | Account seeded, adapter pending |
| Lidl | ⚠️ Limited | No full online grocery in UK |

## Known Limitations

1. **Browser Automation**: Requires `BROWSERLESS_API_KEY` to be configured for full autonomous shopping
2. **Fallback Behavior**: If automation fails, agent provides manual shopping list with links
3. **Rate Limiting**: HeySalad accounts may be rate-limited after heavy use (auto-rotates to backup)

## Troubleshooting

### "No account available" Error
- Check if accounts are seeded: `GET /api/admin/accounts`
- Check account status - may be `rate_limited` or `blocked`

### Shopping Session Fails
- Check if `BROWSERLESS_API_KEY` is configured
- Check store adapter implementation status
- Review session logs in D1 database

### Agent Asks for Credentials
- This is legacy behavior - update to latest deployment
- Agent should use HeySalad accounts by default

## Environment Variables Required

```
OPENAI_API_KEY=sk-...
BROWSERLESS_API_KEY=...  # For browser automation
STORE_ENCRYPTION_KEY=... # AES-256 key for credential encryption
ADMIN_API_KEY=...        # For admin endpoints
TAVILY_API_KEY=...       # For web search (optional)
```

## Database Tables

- `store_accounts` - HeySalad-owned supermarket accounts
- `user_store_accounts` - User's own connected accounts (optional)
- `shopping_sessions` - Shopping session history
- `shopping_history` - Product purchase history for personalization
- `store_account_usage_log` - Audit log for account usage

## Contact

For issues with the Shopping Agent, contact: peter@heysalad.io
