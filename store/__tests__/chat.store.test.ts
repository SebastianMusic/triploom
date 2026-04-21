import { act } from '@testing-library/react-native';
import { useChatStore } from '../chat.store';

jest.mock('@/services/chat.service', () => ({
  getAllChatRooms: jest.fn(),
  getAllMessages: jest.fn(),
  sendMessage: jest.fn(),
  subscribeToMessages: jest.fn(() => jest.fn()),
  markChatRead: jest.fn().mockResolvedValue(undefined),
}));

import * as chatService from '@/services/chat.service';

const VALID_UUID = '123e4567-e89b-42d3-a456-556642440000';

const mockRoom = {
  id: 'room-1',
  chat_name: 'General',
  trip_id: 'trip-1',
  trip_group_id: null,
  event_id: null,
  created_at: '2026-01-01T00:00:00Z',
  hasUnread: true,
  lastActivityAt: '2026-01-02T00:00:00Z',
};

const mockMessage = {
  id: 'msg-1',
  content: 'Hello',
  created_at: '2026-01-01T12:00:00Z',
  group_chat_id: 'room-1',
  user_id: 'user-1',
  senderName: 'Alice',
};

beforeEach(() => {
  jest.clearAllMocks();
  (chatService.subscribeToMessages as jest.Mock).mockReturnValue(jest.fn());
  (chatService.markChatRead as jest.Mock).mockResolvedValue(undefined);
  useChatStore.setState({
    chatRooms: [],
    activeChatRoomId: null,
    messages: [],
    currentPage: 0,
    isLoading: false,
    isSending: false,
  });
});

// --- sendMessage ---

describe('sendMessage store action', () => {
  it('resets isSending to false and re-throws when service throws', async () => {
    const serviceError = new Error('Network error');
    (chatService.sendMessage as jest.Mock).mockRejectedValue(serviceError);

    let caughtError: Error | null = null;
    await act(async () => {
      try {
        await useChatStore.getState().sendMessage({
          content: 'Hello',
          group_chat_id: VALID_UUID,
        });
      } catch (err) {
        caughtError = err as Error;
      }
    });

    expect(caughtError).toBe(serviceError);
    expect(useChatStore.getState().isSending).toBe(false);
  });

  it('sets isSending to true during the call', async () => {
    let isSendingDuringCall = false;
    (chatService.sendMessage as jest.Mock).mockImplementation(async () => {
      isSendingDuringCall = useChatStore.getState().isSending;
      return mockMessage;
    });

    await act(async () => {
      await useChatStore.getState().sendMessage({
        content: 'Hello',
        group_chat_id: VALID_UUID,
      });
    });

    expect(isSendingDuringCall).toBe(true);
    expect(useChatStore.getState().isSending).toBe(false);
  });

  it('adds the sent message to state immediately', async () => {
    (chatService.sendMessage as jest.Mock).mockResolvedValue(mockMessage);

    await act(async () => {
      await useChatStore.getState().sendMessage({
        content: 'Hello',
        group_chat_id: VALID_UUID,
      });
    });

    expect(useChatStore.getState().messages[0]).toEqual(mockMessage);
  });
});

// --- getAllChatRooms ---

describe('getAllChatRooms store action', () => {
  it('sets chatRooms and clears isLoading on success', async () => {
    (chatService.getAllChatRooms as jest.Mock).mockResolvedValue([mockRoom]);

    await act(async () => {
      await useChatStore.getState().getAllChatRooms('trip-1');
    });

    expect(useChatStore.getState().chatRooms).toEqual([mockRoom]);
    expect(useChatStore.getState().isLoading).toBe(false);
  });

  it('resets isLoading and re-throws on error', async () => {
    (chatService.getAllChatRooms as jest.Mock).mockRejectedValue(new Error('fetch error'));

    let caughtError: Error | null = null;
    await act(async () => {
      try {
        await useChatStore.getState().getAllChatRooms('trip-1');
      } catch (err) {
        caughtError = err as Error;
      }
    });

    expect(caughtError).not.toBeNull();
    expect(useChatStore.getState().isLoading).toBe(false);
  });
});

// --- getAllMessages ---

