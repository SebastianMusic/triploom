import { supabase } from '@/lib/supabase';
import { sendMessageSchema, editMessageSchema, sendLocationMessageSchema } from '@/types';
import type { SendMessageDTO, EditMessageDTO, MessageWithSender, ChatRoomWithMeta, SendLocationMessageDTO, MessageLocationData } from '@/types';

function mapToMessageWithSender(raw: {
  id: string;
  content: string | null;
  type?: string;
  created_at: string;
  updated_at?: string | null;
  deleted_at?: string | null;
  group_chat_id: string | null;
  user_id: string | null;
  profile: { user_name: string | null } | null;
  message_location?: MessageLocationData[] | MessageLocationData | null;
}): MessageWithSender {
  const loc = raw.message_location;
  const locationData = Array.isArray(loc) ? (loc[0] ?? null) : (loc ?? null);
  return {
    id: raw.id,
    content: raw.content,
    type: raw.type === 'location' ? 'location' : 'text',
    created_at: raw.created_at,
    updated_at: raw.updated_at ?? null,
    deleted_at: raw.deleted_at ?? null,
    group_chat_id: raw.group_chat_id,
    user_id: raw.user_id,
    senderName: raw.profile?.user_name ?? null,
    location: locationData,
  };
}

export async function getAllChatRooms(tripId: string): Promise<ChatRoomWithMeta[]> {
  const { data, error } = await supabase.rpc('get_chat_rooms_for_trip', {
    trip_id_param: tripId,
  });
  if (error) throw error;
  const rooms = (data ?? [])
    .map((row) => ({
      id: row.id,
      chat_name: row.chat_name,
      trip_id: row.trip_id,
      trip_group_id: row.trip_group_id,
      event_id: row.event_id,
      created_at: row.created_at,
      hasUnread: row.has_unread,
      lastActivityAt: row.last_activity_at,
      imageUrl: row.image_url ?? null,
    }))
    .sort((a, b) => {
      const aIsGeneral = a.event_id === null && a.trip_group_id === null;
      const bIsGeneral = b.event_id === null && b.trip_group_id === null;
      if (aIsGeneral !== bIsGeneral) return aIsGeneral ? -1 : 1;
      if (!a.lastActivityAt && !b.lastActivityAt) return 0;
      if (!a.lastActivityAt) return 1;
      if (!b.lastActivityAt) return -1;
      return b.lastActivityAt.localeCompare(a.lastActivityAt);
    });

  await Promise.all(
    rooms.map(async (room) => {
      if (!room.imageUrl || !room.event_id) return;
      const { data: signed } = await supabase.storage
        .from('event_banner')
        .createSignedUrl(room.imageUrl, 3600);
      room.imageUrl = signed?.signedUrl ?? null;
    })
  );

  return rooms;
}

export async function getAllMessages(
  roomId: string,
  page: number = 0,
  since?: string
): Promise<MessageWithSender[]> {
  let query = supabase
    .from('message')
    .select('*, profile:user_id(user_name), message_location(*)')
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
      updated_at: row.updated_at,
      deleted_at: row.deleted_at,
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
    .insert({ content: dto.content, type: 'text', group_chat_id: dto.group_chat_id, user_id: user?.id })
    .select('*, profile:user_id(user_name)')
    .single();
  if (error) throw error;

  return mapToMessageWithSender({
    id: data.id,
    content: data.content,
    type: data.type,
    created_at: data.created_at,
    updated_at: data.updated_at,
    deleted_at: data.deleted_at,
    group_chat_id: data.group_chat_id,
    user_id: data.user_id,
    profile: Array.isArray(data.profile) ? (data.profile[0] ?? null) : data.profile,
    message_location: null,
  });
}

