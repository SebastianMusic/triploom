import {
  getAllChatRooms,
  getAllMessages,
  sendMessage,
  subscribeToMessages,
  markChatRead,
} from '../chat.service';
import { sendMessageSchema } from '@/types';

// Mock the supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
    channel: jest.fn(),
    removeChannel: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  },
}));

import { supabase } from '@/lib/supabase';
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

// Zod v4 requires a proper RFC 4122 UUID (version 1-8, variant 8/9/a/b)
const VALID_UUID = '123e4567-e89b-42d3-a456-556642440000';

beforeEach(() => {
  jest.clearAllMocks();
  (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
    data: { user: { id: 'user-1' } },
    error: null,
  });
});

// --- sendMessageSchema ---

describe('sendMessageSchema', () => {
  it('accepts valid content and group_chat_id', () => {
    const result = sendMessageSchema.safeParse({
      content: 'Hello world',
      group_chat_id: VALID_UUID,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty content', () => {
    const result = sendMessageSchema.safeParse({
      content: '',
      group_chat_id: VALID_UUID,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Message cannot be empty');
    }
  });

  it('rejects content over 2000 chars', () => {
    const result = sendMessageSchema.safeParse({
      content: 'a'.repeat(2001),
      group_chat_id: VALID_UUID,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid uuid for group_chat_id', () => {
    const result = sendMessageSchema.safeParse({
      content: 'Hello',
      group_chat_id: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });
});

// --- getAllChatRooms ---

describe('getAllChatRooms', () => {
  it('returns ChatRoomWithMeta[] with camelCase fields', async () => {
    const rpcData = [
      {
        id: 'room-1',
        chat_name: 'General',
        trip_id: 'trip-1',
        trip_group_id: null,
        event_id: null,
        created_at: '2026-01-01T00:00:00Z',
        has_unread: true,
        last_activity_at: '2026-01-02T00:00:00Z',
      },
    ];
    (mockSupabase.rpc as jest.Mock).mockResolvedValue({ data: rpcData, error: null });

    const result = await getAllChatRooms('trip-1');

    expect(mockSupabase.rpc).toHaveBeenCalledWith('get_chat_rooms_for_trip', {
      trip_id_param: 'trip-1',
    });
    expect(result).toHaveLength(1);
    expect(result[0].hasUnread).toBe(true);
    expect(result[0].lastActivityAt).toBe('2026-01-02T00:00:00Z');
    expect(result[0].chat_name).toBe('General');
  });

  it('returns empty array when rpc returns null data', async () => {
    (mockSupabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: null });
    const result = await getAllChatRooms('trip-1');
    expect(result).toEqual([]);
  });

  it('throws when Supabase returns an error', async () => {
    (mockSupabase.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'RPC error' },
    });
    await expect(getAllChatRooms('trip-1')).rejects.toMatchObject({ message: 'RPC error' });
  });
});

// --- getAllMessages ---

describe('getAllMessages', () => {
  function mockFromChain(returnData: unknown[], error: null | object = null) {
    const range = jest.fn().mockResolvedValue({ data: returnData, error });
    const order = jest.fn().mockReturnValue({ range });
    const eq = jest.fn().mockReturnValue({ order });
    const select = jest.fn().mockReturnValue({ eq });
    mockSupabase.from.mockReturnValue({ select } as any);
    return { select, eq, order, range };
  }

  it('returns MessageWithSender[] with senderName from profile join', async () => {
    const rawRow = {
      id: 'msg-1',
      content: 'Hello',
      created_at: '2026-01-01T12:00:00Z',
      group_chat_id: 'room-1',
      user_id: 'user-1',
      profile: { user_name: 'Alice' },
    };
    mockFromChain([rawRow]);

    const result = await getAllMessages('room-1', 0);

    expect(result).toHaveLength(1);
    expect(result[0].senderName).toBe('Alice');
    expect(result[0].content).toBe('Hello');
    expect(result[0].id).toBe('msg-1');
  });

  it('sets senderName to null when profile is null', async () => {
    const rawRow = {
      id: 'msg-2',
      content: 'Hi',
      created_at: '2026-01-01T12:00:00Z',
      group_chat_id: 'room-1',
      user_id: 'user-1',
      profile: null,
    };
    mockFromChain([rawRow]);

    const result = await getAllMessages('room-1', 0);
    expect(result[0].senderName).toBeNull();
  });

  it('throws when Supabase returns an error', async () => {
    const range = jest.fn().mockResolvedValue({ data: null, error: { message: 'Query error' } });
    const order = jest.fn().mockReturnValue({ range });
    const eq = jest.fn().mockReturnValue({ order });
    const select = jest.fn().mockReturnValue({ eq });
    mockSupabase.from.mockReturnValue({ select } as any);

    await expect(getAllMessages('room-1', 0)).rejects.toMatchObject({ message: 'Query error' });
  });
});

// --- sendMessage ---

describe('sendMessage', () => {
  it('inserts and returns the persisted message with senderName', async () => {
    const returnData = {
      id: 'msg-3',
      content: 'New message',
      created_at: '2026-01-01T13:00:00Z',
      group_chat_id: VALID_UUID,
      user_id: 'user-1',
      profile: { user_name: 'Bob' },
    };
    const single = jest.fn().mockResolvedValue({ data: returnData, error: null });
    const select = jest.fn().mockReturnValue({ single });
    const insert = jest.fn().mockReturnValue({ select });
    mockSupabase.from.mockReturnValue({ insert } as any);

    const result = await sendMessage({
      content: 'New message',
      group_chat_id: VALID_UUID,
    });

    expect(result.senderName).toBe('Bob');
    expect(result.content).toBe('New message');
  });

  it('throws on schema validation failure (empty content)', async () => {
    await expect(
      sendMessage({ content: '', group_chat_id: VALID_UUID })
    ).rejects.toThrow('Message cannot be empty');
  });

  it('throws when Supabase insert returns an error', async () => {
    const single = jest.fn().mockResolvedValue({ data: null, error: { message: 'Insert error' } });
    const select = jest.fn().mockReturnValue({ single });
    const insert = jest.fn().mockReturnValue({ select });
    mockSupabase.from.mockReturnValue({ insert } as any);

    await expect(
      sendMessage({ content: 'Hi', group_chat_id: VALID_UUID })
    ).rejects.toMatchObject({ message: 'Insert error' });
  });
});

// --- subscribeToMessages ---

describe('subscribeToMessages', () => {
  it('calls onMessage when a realtime INSERT event fires', () => {
    let capturedHandler: ((payload: { new: object }) => void) | null = null;

    // Use a self-referential channel mock so chaining works correctly
    const mockChannel = {
      on: jest.fn(),
      subscribe: jest.fn(),
    };
    mockChannel.on.mockImplementation((_event: unknown, _filter: unknown, handler: (payload: { new: object }) => void) => {
      capturedHandler = handler;
      return mockChannel; // return self for chaining
    });
    mockChannel.subscribe.mockReturnValue(mockChannel); // return self

    (mockSupabase.channel as jest.Mock).mockReturnValue(mockChannel);
    (mockSupabase.removeChannel as jest.Mock).mockResolvedValue(undefined);

    const onMessage = jest.fn();
    const unsubscribe = subscribeToMessages('room-1', onMessage);

    expect(mockSupabase.channel).toHaveBeenCalledWith('messages:room-1');

    // Simulate a realtime INSERT payload
    capturedHandler!({
      new: {
        id: 'msg-rt-1',
        content: 'Realtime!',
        created_at: '2026-01-01T14:00:00Z',
        group_chat_id: 'room-1',
        user_id: 'user-1',
      },
    });

    expect(onMessage).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'msg-rt-1', content: 'Realtime!', senderName: null })
    );

    unsubscribe();
    expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel);
  });
});

// --- markChatRead ---

describe('markChatRead', () => {
  it('calls update on chat_participant with last_read_at', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null });
    const update = jest.fn().mockReturnValue({ eq });
    mockSupabase.from.mockReturnValue({ update } as any);

    await markChatRead('room-1');

    expect(mockSupabase.from).toHaveBeenCalledWith('chat_participant');
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ last_read_at: expect.any(String) })
    );
    expect(eq).toHaveBeenCalledWith('group_chat_id', 'room-1');
  });

  it('throws when Supabase returns an error', async () => {
    const eq = jest.fn().mockResolvedValue({ error: { message: 'Update error' } });
    const update = jest.fn().mockReturnValue({ eq });
    mockSupabase.from.mockReturnValue({ update } as any);

    await expect(markChatRead('room-1')).rejects.toMatchObject({ message: 'Update error' });
  });
});
