# Tasks: Chat Image Sharing

**Input**: Design documents from `specs/003-chat-image-sharing/`
**Prerequisites**: plan.md ✅, spec.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1 = Send Images, US2 = View Full-Screen)
- Constitution §II: Integration tests MUST be green before any UI work begins
- Constitution §IV: UI layer is the ONLY catch boundary — every store re-throw must be caught in the screen
- Constitution §VI: Commit after each successful phase checkpoint (T004, T011, T021)

---

## Phase 1: Setup (Database + Types)

**Purpose**: Apply remaining database changes and sync TypeScript types. Blocks everything.

**⚠️ CRITICAL**: No Phase 2+ work can begin until this phase is complete.

- [ ] T001 Apply 3 RLS policies on `chat_image` table via MCP `execute_sql` (SELECT for trip participants, INSERT for message owner, DELETE for message owner) — SQL in `specs/003-chat-image-sharing/data-model.md` Step 5
- [ ] T002 Regenerate `types/database.types.ts` from hosted Supabase: `npx supabase gen types --lang=typescript --project-id ccyrwyfmijmqijpyvefo > types/database.types.ts`
- [ ] T003 Update `types/chat.types.ts`: add `MessageImage` type; add `images: MessageImage[]` to `MessageWithSender`; update `sendMessageSchema` + `SendMessageDTO` to allow null content when images present — contracts in `specs/003-chat-image-sharing/data-model.md` TypeScript section
- [ ] T004 Commit: `chore(db): add chat_image RLS policies and update types`

**Checkpoint**: DB policies active, types up-to-date, changes saved — foundation ready

---

## Phase 2: Foundational (Integration Tests + Service + Realtime Fix)

**Purpose**: Write failing tests first (constitution §II), implement service until all green, then fix the Realtime image delivery gap. No UI work may begin until this phase is complete.

**⚠️ CRITICAL**: Write tests → confirm FAIL → implement service → confirm PASS — in this exact order.

- [X] T005 Write all failing integration tests in `__integration__/chat-images.test.ts` covering: `uploadChatImage` returns storage path; `sendMessage` with images inserts `chat_image` rows and returns signed URLs; `getAllMessages` returns `images` array; image-only message succeeds; RLS blocks non-participant SELECT; RLS blocks non-owner INSERT — run `npx jest chat-images --no-coverage` and confirm RED
- [X] T006 Add `uploadChatImage(groupChatId, asset)` to `services/chat.service.ts`: fetch bytes from `asset.uri`, generate UUID, upload to `chat_images` bucket at `{groupChatId}/{uuid}`, return storage path; throw on error — contract in `specs/003-chat-image-sharing/contracts/chat-service.md`
- [X] T007 Add `deleteUploadedImages(paths)` to `services/chat.service.ts`: batch-remove objects from `chat_images` bucket; best-effort, never throws — contract in `specs/003-chat-image-sharing/contracts/chat-service.md`
- [X] T008 Update `sendMessage` in `services/chat.service.ts`: accept `imageStoragePaths?`; insert `chat_image` rows after message insert; compensating delete if insert fails; batch `createSignedUrls`; return `MessageWithSender` with `images` populated — contract in `specs/003-chat-image-sharing/contracts/chat-service.md`
- [X] T009 Update `getAllMessages` in `services/chat.service.ts`: change select to `'*, profile:user_id(user_name), chat_image(image_url, created_at)'`; batch `createSignedUrls` per message; sort images by `created_at` ASC; set `images: []` when no rows — run `npx jest chat-images --no-coverage` and confirm all GREEN before proceeding
- [X] T010 Fix Realtime image delivery in `store/chat.store.ts` — Supabase Realtime INSERT events only deliver the `message` row and do NOT include joined `chat_image` rows (recipients see messages without images until reload, breaking SC-002). In the Realtime INSERT handler, after receiving a new message event, re-fetch that single message via `chatService` using `select('*, profile:user_id(user_name), chat_image(image_url, created_at)')` + signed URL resolution before inserting it into local `messages` state. Do not call Supabase directly from the store.
- [X] T011 Commit: `feat(chat): add image upload service and integration tests`

**Checkpoint**: All integration tests green, Realtime handler updated — UI implementation can now begin

---

