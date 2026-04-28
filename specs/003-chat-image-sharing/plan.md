# Implementation Plan: Chat Image Sharing

**Branch**: `003-chat-image-sharing` | **Date**: 2026-04-27 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `specs/003-chat-image-sharing/spec.md`

## Summary

TripParticipants can attach up to 10 images per chat message, optionally with text. Images are uploaded to a private Supabase Storage bucket (`chat_images`), stored as paths in the `chat_image` table (linked to the message), and displayed as a 2-column thumbnail grid in the message bubble ("+N" overflow for >4 images). Tapping any image opens a full-screen swipe gallery. The existing layered architecture (service → store → component) is extended. No new npm packages are required — `expo-image-picker` and `expo-image` are already installed.

## Technical Context

**Language/Version**: TypeScript 5  
**Primary Dependencies**: React Native, Expo Router, `@supabase/supabase-js`, Zustand, Zod v4, `expo-image-picker` (~17.0.10), `expo-image` (~3.0.11)  
**Storage**: Supabase PostgreSQL (`message`, `chat_image` tables) + Supabase Storage (`chat_images` bucket, private)  
**Testing**: Jest, integration tests against hosted Supabase (project ID: `ccyrwyfmijmqijpyvefo`)  
**Target Platform**: iOS + Android (React Native / Expo)  
**Project Type**: Mobile app  
**Performance Goals**: SC-001: select + send ≤30s; SC-002: images visible to participants ≤5s; SC-003: viewer opens ≤1s  
**Constraints**: Max 10 images/message (client-enforced); image-only messages allowed; private bucket (authenticated participants only)  
**Scale/Scope**: Per-trip chat rooms; same user base as existing chat system

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Layered Architecture | ✅ PASS | Components call store only; store calls service; service calls Supabase |
| II. Test-First | ✅ PASS | `__integration__/chat-images.test.ts` must be green before any UI work |
| III. Naming | ✅ PASS | New service functions: `uploadChatImage`, `deleteUploadedImages`; store state mirrors service verbs |
| IV. Error Handling | ✅ PASS | Services throw; store catches, resets loading flags, re-throws |
| V. Security Boundary | ✅ PASS | `service_role` key only in integration tests; app uses anon key; `chat_images` bucket is private |
| VI. Commit Discipline | ✅ PASS | Commit after migration, after integration tests pass, after each phase |

## Project Structure

### Documentation (this feature)

```text
specs/003-chat-image-sharing/
├── plan.md              # This file
├── research.md          # Phase 0 — library choices, storage patterns, RLS SQL
├── data-model.md        # Phase 1 — migration SQL, type changes, entity diagram
├── quickstart.md        # Phase 1 — setup and development walkthrough
├── contracts/
│   ├── chat-service.md  # Phase 1 — service and store function contracts
│   └── components.md    # Phase 1 — component props and behaviour contracts
└── tasks.md             # Phase 2 output (created by /speckit.tasks — NOT yet)
```

### Source Code Changes

```text
types/
└── chat.types.ts              # Update: MessageImage type; MessageWithSender.images[]; SendMessageDTO

__integration__/
└── chat-images.test.ts        # New: integration tests for upload, send, receive, RLS

services/
└── chat.service.ts            # Update: sendMessage + getAllMessages; New: uploadChatImage, deleteUploadedImages

store/
└── chat.store.ts              # Update: sendMessage action + isUploadingImages state; closeChatRoom cancels upload

components/chat/
├── message-bubble.tsx         # Update: render MessageImageGrid; add onImagePress prop
├── message-input.tsx          # Update: image picker button, thumbnail strip, upload progress
├── image-thumbnail-strip.tsx  # New: pre-send preview with remove-per-image buttons
├── message-image-grid.tsx     # New: 2-column grid in bubble, +N overflow tile
└── image-viewer.tsx           # New: full-screen swipe gallery (Modal + FlatList)

app/(app)/(trip)/chat/
└── [roomId].tsx               # Update: pending images state, viewer state, wire to store
```

**Structure Decision**: Single Expo app — no new directories. All changes are additive to the existing `chat` domain.

## Implementation Phases

### Phase 0 — Database & Migration (before all code)

1. Apply migration from `data-model.md`:
   - Add `created_at` to `chat_image`
   - Make `message_id NOT NULL`, add `ON DELETE CASCADE`
   - Enable RLS + 3 policies on `chat_image`
   - Create `chat_images` storage bucket (private) + 3 storage policies
2. Regenerate `types/database.types.ts`
3. Commit: `chore(db): add chat_image migration and chat_images storage bucket`

### Phase 1 — Types + Service + Integration Tests

**Do in this order (constitution §II: tests first):**

1. Update `types/chat.types.ts` — `MessageImage`, `MessageWithSender.images`, `sendMessageSchema`
2. Write `__integration__/chat-images.test.ts` — all tests initially fail (Red)
3. Implement `chat.service.ts` changes — `uploadChatImage`, `deleteUploadedImages`, update `sendMessage` and `getAllMessages`
4. Run integration tests → all Green
5. Commit: `feat(chat): add image upload service and integration tests`

### Phase 2 — Store

1. Update `store/chat.store.ts`:
   - Add `isUploadingImages`, `uploadProgress` state
   - Add `uploadCancelledRef` module-level ref
   - Update `sendMessage` action: upload loop → paths → service
   - Update `closeChatRoom`: set cancel flag
2. Commit: `feat(chat): update chat store for image sending`

### Phase 3 — New UI Components

Build new components (no dependencies on Phase 2 changes to existing components):

1. `components/chat/image-thumbnail-strip.tsx`
2. `components/chat/message-image-grid.tsx`
3. `components/chat/image-viewer.tsx`
4. Commit: `feat(chat): add image thumbnail strip, grid, and viewer components`

### Phase 4 — Wire Up Existing Components & Screen

1. `components/chat/message-bubble.tsx` — add `MessageImageGrid` + `onImagePress`
2. `components/chat/message-input.tsx` — add picker button, thumbnail strip, upload progress
3. `app/(app)/(trip)/chat/[roomId].tsx` — pending images state, viewer state, wire to store
4. Commit: `feat(chat): wire image sending and viewing into chat screen`

### Phase 5 — Smoke Test & Polish

1. Manual smoke test (see `quickstart.md` Step 8)
2. Fix any regressions in existing message send/edit/delete flows
3. Final commit and PR

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Upload timing | Upload before message insert | Avoids orphaned messages; simpler error path |
| Atomicity | Compensating delete if image insert fails | Simpler than RPC; acceptable given low failure probability |
| Gallery viewer | Modal + FlatList `pagingEnabled` | No new dependencies; built-in RN |
| Image ordering | Insertion order (`created_at ASC`) | Clarification Q1; matches user selection order |
| Storage access | Private bucket + signed URLs (1h) | Clarification Q2; matches `event_banner` pattern |
| Navigate-away | Cancel upload + cleanup | Clarification Q4; simpler than background upload |
| Multi-image layout | 2-column grid, 4th tile "+N" overflow | Clarification Q5; standard chat app pattern |
| Pre-send preview | Thumbnail strip with per-image remove | Clarification Q3; prevents accidental sends |