describe('getAllMessages store action', () => {
  it('sets messages, resets page to 0, and clears isLoading', async () => {
    (chatService.getAllMessages as jest.Mock).mockResolvedValue([mockMessage]);

    await act(async () => {
      await useChatStore.getState().getAllMessages('room-1');
    });

    expect(useChatStore.getState().messages).toEqual([mockMessage]);
    expect(useChatStore.getState().currentPage).toBe(0);
    expect(useChatStore.getState().isLoading).toBe(false);
  });

  it('resets isLoading and re-throws on error', async () => {
    (chatService.getAllMessages as jest.Mock).mockRejectedValue(new Error('query error'));

    let caughtError: Error | null = null;
    await act(async () => {
      try {
        await useChatStore.getState().getAllMessages('room-1');
      } catch (err) {
        caughtError = err as Error;
      }
    });

    expect(caughtError).not.toBeNull();
    expect(useChatStore.getState().isLoading).toBe(false);
  });
});

// --- loadMoreMessages ---

describe('loadMoreMessages store action', () => {
  it('appends older messages and increments currentPage', async () => {
    useChatStore.setState({ messages: [mockMessage], currentPage: 0 });
    const olderMessage = { ...mockMessage, id: 'msg-2', content: 'Older' };
    (chatService.getAllMessages as jest.Mock).mockResolvedValue([olderMessage]);

    await act(async () => {
      await useChatStore.getState().loadMoreMessages('room-1');
    });

    const state = useChatStore.getState();
    expect(state.messages).toHaveLength(2);
    expect(state.messages[1]).toEqual(olderMessage);
    expect(state.currentPage).toBe(1);
    expect(chatService.getAllMessages).toHaveBeenCalledWith('room-1', 1);
  });
});

// --- openChatRoom ---

describe('openChatRoom store action', () => {
  it('sets activeChatRoomId, loads messages, and subscribes to realtime', async () => {
    (chatService.getAllMessages as jest.Mock).mockResolvedValue([mockMessage]);

    await act(async () => {
      await useChatStore.getState().openChatRoom('room-1');
    });

    const state = useChatStore.getState();
    expect(state.activeChatRoomId).toBe('room-1');
    expect(state.messages).toEqual([mockMessage]);
    expect(chatService.subscribeToMessages).toHaveBeenCalledWith(
      'room-1',
      expect.any(Function),
      expect.any(Function)
    );
    expect(chatService.markChatRead).toHaveBeenCalledWith('room-1');
  });

  it('clears the unread dot for the opened room optimistically', async () => {
    useChatStore.setState({ chatRooms: [mockRoom] });
    (chatService.getAllMessages as jest.Mock).mockResolvedValue([]);

    await act(async () => {
      await useChatStore.getState().openChatRoom('room-1');
    });

    const room = useChatStore.getState().chatRooms.find((r) => r.id === 'room-1');
    expect(room?.hasUnread).toBe(false);
  });
});

// --- closeChatRoom ---

describe('closeChatRoom store action', () => {
  it('calls unsubscribe, resets state, and calls markChatRead', async () => {
    const mockUnsubscribe = jest.fn();
    (chatService.subscribeToMessages as jest.Mock).mockReturnValue(mockUnsubscribe);
    (chatService.getAllMessages as jest.Mock).mockResolvedValue([mockMessage]);

    await act(async () => {
      await useChatStore.getState().openChatRoom('room-1');
    });

    jest.clearAllMocks();
    (chatService.markChatRead as jest.Mock).mockResolvedValue(undefined);

    act(() => {
      useChatStore.getState().closeChatRoom();
    });

    expect(mockUnsubscribe).toHaveBeenCalled();
    expect(chatService.markChatRead).toHaveBeenCalledWith('room-1');
    const state = useChatStore.getState();
    expect(state.activeChatRoomId).toBeNull();
    expect(state.messages).toEqual([]);
    expect(state.currentPage).toBe(0);
  });
});

// --- addMessage ---

describe('addMessage store action', () => {
  it('prepends message to the messages array', () => {
    useChatStore.setState({ messages: [mockMessage] });
    const newMessage = { ...mockMessage, id: 'msg-new', content: 'New!' };

    act(() => {
      useChatStore.getState().addMessage(newMessage);
    });

    const messages = useChatStore.getState().messages;
    expect(messages[0]).toEqual(newMessage);
    expect(messages[1]).toEqual(mockMessage);
  });

  it('calls markChatRead when a room is active', () => {
    useChatStore.setState({ activeChatRoomId: 'room-1' });

    act(() => {
      useChatStore.getState().addMessage(mockMessage);
    });

    expect(chatService.markChatRead).toHaveBeenCalledWith('room-1');
  });

  it('does not add a duplicate message with the same id', () => {
    useChatStore.setState({ messages: [mockMessage] });

    act(() => {
      useChatStore.getState().addMessage(mockMessage);
    });

    expect(useChatStore.getState().messages).toHaveLength(1);
  });
});
