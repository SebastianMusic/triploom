import { supabase } from '@/lib/supabase';
import { sendMessageSchema, editMessageSchema, sendLocationMessageSchema } from '@/types';
import type { SendMessageDTO, EditMessageDTO, MessageImage, MessageWithSender, ChatRoomWithMeta, SendLocationMessageDTO, MessageLocationData } from '@/types';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

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
  images?: MessageImage[];
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
    images: raw.images ?? [],
  };
}

async function resolveImages(messageId: string): Promise<MessageImage[]> {
  const { data } = await supabase
    .from('chat_image')
    .select('image_url')
    .eq('message_id', messageId);
  if (!data || data.length === 0) return [];
  return Promise.all(
    data.map(async (row) => {
      const { data: signed } = await supabase.storage
        .from('chat_image')
        .createSignedUrl(row.image_url, 3600);
      return { path: row.image_url, url: signed?.signedUrl ?? '' };
    })
  );
}

export async function uploadChatImage(
  groupChatId: string,
  asset: { uri?: string; blob?: Blob; mimeType?: string }
): Promise<string> {
  const ext = asset.mimeType?.split('/')[1] ?? 'jpg';
  const path = `${groupChatId}/${generateUUID()}.${ext}`;
  let body: ArrayBuffer | Blob;
  if (asset.blob) {
    body = await asset.blob.arrayBuffer();
  } else if (asset.uri) {
    const response = await fetch(asset.uri);
    body = await response.arrayBuffer();
  } else {
    throw new Error('uploadChatImage requires either uri or blob');
  }
  const { error } = await supabase.storage
    .from('chat_image')
    .upload(path, body, { contentType: asset.mimeType ?? 'image/jpeg' });
  if (error) throw error;
  return path;
}

export async function deleteUploadedImages(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  await supabase.storage.from('chat_image').remove(paths);
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
      if (!room.imageUrl) return;
      const isGeneral = room.event_id === null && room.trip_group_id === null;
      const bucket = room.event_id ? 'event_banner' : isGeneral ? 'trip_banner' : null;
      if (!bucket) return;
      const { data: signed } = await supabase.storage
        .from(bucket)
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
    .select('*, profile:user_id(user_name), message_location(*), chat_image(image_url)')
    .eq('group_chat_id', roomId)
    .order('created_at', { ascending: false })
    .range(page * 50, page * 50 + 49);

  if (since) {
    query = query.gt('created_at', since);
  }

  const { data, error } = await query;
  if (error) throw error;

  return Promise.all(
    (data ?? []).map(async (row) => {
      const rawImages: { image_url: string }[] = Array.isArray(row.chat_image)
        ? row.chat_image
        : row.chat_image
          ? [row.chat_image]
          : [];
      const images: MessageImage[] = await Promise.all(
        rawImages.map(async (img) => {
          const { data: signed } = await supabase.storage
            .from('chat_image')
            .createSignedUrl(img.image_url, 3600);
          return { path: img.image_url, url: signed?.signedUrl ?? '' };
        })
      );
      return mapToMessageWithSender({
        id: row.id,
        content: row.content,
        type: row.type,
        created_at: row.created_at,
        updated_at: row.updated_at,
        deleted_at: row.deleted_at,
        group_chat_id: row.group_chat_id,
        user_id: row.user_id,
        profile: Array.isArray(row.profile) ? (row.profile[0] ?? null) : row.profile,
        message_location: row.message_location ?? null,
        images,
      });
    })
  );
}

export async function sendMessage(dto: SendMessageDTO): Promise<MessageWithSender> {
  const result = sendMessageSchema.safeParse(dto);
  if (!result.success) throw new Error(result.error.issues[0].message);

  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('message')
    .insert({ content: dto.content ?? null, type: 'text', group_chat_id: dto.group_chat_id, user_id: user?.id })
    .select('*, profile:user_id(user_name)')
    .single();
  if (error) throw error;

  let images: MessageImage[] = [];
  if (dto.imageStoragePaths && dto.imageStoragePaths.length > 0) {
    const { error: imgError } = await supabase
      .from('chat_image')
      .insert(dto.imageStoragePaths.map((path) => ({ message_id: data.id, image_url: path })));
    if (imgError) throw imgError;
    images = await resolveImages(data.id);
  }

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
    images,
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
    images: [],
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
    images: [],
  });
}

export async function deleteMessage(messageId: string): Promise<MessageWithSender> {
  const { data: imageRows } = await supabase
    .from('chat_image')
    .select('image_url')
    .eq('message_id', messageId);

  if (imageRows && imageRows.length > 0) {
    const paths = imageRows.map((r) => r.image_url);
    await deleteUploadedImages(paths);
    await supabase.from('chat_image').delete().eq('message_id', messageId);
  }

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
    images: [],
  });
}

export function subscribeToAllRoomMessages(
  roomIds: string[],
  onNewMessage: (groupChatId: string) => void
): () => void {
  if (roomIds.length === 0) return () => {};
  const channel = supabase.channel('global-message-feed');
  for (const roomId of roomIds) {
    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'message', filter: `group_chat_id=eq.${roomId}` },
      (payload) => {
        const groupChatId = (payload.new as { group_chat_id: string | null }).group_chat_id;
        if (groupChatId) onNewMessage(groupChatId);
      }
    );
  }
  channel.subscribe(() => {});
  return () => { supabase.removeChannel(channel); };
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
        const images = data ? await resolveImages(data.id) : [];
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
            images,
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
        const images = data ? await resolveImages(data.id) : [];
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
            images,
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
