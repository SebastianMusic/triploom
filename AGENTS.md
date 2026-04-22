# Agent Guide — Triploom

This document captures the workflow and hard-won learnings for implementing features in this project. Read it before writing code.

---

## Feature implementation workflow

Every feature follows this exact order. Do not skip layers or implement them out of order — tests at each step tell you if the layer is correct before you build the next one.

**UI/design work:** Before changing screens, components, layout, colors, spacing, cards, images, navigation chrome, or reusable UI primitives, read `constants/README.md`. It defines the app's design-token rules, 60-30-10 color model, visual composition rules, and when to use large image/content surfaces.

```
1. types/          — Zod schema + DTO
2. services/       — Supabase call using the DTO
3. store/          — Zustand action calling the service
4. tests           — unit + integration (run before touching UI)
5. UI              — screen/component using the store action
```

### Why tests before UI

Writing tests after UI is almost useless in an agentic workflow. You want to know your service and store are correct *before* wiring them to a screen. If the integration test passes, the feature works against the real database. The UI is then just display logic.

---

## 1. Types — `types/<domain>.types.ts`

Use Zod for any data that crosses a system boundary (form input). Use the `satisfies` constraint to anchor the schema to the Supabase-generated Insert type — this makes TypeScript catch drift when the schema is regenerated.

```ts
import { z } from 'zod';
import type { TripInsert } from '@/types';

export const createTripSchema = z.object({
  name: z.string().min(1, 'Trip name is required'),
  description: z.string().nullable().optional(),
}) satisfies z.ZodType<Omit<TripInsert, 'id' | 'created_at' | 'organizer_id'>>;

export type CreateTripDTO = z.infer<typeof createTripSchema>;
```

**Rules:**
- Exclude server-set fields from the schema: `id`, `created_at`, and any FK set from the auth session (e.g. `organizer_id`)
- The Supabase `Insert` types are for the internal contract *inside* the service — they are not the DTO
- Export the schema and DTO from `types/index.ts` so imports stay clean

**Zod v4 gotcha:** Use `result.error.issues[0].message` — not `.errors`. Zod v4 renamed the array.

---

## 2. Service — `services/<domain>.service.ts`

The service is the only place that talks to Supabase. It accepts the DTO, adds server-side fields (auth session, timestamps), and calls Supabase.

```ts
import { supabase } from '@/lib/supabase';
import type { CreateTripDTO } from '@/types/trip.types';

export async function createTrip(dto: CreateTripDTO): Promise<Trip> {
  const { data: { session } } = await supabase.auth.getSession();

  const { data, error } = await supabase
    .from('trip')
    .insert({ ...dto, organizer_id: session?.user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

**Rules:**
- Always `throw error` — never swallow it. The store and UI handle error state.
- Always call `.select().single()` after insert/update to get the persisted row back
- Table names are **singular** in this project: `trip`, `event`, `task`, `message`, `profile`

---

## 3. Store — `store/<domain>.store.ts`

The store holds state and exposes actions. Actions call services — they do not call Supabase directly.

```ts
import { create } from 'zustand';
import { createTrip as createTripService } from '@/services/trip.service';
import type { CreateTripDTO } from '@/types/trip.types';

