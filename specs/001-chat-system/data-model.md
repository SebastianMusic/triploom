# Data Model: Chat System

**Phase**: 1 | **Date**: 2026-04-14 | **Plan**: [plan.md](./plan.md)

---

## Existing Database Tables (no schema changes required)

All tables already exist. This feature adds RLS policies, triggers, and a realtime
publication — no `ALTER TABLE` or `CREATE TABLE` DDL is needed.

### `group_chat` — Chat Room

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | NO | Primary key |
| `chat_name` | text | YES | Display label: "General" / group name / event title |
| `trip_id` | uuid | YES | FK → `trip.id`; always set |
| `trip_group_id` | uuid | YES | FK → `trip_group.id`; set for group chats only |
| `event_id` | uuid | YES | FK → `event.id`; set for event chats only |
| `created_at` | timestamptz | NO | Auto-set by DB |

**Chat room type** is derived from nullable FKs:

| `trip_group_id` | `event_id` | Type |
|-----------------|------------|------|
| null | null | `global` |
| set | null | `group` |
| null | set | `event` |

### `message` — Chat Message

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | NO | Primary key |
| `content` | text | YES | Message body (text only) |
| `group_chat_id` | uuid | YES | FK → `group_chat.id` |
| `user_id` | uuid | YES | FK → `profile.id` (= `auth.uid()`) |
| `created_at` | timestamptz | NO | Auto-set by DB; used for ordering + pagination |

### `chat_participant` — Room Membership + Read Receipt

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `group_chat_id` | uuid | NO | FK → `group_chat.id` (PK part 1) |
| `participant_id` | uuid | NO | FK → `trip_participant.id` (PK part 2) |
| `last_read_at` | timestamptz | YES | Null until user first opens the room; updated by `markChatRead` |

---

## FK Chain (for test setup order)

```
auth.users (auth.uid())
  └─► profile (profile.id = auth.uid())
        └─► trip_participant (trip_participant.user_id ← resolved via auth session)
              └─► chat_participant (chat_participant.participant_id = trip_participant.id)
                    └─► group_chat (group_chat.id = chat_participant.group_chat_id)
                          └─► message (message.group_chat_id = group_chat.id)

message.user_id ─► profile.id  (sender identity for display name)
```

Integration tests must create records in this dependency order:
1. `createTestUser()` → auth user + profile
2. Create `trip` → triggers create global `group_chat` + adds organizer as `chat_participant`
3. Create `trip_participant` → trigger adds participant to global `chat_participant`
4. (For event tests) Create `event` → trigger creates event `group_chat`
5. (For event tests) Create `event_participation` → trigger adds participant to event `chat_participant`
6. (For group tests) Create `trip_group` → trigger creates group `group_chat`
7. (For group tests) Create `group_membership` → trigger adds participant to group `chat_participant`

---

## TypeScript Types

### Base types (already exported from `types/index.ts`)

```ts
export type GroupChat = Tables<'group_chat'>;
export type Message = Tables<'message'>;
export type ChatParticipant = Tables<'chat_participant'>;
```

### New derived types (add to `types/chat.types.ts` and re-export from `types/index.ts`)

```ts
import { z } from 'zod';
import type { MessageInsert } from '@/types';

// DTO for sending a message (form validation boundary)
export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(2000),
  group_chat_id: z.string().uuid(),
}) satisfies z.ZodType<Pick<MessageInsert, 'content' | 'group_chat_id'>>;

export type SendMessageDTO = z.infer<typeof sendMessageSchema>;

// Message enriched with the sender's display name (from profile JOIN)
export type MessageWithSender = {
  id: string;
  content: string | null;
  created_at: string;
  group_chat_id: string | null;
  user_id: string | null;
  senderName: string | null;
};

// Chat room enriched with unread status and last activity (from getAllChatRooms)
export type ChatRoomWithMeta = {
  id: string;
  chat_name: string | null;   // display label
  trip_id: string | null;
  trip_group_id: string | null;
  event_id: string | null;
  created_at: string;
  hasUnread: boolean;          // true if any message.created_at > last_read_at
  lastActivityAt: string | null; // created_at of the most recent message
};
```

---

## Validation Rules

| Field | Rule | Source |
|-------|------|--------|
| `message.content` | Non-empty string, max 2000 chars | sendMessageSchema |
| `message.group_chat_id` | Valid UUID; user must be in `chat_participant` for this room | RLS policy |
| `message.user_id` | Must equal `auth.uid()` | RLS `with check` |
| `chat_participant.last_read_at` | ISO 8601 timestamp; only the owning participant may update | RLS policy |

---

## State Transitions

```
[room closed]
    │
    ▼ openChatRoom(roomId)
[room open, loading]
    │ getAllMessages() completes + Realtime channel subscribed
    ▼
[room open, messages loaded]
    │
    ├─► user sends message ──► sendMessage() ──► optimistic add or wait for realtime
    │
    ├─► realtime INSERT event ──► addMessage() prepends to messages list
    │
    ├─► user scrolls to top ──► loadMoreMessages() ──► prepend older batch
    │
    └─► user leaves screen ──► closeChatRoom() ──► unsubscribe channel + clear messages
```

---

## Re-evaluation: Constitution Check Post-Design

| Principle | Status |
|-----------|--------|
| I. Layered Architecture | PASS — no component touches Supabase; all DB access in `chat.service.ts` |
| II. Test-First Development | PASS — integration tests for every service function before UI screens |
| V. Security Boundary | PASS — all tables have RLS policies documented in research.md; no service role key in app code |

No new violations introduced by the design.
