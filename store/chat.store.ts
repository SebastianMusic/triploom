import { create } from 'zustand';
import type { GroupChat, Message } from '@/types';

interface ChatState {
  groupChats: GroupChat[];
  activeGroupChatId: string | null;
  messages: Message[];
  isLoading: boolean;
  setGroupChats: (groupChats: GroupChat[]) => void;
  setActiveGroupChatId: (id: string | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useChatStore = create<ChatState>()(() => ({
  groupChats: [],
  activeGroupChatId: null,
  messages: [],
  isLoading: false,
  setGroupChats: () => {},
  setActiveGroupChatId: () => {},
  setMessages: () => {},
  addMessage: () => {},
  setLoading: () => {},
}));
