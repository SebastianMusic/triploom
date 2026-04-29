import { act } from '@testing-library/react-native';
import { useChatStore } from '../chat.store';

jest.mock('@/services/chat.service', () => ({
  getAllChatRooms: jest.fn(),
  getAllMessages: jest.fn(),
  sendMessage: jest.fn(),
  updateMessage: jest.fn(),
  deleteMessage: jest.fn(),
  deleteUploadedImages: jest.fn().mockResolvedValue(undefined),
  subscribeToMessages: jest.fn(() => jest.fn()),
  subscribeToAllRoomMessages: jest.fn(() => jest.fn()),
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
  imageUrl: null,
};

const mockMessage = {
  id: 'msg-1',
  content: 'Hello',
  created_at: '2026-01-01T12:00:00Z',
  updated_at: null,
  deleted_at: null,
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
    editingMessage: null,
    isUpdating: false,
    isDeleting: false,
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

  it('clears chatRooms immediately before fetch resolves', async () => {
    useChatStore.setState({ chatRooms: [mockRoom] });
    let chatRoomsDuringFetch: typeof mockRoom[] = [];
    (chatService.getAllChatRooms as jest.Mock).mockImplementation(async () => {
      chatRoomsDuringFetch = useChatStore.getState().chatRooms as typeof mockRoom[];
      return [];
    });

    await act(async () => {
      await useChatStore.getState().getAllChatRooms('trip-1');
    });

    expect(chatRoomsDuringFetch).toHaveLength(0);
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
      expect.any(Function),
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

// --- replaceMessage ---

describe('replaceMessage store action', () => {
  it('replaces a message with the same id in place', () => {
    const other = { ...mockMessage, id: 'msg-2', content: 'Other' };
    useChatStore.setState({ messages: [mockMessage, other] });
    const updated = { ...mockMessage, content: 'Updated' };

    act(() => {
      useChatStore.getState().replaceMessage(updated);
    });

    const messages = useChatStore.getState().messages;
    expect(messages[0].content).toBe('Updated');
    expect(messages[1]).toEqual(other);
  });

  it('leaves messages unchanged when id is not found', () => {
    useChatStore.setState({ messages: [mockMessage] });
    const ghost = { ...mockMessage, id: 'ghost-id', content: 'Ghost' };

    act(() => {
      useChatStore.getState().replaceMessage(ghost);
    });

    expect(useChatStore.getState().messages).toEqual([mockMessage]);
  });
});

// --- removeMessage ---

describe('removeMessage store action', () => {
  it('removes the message with the given id', () => {
    const other = { ...mockMessage, id: 'msg-2', content: 'Other' };
    useChatStore.setState({ messages: [mockMessage, other] });

    act(() => {
      useChatStore.getState().removeMessage('msg-1');
    });

    const messages = useChatStore.getState().messages;
    expect(messages).toHaveLength(1);
    expect(messages[0].id).toBe('msg-2');
  });

  it('clears editingMessage when the removed message is the one being edited', () => {
    useChatStore.setState({ messages: [mockMessage], editingMessage: mockMessage });

    act(() => {
      useChatStore.getState().removeMessage('msg-1');
    });

    expect(useChatStore.getState().editingMessage).toBeNull();
  });

  it('leaves editingMessage intact when removing a different message', () => {
    const other = { ...mockMessage, id: 'msg-2' };
    useChatStore.setState({ messages: [mockMessage, other], editingMessage: mockMessage });

    act(() => {
      useChatStore.getState().removeMessage('msg-2');
    });

    expect(useChatStore.getState().editingMessage).toEqual(mockMessage);
  });
});

// --- startEditingMessage / cancelEditingMessage ---

describe('startEditingMessage and cancelEditingMessage store actions', () => {
  it('startEditingMessage sets editingMessage', () => {
    act(() => {
      useChatStore.getState().startEditingMessage(mockMessage);
    });

    expect(useChatStore.getState().editingMessage).toEqual(mockMessage);
  });

  it('cancelEditingMessage clears editingMessage', () => {
    useChatStore.setState({ editingMessage: mockMessage });

    act(() => {
      useChatStore.getState().cancelEditingMessage();
    });

    expect(useChatStore.getState().editingMessage).toBeNull();
  });
});

// --- updateMessage ---

describe('updateMessage store action', () => {
  it('replaces the message in state and clears editingMessage on success', async () => {
    const updated = { ...mockMessage, content: 'Edited content', updated_at: '2026-01-02T00:00:00Z' };
    useChatStore.setState({ messages: [mockMessage], editingMessage: mockMessage });
    (chatService.updateMessage as jest.Mock).mockResolvedValue(updated);

    await act(async () => {
      await useChatStore.getState().updateMessage({ id: 'msg-1', content: 'Edited content' });
    });

    const state = useChatStore.getState();
    expect(state.messages[0].content).toBe('Edited content');
    expect(state.editingMessage).toBeNull();
    expect(state.isUpdating).toBe(false);
  });

  it('sets isUpdating to true during the call', async () => {
    let isUpdatingDuringCall = false;
    (chatService.updateMessage as jest.Mock).mockImplementation(async () => {
      isUpdatingDuringCall = useChatStore.getState().isUpdating;
      return mockMessage;
    });

    await act(async () => {
      await useChatStore.getState().updateMessage({ id: 'msg-1', content: 'x' });
    });

    expect(isUpdatingDuringCall).toBe(true);
    expect(useChatStore.getState().isUpdating).toBe(false);
  });

  it('resets isUpdating and re-throws on error', async () => {
    (chatService.updateMessage as jest.Mock).mockRejectedValue(new Error('update failed'));

    let caughtError: Error | null = null;
    await act(async () => {
      try {
        await useChatStore.getState().updateMessage({ id: 'msg-1', content: 'x' });
      } catch (err) {
        caughtError = err as Error;
      }
    });

    expect(caughtError?.message).toBe('update failed');
    expect(useChatStore.getState().isUpdating).toBe(false);
  });
});

// --- deleteMessage ---

describe('deleteMessage store action', () => {
  it('replaces the message with the soft-deleted version and clears editingMessage', async () => {
    const softDeleted = { ...mockMessage, content: null, deleted_at: '2026-01-02T00:00:00Z' };
    useChatStore.setState({ messages: [mockMessage], editingMessage: mockMessage });
    (chatService.deleteMessage as jest.Mock).mockResolvedValue(softDeleted);

    await act(async () => {
      await useChatStore.getState().deleteMessage('msg-1');
    });

    const state = useChatStore.getState();
    expect(state.messages[0].deleted_at).not.toBeNull();
    expect(state.messages[0].content).toBeNull();
    expect(state.editingMessage).toBeNull();
    expect(state.isDeleting).toBe(false);
  });

  it('sets isDeleting to true during the call', async () => {
    let isDeletingDuringCall = false;
    (chatService.deleteMessage as jest.Mock).mockImplementation(async () => {
      isDeletingDuringCall = useChatStore.getState().isDeleting;
      return { ...mockMessage, content: null, deleted_at: '2026-01-02T00:00:00Z' };
    });

    await act(async () => {
      await useChatStore.getState().deleteMessage('msg-1');
    });

    expect(isDeletingDuringCall).toBe(true);
    expect(useChatStore.getState().isDeleting).toBe(false);
  });

  it('resets isDeleting and re-throws on error', async () => {
    (chatService.deleteMessage as jest.Mock).mockRejectedValue(new Error('delete failed'));

    let caughtError: Error | null = null;
    await act(async () => {
      try {
        await useChatStore.getState().deleteMessage('msg-1');
      } catch (err) {
        caughtError = err as Error;
      }
    });

    expect(caughtError?.message).toBe('delete failed');
    expect(useChatStore.getState().isDeleting).toBe(false);
  });
});

// --- getAllChatRooms global subscription ---

describe('getAllChatRooms global subscription', () => {
  it('starts the global subscription after loading rooms', async () => {
    (chatService.getAllChatRooms as jest.Mock).mockResolvedValue([mockRoom]);

    await act(async () => {
      await useChatStore.getState().getAllChatRooms('trip-1');
    });

    expect(chatService.subscribeToAllRoomMessages).toHaveBeenCalledTimes(1);
  });

  it('marks a room as unread when a message arrives for an inactive room', async () => {
    const unreadRoom = { ...mockRoom, hasUnread: false };
    (chatService.getAllChatRooms as jest.Mock).mockResolvedValue([unreadRoom]);

    let capturedCallback: ((groupChatId: string) => void) | null = null;
    (chatService.subscribeToAllRoomMessages as jest.Mock).mockImplementation((_roomIds, cb) => {
      capturedCallback = cb;
      return jest.fn();
    });

    await act(async () => {
      await useChatStore.getState().getAllChatRooms('trip-1');
    });

    act(() => {
      capturedCallback!('room-1');
    });

    const room = useChatStore.getState().chatRooms.find((r) => r.id === 'room-1');
    expect(room?.hasUnread).toBe(true);
  });

  it('does not mark a room as unread when the message is for the active room', async () => {
    const unreadRoom = { ...mockRoom, hasUnread: false };
    (chatService.getAllChatRooms as jest.Mock).mockResolvedValue([unreadRoom]);
    useChatStore.setState({ activeChatRoomId: 'room-1' });

    let capturedCallback: ((groupChatId: string) => void) | null = null;
    (chatService.subscribeToAllRoomMessages as jest.Mock).mockImplementation((_roomIds, cb) => {
      capturedCallback = cb;
      return jest.fn();
    });

    await act(async () => {
      await useChatStore.getState().getAllChatRooms('trip-1');
    });

    act(() => {
      capturedCallback!('room-1');
    });

    const room = useChatStore.getState().chatRooms.find((r) => r.id === 'room-1');
    expect(room?.hasUnread).toBe(false);
  });
});

// --- resetChatState ---

describe('resetChatState store action', () => {
  it('clears all chat state', async () => {
    useChatStore.setState({
      chatRooms: [mockRoom],
      messages: [mockMessage],
      activeChatRoomId: 'room-1',
      currentPage: 3,
      editingMessage: mockMessage,
    });

    act(() => {
      useChatStore.getState().resetChatState();
    });

    const state = useChatStore.getState();
    expect(state.chatRooms).toEqual([]);
    expect(state.messages).toEqual([]);
    expect(state.activeChatRoomId).toBeNull();
    expect(state.currentPage).toBe(0);
    expect(state.editingMessage).toBeNull();
  });

  it('calls the global unsubscribe function', async () => {
    const mockGlobalUnsub = jest.fn();
    (chatService.subscribeToAllRoomMessages as jest.Mock).mockReturnValue(mockGlobalUnsub);
    (chatService.getAllChatRooms as jest.Mock).mockResolvedValue([mockRoom]);

    await act(async () => {
      await useChatStore.getState().getAllChatRooms('trip-1');
    });

    act(() => {
      useChatStore.getState().resetChatState();
    });

    expect(mockGlobalUnsub).toHaveBeenCalled();
  });

  it('calls the per-room unsubscribe function', async () => {
    const mockUnsub = jest.fn();
    (chatService.subscribeToMessages as jest.Mock).mockReturnValue(mockUnsub);
    (chatService.getAllMessages as jest.Mock).mockResolvedValue([]);

    await act(async () => {
      await useChatStore.getState().openChatRoom('room-1');
    });

    act(() => {
      useChatStore.getState().resetChatState();
    });

    expect(mockUnsub).toHaveBeenCalled();
  });
});
