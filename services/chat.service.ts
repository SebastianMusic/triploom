import { supabase } from '@/lib/supabase';
import { sendMessageSchema } from '@/types';
import type { SendMessageDTO, MessageWithSender, ChatRoomWithMeta } from '@/types';

// Private helper — reshapes raw Supabase message row (with profile join) into MessageWithSender
function mapToMessageWithSender(raw: {
  id: string;
  content: string | null;
  created_at: string;
  group_chat_id: string | null;
  user_id: string | null;
  profile: { user_name: string | null } | null;
}): MessageWithSender {
  return {
    id: raw.id,
    content: raw.content,
    created_at: raw.created_at,
    group_chat_id: raw.group_chat_id,
    user_id: raw.user_id,
    senderName: raw.profile?.user_name ?? null,
  };
}

export async function getAllChatRooms(tripId: string): Promise<ChatRoomWithMeta[]> {
  const { data, error } = await supabase.rpc('get_chat_rooms_for_trip', {
    trip_id_param: tripId,
  });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    chat_name: row.chat_name,
    trip_id: row.trip_id,
    trip_group_id: row.trip_group_id,
    event_id: row.event_id,
    created_at: row.created_at,
    hasUnread: row.has_unread,
    lastActivityAt: row.last_activity_at,
  }));
}

export async function getAllMessages(
  roomId: string,
  page: number = 0,
  since?: string
): Promise<MessageWithSender[]> {
  let query = supabase
    .from('message')
    .select('*, profile:user_id(user_name)')
    .eq('group_chat_id', roomId)
    .order('created_at', { ascending: false })
    .range(page * 50, page * 50 + 49);

  if (since) {
    query = query.gt('created_at', since);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) =>
    mapToMessageWithSender({
      id: row.id,
      content: row.content,
      created_at: row.created_at,
      group_chat_id: row.group_chat_id,
      user_id: row.user_id,
      profile: Array.isArray(row.profile) ? (row.profile[0] ?? null) : row.profile,
    })
  );
}

export async function sendMessage(dto: SendMessageDTO): Promise<MessageWithSender> {
  const result = sendMessageSchema.safeParse(dto);
  if (!result.success) throw new Error(result.error.issues[0].message);

  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('message')
    .insert({ content: dto.content, group_chat_id: dto.group_chat_id, user_id: user?.id })
    .select('*, profile:user_id(user_name)')
    .single();
  if (error) throw error;

  return mapToMessageWithSender({
    id: data.id,
    content: data.content,
    created_at: data.created_at,
    group_chat_id: data.group_chat_id,
    user_id: data.user_id,
    profile: Array.isArray(data.profile) ? (data.profile[0] ?? null) : data.profile,
  });
}

export function subscribeToMessages(
  roomId: string,
  onMessage: (message: MessageWithSender) => void,
  onStatusChange?: (status: string) => void
): () => void {
  const channel = supabase
    .channel(`messages:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'message',
        filter: `group_chat_id=eq.${roomId}`,
      },
      async (payload) => {
        const raw = payload.new as {
          id: string;
          content: string | null;
          created_at: string;
          group_chat_id: string | null;
          user_id: string | null;
        };
        const { data } = await supabase
          .from('message')
          .select('*, profile:user_id(user_name)')
          .eq('id', raw.id)
          .single();
        if (!data) return;
        onMessage(
          mapToMessageWithSender({
            id: data.id,
            content: data.content,
            created_at: data.created_at,
            group_chat_id: data.group_chat_id,
            user_id: data.user_id,
            profile: Array.isArray(data.profile) ? (data.profile[0] ?? null) : data.profile,
          })
        );
      }
    )
    .subscribe((status) => {
      onStatusChange?.(status);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function markChatRead(roomId: string): Promise<void> {
  const { error } = await supabase
    .from('chat_participant')
    .update({ last_read_at: new Date().toISOString() })
    .eq('group_chat_id', roomId);
  if (error) throw error;
}
