# Research: Chat System

**Phase**: 0 | **Date**: 2026-04-14 | **Plan**: [plan.md](./plan.md)

All design decisions are documented here. No NEEDS CLARIFICATION items were carried
forward from the spec — all ambiguities were resolved in the two clarification sessions.

---

## Decision 1: Chat Room Auto-Creation Strategy

**Decision**: Use PostgreSQL triggers to auto-create `group_chat` rows and seed
`chat_participant` memberships whenever a trip, event, or group is created — and
whenever a participant joins any of those entities.

**Rationale**: Triggers keep the chat feature self-contained. The trip, event, and
group services do not need to know that a chat feature exists. Any future agent or
developer adding trip/event/group functionality gets chat rooms for free without
modifying unrelated code.

**Alternatives considered**:
- *Call chat service from trip/event/group services*: Rejected because it creates
  cross-service coupling and requires modifying already-tested code.
- *Lazy creation on first access*: Rejected because FR-001/002/003 require rooms to
  exist immediately on entity creation, not on first visit.

**Trigger list**:

| Trigger | Table | Event | Action |
|---------|-------|-------|--------|
| `on_trip_created` | `trip` | INSERT | Create `group_chat` (global, chat_name = 'General'); add organizer to `chat_participant` |
| `on_trip_participant_joined` | `trip_participant` | INSERT | Add to global `chat_participant` for that trip |
| `on_event_created` | `event` | INSERT | Create `group_chat` (event, chat_name = event.title) |
| `on_event_participation_created` | `event_participation` | INSERT | Add to event `chat_participant` |
| `on_trip_group_created` | `trip_group` | INSERT | Create `group_chat` (group, chat_name = trip_group.name) |
| `on_group_membership_created` | `group_membership` | INSERT | Add to group `chat_participant` |

---

## Decision 2: RLS Strategy

**Decision**: All access control is enforced via RLS policies that gate on the
`chat_participant` table. The policy joins `chat_participant → trip_participant` to
resolve `auth.uid()`.

**Rationale**: A single access table (`chat_participant`) keeps RLS queries simple and
consistent across all three room types. The join chain is short (one hop via
`trip_participant`) and indexed on both FKs.

**Policies required**:

```sql
-- group_chat: users can only see rooms they are a participant in
create policy "chat members can read their rooms"
on group_chat for select to authenticated
using (
  exists (
    select 1 from chat_participant cp
    join trip_participant tp on tp.id = cp.participant_id
    where cp.group_chat_id = group_chat.id
    and tp.user_id = auth.uid()
  )
);

-- message: read access gated on chat_participant membership
create policy "chat members can read messages"
on message for select to authenticated
using (
  exists (
    select 1 from chat_participant cp
    join trip_participant tp on tp.id = cp.participant_id
    where cp.group_chat_id = message.group_chat_id
    and tp.user_id = auth.uid()
  )
);

-- message: insert gated on same membership check
create policy "chat members can send messages"
on message for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from chat_participant cp
    join trip_participant tp on tp.id = cp.participant_id
    where cp.group_chat_id = message.group_chat_id
    and tp.user_id = auth.uid()
  )
);

-- chat_participant: users can read their own membership rows
create policy "users can read own chat memberships"
on chat_participant for select to authenticated
using (
  exists (
    select 1 from trip_participant tp
    where tp.id = chat_participant.participant_id
    and tp.user_id = auth.uid()
  )
);

-- chat_participant: users can update their own last_read_at
create policy "users can mark chats as read"
on chat_participant for update to authenticated
using (
  exists (
    select 1 from trip_participant tp
    where tp.id = chat_participant.participant_id
    and tp.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from trip_participant tp
    where tp.id = chat_participant.participant_id
    and tp.user_id = auth.uid()
  )
);
```

**Alternatives considered**:
- *Inline joins per room type*: Rejected — three different policy bodies for global/group/event chats would be harder to maintain and test.
- *Denormalised `user_id` on `chat_participant`*: Rejected — would require a schema change and duplicates data already in `trip_participant`.

---

## Decision 3: Realtime Channel Setup

**Decision**: One Supabase Realtime channel per open chat room, named
`messages:{group_chat_id}`. Subscribe on room open; unsubscribe on room close.
On reconnect, fetch all messages with `created_at > lastSeenTimestamp` to fill the gap.

**Rationale**: Scoped channels keep each subscription minimal. Supabase Realtime
handles WebSocket reconnection automatically; the only app-side responsibility is
fetching missed messages after reconnect.

