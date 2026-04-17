# Tasks: Chat System

**Feature**: `001-chat-system` | **Branch**: `001-chat-system` | **Date**: 2026-04-14
**Input**: Design documents from `specs/001-chat-system/`
**Prerequisites**: plan.md ✓, spec.md ✓, data-model.md ✓, contracts/service-interface.md ✓, research.md ✓, quickstart.md ✓

**Implementation order** (from quickstart.md, enforced by constitution):
DB Migrations → Types → Service → Store → Integration Tests → UI Screens

**Tests**: Integration tests are required by constitution (test-first, tests before UI).
Unit tests (mocked Supabase) are included for the service layer.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: User story label — [US1] global chat, [US2] send/receive, [US3] event chat, [US4] group chat

---

## Phase 1: Setup

**Purpose**: Confirm working state before any implementation begins.

- [X] T001 Verify branch `001-chat-system` is active and all prior changes are committed (savepoint); confirm Supabase MCP is connected

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: DB schema (triggers + RLS + realtime) and TypeScript types. Nothing can be implemented or tested until these are in place.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 Apply migration `chat_realtime_publication` via `mcp__supabase__apply_migration`: `alter publication supabase_realtime add table message;`
- [X] T003 Apply migration `chat_room_triggers` via `mcp__supabase__apply_migration`: create `create_global_chat_for_trip`, `create_event_chat`, `create_group_chat` PL/pgSQL functions and triggers `on_trip_created` (INSERT on `trip`), `on_event_created` (INSERT on `event`), `on_trip_group_created` (INSERT on `trip_group`) — full SQL in `specs/001-chat-system/quickstart.md` Step 1 Migration 2
- [X] T004 Apply migration `chat_participant_triggers` via `mcp__supabase__apply_migration`: create `add_participant_to_global_chat`, `add_participant_to_event_chat`, `add_participant_to_group_chat` functions and triggers `on_trip_participant_joined`, `on_event_participation_created`, `on_group_membership_created` — full SQL in `specs/001-chat-system/quickstart.md` Step 1 Migration 3
- [X] T005 Apply migration `chat_rls_policies` via `mcp__supabase__apply_migration`: create 5 policies — `chat members can read their rooms` (group_chat SELECT), `chat members can read messages` (message SELECT), `chat members can send messages` (message INSERT with `user_id = auth.uid()` check), `users can read own chat memberships` (chat_participant SELECT), `users can mark chats as read` (chat_participant UPDATE) — full SQL in `specs/001-chat-system/research.md` Decision 2
- [X] T034 Apply migration `chat_get_rooms_rpc` via `mcp__supabase__apply_migration`: create `get_chat_rooms_for_trip(trip_id_param uuid)` SQL function that returns `ChatRoomWithMeta` rows with `has_unread` and `last_activity_at` computed server-side — full SQL in `specs/001-chat-system/quickstart.md` Step 1 Migration 5
- [X] T006 Verify all migrations applied via `mcp__supabase__execute_sql`: confirm 6 triggers in `information_schema.triggers`, 5 policies in `pg_policies` for group_chat/message/chat_participant, `message` in `pg_publication_tables` where `pubname = 'supabase_realtime'`, and `get_chat_rooms_for_trip` in `information_schema.routines`
- [X] T007 [P] Create `types/chat.types.ts` with `sendMessageSchema` (Zod, min 1 / max 2000 chars, uuid group_chat_id), `SendMessageDTO`, `MessageWithSender` (id, content, created_at, group_chat_id, user_id, senderName), `ChatRoomWithMeta` (id, chat_name, trip_id, trip_group_id, event_id, created_at, hasUnread, lastActivityAt) — exact shapes in `specs/001-chat-system/data-model.md` TypeScript Types section
- [X] T008 [P] Add chat type exports to `types/index.ts`: `export { sendMessageSchema } from './chat.types'` and `export type { SendMessageDTO, MessageWithSender, ChatRoomWithMeta } from './chat.types'`

