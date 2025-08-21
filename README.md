# HeySalad Wallet (TRON)

Mobile-first TRON wallet prototype with food/social payments. Runs in Expo Go v53 and web preview. Backend: Hono + tRPC at /api. Features wallet, Payments, Social Split (IOUs), Rewards, and basic voice.

## At-a-glance
- Frontend: Expo Router + React Native (web compatible), TypeScript, React Query (via tRPC), lucide-react-native icons, RN StyleSheet
- Backend: Hono server with tRPC procedures under /api/trpc
- Chain: TRON via TronGrid (read), server-assisted signing for prototype sends

## Architecture
Client
- App shell: Expo Router with Tabs: Wallet, Payments, Social, Rewards
- Providers: React Query, AuthProvider, WalletProvider
- Data: tRPC client (lib/trpc.ts) pointing to EXPO_PUBLIC_RORK_API_BASE_URL
- Error Handling: RorkErrorBoundary (components/ErrorBoundary)
- Media/AI: Voice scaffold (features/voice) using utils/ai tool endpoints

Server
- backend/hono.ts mounts Hono app and tRPC router at /api
- backend/trpc/app-router.ts composes procedures
- TRON routes: backend/trpc/routes/tron/*
  - getAccount: fetch account/balances via TronGrid
  - getTransactions: fetch tx history via TronGrid
  - sendTrx: build, sign (with TRON_PRIVATE_KEY), broadcast

Data flow
1) UI calls trpc().tron.getAccount / getTransactions / sendTrx
2) Hono+tRPC handler runs server logic
3) External calls to TronGrid using EXPO_PUBLIC_TRONGRID_URL + EXPO_PUBLIC_TRONGRID_API_KEY
4) For sends, server signs with TRON_PRIVATE_KEY and returns txid

Security note
- TRON_PRIVATE_KEY is server-side only and used for demo signing. Never use real funds/keys.

## Project structure
- app/
  - _layout.tsx: Root layout (providers)
  - (tabs)/_layout.tsx: Tabs container (no header; each tab has its own stack)
  - (tabs)/(wallet)/: Wallet tab stack (balances, activity)
  - (tabs)/pay/: Payments tab stack (text, image, QR flows)
  - (tabs)/social/: Social Split tab (IOUs/requests)
  - (tabs)/rewards/: Rewards tab
  - modal.tsx: Example modal route
- components/: HSButton, HSTag, TomatoMascot, ErrorBoundary
- constants/: colors.ts (brand tokens)
- features/voice/: VoiceRecorder, intent.ts
- providers/: AuthProvider, WalletProvider
- utils/: ai.ts, format.ts
- lib/trpc.ts: tRPC client (React Query powered)
- backend/
  - hono.ts: Hono bootstrap
  - trpc/app-router.ts: root router
  - trpc/routes/tron/: getAccount, getTransactions, sendTrx

## UI overview
Design
- Clean, modern, large touch targets (≥48dp), rounded corners (50px radii)
- Brand: cherry #ed4c4c, peach #ffd0cd/#faa09a, plenty of white
- Icons: lucide-react-native; tab bar uses clear, minimal glyphs

Tabs & screens
- Wallet
  - Balance header, recent transactions
  - Pull-to-refresh; tap tx to open Tronscan on web/native via Linking
- Payments (formerly Voice Pay)
  - Text pay: enter recipient (T-addr) and amount, submit to get txid + Tronscan link
  - Image/QR pay: paste image or scan QR (web-compatible scanning is limited; fallback to image upload or text input)
  - Payment history shortcut
- Social Split (IOU)
  - Create IOUs (help requests) and track who owes whom
  - Settle actions can open Payments flow prefilled
- Rewards
  - Placeholder for streaks/perks; showcases brand visuals

Empty/error/loading states
- Each list shows skeleton/empty copy
- Errors surface user-friendly copy with Retry; dev console logs include details

Accessibility
- Sufficient color contrast, hitSlop, descriptive accessibilityLabels

## Environment variables
Create .env locally or in Rork Environment.
- EXPO_PUBLIC_RORK_API_BASE_URL: Base host, e.g. https://yourspace.rork.app
- EXPO_PUBLIC_TRONGRID_URL: TronGrid base
  - https://nile.trongrid.io (Nile testnet)
  - https://api.shasta.trongrid.io (Shasta testnet)
  - https://api.trongrid.io (Mainnet)
- EXPO_PUBLIC_TRONGRID_API_KEY: TronGrid API key
- TRON_PRIVATE_KEY: Server-only key to sign prototype txs (test funds only). PRIVATE_KEY alias is also read if present.

See .env.example for a template. Never commit real keys.

## Development
- bun install
- bun run start       # Expo dev with tunnel
- bun run start-web   # Web preview
- lint: bun run lint

Run the app in Expo Go (v53). Web runs via React Native Web.

## Payments flow (txid + Tronscan)
- After sendTrx succeeds, the UI shows returned txid and a deep-link to Tronscan:
  - Nile: https://nile.tronscan.org/#/transaction/<txid>
  - Mainnet: https://tronscan.org/#/transaction/<txid>
- Linking opens the explorer in the system browser on native and a new tab on web.

## State management
- Server state via React Query (tRPC hooks)
- Local component state with useState
- Shared UI/app state via providers in providers/* using @nkzw/create-context-hook
- Persistence: keep minimal; secrets never stored client-side

## Error handling & testing
- components/ErrorBoundary wraps routes; renders friendly fallback
- All network calls show toasts or inline errors, with Retry
- testID props included on interactives to enable E2E/automation
- Verbose console logs in dev builds

## Web compatibility notes
- Camera/audio APIs are limited on web; QR scanning uses fallbacks (image upload or manual input)
- Avoids native-only modules; Expo Go v53 compatible

## Troubleshooting
- Splash screen stuck on iOS build (dev)
  - Ensure no unhandled promise rejections in layout/providers
  - Verify env vars exist in the runtime (EXPO_PUBLIC_* must be defined before start)
  - Check tRPC base URL resolves from device (tunnel active)
- TRPCClientError: Failed to sign transaction
  - Confirm TRON_PRIVATE_KEY is present in the server env (Rork) and matches the target network
  - Ensure EXPO_PUBLIC_TRONGRID_URL points to the correct network (e.g., Nile) and API key is valid

## Constraints
- Expo Go v53: no custom native modules; use web-compatible APIs
- For production-grade wallet (non-custodial, on-device signing), move to custom dev build + wallet SDKs

## License
Internal demo scaffold. Brand assets belong to their owners.