# Service Contract: chat.service.ts

**Feature**: 003-chat-image-sharing  
**File**: `services/chat.service.ts`

---

## Changed Functions

### `sendMessage`

**Signature change**: `content` becomes optional/nullable; `imageStoragePaths` added.

```typescript
// Before
sendMessage(dto: { content: string; group_chat_id: string }): Promise<MessageWithSender>

// After
sendMessage(dto: {
  content?: string | null;
  group_chat_id: string;
  imageStoragePaths?: string[];    // storage paths, already uploaded
}): Promise<MessageWithSender>
```

**Behaviour**:
1. Validate with updated `sendMessageSchema` (Zod). Throws if both content and images are absent.
2. Insert `message` row (`content` may be null).
3. If `imageStoragePaths` is non-empty, insert one `chat_image` row per path (`message_id` = new message id).
4. If `chat_image` insert fails: delete the orphaned `message` row, then re-throw.
5. Generate signed URLs for all images via `createSignedUrls` (batch).
6. Return `MessageWithSender` with `images: MessageImage[]` populated.

**Error contract**: Throws on any Supabase error or Zod validation failure.

---

### `getAllMessages`

**Signature**: unchanged  
**Return type change**: `MessageWithSender.images` is now populated.

**Behaviour change**:
- Query changes from `'*'` to `'*, profile:user_id(user_name), chat_image(image_url, created_at)'`.
- For each message that has `chat_image` rows: batch `createSignedUrls` call to resolve storage paths to signed URLs.
- Images are sorted by `created_at` ascending within each message (insertion order — Clarification Q1).
- `images` is `[]` when no chat_image rows exist for the message.

---

## New Functions

### `uploadChatImage`

```typescript
uploadChatImage(
  groupChatId: string,
  asset: { uri: string; mimeType?: string }
): Promise<string>   // returns storage path
```

**Behaviour**:
1. Fetch the image bytes from `asset.uri` using `fetch()` → `arrayBuffer()`.
2. Generate a UUID for the object name.
3. Upload to `chat_images` bucket at path `{groupChatId}/{uuid}`.
4. Return the full storage path (`{groupChatId}/{uuid}`).
5. Throws on upload error.

**Caller responsibility**: The store calls this for each selected image before calling `sendMessage`. The store accumulates paths and passes them as `imageStoragePaths` to `sendMessage`.

---

### `deleteUploadedImages`

```typescript
deleteUploadedImages(paths: string[]): Promise<void>
```

**Behaviour**: Removes the given storage objects from the `chat_images` bucket. Used for cleanup when:
- Upload is cancelled (user navigates away mid-upload).
- `chat_image` insert fails after message was created (compensating action).

Ignores individual delete errors (best-effort cleanup). Does not throw.

---

## Unchanged Functions

`updateMessage`, `deleteMessage`, `subscribeToMessages`, `markChatRead`, `getAllChatRooms` — no changes in signature or behaviour.

---

## Store Contract: chat.store.ts

### Changed action: `sendMessage`

```typescript
sendMessage(dto: {
  content?: string | null;
  group_chat_id: string;
  imageAssets?: ImagePicker.ImagePickerAsset[];
}): Promise<void>
```

**New state fields**:
```typescript
isUploadingImages: boolean;
uploadProgress: number;   // 0–imageAssets.length, how many uploaded so far
```

**Behaviour**:
1. Set `isUploadingImages: true` if `imageAssets` is non-empty.
2. Upload each image sequentially via `chatService.uploadChatImage(...)`.
3. Between each upload: check `uploadCancelledRef`. If cancelled → call `deleteUploadedImages(uploadedSoFar)` → reset state → return silently.
4. On all uploads complete: set `isUploadingImages: false`.
5. Call `chatService.sendMessage({ ..., imageStoragePaths })`.
6. On error: call `chatService.deleteUploadedImages(uploadedPaths)`, reset state, re-throw.

### Changed action: `closeChatRoom`

Sets `uploadCancelledRef = true` (in addition to existing behaviour) to signal any in-progress upload loop to abort.
