import { create } from 'zustand';
import type { Message } from '@/types';

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useChatStore = create<ChatState>()(() => ({
  messages: [],
  isLoading: false,
  setMessages: () => {},
  addMessage: () => {},
  setLoading: () => {},
}));
