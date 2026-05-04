import { z } from 'zod';

export const sendMessageSchema = z.object({
  content: z.string().max(2000).nullable().optional(),
  group_chat_id: z.string().uuid(),
  imageStoragePaths: z.array(z.string()).max(10).optional(),
}).refine(
  (d) => (d.content?.trim() ?? '').length > 0 || (d.imageStoragePaths?.length ?? 0) > 0,
  { message: 'Message must have text or at least one image' }
);

export type SendMessageDTO = z.infer<typeof sendMessageSchema>;

export const editMessageSchema = z.object({
  id: z.string().uuid(),
  content: z.string().min(1, 'Message cannot be empty').max(2000),
});

export type EditMessageDTO = z.infer<typeof editMessageSchema>;

export const sendLocationMessageSchema = z.object({
  group_chat_id: z.string().uuid(),
  latitude: z.number(),
  longitude: z.number(),
  label: z.string().nullable().optional(),
});

export type SendLocationMessageDTO = z.infer<typeof sendLocationMessageSchema>;

export type MessageLocationData = {
  id: string;
  latitude: number;
  longitude: number;
  label: string | null;
};

export type MessageImage = {
  path: string;
  url: string;
};

export type MessageWithSender = {
  id: string;
  content: string | null;
  type: 'text' | 'location';
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
  group_chat_id: string | null;
  user_id: string | null;
  senderName: string | null;
  senderAvatarUrl: string | null;
  location: MessageLocationData | null;
  images: MessageImage[];
};

export type ChatRoomWithMeta = {
  id: string;
  chat_name: string | null;
  trip_id: string | null;
  trip_group_id: string | null;
  event_id: string | null;
  created_at: string;
  hasUnread: boolean;
  lastActivityAt: string | null;
  imageUrl: string | null;
};