**Checkpoint**: All DB objects exist, all types compile — US1 implementation can now begin.

---

## Phase 3: User Story 1 — Trip Global Chat (Priority: P1) 🎯 MVP

**Goal**: Global chat room auto-created when a trip is created; all trip participants have real-time access; non-members are denied. Proves the full pipeline (DB triggers → RLS → service → store → integration test) works end-to-end for the global room type.

**Independent Test**: Create a trip, have two participants join, verify messages sent by one appear for the other in real time — no group or event needed.

### Service Implementation (US1)

- [X] T009 [US1] Implement `getAllChatRooms(tripId)` in `services/chat.service.ts`: call `supabase.rpc('get_chat_rooms_for_trip', { trip_id_param: tripId })`, map each row to `ChatRoomWithMeta` (rename snake_case columns: `has_unread` → `hasUnread`, `last_activity_at` → `lastActivityAt`), return array; throw on error
- [X] T010 [US1] Implement `getAllMessages(roomId, page?)` in `services/chat.service.ts`: `.from('message').select('*, profile:user_id(user_name)').eq('group_chat_id', roomId).order('created_at', { ascending: false }).range(page*50, page*50+49)`, map to `MessageWithSender[]` (flatten `profile.user_name` → `senderName`), return array; throw on error
- [X] T011 [US1] Implement `sendMessage(dto)` in `services/chat.service.ts`: validate `dto` against `sendMessageSchema`, insert into `message` with `.select('*, profile:user_id(user_name)').single()`, map to `MessageWithSender`, return result; throw on error
- [X] T012 [US1] Implement `subscribeToMessages(roomId, onMessage)` in `services/chat.service.ts`: create Supabase channel `messages:${roomId}`, listen to `postgres_changes` INSERT on `message` filtered by `group_chat_id=eq.${roomId}`, call `onMessage(mapToMessageWithSender(payload.new))` on event, subscribe, return `() => supabase.removeChannel(channel)`; do not throw — channel errors surface via Supabase status
- [X] T013 [US1] Implement `markChatRead(roomId)` in `services/chat.service.ts`: `.from('chat_participant').update({ last_read_at: new Date().toISOString() }).eq('group_chat_id', roomId)` scoped to current user via RLS; throw on error

### Store Implementation (US1)

- [X] T014 [US1] Implement `store/chat.store.ts` with full `ChatState` interface from `specs/001-chat-system/contracts/service-interface.md`: state fields (`chatRooms`, `activeChatRoomId`, `messages`, `currentPage`, `isLoading`, `isSending`), all seven actions (`getAllChatRooms`, `getAllMessages`, `loadMoreMessages`, `sendMessage`, `openChatRoom`, `closeChatRoom`, `addMessage`); hold realtime unsubscribe function in a module-level `let unsubscribeRef: (() => void) | null = null` outside Zustand state; all store actions wrap service calls in try/catch, reset `isLoading: false` in catch, and re-throw; `openChatRoom` MUST also set `hasUnread: false` on the matching entry in `chatRooms` state immediately after calling `markChatRead` (so the dot clears without waiting for a `getAllChatRooms` refetch)

### Tests (US1)

- [X] T015 [P] [US1] Write unit tests in `services/__tests__/chat.service.test.ts` (Supabase mocked) covering: `getAllChatRooms` returns `ChatRoomWithMeta[]` with correct `hasUnread` logic; `markChatRead` calls update with correct args; service throws when Supabase returns error
- [X] T016 [P] [US1] Write integration tests in `__integration__/chat.test.ts` covering US1 acceptance scenarios: (1) global chat room exists after `createTestUser()` + trip insert (trigger fired), (2) `trip_participant` INSERT adds user to `chat_participant` (trigger fired), (3) `getAllChatRooms` returns global room for trip member, (4) non-member `getAllChatRooms` returns empty / denied, (5) two users can send and receive in real time (subscribe + send + await INSERT event), (6) the global chat room returned by `getAllChatRooms` has `chat_name === 'General'`
- [X] T017 [US1] Run US1 tests: `npx jest chat --no-coverage`; if RLS error → apply fix via `mcp__supabase__apply_migration` (never change the test); if FK error → verify FK chain in `data-model.md` and seed parent rows first