## Phase 3: User Story 1 — Send Images in a Chat Message (Priority: P1) 🎯 MVP

**Goal**: TripParticipant can select 1–10 images, preview them with per-image remove, optionally add text, and send. Images appear in the message bubble for all participants in real time. Image-only messages work.

**Independent Test**: Select images, send, verify bubble shows images to sender and recipient in real time (not just after reload). Test image-only message and 10-image limit enforcement. Test that upload failure preserves pending images for retry.

### Implementation for User Story 1

- [X] T01X [US1] Add `isUploadingImages: boolean` and `uploadProgress: number` state fields to `store/chat.store.ts`; add module-level `uploadCancelledRef: { current: boolean }` alongside existing `unsubscribeRef`
- [X] T01X [US1] Update `sendMessage` action in `store/chat.store.ts`: accept `imageAssets?: ImagePicker.ImagePickerAsset[]`; set `isUploadingImages: true` if images present; upload sequentially via `chatService.uploadChatImage`; increment `uploadProgress` after each upload; check `uploadCancelledRef.current` between uploads (if true → call `deleteUploadedImages(uploadedSoFar)` → set `isUploadingImages: false`, `uploadProgress: 0` → return silently); call `chatService.sendMessage` with collected `imageStoragePaths`; on any error: call `deleteUploadedImages(uploadedPaths)`, set `isUploadingImages: false` and `uploadProgress: 0`, then re-throw — contract in `specs/003-chat-image-sharing/contracts/chat-service.md` Store section
- [X] T01X [US1] Update `closeChatRoom` action in `store/chat.store.ts` to set `uploadCancelledRef.current = true` before existing teardown logic
- [X] T01X [P] [US1] Create `components/chat/image-thumbnail-strip.tsx`: horizontal `ScrollView` of 64×64 `expo-image` thumbnails; each has an "×" remove button top-right; `disabled` prop hides remove buttons during upload — props contract in `specs/003-chat-image-sharing/contracts/components.md`
- [X] T01X [P] [US1] Create `components/chat/message-image-grid.tsx`: 1-image = full-width (max 200px height); 2–4 images = 2-column grid; 5–10 images = 2-column grid with 4th tile showing `+N` overlay; `expo-image` `<Image>` with `contentFit="cover"`; grey placeholder while loading; broken-image icon on error — props contract in `specs/003-chat-image-sharing/contracts/components.md`
- [X] T01X [US1] Update `components/chat/message-bubble.tsx`: import and render `<MessageImageGrid>` above text content when `message.images.length > 0`; accept `onImagePress?: (imageIndex: number) => void` prop and forward it to `MessageImageGrid`; deleted messages show placeholder text only with no images
- [X] T01X [US1] Update `components/chat/message-input.tsx`: add image picker button (camera-roll icon, left of text input) using `expo-image-picker` `launchImageLibraryAsync` (max 10, enforced with user-facing message); render `<ImageThumbnailStrip>` above input row when `pendingImages.length > 0`; show "Uploading N/M…" label during upload; disable picker and remove buttons while `isUploadingImages`; extend `onSubmit` to pass images — new props in `specs/003-chat-image-sharing/contracts/components.md`
- [X] T01X [US1] Update `app/(app)/(trip)/chat/[roomId].tsx` (send path): add `pendingImages: ImagePicker.ImagePickerAsset[]` local state; pass `pendingImages`, `onAddImages`, `onRemoveImage`, `isUploadingImages`, `uploadProgress` to `<MessageInput>`; update `handleSubmit` to pass `pendingImages` to `useChatStore().sendMessage`; clear `pendingImages` only after successful send
- [X] T020 [US1] Update `app/(app)/(trip)/chat/[roomId].tsx` (error path — constitution §IV: UI is the only catch boundary): wrap the `sendMessage` store call in try/catch; on catch display an error message to the user; do NOT clear `pendingImages` on error so the user can retry by tapping send again
- [X] T021 Commit: `feat(chat): add image sending UI and store`

**Checkpoint**: User Story 1 fully functional — images can be sent, displayed in real time, and retried after failure

---

## Phase 4: User Story 2 — View Images Full-Screen (Priority: P2)

**Goal**: Tapping any image in a message bubble opens a full-screen swipe gallery. User can navigate between images and dismiss the viewer.

