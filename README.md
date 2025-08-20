# HeySalad® Wallet (TRON) – Expo + Expo Router + Hono + tRPC

A mobile-first, cross‑platform wallet focused on food payments. Built with Expo (Go v53) and React Native Web. Includes voice commands, AI intent parsing, social bill splitting, sustainable purchase rewards, and a lightweight backend powered by Hono + tRPC.

Brand colors: cherry red #ed4c4c, peach #ffd0cd and #faa09a. Buttons are large and friendly (50px radii).

## Quick start

Prereqs: Node 18+, Bun, Expo Go app on your device.

- Install deps: bun install
- Start mobile (with tunnel): bun run start
- Start web: bun run start-web

Scan the QR with Expo Go to run on iOS/Android. Web preview runs via React Native Web.

## Scripts

- bun run start – Dev server with tunnel
- bun run start-web – Web preview with tunnel
- bun run start-web-dev – Web preview with Expo debug logs
- bun run lint – Lint

## Project layout

- app/ – Expo Router routes
  - _layout.tsx – Root stack
  - (tabs)/ – Tab navigation
    - (wallet)/ – Wallet home stack
    - pay/, social/, rewards/ – Feature areas
  - modal.tsx – Example modal route
- components/ – Reusable UI (ErrorBoundary, HSButton, HSTag)
- constants/ – Theme tokens (colors.ts)
- features/voice/ – Voice recording + intent parsing
- providers/ – App providers (WalletProvider)
- utils/ – Helpers (format, ai)
- backend/ – Hono + tRPC server
  - hono.ts – Hono app mounted at /api
  - trpc/app-router.ts – tRPC router
  - trpc/routes/... – tRPC procedures
- lib/trpc.ts – React tRPC client and helpers

## Backend (Hono + tRPC)

The dev server mounts the backend at /api. tRPC endpoints are available under /api/trpc.

- Add a new procedure: create a file under backend/trpc/routes/<area>/<name>/route.ts and export a procedure.
- Register it in backend/trpc/app-router.ts.
- Call from React using trpc from lib/trpc.ts:

Example:

```
import { trpc } from '@/lib/trpc';

export function Example() {
  const hi = trpc.example.hi.useQuery();
  if (hi.isLoading) return null;
  return <Text testID="hi-text">{hi.data?.message}</Text>;
}
```

Non-React usage (server utilities):

```
import { trpcClient } from '@/lib/trpc';
const data = await trpcClient.example.hi.query();
```

## Voice + AI

- Recording: features/voice/VoiceRecorder.tsx uses expo-av on mobile and Web APIs on web.
- STT: utils/ai.ts posts audio to https://toolkit.rork.com/stt/transcribe/.
- LLM: utils/ai.ts calls https://toolkit.rork.com/text/llm/ to parse intents like “send 5 TRX to Alice”.
- Intent parsing: features/voice/intent.ts returns a typed ParsedIntent or null when unrecognized.

Notes
- On web, MediaRecorder is used; on mobile, expo-av is used. Recording formats are configured per platform.
- After recording, audio is uploaded via FormData as { uri, name, type } on mobile.

## Wallet features

- TRON wallet shell with mobile-first UI
- AI-powered food payments (natural language to actions)
- Smart categorization for food expenses
- Social bill splitting for cooking together
- Token rewards for sustainable purchases
- Friendly, supportive tone throughout; 50px rounded buttons; brand colors applied

## Design guidelines

- Colors: cherry #ed4c4c, peaches #ffd0cd and #faa09a
- Clean, modern UI; large touch targets, generous spacing
- Icons: lucide-react-native
- Styling: React Native StyleSheet only

## State & data

- React Query for server state
- Local UI state via useState with explicit types
- Shared app state via @nkzw/create-context-hook providers
- AsyncStorage for minimal persistence when necessary

## Routing

- Expo Router with tab-based navigation inside app/(tabs)
- Each tab can host its own stack; headers belong to stacks, not the Tabs container
- For full-screen routes outside tabs, create top-level files under app/

## Web compatibility

- Avoid native-only Expo APIs on web; use Platform checks where needed
- Limited/partial web support: see comments in features using camera, audio, notifications
- Prefer React Native Animated for simple animations; avoid reanimated-only web patterns

## Testing readiness

- testID props exist on interactive components
- Error boundaries: components/ErrorBoundary.tsx wraps critical trees
- Console logs are verbose in dev for debugging

## Development tips

- TypeScript strict: always annotate useState and verify types exist before use
- Don’t add native modules not included in Expo Go v53
- If bundling fails, clear cache and restart: stop server, then run bun run start again

## Environment & limits

- Expo Go v53 (no custom native packages beyond Expo SDK)
- No EAS/Git/Simulators from this environment; run on device via QR or in web preview

## License & attribution

HeySalad® Wallet is an internal demo app scaffold for food payments on TRON. Brand assets and name are property of their respective owners.