**Checkpoint**: US1 integration tests pass — global chat is fully functional and access-controlled.

---

## Phase 4: User Story 2 — Send and Receive Messages (Priority: P2)

**Goal**: Participants can send messages, messages are persisted and attributed, real-time delivery works across all room types, pagination loads 50 messages per batch.

**Independent Test**: Within the global chat (US1), verify a sent message is stored, attributed to the sender with their display name and timestamp, visible to other members in real time, and that scrolling up loads earlier batches.

### Tests (US2)

- [X] T018 [P] [US2] Add unit tests to `services/__tests__/chat.service.test.ts` covering: `getAllMessages` returns `MessageWithSender[]` with correct `senderName` from profile join; `sendMessage` inserts and returns persisted row; `sendMessage` throws on schema validation failure; `subscribeToMessages` calls `onMessage` on INSERT event
- [X] T019 [P] [US2] Add integration tests to `__integration__/chat.test.ts` covering US2 acceptance scenarios: (1) sent message is stored and immediately readable by all room members, (2) message row includes correct `user_id` and `senderName` resolves from profile, (3) `created_at` is set and message appears in chronological order in `getAllMessages` response, (4) non-member INSERT rejected by RLS, (5) `getAllMessages(roomId, 0)` returns ≤ 50 messages; `getAllMessages(roomId, 1)` returns older batch

### UI Components (US2) — only after integration tests pass

- [X] T020 [P] [US2] Create `components/chat-room-list-item.tsx`: accepts `room: ChatRoomWithMeta` and `onPress: () => void` props; renders `room.chat_name`, unread dot (filled circle) when `room.hasUnread === true`, and `room.lastActivityAt` formatted as relative time; no direct Supabase calls
- [X] T021 [P] [US2] Create `components/message-bubble.tsx`: accepts `message: MessageWithSender` prop; renders `message.senderName`, `message.content`, and `message.created_at` formatted as time (HH:mm); no direct Supabase calls
- [X] T022 [P] [US2] Create `components/message-input.tsx`: accepts `onSubmit: (text: string) => void` and `isSending: boolean` props; controlled text input + send button; clears input on submit; disables send button when `isSending === true` or text is empty
- [X] T023 [US2] Implement `app/(app)/(trip)/chat/index.tsx` (replace placeholder): on mount call `useChatStore().getAllChatRooms(selectedTripId)` where `selectedTripId` is read from trip store; render `FlatList` of `<ChatRoomListItem>`; `onPress` navigates to `chat/[roomId]`; show loading indicator while `isLoading`; catch store errors and show error state
- [X] T024 [US2] Implement `app/(app)/(trip)/chat/[roomId].tsx` (new file): on mount call `openChatRoom(roomId)`, on unmount call `closeChatRoom()`; render inverted `FlatList` of `<MessageBubble>` (inverted so newest is at bottom); call `loadMoreMessages(roomId)` when `onEndReached` fires on inverted list (this triggers when user scrolls to top); render `<MessageInput onSubmit={...} isSending={isSending}>`; catch errors and show error state
- [X] T025 [US2] Run integration tests: `npx jest __integration__/chat --no-coverage`; verify all US2 scenarios pass; fix RLS failures via migration if needed

**Checkpoint**: US2 integration tests pass and UI renders correctly — full send/receive flow is functional.

---

## Phase 5: User Story 3 — Event Chat (Priority: P3)

**Goal**: Each event gets a dedicated chat room auto-created on event INSERT; only event participants can access it; non-event-participants are denied. No new UI required — event chat rooms appear in the existing chat list screen using the same components.

**Independent Test**: Create an event, register two participants, verify their messages are visible only to those two and not to other trip members.

### Tests (US3)