export async function sendLocationMessage(dto: SendLocationMessageDTO): Promise<MessageWithSender> {
  const result = sendLocationMessageSchema.safeParse(dto);
  if (!result.success) throw new Error(result.error.issues[0].message);

  const { data: { user } } = await supabase.auth.getUser();

  const { data: message, error: messageError } = await supabase
    .from('message')
    .insert({ content: null, type: 'location', group_chat_id: dto.group_chat_id, user_id: user?.id })
    .select('*, profile:user_id(user_name)')
    .single();
  if (messageError) throw messageError;

  const { data: location, error: locationError } = await supabase
    .from('message_location')
    .insert({ message_id: message.id, latitude: dto.latitude, longitude: dto.longitude, label: dto.label ?? null })
    .select()
    .single();
  if (locationError) throw locationError;

  return mapToMessageWithSender({
    id: message.id,
    content: message.content,
    type: message.type,
    created_at: message.created_at,
    updated_at: message.updated_at,
    deleted_at: message.deleted_at,
    group_chat_id: message.group_chat_id,
    user_id: message.user_id,
    profile: Array.isArray(message.profile) ? (message.profile[0] ?? null) : message.profile,
    message_location: location,
  });
}

export async function updateMessage(dto: EditMessageDTO): Promise<MessageWithSender> {
  const result = editMessageSchema.safeParse(dto);
  if (!result.success) throw new Error(result.error.issues[0].message);

  const { data, error } = await supabase
    .from('message')
    .update({ content: dto.content, updated_at: new Date().toISOString() })
    .eq('id', dto.id)
    .select('*, profile:user_id(user_name), message_location(*)')
    .single();
  if (error) throw error;

  return mapToMessageWithSender({
    id: data.id,
    content: data.content,
    type: data.type,
    created_at: data.created_at,
    updated_at: data.updated_at,
    deleted_at: data.deleted_at,
    group_chat_id: data.group_chat_id,
    user_id: data.user_id,
    profile: Array.isArray(data.profile) ? (data.profile[0] ?? null) : data.profile,
    message_location: data.message_location ?? null,
  });
}

export async function deleteMessage(messageId: string): Promise<MessageWithSender> {
  const { data, error } = await supabase
    .from('message')
    .update({ content: null, deleted_at: new Date().toISOString() })
    .eq('id', messageId)
    .select('*, profile:user_id(user_name), message_location(*)')
    .single();
  if (error) throw error;
  return mapToMessageWithSender({
    id: data.id,
    content: data.content,
    type: data.type,
    created_at: data.created_at,
    updated_at: data.updated_at,
    deleted_at: data.deleted_at,
    group_chat_id: data.group_chat_id,
    user_id: data.user_id,
    profile: Array.isArray(data.profile) ? (data.profile[0] ?? null) : data.profile,
    message_location: data.message_location ?? null,
  });
}

export function subscribeToMessages(
  roomId: string,
  onMessage: (message: MessageWithSender) => void,
  onMessageUpdated?: (message: MessageWithSender) => void,
  onMessageDeleted?: (messageId: string) => void,
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
          .select('*, profile:user_id(user_name), message_location(*)')
          .eq('id', raw.id)
          .single();
        const source = data ?? raw;
        onMessage(
          mapToMessageWithSender({
            id: source.id,
            content: source.content,
            type: data?.type ?? 'text',
            created_at: source.created_at,
            updated_at: data?.updated_at,
            deleted_at: data?.deleted_at,
            group_chat_id: source.group_chat_id,
            user_id: source.user_id,
            profile: data ? (Array.isArray(data.profile) ? (data.profile[0] ?? null) : data.profile) : null,
            message_location: data?.message_location ?? null,
          })
        );
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'message',
        filter: `group_chat_id=eq.${roomId}`,
      },
      async (payload) => {
        if (!onMessageUpdated) return;
        const raw = payload.new as {
          id: string;
          content: string | null;
          created_at: string;
          group_chat_id: string | null;
          user_id: string | null;
        };
        const { data } = await supabase
          .from('message')
          .select('*, profile:user_id(user_name), message_location(*)')
          .eq('id', raw.id)
          .single();
        const source = data ?? raw;
        onMessageUpdated(
          mapToMessageWithSender({
            id: source.id,
            content: source.content,
            type: data?.type ?? 'text',
            created_at: source.created_at,
            updated_at: data?.updated_at,
            deleted_at: data?.deleted_at,
            group_chat_id: source.group_chat_id,
            user_id: source.user_id,
            profile: data ? (Array.isArray(data.profile) ? (data.profile[0] ?? null) : data.profile) : null,
            message_location: data?.message_location ?? null,
          })
        );
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'message',
        filter: `group_chat_id=eq.${roomId}`,
      },
      (payload) => {
        if (!onMessageDeleted) return;
        onMessageDeleted((payload.old as { id: string }).id);
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
