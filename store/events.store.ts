import { create } from 'zustand';
import type { Event, EventInsert } from '@/types';
import {
  getEvents as getEventsService,
  createEvent as createEventService,
} from '@/services/events.service';

interface EventsState {
  events: Event[];
  isLoading: boolean;
  fetchEvents: (tripId: string) => Promise<void>;
  createEvent: (data: EventInsert) => Promise<Event>;
  setEvents: (events: Event[]) => void;
  addEvent: (event: Event) => void;
  removeEvent: (id: string) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useEventsStore = create<EventsState>()((set) => ({
  events: [],
  isLoading: false,

  fetchEvents: async (tripId) => {
    set({ isLoading: true });
    try {
      const events = await getEventsService(tripId);
      set({ events, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createEvent: async (data) => {
    const event = await createEventService(data);
    set((state) => ({
      events: [...state.events, event].sort((a, b) => {
        if (!a.start_time || !b.start_time) return 0;
        return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
      }),
    }));
    return event;
  },

  setEvents: (events) => set({ events }),
  addEvent: (event) => set((state) => ({ events: [...state.events, event] })),
  removeEvent: (id) => set((state) => ({ events: state.events.filter((e) => e.id !== id) })),
  setLoading: (isLoading) => set({ isLoading }),
}));