- [X] T026 [P] [US3] Add integration tests to `__integration__/chat.test.ts` covering US3 acceptance scenarios: (1) event chat room exists after event INSERT (trigger `on_event_created` fired), (2) `event_participation` INSERT adds user to event `chat_participant` (trigger fired), (3) event participant can fetch and send in event chat, (4) trip participant NOT registered for event is denied read and write access, (5) two event participants receive each other's messages in real time via subscription, (6) the event chat room has `chat_name` equal to the event's title
- [X] T027 [US3] Run US3 integration tests: `npx jest __integration__/chat --no-coverage`; fix any RLS or trigger failures via `mcp__supabase__apply_migration`

**Checkpoint**: US3 integration tests pass — event chat is auto-created and access-controlled correctly.

---

## Phase 6: User Story 4 — Group Chat (Priority: P4)

**Goal**: Each trip group gets a dedicated chat room auto-created on trip_group INSERT; only group members can access it; non-members are denied. A participant with multiple group memberships can access each group chat independently.

**Independent Test**: Create a group with two members, verify messages are visible only to those two members and not to other trip participants outside the group.

### Tests (US4)

- [X] T028 [P] [US4] Add integration tests to `__integration__/chat.test.ts` covering US4 acceptance scenarios: (1) group chat room exists after `trip_group` INSERT (trigger `on_trip_group_created` fired), (2) `group_membership` INSERT adds user to group `chat_participant` (trigger fired), (3) group member can fetch and send in group chat, (4) trip participant not in the group is denied access, (5) participant in two groups sees both group rooms in `getAllChatRooms` and can independently send/receive in each, (6) the group chat room has `chat_name` equal to the group's name
- [X] T029 [US4] Run US4 integration tests: `npx jest __integration__/chat --no-coverage`; fix any RLS or trigger failures via `mcp__supabase__apply_migration`

**Checkpoint**: US4 integration tests pass — group chat is auto-created and access-controlled correctly.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Edge-case handling, reconnection gap-fill, and final validation.

- [X] T030 [P] Add empty state to `app/(app)/(trip)/chat/[roomId].tsx`: when `messages` array is empty and `isLoading` is false, render a prompt encouraging the first message (e.g. "No messages yet — be the first to say something!")
- [X] T031 [P] Add error state + retry button to both `app/(app)/(trip)/chat/index.tsx` and `app/(app)/(trip)/chat/[roomId].tsx`: catch errors thrown by store actions, display an error message, and provide a retry button that re-invokes the failed action
- [X] T032 Implement realtime reconnection gap-fill in `store/chat.store.ts`: track `lastSeenAt` (timestamp of the newest message in `messages`); on Supabase channel status `CHANNEL_ERROR` or `CLOSED` followed by `SUBSCRIBED`, call `getAllMessages` with a `since` parameter to backfill missed messages — update `getAllMessages` in `services/chat.service.ts` to accept optional `since: string` and add `.gt('created_at', since)` filter when provided
- [X] T035 [P] Write unit test in `store/__tests__/chat.store.test.ts` (mock `chat.service.ts`): when the `sendMessage` service throws, the store action catches the error, resets `isSending: false`, and re-throws — verify `isSending` is `false` in the caught error path
- [X] T036 [P] Add send-failure error state to `app/(app)/(trip)/chat/[roomId].tsx`: catch the error thrown by the `sendMessage` store action, display an inline error message below `<MessageInput>`, and show a retry button that re-attempts sending the same message text; clear the error when the retry succeeds or the user edits the input
- [X] T033 Run full test suite: `npm test`; all unit + integration tests must pass; resolve any remaining failures before marking feature complete

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 (DB objects + types must exist)
- **US2 (Phase 4)**: Depends on Phase 3 (service + store must be implemented)
- **US3 (Phase 5)**: Depends on Phase 4 (integration tests must be passing before more are added)
- **US4 (Phase 6)**: Depends on Phase 5 (same reasoning)
- **Polish (Phase 7)**: Depends on all user story phases

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 completes — no story dependencies
- **US2 (P2)**: Depends on US1 (service + store built in US1 phase; US2 adds tests + UI)
- **US3 (P3)**: Depends on US2 (messaging foundation must work; only adds event-specific test scenarios)
- **US4 (P4)**: Depends on US3 (group-specific scenarios; could run in parallel with US3 if staffed)