**Implementation notes**:
- Channel listens to `postgres_changes` → `INSERT` on the `message` table, filtered
  by `group_chat_id`.
- `subscribeToMessages` in the service returns an unsubscribe callback so the store
  can clean up when `closeChatRoom` is called.
- Track `lastSeenAt` (timestamp of newest locally-held message) in the store. On
  reconnect, call `getAllMessages` with a `since` parameter to backfill.

**Alternatives considered**:
- *Single global channel for all rooms*: Rejected — would receive noise from rooms
  the user is not currently viewing.
- *Polling fallback*: Rejected — adds complexity with no benefit given Supabase
  Realtime's built-in reconnection.

---

## Decision 4: Sender Display Name Resolution

**Decision**: Fetch messages with an embedded profile join:
`supabase.from('message').select('*, profile:user_id(user_name)')`. The joined
`user_name` is flattened into a `MessageWithSender` derived type before being stored.

**Rationale**: A single query avoids a second round-trip per message batch and keeps
the service function simple. Supabase PostgREST supports nested selects natively.

**Alternatives considered**:
- *Separate profile lookup per sender*: Rejected — O(n) round-trips for n unique senders.
- *Denormalise sender name onto `message` row*: Rejected — schema change not needed;
  PostgREST join is zero-cost in terms of queries.

---

## Decision 5: Room Label Storage

**Decision**: `group_chat.chat_name` stores the display label for each room. Triggers
set it at creation time: `"General"` for global chats, `trip_group.name` for group
chats, `event.title` for event chats.

**Rationale**: Storing the label avoids a runtime JOIN to `trip_group` or `event` every
time the room list loads. The label is set once and rarely changes. If a group is
renamed, a separate trigger or service call can update `chat_name`.

**Alternatives considered**:
- *JOIN on fetch*: Rejected — adds query complexity to every room list load with no
  benefit for read-heavy access patterns.

---

## Decision 6: Pagination Strategy

**Decision**: `getAllMessages(roomId, page = 0)` uses
`.order('created_at', { ascending: false }).range(page * 50, page * 50 + 49)`,
then reverses the result array before storing so messages render oldest-at-top.

**Rationale**: Descending order + `.range()` is the most efficient pattern for
cursor-less pagination in Supabase. The client-side reverse is O(n) and trivial.
Page 0 = most recent 50; page 1 = next 50 older messages, etc.

**Alternatives considered**:
- *Cursor-based pagination using `created_at`*: Better for correctness under concurrent
  inserts, but adds complexity to the store. Deferred — acceptable for initial version.

---

## Decision 7: Unread Dot Indicator

**Decision**: A room shows the unread dot when any message exists with
`created_at > chat_participant.last_read_at` (or when `last_read_at` is null).
This is computed server-side as part of the `getAllChatRooms` query using a subquery
or view. `markChatRead` sets `last_read_at = now()`.

**Rationale**: Computing unread status server-side avoids a separate client-side pass.
A subquery on `getAllChatRooms` is acceptable given the bounded number of rooms per trip.

**Implementation**: The `getAllChatRooms` query will select:
```sql
-- approximate: actual implementation via PostgREST or custom function
select
  gc.*,
  max(m.created_at) as last_activity_at,
  exists(
    select 1 from message m2
    where m2.group_chat_id = gc.id
    and (cp.last_read_at is null or m2.created_at > cp.last_read_at)
  ) as has_unread
from group_chat gc
join chat_participant cp on cp.group_chat_id = gc.id
left join message m on m.group_chat_id = gc.id
where ...
```

**Chosen approach**: Supabase RPC function (`get_chat_rooms_for_trip`). The aggregations
(`last_activity_at`, `last_read_at` comparison, `has_unread`) combined with the
multi-table JOIN chain are too complex for PostgREST's embedded select syntax to
handle cleanly. A single SQL function encapsulates the query and returns a typed result
directly. Defined in Migration 5 (`chat_get_rooms_rpc`) — see `quickstart.md` Step 1.

Service call: `supabase.rpc('get_chat_rooms_for_trip', { trip_id_param: tripId })`

---

## Decision 8: Realtime + RLS Compatibility

**Decision**: Enable the `message` table on the `supabase_realtime` publication.
Supabase Realtime respects RLS for Postgres Changes subscriptions when RLS is enabled
on the table — no additional configuration needed.

**Rationale**: Supabase automatically filters realtime events through RLS policies when
the publication is set to filter by row security. This means users only receive realtime
events for messages in rooms they have access to.

**Action required**: Run migration to add `message` to the realtime publication:
```sql
alter publication supabase_realtime add table message;
```