**Independent Test**: Tap an image in any message with images, verify full-screen viewer opens at the correct index, swipe navigation works, and dismiss returns to chat.

### Implementation for User Story 2

- [X] T022 [US2] Create `components/chat/image-viewer.tsx`: full-screen `Modal` (`animationType="fade"`); horizontal `FlatList` with `pagingEnabled` and `initialScrollIndex={initialIndex}`; each page shows one image full-screen (`contentFit="contain"`); close button top-right; page indicator dots bottom-center; back gesture calls `onClose` — props contract in `specs/003-chat-image-sharing/contracts/components.md`
- [X] T023 [US2] Update `app/(app)/(trip)/chat/[roomId].tsx` (viewer path): add `viewerVisible`, `viewerImages`, `viewerInitialIndex` state; add `handleImagePress(message, index)` that sets viewer state; pass `onImagePress` to each `<MessageBubble>`; render `<ImageViewer>` at root level (conditionally visible)

**Checkpoint**: User Stories 1 AND 2 both independently functional

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Manual smoke test, regression check, and final delivery.

- [ ] T024 [P] Manual smoke test per `specs/003-chat-image-sharing/quickstart.md` Step 8: send 3 images, remove one in thumbnail strip, send, verify display; verify images appear for recipient in real time (not just after reload); send image-only; tap image to open viewer; swipe between images; try 11 images and verify limit message; navigate away mid-upload and verify no partial message; verify SC-001 (select+send flow ≤30s) and SC-003 (viewer opens ≤1s) during walkthrough
- [ ] T025 Verify no regressions in existing text-only send, message edit, message delete, and chat room list flows; fix any issues found
- [ ] T026 Final commit and PR

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 completion — BLOCKS all user story work
- **Phase 3 (US1)**: Depends on Phase 2 completion — all integration tests must be green
- **Phase 4 (US2)**: Depends on Phase 3 completion — viewer requires MessageImageGrid and image data pipeline
- **Phase 5 (Polish)**: Depends on Phases 3 + 4

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2 — independent of US2
- **US2 (P2)**: Starts after US1 — requires `images` data in messages and MessageImageGrid already rendering

### Within Each Phase

- T005 (write tests) MUST precede T006–T009 (implement service) per constitution §II
- T010 (Realtime fix) follows T009 (getAllMessages done so the re-fetch helper exists)
- T015 and T016 (new components) can be built in parallel — different files, no shared dependencies
- T012–T014 (store) must precede T018–T020 (UI wiring to store)
- T020 (error handler) depends on T019 (happy path wiring) being complete first

### Parallel Opportunities

- T015 (`image-thumbnail-strip.tsx`) and T016 (`message-image-grid.tsx`) — different files, no deps on each other
- T012–T014 (store) can overlap with T015–T016 (new components) — different files

---

## Parallel Example: User Story 1

```bash
# Once T011 (commit, tests green) is done, these can start simultaneously:
Task T012: "Add isUploadingImages + uploadProgress state to store/chat.store.ts"
Task T015: "Create components/chat/image-thumbnail-strip.tsx"
Task T016: "Create components/chat/message-image-grid.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (DB + types) → commit T004
2. Complete Phase 2: Foundational (integration tests GREEN + Realtime fix) → commit T011
3. Complete Phase 3: User Story 1 (send + display + error handling) → commit T021
4. **STOP and VALIDATE**: Send images on a real device/simulator; verify bubble display, real-time delivery to recipient, and error retry
5. Proceed to US2 (viewer) once US1 is stable

### Incremental Delivery

1. Phase 1 + 2 → DB ready, service tested, Realtime fixed
2. Phase 3 (US1) → images can be sent, displayed, and retried (MVP!)
3. Phase 4 (US2) → full-screen gallery viewer added
4. Phase 5 → smoke test + polish

---

## Notes

- [P] tasks = different files, no dependencies on in-progress tasks
- Constitution §II: integration tests (T005) MUST be written and FAIL before service implementation (T006–T009)
- Constitution §IV: T020 (UI catch boundary for upload errors) is non-negotiable — without it upload errors are silently swallowed
- Constitution §VI: commit checkpoints are T004, T011, and T021 — do not skip them
- `types/database.types.ts` is auto-generated — never hand-edit it
- Supabase `service_role` key only in `__integration__/` tests; app uses anon key