### Within Each User Story

- DB migrations before service implementation
- Service before store
- Integration tests before UI screens (constitution rule)
- Tests must pass before moving to next story

### Parallel Opportunities

- **T007** and **T008** can run in parallel (different files within Phase 2)
- **T009–T013** (service functions) can be written in parallel, but service file must be complete before store (T014)
- **T015** and **T016** can be written in parallel; T017 runs after both
- **T018** and **T019** can be written in parallel; T025 runs after both
- **T020**, **T021**, **T022** can be built in parallel; T023, T024 depend on them
- **T026** and **T028** (US3 + US4 test authoring) could run in parallel if staffed

---

## Parallel Example: Phase 2 Foundational

```bash
# Apply migrations sequentially (each depends on prior schema state):
T002 → T003 → T004 → T005 → T006

# After T006 passes, run in parallel:
Task: "Create types/chat.types.ts"     (T007)
Task: "Add exports to types/index.ts"  (T008)
```

## Parallel Example: User Story 1

```bash
# After T013 (all service functions done), run in parallel:
Task: "Implement chat.store.ts"                    (T014)
Task: "Write unit tests chat.service.test.ts"      (T015)
Task: "Write integration tests __integration__/chat.test.ts"  (T016)

# After T015 and T016 are written:
Task: "Run all chat tests and fix failures"        (T017)
```

## Parallel Example: User Story 2 (UI)

```bash
# After T019 integration tests pass (T025 not yet run), build components in parallel:
Task: "Create components/chat-room-list-item.tsx"  (T020)
Task: "Create components/message-bubble.tsx"       (T021)
Task: "Create components/message-input.tsx"        (T022)

# After T020–T022 are complete:
Task: "Implement chat/index.tsx"     (T023)
Task: "Implement chat/[roomId].tsx"  (T024)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks everything)
3. Complete Phase 3: User Story 1 (service + store + global chat integration tests)
4. **STOP and VALIDATE**: `npx jest __integration__/chat --no-coverage` — all US1 tests green
5. Proceed to US2 only after US1 integration tests pass

### Incremental Delivery

1. Phase 1 + Phase 2 → Foundation ready (DB live, types compile)
2. Phase 3 (US1) → Global chat proven via integration tests; service + store complete
3. Phase 4 (US2) → Send/receive tests pass + UI built → fully usable chat in app
4. Phase 5 (US3) → Event chats auto-wired and access-controlled
5. Phase 6 (US4) → Group chats auto-wired and access-controlled
6. Phase 7 → Polish; full suite passes

### Commit Points

Per constitution, commit after each passing task group:
- After T006 (all migrations verified)
- After T008 (types added)
- After T013 (service complete)
- After T014 (store complete)
- After T017 (US1 tests green)
- After T025 (US2 tests green + UI complete)
- After T027 (US3 tests green)
- After T029 (US4 tests green)
- After T033 (full suite green)

---

## Notes

- **RLS failures in integration tests**: Always fix via `mcp__supabase__apply_migration`. Never change the test to work around RLS.
- **FK violations in integration tests**: Create parent rows in the dependency order documented in `data-model.md` (auth user → profile → trip → trip_participant → chat_participant → message).
- **No `any`**: Production code in `app/`, `components/`, `services/`, `store/`, `lib/`, `hooks/` must have no `any` types.
- **Service role key**: Only used in `__integration__/` via `createTestUser()`. The app bundle uses the anon key only.
- **[P]** tasks operate on different files with no shared in-progress dependencies — safe to launch in parallel.
- Each story phase is independently completable and testable — stop at any checkpoint to demo/validate.
