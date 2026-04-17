# Implementation Plan: Chat System

**Branch**: `001-chat-system` | **Date**: 2026-04-14 | **Spec**: [spec.md](./spec.md)
**Input**: Real-time chat system with three chat types: trip global chat, group chat, and event chat.

## Summary

Implement a real-time chat system on top of the existing `group_chat`, `message`, and
`chat_participant` Supabase tables. Three room types are distinguished by which FK is set
on `group_chat`: global (trip_id only), group (+ trip_group_id), event (+ event_id).
Chat rooms and participant memberships are auto-created via PostgreSQL triggers.
Real-time message delivery uses Supabase Realtime channels. Unread dot indicators are
driven by `chat_participant.last_read_at`.

## Technical Context

**Language/Version**: TypeScript 5 / React Native (Expo SDK)
**Primary Dependencies**: Expo Router (file-based routing), @supabase/supabase-js (Postgres + Realtime + RLS), Zustand (state), Zod v4 (validation)
**Storage**: PostgreSQL (Supabase) — tables: `group_chat`, `message`, `chat_participant`, `profile`, `trip_participant`, `event_participation`, `group_membership`, `trip_group`, `event`
**Testing**: Jest unit tests (`services/__tests__/`) + integration tests against real Supabase (`__integration__/`)
**Target Platform**: iOS + Android (React Native / Expo)
**Performance Goals**: New message visible to other participants within 3 seconds under normal network (SC-001)
**Constraints**: Anon key only in app bundle; RLS authoritative; service role key in `__integration__/` only; no `any` in production code
**Scale/Scope**: Trip-scoped rooms; 50 messages per page; three room types per trip

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Layered Architecture | PASS | `chat.service.ts` and `chat.store.ts` stubs already exist; no component will call Supabase directly |
| II. Test-First Development | PASS | Integration tests written before any UI screen is implemented |
| III. Naming Conventions | PASS | Service: `chat.service.ts`, store: `chat.store.ts`, components: `kebab-case.tsx`, verbs: `getAll`/`send`/`markChatRead` |
| IV. Error Handling Contract | PASS | Services throw; stores catch + reset `isLoading` + re-throw; UI is only catch boundary |
| V. Security Boundary | PASS | App uses anon key; service role key confined to `__integration__/`; all tables require RLS policies before queries succeed |
| VI. Commit Discipline | PASS | Savepoint committed before this session; commit after each passing task group |

No violations. No complexity justification required.

## Project Structure

### Documentation (this feature)

```text
specs/001-chat-system/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── service-interface.md   # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code

```text
types/
└── chat.types.ts          # Add SendMessageDTO schema + derived UI types

services/
└── chat.service.ts        # Implement: getAllChatRooms, getAllMessages,
                           #            sendMessage, subscribeToMessages, markChatRead

store/
└── chat.store.ts          # Implement: getAllChatRooms, getAllMessages, loadMoreMessages,
                           #            sendMessage, openChatRoom, closeChatRoom, addMessage

services/__tests__/
└── chat.service.test.ts   # Unit tests (Supabase mocked)

__integration__/
└── chat.test.ts           # Integration tests against real Supabase

app/(app)/(trip)/chat/
├── index.tsx              # Chat room list screen (currently a placeholder)
└── [roomId].tsx           # Message view screen (new)

components/
├── chat-room-list-item.tsx  # Room row: name, unread dot, last activity
├── message-bubble.tsx       # Single message: sender name, content, timestamp
└── message-input.tsx        # Text input + send button
```

**DB migrations** (applied directly via `mcp__supabase__apply_migration` — Supabase MCP is connected):

DB state verified 2026-04-14: all chat tables exist with RLS enabled, but no triggers,
no RLS policies on chat tables, and `message` is not yet in the realtime publication.
All four migrations are confirmed needed.

```text
1. chat_rls_policies        — SELECT/INSERT policies for group_chat, message, chat_participant
2. chat_room_triggers       — Auto-create group_chat row on trip/event/trip_group INSERT
3. chat_participant_triggers — Auto-add chat_participant row on trip_participant/
                               event_participation/group_membership INSERT
4. message_realtime         — Add message table to supabase_realtime publication
```

## Complexity Tracking

No constitution violations. Table omitted.
