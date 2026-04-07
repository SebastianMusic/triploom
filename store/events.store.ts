import { create } from 'zustand';
import type { Event } from '@/types';

interface EventsState {
  events: Event[];
  isLoading: boolean;
  setEvents: (events: Event[]) => void;
  addEvent: (event: Event) => void;
  removeEvent: (id: string) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useEventsStore = create<EventsState>()(() => ({
  events: [],
  isLoading: false,
  setEvents: () => {},
  addEvent: () => {},
  removeEvent: () => {},
  setLoading: () => {},
}));
