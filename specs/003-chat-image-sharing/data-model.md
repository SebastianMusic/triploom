# Data Model: Chat Image Sharing

**Feature**: 003-chat-image-sharing  
**Date**: 2026-04-27

---

## Existing Tables (no structural change needed)

### `message`

No columns added. Image-only messages are supported by allowing `content = NULL` — this is already permitted by the existing schema (`content` is nullable). The `sendMessageSchema` Zod validation is updated in application code (not DB-level) to allow null content when images are present.

### `chat_participant`, `group_chat`, `trip_participant`

Used by RLS policies on `chat_image`. No schema changes.

---

## Modified Table: `chat_image`

### Current schema

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `image_url` | `uuid` / `text` | NOT NULL | Primary key — Supabase Storage object path UUID |
| `message_id` | `uuid` | NULL | FK → `message.id` |

### Required changes

| Change | Reason |
|--------|--------|
| Add `created_at timestamptz NOT NULL DEFAULT now()` | Required for deterministic insertion-order sorting (Clarification Q1) |
| Make `message_id NOT NULL` | Every `chat_image` row must belong to a message; nullable was a schema gap |
| Enable RLS | No policies exist yet; required before any app-level access |

### Target schema (post-migration)

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `image_url` | `text` | NOT NULL | Supabase Storage path: `{group_chat_id}/{uuid}`. Acts as natural PK. |
| `message_id` | `uuid` | NOT NULL | FK → `message.id` (ON DELETE CASCADE) |
| `created_at` | `timestamptz` | NOT NULL | Default `now()`. Used for ordered display. |

### Migration SQL

```sql
-- Step 1: add created_at
ALTER TABLE public.chat_image
  ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();

-- Step 2: make message_id NOT NULL (after back-filling if any rows exist)
-- If the table is empty (new feature, no existing data):
ALTER TABLE public.chat_image
  ALTER COLUMN message_id SET NOT NULL;

-- Step 3: add ON DELETE CASCADE so images are removed when a message is hard-deleted
ALTER TABLE public.chat_image
  DROP CONSTRAINT IF EXISTS chat_image_message_id_fkey,
  ADD CONSTRAINT chat_image_message_id_fkey
    FOREIGN KEY (message_id) REFERENCES public.message(id) ON DELETE CASCADE;

-- Step 4: enable RLS
ALTER TABLE public.chat_image ENABLE ROW LEVEL SECURITY;

-- Step 5: RLS policies (see research.md §4 for full SQL)
CREATE POLICY "chat_image_select_participants" ON public.chat_image FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.message m
    JOIN public.chat_participant cp ON cp.group_chat_id = m.group_chat_id
    JOIN public.trip_participant tp ON tp.id = cp.participant_id
    WHERE m.id = chat_image.message_id
      AND tp.user_id = auth.uid()
  )
);

CREATE POLICY "chat_image_insert_own" ON public.chat_image FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.message m
    WHERE m.id = message_id AND m.user_id = auth.uid()
  )
);

CREATE POLICY "chat_image_delete_own" ON public.chat_image FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.message m
    WHERE m.id = message_id AND m.user_id = auth.uid()
  )
);
```

---

## New: Supabase Storage Bucket `chat_images`

| Property | Value |
|----------|-------|
| Bucket name | `chat_images` |
| Access | Private (not public) |
| File path | `{group_chat_id}/{uuid}` — e.g. `abc123.../img_uuid` |
| Allowed MIME types | `image/jpeg`, `image/png`, `image/webp`, `image/gif` |
| Max file size | 10 MB per object (Supabase default; can be restricted in bucket config) |

**Path design rationale**: Prefixing with `group_chat_id` allows storage policies to check room membership using `split_part(name, '/', 1)`. The UUID part (`split_part(name, '/', 2)`) is generated client-side per upload.

**Bucket creation SQL** (applied via migration or Supabase dashboard):
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat_images', 'chat_images', false)
ON CONFLICT DO NOTHING;
```

**Storage policies** (see research.md §5 for full SQL).

---

## TypeScript Type Changes

### `types/chat.types.ts`

**Add** `MessageImage` type:
```typescript
export type MessageImage = {
  path: string;    // storage path (stored in DB)
  url: string;     // signed URL (generated at query time, not stored)
};
```

**Update** `MessageWithSender`:
```typescript
export type MessageWithSender = {
  id: string;
  content: string | null;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
  group_chat_id: string | null;
  user_id: string | null;
  senderName: string | null;
  images: MessageImage[];   // ← new; empty array when no images
};
```

**Update** `sendMessageSchema` and `SendMessageDTO`:
```typescript
export const sendMessageSchema = z.object({
  content: z.string().max(2000).nullable().optional(),
  group_chat_id: z.string().uuid(),
  imageStoragePaths: z.array(z.string()).max(10).optional(),
}).refine(
  (d) => (d.content?.trim() ?? '').length > 0 || (d.imageStoragePaths?.length ?? 0) > 0,
  { message: 'Message must have text or at least one image' }
);

export type SendMessageDTO = z.infer<typeof sendMessageSchema>;
```

---

## Entity Relationship (chat-image domain)

```
group_chat (1) ──< chat_participant (N)
group_chat (1) ──< message (N)
message    (1) ──< chat_image (N)   [ON DELETE CASCADE]
trip_participant ──< chat_participant
```

A `message` has 0–10 `chat_image` rows. Each `chat_image` row stores a Supabase Storage path. Signed URLs are generated at query time and are never persisted.
