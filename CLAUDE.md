# Triploom Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-14

## Active Technologies

- TypeScript 5, React Native, Expo Router (file-based routing)
- Supabase (PostgreSQL + Realtime + RLS) via `@supabase/supabase-js`
- Zustand (state management), Zod v4 (validation)

## Project Structure

```text
app/              # Expo Router screens (file-based routing)
  (auth)/         # Sign-in / sign-up screens
  (app)/
    (no-trip)/    # Screens shown before a trip is selected
    (trip)/       # Screens scoped to the active trip
      chat/       # Chat room list + message view
      events/
      tasks/
      home/
      profile/
components/       # Shared React Native components (kebab-case.tsx)
services/         # Supabase access layer (domain.service.ts)
  __tests__/      # Unit tests with mocked Supabase
store/            # Zustand stores (domain.store.ts)
types/            # Zod schemas, DTOs, and re-exported Supabase types
  index.ts        # Single import point for all types
  database.types.ts  # Auto-generated from Supabase (do not edit manually)
lib/              # Supabase client instances (supabase.ts, supabase.admin.ts)
__integration__/  # Integration tests against real hosted Supabase
  helpers/
    user.ts       # createTestUser() — auth + profile setup for tests
```

## Commands

```bash
npm test                     # All tests (unit + integration)
npx jest chat --no-coverage  # Run only chat-related tests
npx jest --no-coverage       # Skip coverage report (faster)
npm run test:watch           # Watch mode during development
```

Regenerate database types:
```bash
npx supabase gen types --lang=typescript --project-id <project-id> > types/database.types.ts
```

## Architecture Rules (from constitution)

**Data flow**: Component → Zustand Store → Service → Supabase. No layer may be skipped.

**Services**: Only layer that calls Supabase. Always `throw error`. Never hold state.

**Stores**: Call services. Catch errors, reset `isLoading: false`, re-throw. No business logic.

**UI**: Only catch boundary for errors. Never call services or Supabase directly.

**RLS**: Authoritative access control. Every table must have policies. If an integration test fails with an RLS error, add a policy via `mcp__supabase__apply_migration` — do not change the test.

**Tests first**: Integration tests must pass before any UI screen is written.

## Code Style

- **Zod v4**: Use `result.error.issues[0].message` — not `.errors`
- **No `any`** in `app/`, `components/`, `services/`, `store/`, `lib/`, `hooks/`
- **Table names**: singular — `trip`, `event`, `message`, `profile`
- **Service verbs**: `create` / `getAll` (list) / `get` (single) / `update` / `delete`
- **Store action names** must mirror service function names exactly
- **Prop callbacks**: `onPress` / `onChange` / `onSubmit` — never `handle*` or `onClick`
- **Supabase inserts**: Always call `.select().single()` after insert/update to get the persisted row

## Active Features

- **001-chat-system** (`branch: 001-chat-system`):
  Real-time chat with global, group, and event room types.
  Uses `group_chat`, `message`, `chat_participant` tables.
  Realtime via Supabase channels. Unread indicator via `last_read_at`.
  See `specs/001-chat-system/` for full plan and contracts.

## Recent Changes

- 001-chat-system: Full implementation plan created (plan.md, research.md, data-model.md, contracts/, quickstart.md)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
