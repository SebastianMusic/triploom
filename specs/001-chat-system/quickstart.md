# Quickstart: Chat System

**Phase**: 1 | **Date**: 2026-04-14 | **Plan**: [plan.md](./plan.md)

How to implement, test, and verify the chat system feature from scratch.

---

## Prerequisites

1. `.env` contains all three variables:
   ```
   EXPO_PUBLIC_SUPABASE_URL=...
   EXPO_PUBLIC_SUPABASE_KEY=...       # anon key
   SUPABASE_SERVICE_ROLE_KEY=...      # integration tests only
   ```
2. You are on branch `001-chat-system`.
3. All previous changes are committed (savepoint).
4. Supabase MCP is connected — migrations are applied via `mcp__supabase__apply_migration`
   directly (no copy-pasting into the dashboard).

**DB state as of 2026-04-14** (verified via MCP):
- All chat tables exist with RLS enabled: `group_chat`, `message`, `chat_participant`
- No triggers exist anywhere in the schema → all trigger migrations are needed
- No RLS policies on chat tables → all policy migrations are needed
- `message` not in `supabase_realtime` publication → realtime migration is needed

---

## Implementation Order

Follow the constitution's mandatory order. Do not skip ahead to UI.

```
Step 1 — DB Migrations    Apply triggers + RLS + realtime publication
Step 2 — Types            Add SendMessageDTO schema and derived types
Step 3 — Service          Implement all five service functions
Step 4 — Store            Implement store actions
Step 5 — Tests            Run integration tests; fix RLS failures via migration (never via test changes)
Step 6 — UI               Build screens only after Step 5 passes
```

---

## Step 1: Apply DB Migrations

Apply these four migrations in order. The implementing agent calls
`mcp__supabase__apply_migration` directly — no dashboard access needed.
After each migration, verify with `mcp__supabase__execute_sql` that the
trigger/policy was created before proceeding to the next.

**Migration 1 — `chat_realtime_publication`**
```sql
alter publication supabase_realtime add table message;
```

**Migration 2 — `chat_room_triggers`**
```sql
-- Auto-create global chat room when a trip is created.
-- Note: no trip_participant rows exist yet at this point, so we only create
-- the group_chat row. The organizer is added to chat_participant when their
-- trip_participant row is inserted (handled by on_trip_participant_joined below).
create or replace function create_global_chat_for_trip()
returns trigger language plpgsql as $$
begin
  insert into group_chat (trip_id, chat_name)
  values (new.id, 'General');
  return new;
end;
$$;

create trigger on_trip_created
after insert on trip
for each row execute function create_global_chat_for_trip();

-- Auto-create event chat room when an event is created
create or replace function create_event_chat()
returns trigger language plpgsql as $$
begin
  insert into group_chat (trip_id, event_id, chat_name)
  values (new.trip_id, new.id, coalesce(new.title, 'Event Chat'));
  return new;
end;
$$;

create trigger on_event_created
after insert on event
for each row execute function create_event_chat();

-- Auto-create group chat room when a trip group is created
create or replace function create_group_chat()
returns trigger language plpgsql as $$
begin
  insert into group_chat (trip_id, trip_group_id, chat_name)
  values (new.trip_id, new.id, new.name);
  return new;
end;
$$;

create trigger on_trip_group_created
after insert on trip_group
for each row execute function create_group_chat();
```

**Migration 3 — `chat_participant_triggers`**
```sql
-- Add new trip participant to the trip's global chat
create or replace function add_participant_to_global_chat()
returns trigger language plpgsql as $$
declare
  global_chat_id uuid;
begin
  select id into global_chat_id
  from group_chat
  where trip_id = new.trip_id
  and trip_group_id is null
  and event_id is null
  limit 1;

  if global_chat_id is not null then
    insert into chat_participant (group_chat_id, participant_id)
    values (global_chat_id, new.id)
    on conflict do nothing;
  end if;

  return new;
end;
$$;

create trigger on_trip_participant_joined
after insert on trip_participant
for each row execute function add_participant_to_global_chat();

-- Add event registrant to the event chat
create or replace function add_participant_to_event_chat()
returns trigger language plpgsql as $$
declare
  event_chat_id uuid;
begin
  select id into event_chat_id
  from group_chat
  where event_id = new.event_id
  limit 1;

  if event_chat_id is not null then
    insert into chat_participant (group_chat_id, participant_id)
    values (event_chat_id, new.participant_id)
    on conflict do nothing;
  end if;

  return new;
end;
$$;

create trigger on_event_participation_created
after insert on event_participation
for each row execute function add_participant_to_event_chat();

-- Add group member to the group chat
create or replace function add_participant_to_group_chat()
returns trigger language plpgsql as $$
declare
  group_chat_room_id uuid;
begin
  select id into group_chat_room_id
  from group_chat
  where trip_group_id = new.group_id
  limit 1;

  if group_chat_room_id is not null then
    insert into chat_participant (group_chat_id, participant_id)
    values (group_chat_room_id, new.participant_id)
    on conflict do nothing;
  end if;

  return new;
end;
$$;

create trigger on_group_membership_created
after insert on group_membership
for each row execute function add_participant_to_group_chat();
```

**Migration 4 — `chat_rls_policies`**
See the full policy SQL in [../research.md](../research.md) under Decision 2.

