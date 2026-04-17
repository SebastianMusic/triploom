import { z } from 'zod';
import type { MessageInsert } from '@/types';

// DTO for sending a message (form validation boundary)
export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(2000),
  group_chat_id: z.string().uuid(),
}) satisfies z.ZodType<Pick<MessageInsert, 'content' | 'group_chat_id'>>;

export type SendMessageDTO = z.infer<typeof sendMessageSchema>;

// Message enriched with the sender's display name (from profile JOIN)
export type MessageWithSender = {
  id: string;
  content: string | null;
  created_at: string;
  group_chat_id: string | null;
  user_id: string | null;
  senderName: string | null;
};

// Chat room enriched with unread status and last activity (from getAllChatRooms)
export type ChatRoomWithMeta = {
  id: string;
  chat_name: string | null;
  trip_id: string | null;
  trip_group_id: string | null;
  event_id: string | null;
  created_at: string;
  hasUnread: boolean;
  lastActivityAt: string | null;
};
