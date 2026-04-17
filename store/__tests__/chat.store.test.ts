import { act } from '@testing-library/react-native';
import { useChatStore } from '../chat.store';

// Mock the entire chat service
jest.mock('@/services/chat.service', () => ({
  getAllChatRooms: jest.fn(),
  getAllMessages: jest.fn(),
  sendMessage: jest.fn(),
  subscribeToMessages: jest.fn(() => jest.fn()),
  markChatRead: jest.fn().mockResolvedValue(undefined),
}));

import * as chatService from '@/services/chat.service';

const VALID_UUID = '123e4567-e89b-42d3-a456-556642440000';

beforeEach(() => {
  jest.clearAllMocks();
  // Reset store state between tests
  useChatStore.setState({
    chatRooms: [],
    activeChatRoomId: null,
    messages: [],
    currentPage: 0,
    isLoading: false,
    isSending: false,
  });
});

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
});
