import { create } from 'zustand';
import * as chatService from '@/services/chat.service';
import type { ChatRoomWithMeta, MessageWithSender, SendMessageDTO } from '@/types';

// Held outside Zustand state — not serialisable
let unsubscribeRef: (() => void) | null = null;
let channelWasError = false;

interface ChatState {
  chatRooms: ChatRoomWithMeta[];
  activeChatRoomId: string | null;
  messages: MessageWithSender[];
  currentPage: number;
  isLoading: boolean;
  isSending: boolean;

  getAllChatRooms: (tripId: string) => Promise<void>;
  getAllMessages: (roomId: string) => Promise<void>;
  loadMoreMessages: (roomId: string) => Promise<void>;
  sendMessage: (dto: SendMessageDTO) => Promise<void>;
  openChatRoom: (roomId: string) => Promise<void>;
  closeChatRoom: () => void;
  addMessage: (message: MessageWithSender) => void;
}

export const useChatStore = create<ChatState>()((set, get) => ({
  chatRooms: [],
  activeChatRoomId: null,
  messages: [],
  currentPage: 0,
  isLoading: false,
  isSending: false,

  getAllChatRooms: async (tripId) => {
    set({ isLoading: true });
    try {
      const chatRooms = await chatService.getAllChatRooms(tripId);
      set({ chatRooms, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  getAllMessages: async (roomId) => {
    set({ isLoading: true });
    try {
      const messages = await chatService.getAllMessages(roomId, 0);
      set({ messages, currentPage: 0, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  loadMoreMessages: async (roomId) => {
    set({ isLoading: true });
    try {
      const nextPage = get().currentPage + 1;
      const olderMessages = await chatService.getAllMessages(roomId, nextPage);
      set((state) => ({
        messages: [...state.messages, ...olderMessages],
        currentPage: nextPage,
        isLoading: false,
      }));
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  sendMessage: async (dto) => {
    set({ isSending: true });
    try {
      await chatService.sendMessage(dto);
      chatService.markChatRead(dto.group_chat_id).catch(() => {});
      set({ isSending: false });
    } catch (error) {
      set({ isSending: false });
      throw error;
    }
  },

  openChatRoom: async (roomId) => {
    set({ activeChatRoomId: roomId });
    await get().getAllMessages(roomId);
    chatService.markChatRead(roomId).catch(() => {});

    // Clear unread dot immediately without waiting for a refetch
    set((state) => ({
      chatRooms: state.chatRooms.map((room) =>
        room.id === roomId ? { ...room, hasUnread: false } : room
      ),
    }));

    channelWasError = false;

    // Subscribe to realtime with reconnection gap-fill
    unsubscribeRef = chatService.subscribeToMessages(
      roomId,
      (message) => {
        get().addMessage(message);
      },
      (status) => {
        if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
          channelWasError = true;
        } else if (status === 'SUBSCRIBED' && channelWasError) {
          channelWasError = false;
          // Backfill messages missed during the disconnection
          const { messages } = get();
          const lastSeenAt =
            messages.length > 0 ? messages[0].created_at : undefined;
          if (lastSeenAt) {
            chatService
              .getAllMessages(roomId, 0, lastSeenAt)
              .then((missed) => {
                if (missed.length > 0) {
                  set((state) => ({ messages: [...missed, ...state.messages] }));
                }
              })
              .catch(() => {
                // Silently ignore backfill errors
              });
          }
        }
      }
    );
  },

  closeChatRoom: () => {
    const { activeChatRoomId } = get();
    if (unsubscribeRef) {
      unsubscribeRef();
      unsubscribeRef = null;
    }
    channelWasError = false;
    set({ activeChatRoomId: null, messages: [], currentPage: 0 });
    if (activeChatRoomId) {
      chatService.markChatRead(activeChatRoomId).catch(() => {});
    }
  },

  addMessage: (message) => {
    const { activeChatRoomId } = get();
    set((state) => ({ messages: [message, ...state.messages] }));
    if (activeChatRoomId) {
      chatService.markChatRead(activeChatRoomId).catch(() => {});
    }
  },
}));
