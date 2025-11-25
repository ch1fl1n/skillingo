## Purpose
This file gives focused, actionable guidance for an AI coding agent working in the Skillingo repo so you can be productive immediately.

Read this before editing code: it highlights architecture, common patterns, testing/run flows, and important files to reference for each change.

## Big picture
- Frontend: Expo React Native (TypeScript) + Expo Router. UI lives in `app/` (route files under `app/` and `app/(tabs)/`).
- Backend: Supabase (Postgres). DB migrations under `supabase/migrations/`. Client helpers and RPC wrappers live in `lib/supabase.ts`.
- Patterns: client state via React hooks (see `hooks/`), persistent small UX state via `AsyncStorage` (keys in components), and realtime updates using Supabase realtime subscriptions.

## Key files and why they matter
- `app/(tabs)/_layout.tsx` — top-level tab layout and where small header components (like wallet badges) are placed.
- `components/RandomBook.tsx` — floating draggable bubble (uses `PanResponder`, `Animated`, `AsyncStorage` keys `@RandomBook:pos`, `@RandomBook:collapsed`, `@RandomBook:book`). Touch/drag logic live here.
- `components/BombillosBadge.tsx` — UI badge for the in-game currency; subscribes to wallet updates and shows balance.
- `lib/supabase.ts` — central Supabase client and helpers. New wallet helpers are: `getBombillosBalance`, `getBombillosTransactions`, `createBombillosTransaction`, `subscribeToWallet` (call these to exercise RPC and realtime behavior).
- `supabase/migrations/*.sql` — migration SQL for wallets and transactions. When updating migrations, prefer idempotent patches and test in Supabase SQL editor.
- `app/community/[postId].tsx` and `hooks/useCommunity.ts` — community post UI + hooks for comments/likes; keep single source-of-truth (hooks) instead of duplicating local state.

## Conventions & project-specific patterns
- Data fetching / side effects: use small hooks in `hooks/` when data is shared (e.g., community comments). Avoid duplicating state in route components.
- Persistence: components may persist UI state to `AsyncStorage` with explicit keys. Search for `@RandomBook:` in repo to find the bubble keys.
- Server enforcement: critical business logic lives in DB migrations / RPCs (e.g., `create_wallet_transaction` enforces 0..1000 bombillos). Don't implement security-sensitive checks only client-side.
- SQL quirks: target environment is Supabase/Postgres — migrations have been adjusted (avoid `CREATE POLICY IF NOT EXISTS`; use `DROP POLICY IF EXISTS` + `CREATE POLICY`; INSERT policies accept only `WITH CHECK`). Test migrations in Supabase SQL Editor.

## Typical developer workflows (commands)
- Install dependencies:
  - `npm install`
- Start Expo dev server (Metro):
  - `npx expo start -c` (use `-c` to clear cache if you see stale bundle issues)
- Run on device/emulator: use Expo QR or `npm run ios` / `npm run android` if configured in `package.json`.
- Apply migrations to Supabase:
  - Easiest: open Supabase project → SQL Editor → paste `supabase/migrations/<file>.sql` and run.
  - If using Supabase CLI in CI: `supabase db push` or `supabase migration apply` depending on repo setup. Confirm `authenticated` role permissions after migration (RPC grants).

## How to test the Bombillos flow locally
1. Apply the SQL migration to your Supabase instance (see `supabase/migrations/20251125_create_bombillos_wallets.sql`).
2. Sign in with the app (use `useAuth()` flows).
3. Use `lib/supabase.createBombillosTransaction({ amount, type, idempotencyKey, metadata })` from a debug screen or console to exercise the RPC.
4. Observe `components/BombillosBadge.tsx` or call `lib/supabase.getBombillosBalance()` to verify balance changes.

## Common problems & quick solutions
- Bubble disappears on mobile: check `components/RandomBook.tsx` for `useWindowDimensions` vs `Dimensions` fallbacks and `Animated` initialization. Ensure `animatedPos` is initialized with numeric values.
- SQL errors on migrations: if Supabase reports syntax errors, open the migration and review dollar-quoting and policy creation — we've patched common issues already (see migration file comments).
- React hooks lint warnings: some environments may not include `react-hooks/exhaustive-deps` in ESLint config; ignore or add rule if required.

## Safe edit checklist for AI agents
1. Read the relevant routing file in `app/` and any hooks in `hooks/` used by that route.
2. If changing persistent UI state (AsyncStorage), search for matching keys (e.g., `@RandomBook:`) and update storage reads/writes consistently.
3. For server-side changes, update `supabase/migrations/` and prefer running them in a staging Supabase project first.
4. Preserve RLS and RPC semantics: don't move enforcement from DB to client.
5. Run `npx expo start -c` and check Metro logs for runtime errors; copy relevant stack traces when asking for help.

## Where to look for more context
- `lib/` for low-level integrations (Supabase, auth, storage).
- `components/` for shared UI building blocks.
- `app/` for routes — follow the Expo Router file conventions.
- `supabase/migrations/` for authoritative DB schema and server logic.

Feedback
If any section is unclear or you want more examples (e.g., a short checklist for adding a new RPC + client helper), tell me which area and I will refine the file.
