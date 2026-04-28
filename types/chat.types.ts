import { z } from 'zod';
import type { MessageInsert } from '@/types';

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(2000),
  group_chat_id: z.string().uuid(),
}) satisfies z.ZodType<Pick<MessageInsert, 'content' | 'group_chat_id'>>;

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
  location: MessageLocationData | null;
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