**Migration 5 — `chat_get_rooms_rpc`**
```sql
create or replace function get_chat_rooms_for_trip(trip_id_param uuid)
returns table (
  id uuid,
  chat_name text,
  trip_id uuid,
  trip_group_id uuid,
  event_id uuid,
  created_at timestamptz,
  has_unread boolean,
  last_activity_at timestamptz
)
language sql
security invoker
stable
as $$
  select
    gc.id,
    gc.chat_name,
    gc.trip_id,
    gc.trip_group_id,
    gc.event_id,
    gc.created_at,
    exists(
      select 1 from message m
      where m.group_chat_id = gc.id
        and (cp.last_read_at is null or m.created_at > cp.last_read_at)
    ) as has_unread,
    (
      select max(m2.created_at)
      from message m2
      where m2.group_chat_id = gc.id
    ) as last_activity_at
  from group_chat gc
  join chat_participant cp on cp.group_chat_id = gc.id
  join trip_participant tp on tp.id = cp.participant_id
  where gc.trip_id = trip_id_param
    and tp.user_id = auth.uid()
  order by last_activity_at desc nulls last
$$;
```

Note: `security invoker` means the function runs as the calling user — `auth.uid()` resolves
correctly and RLS on the underlying tables is respected automatically.

**Verify all migrations applied** (run after all five migrations complete):
```sql
-- Expected: 6 rows (on_trip_created, on_event_created, on_trip_group_created,
--           on_trip_participant_joined, on_event_participation_created,
--           on_group_membership_created)
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;

-- Expected: 5 rows across group_chat, message, chat_participant
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('group_chat', 'message', 'chat_participant');

-- Expected: message appears in results
SELECT tablename FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';

-- Expected: get_chat_rooms_for_trip appears in results
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name = 'get_chat_rooms_for_trip';
```

---

## Step 2: Types

File: `types/chat.types.ts` — add `sendMessageSchema`, `SendMessageDTO`,
`MessageWithSender`, `ChatRoomWithMeta` (see [../data-model.md](../data-model.md)).

Then add to `types/index.ts`:
```ts
export { sendMessageSchema } from './chat.types';
export type { SendMessageDTO, MessageWithSender, ChatRoomWithMeta } from './chat.types';
```

---

## Step 3: Service

File: `services/chat.service.ts` — implement all five functions per
[../contracts/service-interface.md](../contracts/service-interface.md).

Key Supabase patterns:

```ts
// getAllMessages: join profile for sender name
const { data, error } = await supabase
  .from('message')
  .select('*, profile:user_id(user_name)')
  .eq('group_chat_id', roomId)
  .order('created_at', { ascending: false })
  .range(page * 50, page * 50 + 49);

// subscribeToMessages: return cleanup function
const channel = supabase
  .channel(`messages:${roomId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'message',
    filter: `group_chat_id=eq.${roomId}`,
  }, (payload) => { onMessage(mapToMessageWithSender(payload.new)); })
  .subscribe();

return () => { supabase.removeChannel(channel); };
```

---

## Step 4: Store

File: `store/chat.store.ts` — implement full state and all actions per
[../contracts/service-interface.md](../contracts/service-interface.md).

Hold the realtime unsubscribe function in a ref outside Zustand state (it is not
serialisable). One pattern:

```ts
let unsubscribeRef: (() => void) | null = null;

// In closeChatRoom action:
if (unsubscribeRef) { unsubscribeRef(); unsubscribeRef = null; }
```

---

## Step 5: Run Tests

```bash
# Unit tests (mocked Supabase)
npx jest chat.service --no-coverage

# Integration tests (real Supabase)
npx jest __integration__/chat --no-coverage
```

**If an integration test fails with "violates row-level security policy"**:
→ Add or fix the RLS policy via `mcp__supabase__apply_migration`. Do NOT change the test.

**If an integration test fails with FK violation**:
→ Verify the FK chain in `data-model.md`. Create parent rows first.

---

## Step 6: UI Screens

Only after integration tests pass:

1. `app/(app)/(trip)/chat/index.tsx` — chat room list
   - Calls `getAllChatRooms(selectedTripId)` on mount
   - Renders `<ChatRoomListItem>` per room
   - Navigates to `chat/[roomId]` on press

2. `app/(app)/(trip)/chat/[roomId].tsx` — message view
   - Calls `openChatRoom(roomId)` on mount
   - Calls `closeChatRoom()` on unmount
   - Renders `<MessageBubble>` per message in a `FlatList` (inverted for scroll-to-bottom)
   - Calls `loadMoreMessages` when `FlatList` reaches top (`onEndReached` on inverted list)
   - Renders `<MessageInput>` at bottom

---

## Verifying the Feature

End-to-end smoke test:

1. Create a trip (global chat room auto-created)
2. Two users join the trip (both added to `chat_participant`)
3. User A opens global chat → 0 messages, empty state
4. User A sends "Hello"
5. User B (in same chat) sees "Hello" appear without refresh (≤ 3s)
6. User B opens chat list → sees unread dot on global chat (if not yet viewed)
7. User B opens chat → dot disappears

Acceptance criteria from spec mapped to steps above:
- SC-001: Step 5 verifies ≤ 3s delivery
- SC-003: Attempting to access the chat as a non-member returns a rejection
- SC-004: Load 50 messages on open; scroll up triggers batch load
