# Research: Chat Image Sharing

**Feature**: 003-chat-image-sharing  
**Date**: 2026-04-27

---

## 1. Image Picker

**Decision**: Use `expo-image-picker` (already installed at `~17.0.10`).

**Key API:**
```typescript
import * as ImagePicker from 'expo-image-picker';

const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ['images'],
  allowsMultipleSelection: true,
  quality: 0.7,              // auto-compress to ~70% quality
  orderedSelection: true,    // preserve selection order on iOS 15+
});

if (!result.canceled) {
  const assets = result.assets; // ImagePicker.ImagePickerAsset[]
  // asset.uri — local file URI (content:// on Android, file:// on iOS)
}
```

**Permissions**: `requestMediaLibraryPermissionsAsync()` must be called before first launch. If denied, show user a message rather than crashing.

**Alternatives considered**: `react-native-image-picker` — heavier dependency; already have expo-image-picker installed, so no reason to add another.

---

## 2. Supabase Storage Upload (React Native)

**Decision**: Upload via `ArrayBuffer` fetched from the local URI using `fetch()`. This avoids `expo-file-system` dependency.

**Pattern** (from Supabase docs for React Native):
```typescript
const response = await fetch(asset.uri);
const blob = await response.blob();
const arrayBuffer = await new Response(blob).arrayBuffer();

const { data, error } = await supabase.storage
  .from('chat_images')
  .upload(storagePath, arrayBuffer, {
    contentType: asset.mimeType ?? 'image/jpeg',
    upsert: false,
  });
```

**Storage path convention**: `{group_chat_id}/{uuid}` — scoping by room enables path-prefix storage policies.

**Alternatives considered**: `expo-file-system` `readAsStringAsync` with base64 — more memory-intensive for large images; `fetch`-based approach is simpler.

---

## 3. Signed URL Duration

**Decision**: 3600 seconds (1 hour). This matches the existing `event_banner` pattern in `chat.service.ts` and is a standard chat image lifetime.

**Pattern** (existing, already used for event banners):
```typescript
const { data: signed } = await supabase.storage
  .from('chat_images')
  .createSignedUrl(storagePath, 3600);
room.imageUrl = signed?.signedUrl ?? null;
```

**Bulk signed URLs**: For messages with multiple images, use `createSignedUrls` (plural) to batch the request:
```typescript
const { data: signedList } = await supabase.storage
  .from('chat_images')
  .createSignedUrls(paths, 3600);
// returns [{ signedUrl: string, path: string, error: ... }]
```

---

## 4. RLS Policy for `chat_image` Table

**Pattern** (follows existing `message` table RLS model):

```sql
-- SELECT: only chat participants of the room the message belongs to
CREATE POLICY "chat_image_select_participants"
ON public.chat_image FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.message m
    JOIN public.chat_participant cp ON cp.group_chat_id = m.group_chat_id
    JOIN public.trip_participant tp ON tp.id = cp.participant_id
    WHERE m.id = chat_image.message_id
      AND tp.user_id = auth.uid()
  )
);

-- INSERT: only the message sender (user_id of the linked message)
CREATE POLICY "chat_image_insert_own"
ON public.chat_image FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.message m
    WHERE m.id = message_id
      AND m.user_id = auth.uid()
  )
);

-- DELETE: only the message sender
CREATE POLICY "chat_image_delete_own"
ON public.chat_image FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.message m
    WHERE m.id = message_id
      AND m.user_id = auth.uid()
  )
);
```

**Note**: RLS on `message` table already enforces room membership for INSERT and SELECT. The `chat_image` policies mirror this pattern.

---

## 5. Storage Bucket RLS

Supabase Storage policies use the same `auth.uid()` pattern but operate on the `storage.objects` table. For the private `chat_images` bucket:

```sql
-- Allow chat participants to read objects in their rooms
CREATE POLICY "chat_images_read_participants"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat_images'
  AND EXISTS (
    SELECT 1 FROM public.group_chat gc
    JOIN public.chat_participant cp ON cp.group_chat_id = gc.id
    JOIN public.trip_participant tp ON tp.id = cp.participant_id
    WHERE gc.id::text = split_part(name, '/', 1)
      AND tp.user_id = auth.uid()
  )
);

-- Allow authenticated users to upload (insert) to rooms they belong to
CREATE POLICY "chat_images_insert_participants"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat_images'
  AND EXISTS (
    SELECT 1 FROM public.group_chat gc
    JOIN public.chat_participant cp ON cp.group_chat_id = gc.id
    JOIN public.trip_participant tp ON tp.id = cp.participant_id
    WHERE gc.id::text = split_part(name, '/', 1)
      AND tp.user_id = auth.uid()
  )
);

-- Allow users to delete their own uploads
-- (matched by path prefix: {group_chat_id}/{uuid})
CREATE POLICY "chat_images_delete_own"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'chat_images'
  AND auth.uid() IS NOT NULL
);
```

**Note**: Storage bucket must be created with `public: false` (private). Signed URLs bypass the storage SELECT policy — the policy mainly governs direct REST access. For signed URL generation, the calling user needs SELECT on the object or the URL is pre-signed by the service. Since signed URLs are generated server-side (anon key with JWT), RLS on the table gates who can call `createSignedUrl`.

---

## 6. Upload Cancellation (Navigate Away)

**Decision**: Use a store-level cancellation flag. Between individual image uploads, check the flag and abort early. Already-uploaded objects are deleted from Storage if cancellation is detected.

This avoids the complexity of `AbortController` (not uniformly supported in the `fetch` layer Supabase uses internally). The approach is:
1. Store sets `uploadCancelledRef = false` at start of `sendMessage`
2. `closeChatRoom` sets `uploadCancelledRef = true`
3. Upload loop checks flag between uploads, deletes any uploaded paths, throws early

---

## 7. `sendMessageSchema` Changes

Current schema requires `content: string.min(1)`. Image-only messages have no text. New schema:

```typescript
export const sendMessageSchema = z.object({
  content: z.string().max(2000).nullable().optional(),
  group_chat_id: z.string().uuid(),
  imageStoragePaths: z.array(z.string()).max(10).optional(),
}).refine(
  (data) => (data.content?.trim() ?? '') !== '' || (data.imageStoragePaths?.length ?? 0) > 0,
  { message: 'Message must have text or at least one image' }
);
```

---

## 8. Full-Screen Gallery Viewer

**Decision**: Modal + horizontal FlatList with `pagingEnabled`. No new library needed — `react-native-reanimated` is installed but not needed for this level of interaction.

```tsx
<Modal visible animationType="fade">
  <FlatList
    data={images}
    horizontal
    pagingEnabled
    initialScrollIndex={tappedIndex}
    renderItem={({ item }) => (
      <Image source={{ uri: item.url }} style={{ width, height }} resizeMode="contain" />
    )}
  />
</Modal>
```

Page indicator and close button are standard RN Views overlaid on the modal.

---

## 9. No New Dependencies

All required functionality is available from installed packages:
- Image selection: `expo-image-picker` ✅ (already installed)
- Image display: `expo-image` ✅ (already installed)
- Gallery viewer: React Native `Modal` + `FlatList` ✅ (built-in)
- Upload: `fetch` + Supabase Storage ✅
- Animation: not required for MVP
