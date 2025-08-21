# HeySalad Wallet (TRON) – Expo + Expo Router + Hono + tRPC

Mobile-first TRON wallet prototype with food-payments UX. Runs in Expo Go v53 and the web preview. Backend is Hono + tRPC mounted at /api. Includes voice intents, social split, rewards scaffolding, and TRON integration via TronGrid.

Brand colors: cherry #ed4c4c, peach #ffd0cd/#faa09a. Large friendly buttons (50px radii).

## Quick start

Prereqs: Node 18+, Bun, Expo Go app.

1) Copy env
- cp .env.example .env
- Fill EXPO_PUBLIC_RORK_API_BASE_URL with your Rork workspace base URL (shown in terminal)
- Fill EXPO_PUBLIC_TRONGRID_URL, EXPO_PUBLIC_TRONGRID_API_KEY (Nile/Shasta/Mainnet)
- For prototype signing on backend, add TRON_PRIVATE_KEY (test-only)

2) Install and run
- bun install
- bun run start  # mobile (with tunnel)
- bun run start-web  # web preview

Scan the QR in Expo Go. Web runs via RN Web.

## Environment variables

Create .env locally or in Rork Environment.

- EXPO_PUBLIC_RORK_API_BASE_URL: Base host used by tRPC client, e.g. https://xyz.rork.app
- EXPO_PUBLIC_TRONGRID_URL: TronGrid base. Examples:
  - https://nile.trongrid.io (Nile testnet)
  - https://api.shasta.trongrid.io (Shasta testnet)
  - https://api.trongrid.io (Mainnet)
- EXPO_PUBLIC_TRONGRID_API_KEY: Your TronGrid API key
- TRON_PRIVATE_KEY: Server-only key used by backend to sign prototype txs
- PRIVATE_KEY: Optional alias read by backend if TRON_PRIVATE_KEY not set

See .env.example for a template. Never commit real keys.

## TRON integration

Read-only
- backend/trpc/routes/tron/getAccount: Calls `${EXPO_PUBLIC_TRONGRID_URL}/v1/accounts/:address` with TRON-PRO-API-KEY

Prototype send (server-signed)
- backend/trpc/routes/tron/sendTrx: Creates, signs (with TRON_PRIVATE_KEY), broadcasts via `${base}/wallet/*`
- Works with Nile/Shasta/Mainnet based on EXPO_PUBLIC_TRONGRID_URL
- For Nile you can also pass nodeUrl per call

Explorer
- Use Nile Tronscan: https://nile.tronscan.org/

## How to fund and test

1) Get a test key: create one with TronLink (off-app) or any wallet and export private key (test only)
2) Fund on Nile via faucet or internal tools
3) Put the private key in your Rork env and local .env as TRON_PRIVATE_KEY
4) Set EXPO_PUBLIC_TRONGRID_URL to https://nile.trongrid.io and EXPO_PUBLIC_TRONGRID_API_KEY to your key
5) Use wallet tab to trigger a small send via sendTrx procedure

## Project layout

- app/ – Expo Router routes
  - (tabs)/ – Tabs: (wallet)/, pay/, social/, rewards/
  - modal.tsx – Example modal route
- components/ – ErrorBoundary, HSButton, HSTag, TomatoMascot
- constants/ – Theme tokens (colors.ts)
- features/voice/ – VoiceRecorder, intent parsing using utils/ai
- providers/ – WalletProvider, AuthProvider
- utils/ – format, ai
- backend/ – Hono app at /api with tRPC
  - hono.ts – Hono server
  - trpc/app-router.ts – root router
  - trpc/routes/... – procedures including tron/getAccount, tron/sendTrx
- lib/trpc.ts – React tRPC client using EXPO_PUBLIC_RORK_API_BASE_URL

## Scripts

- bun run start – Dev server with tunnel
- bun run start-web – Web preview with tunnel
- bun run start-web-dev – Web preview with Expo debug logs
- bun run lint – Lint

## Design & UX

- Clean, modern, brand colors, large touch targets
- Icons: lucide-react-native
- Styling: React Native StyleSheet only
- Mascot images in assets/images (white background friendly: keep UI white behind)

## Testing readiness

- testID on interactive components
- Error boundaries in components/ErrorBoundary
- Verbose console logs in dev

## Notes & constraints

- Expo Go v53 (no custom native modules). For non-custodial wallets via TronLink/WalletConnect, move to a custom dev build.
- Web compatibility considered; platform checks around audio/camera.

## Security

- This prototype can sign on the server using TRON_PRIVATE_KEY. Do NOT use a real key. Rotate TronGrid API keys regularly. Never commit secrets. Use Rork env variables.

## License

Internal demo scaffold. Brand assets belong to their owners.