export const useTripStore = create<TripState>()((set) => ({
  trips: [],
  isLoading: false,

  createTrip: async (dto: CreateTripDTO) => {
    set({ isLoading: true });
    try {
      const trip = await createTripService(dto);
      set((state) => ({ trips: [...state.trips, trip], isLoading: false }));
      return trip;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));
```

**Rules:**
- Always reset `isLoading: false` in both the success and error path
- Re-throw errors so the UI can react to them
- Use `set((state) => ...)` (function form) when the new value depends on current state

---

## 4. Tests

Run `npm test` after implementing the service and store. Fix failures before touching the UI.

### Service tests — `__integration__/<domain>.test.ts`

**Do not mock Supabase.** All service tests run against the real hosted Supabase database. If you mock Supabase in a service test the mock will pass even when the query, schema, or RLS policy is wrong — defeating the point of the test.

Pure logic tests (e.g. Zod schema validation) that have no Supabase dependency may live in `services/__tests__/` — but they must not import or mock `@/lib/supabase`.

### Store tests — `store/__tests__/<domain>.store.test.ts`

Store tests mock the **service layer**, not Supabase. This is correct: stores should be tested in isolation from the database.

```ts
jest.mock('@/services/trip.service', () => ({
  createTrip: jest.fn(),
  getTrips: jest.fn(),
}));
```

### Integration tests — `__integration__/<domain>.test.ts`

Hit the real hosted Supabase database. These are the tests that actually prove the feature works.

```ts
import { createTestUser, type TestUser } from './helpers/user';

jest.setTimeout(15000);

let user: TestUser;
const createdIds: string[] = [];

beforeAll(async () => { user = await createTestUser(); });
afterAll(async () => {
  await getSupabaseAdmin().from('trip').delete().in('id', createdIds);
  await user.cleanup();
});

it('creates a trip', async () => {
  const trip = await createTrip({ name: 'Test Trip' });
  createdIds.push(trip.id);
  expect(trip.organizer_id).toBe(user.id);
});
```

**`createTestUser()` does the following automatically:**
1. Creates an auth user via admin API (email confirmation skipped)
2. Creates the `profile` row — required because `organizer_id` FK references `profile.id`
3. Signs in on the shared `supabase` client so `getSession()` works inside service functions
4. Returns `{ id, email, cleanup }` — call `cleanup()` in `afterAll`

**Never skip cleanup.** Test users and rows accumulate in the database otherwise.

---

## RLS — Row Level Security

Every table has RLS enabled. Without policies, even authenticated inserts are blocked. When you add a new table or feature, apply the appropriate policies via the Supabase MCP:

```sql
create policy "authenticated users can create trips"
on trip for insert to authenticated
with check (auth.uid() = organizer_id);

create policy "users can read own trips"
on trip for select to authenticated
using (auth.uid() = organizer_id);
```

**If integration tests fail with "violates row-level security policy" — add a policy, do not change the test or the service.**

Use `mcp__supabase__apply_migration` to apply policies. Do not use `execute_sql` for DDL.

---

## FK constraints

Several tables have FK chains that must be satisfied in order:

```
auth.users → profile (profile.id = auth.uid())
profile → trip (trip.organizer_id → profile.id)
trip → trip_participant, event, task, group_chat, ...
trip_participant → task_assignment, group_membership, ...
```

When writing integration tests, always create records in dependency order:
1. `createTestUser()` handles auth user + profile
2. Create the domain record (trip, event, etc.) next
3. Clean up in reverse order in `afterAll`

---

## Environment variables

| Variable | Used in | Description |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | app + tests | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_KEY` | app + tests | Anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | integration tests only | Bypasses RLS — never bundle into app |

`jest.setup.ts` loads all `.env` variables before tests run, including non-`EXPO_PUBLIC_` ones.

---

## Running tests

```bash
npm test                  # all tests (unit + integration)
npm run test:watch        # watch mode during development
npx jest trip             # run only trip-related tests
npx jest --no-coverage    # skip coverage report (faster)
```

---

## Common mistakes

| Mistake | Fix |
|---|---|
| Calling Supabase from a component | Move it to a service, call via store action |
| Using `.errors` on a Zod result | Use `.issues` — Zod v4 renamed it |
| Integration test fails with RLS error | Add a policy via `apply_migration`, do not change the test |
| Integration test fails with FK error | Check the FK chain — create parent rows first (use `createTestUser`) |
| Session is null in integration test | `createTestUser()` verifies the session — if it throws, auth is broken |
| Adding `id`, `created_at` to a Zod schema | These are server-set — exclude them from DTOs |
| Writing UI before tests pass | Tests first — always |
