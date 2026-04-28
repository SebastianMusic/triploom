# Quickstart: Chat Image Sharing

**Feature**: 003-chat-image-sharing  
**Date**: 2026-04-27

---

## Prerequisites

- Branch `003-chat-image-sharing` checked out
- `.env` file present with `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `npm install` done (no new packages needed)

---

## Step 1: Apply Database Migration

Run the migration SQL from `data-model.md` against the hosted Supabase project.

The migration must:
1. Add `created_at` column to `chat_image`
2. Make `message_id` NOT NULL
3. Add `ON DELETE CASCADE` to the FK
4. Enable RLS on `chat_image`
5. Create the 3 RLS policies on `chat_image`
6. Create the `chat_images` storage bucket (private)
7. Create the 3 storage policies on `storage.objects`

Use MCP `execute_sql` to apply, then `apply_migration` once verified:
```bash
supabase migration new add_chat_image_created_at_and_rls
# paste the migration SQL from data-model.md
supabase db push
```

After applying: **regenerate database types**:
```bash
npx supabase gen types --lang=typescript --project-id ccyrwyfmijmqijpyvefo > types/database.types.ts
```

---

## Step 2: Run Integration Tests (Constitution §II — Test First)

Write and run `__integration__/chat-images.test.ts` before writing any UI.

The tests must cover (see tasks.md for full list):
- `uploadChatImage` uploads to Storage and returns a path
- `sendMessage` with images inserts `chat_image` rows and returns images with signed URLs
- `getAllMessages` returns `images` array on messages that have them
- `sendMessage` with only images (no text) succeeds
- RLS: non-participant cannot read `chat_image` rows
- RLS: non-owner cannot insert `chat_image` rows

Run:
```bash
npx jest chat-images --no-coverage
```

All tests must be green before proceeding.

---

## Step 3: Update Types

Edit `types/chat.types.ts`:
- Add `MessageImage` type
- Update `MessageWithSender` with `images: MessageImage[]`
- Update `sendMessageSchema` and `SendMessageDTO`

---

## Step 4: Update Service

Edit `services/chat.service.ts`:
- Update `mapToMessageWithSender` to accept and return `images`
- Update `getAllMessages` query to join `chat_image`
- Add signed URL resolution for images in `getAllMessages`
- Update `sendMessage` to accept `imageStoragePaths` and insert `chat_image` rows
- Add `uploadChatImage` function
- Add `deleteUploadedImages` function

---

## Step 5: Update Store

Edit `store/chat.store.ts`:
- Add `isUploadingImages: boolean` and `uploadProgress: number` state
- Add `uploadCancelledRef` (module-level, alongside `unsubscribeRef`)
- Update `sendMessage` action to: upload images → collect paths → call service
- Update `closeChatRoom` to set `uploadCancelledRef = true`

---

## Step 6: Build New Components

In order:
1. `components/chat/image-thumbnail-strip.tsx`
2. `components/chat/message-image-grid.tsx`
3. `components/chat/image-viewer.tsx`

---

## Step 7: Update Existing Components

In order:
1. `components/chat/message-bubble.tsx` — add `<MessageImageGrid>`
2. `components/chat/message-input.tsx` — add picker button, thumbnail strip, upload progress
3. `app/(app)/(trip)/chat/[roomId].tsx` — wire pending images, viewer state

---

## Step 8: Manual Smoke Test

1. Open a chat room
2. Tap the image picker button → select 3 images
3. Confirm thumbnail strip appears; remove one image
4. Send — confirm images appear in the bubble for both sender and recipient
5. Tap an image — confirm full-screen viewer opens
6. Swipe between images — confirm correct order
7. Send image-only (no text) — confirm it works
8. Try selecting 11 images — confirm "+10 max" message appears
9. Navigate away mid-upload — confirm message is not sent

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| RLS error on `chat_image` INSERT | Policy missing or wrong | Run migration again; check `message.user_id = auth.uid()` |
| Storage upload 403 | Bucket not created or wrong policy | Verify bucket exists and is private; check storage policy |
| Signed URL is null | `createSignedUrls` path mismatch | Log the path stored in DB vs. path passed to `createSignedUrls` |
| `images` is empty on received messages | `chat_image` join missing in `getAllMessages` query | Add `chat_image(image_url, created_at)` to select string |
| Image not shown to recipient | Realtime doesn't send `chat_image` data | After receiving INSERT via Realtime, re-fetch full message with `select('*, chat_image(*)')` |
