# Component Contracts: Chat Image Sharing

**Feature**: 003-chat-image-sharing  
**Date**: 2026-04-27

---

## New Components

### `components/chat/image-thumbnail-strip.tsx`

Pre-send preview shown between the edit-bar and the text input when images are selected.

```typescript
interface Props {
  assets: ImagePicker.ImagePickerAsset[];
  onRemove: (index: number) => void;
  disabled?: boolean;
}

export function ImageThumbnailStrip({ assets, onRemove, disabled }: Props)
```

**Renders**: Horizontal `ScrollView` of square thumbnails (64×64). Each thumbnail has an "×" button top-right. Thumbnails use `expo-image` `<Image>` with `source={{ uri: asset.uri }}`.

**Behaviour**: Tapping "×" calls `onRemove(index)`. `disabled` hides the remove buttons (during upload).

---

### `components/chat/message-image-grid.tsx`

Displays 1–10 images attached to a received message.

```typescript
interface Props {
  images: MessageImage[];         // from MessageWithSender.images
  onImagePress: (index: number) => void;
}

export function MessageImageGrid({ images, onImagePress }: Props)
```

**Layout rules**:
- 1 image: full-width within bubble, aspect ratio preserved (max height 200px).
- 2–4 images: 2-column grid, each tile square.
- 5–10 images: 2-column grid, first 3 tiles shown normally, 4th tile overlaid with `+N` count (where N = total − 3). Tapping the 4th tile calls `onImagePress(3)` (opens viewer at index 3).

**Images**: `expo-image` `<Image>` with `contentFit="cover"`. Shows a grey placeholder while loading; shows a broken-image icon on error (FR-010 edge case: image load failure).

---

### `components/chat/image-viewer.tsx`

Full-screen gallery modal.

```typescript
interface Props {
  images: MessageImage[];
  initialIndex: number;
  visible: boolean;
  onClose: () => void;
}

export function ImageViewer({ images, initialIndex, visible, onClose }: Props)
```

**Renders**: Full-screen `Modal` (animationType="fade", transparent=false). Inside: horizontal `FlatList` with `pagingEnabled`, `initialScrollIndex={initialIndex}`. Each page shows one image (full screen, `resizeMode="contain"`). Overlaid: close button (top-right), page indicator dots (bottom-center).

**Behaviour**: Swipe left/right navigates images. Back gesture or close button calls `onClose`.

---

## Modified Components

### `components/chat/message-bubble.tsx`

**Additions**:
- Import and render `<MessageImageGrid>` above the text content when `message.images.length > 0`.
- Accept and forward `onImagePress: (index: number) => void` prop.
- Deleted messages: show placeholder text only — no images rendered.

**New prop**:
```typescript
onImagePress?: (imageIndex: number) => void;
```

---

### `components/chat/message-input.tsx`

**Additions**:
- Add image picker button (left of text input, camera-roll icon).
- Show `<ImageThumbnailStrip>` above the input row when `pendingImages.length > 0`.
- Disable the picker button and thumbnail strip's remove buttons while `isUploadingImages`.
- Show upload progress label (e.g. "Uploading 2/3…") in the edit bar area during upload.

**New props**:
```typescript
pendingImages: ImagePicker.ImagePickerAsset[];
onAddImages: (assets: ImagePicker.ImagePickerAsset[]) => void;
onRemoveImage: (index: number) => void;
isUploadingImages: boolean;
uploadProgress: number;
onSubmit: (text: string, images: ImagePicker.ImagePickerAsset[]) => void;  // extended
```

---

## Screen Changes: `app/(app)/(trip)/chat/[roomId].tsx`

**Additions**:
- Local state: `pendingImages: ImagePicker.ImagePickerAsset[]`
- `ImageViewer` state: `viewerVisible`, `viewerImages`, `viewerInitialIndex`
- `handleSubmit` passes `pendingImages` to `useChatStore().sendMessage`
- `handleImagePress(message, index)` opens `<ImageViewer>`
- Wire `isUploadingImages` and `uploadProgress` from store to `<MessageInput>`
- Render `<ImageViewer>` (conditionally visible) at root level
