import { create } from 'zustand';
import * as chatService from '@/services/chat.service';
import type { ChatRoomWithMeta, EditMessageDTO, MessageWithSender, SendMessageDTO, SendLocationMessageDTO } from '@/types';

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
  editingMessage: MessageWithSender | null;
  isUpdating: boolean;
  isDeleting: boolean;

  getAllChatRooms: (tripId: string) => Promise<void>;
  getAllMessages: (roomId: string) => Promise<void>;
  loadMoreMessages: (roomId: string) => Promise<void>;
  sendMessage: (dto: SendMessageDTO) => Promise<void>;
  sendLocationMessage: (dto: SendLocationMessageDTO) => Promise<void>;
  openChatRoom: (roomId: string) => Promise<void>;
  closeChatRoom: () => void;
  addMessage: (message: MessageWithSender) => void;
  replaceMessage: (message: MessageWithSender) => void;
  removeMessage: (messageId: string) => void;
  startEditingMessage: (message: MessageWithSender) => void;
  cancelEditingMessage: () => void;
  updateMessage: (dto: EditMessageDTO) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
}

export const useChatStore = create<ChatState>()((set, get) => ({
  chatRooms: [],
  activeChatRoomId: null,
  messages: [],
  currentPage: 0,
  isLoading: false,
  isSending: false,
  editingMessage: null,
  isUpdating: false,
  isDeleting: false,

  getAllChatRooms: async (tripId) => {
    set({ isLoading: true, chatRooms: [] });
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
      set((state) => {
        const existingIds = new Set(state.messages.map((m) => m.id));
        const unique = olderMessages.filter((m) => !existingIds.has(m.id));
        return { messages: [...state.messages, ...unique], currentPage: nextPage, isLoading: false };
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  sendMessage: async (dto) => {
    set({ isSending: true });
    try {
      const message = await chatService.sendMessage(dto);
      get().addMessage(message);
      chatService.markChatRead(dto.group_chat_id).catch(() => {});
      set({ isSending: false });
    } catch (error) {
      set({ isSending: false });
      throw error;
    }
  },

  sendLocationMessage: async (dto) => {
    set({ isSending: true });
    try {
      const message = await chatService.sendLocationMessage(dto);
      get().addMessage(message);
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
      (message) => {
        get().replaceMessage(message);
      },
      (messageId) => {
        get().removeMessage(messageId);
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
                  set((state) => {
                    const existingIds = new Set(state.messages.map((m) => m.id));
                    const unique = missed.filter((m) => !existingIds.has(m.id));
                    return unique.length > 0 ? { messages: [...unique, ...state.messages] } : state;
                  });
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
    set({ activeChatRoomId: null, messages: [], currentPage: 0, editingMessage: null });
    if (activeChatRoomId) {
      chatService.markChatRead(activeChatRoomId).catch(() => {});
    }
  },

  addMessage: (message) => {
    const { activeChatRoomId } = get();
    set((state) => {
      if (state.messages.some((m) => m.id === message.id)) return state;
      return { messages: [message, ...state.messages] };
    });
    if (activeChatRoomId) {
      chatService.markChatRead(activeChatRoomId).catch(() => {});
    }
  },

  replaceMessage: (message) => {
    set((state) => ({
      messages: state.messages.map((m) => (m.id === message.id ? message : m)),
    }));
  },

  removeMessage: (messageId) => {
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== messageId),
      editingMessage: state.editingMessage?.id === messageId ? null : state.editingMessage,
    }));
  },

  startEditingMessage: (message) => {
    set({ editingMessage: message });
  },

  cancelEditingMessage: () => {
    set({ editingMessage: null });
  },

  updateMessage: async (dto) => {
    set({ isUpdating: true });
    try {
      const updated = await chatService.updateMessage(dto);
      get().replaceMessage(updated);
      set({ isUpdating: false, editingMessage: null });
    } catch (error) {
      set({ isUpdating: false });
      throw error;
    }
  },

  deleteMessage: async (messageId) => {
    set({ isDeleting: true });
    try {
      const deleted = await chatService.deleteMessage(messageId);
      get().replaceMessage(deleted);
      set({ isDeleting: false, editingMessage: null });
    } catch (error) {
      set({ isDeleting: false });
      throw error;
    }
  },
}));
