import { create } from 'zustand';
import type { EventInsert, EventUpdate } from '@/types';
import type { EventWithCount } from '@/services/events.service';
import {
  getEvents as getEventsService,
  createEvent as createEventService,
  updateEvent as updateEventService,
  deleteEvent as deleteEventService,
  registerForEvent as registerForEventService,
  unregisterFromEvent as unregisterFromEventService,
} from '@/services/events.service';

interface EventsState {
  events: EventWithCount[];
  isLoading: boolean;
  fetchEvents: (tripId: string) => Promise<void>;
  createEvent: (data: EventInsert) => Promise<EventWithCount>;
  updateEvent: (id: string, data: EventUpdate) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  registerForEvent: (eventId: string, participantId: string) => void;
  unregisterFromEvent: (eventId: string, participantId: string) => void;
  setEvents: (events: EventWithCount[]) => void;
  setLoading: (isLoading: boolean) => void;
}

function sortEvents(events: EventWithCount[]): EventWithCount[] {
  return [...events].sort((a, b) => {
    const aMandatory = a.is_optional === false ? 0 : 1;
    const bMandatory = b.is_optional === false ? 0 : 1;
    if (aMandatory !== bMandatory) return aMandatory - bMandatory;
    if (!a.start_time || !b.start_time) return 0;
    return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
  });
}

export const useEventsStore = create<EventsState>()((set) => ({
  events: [],
  isLoading: false,

  fetchEvents: async (tripId) => {
    set({ isLoading: true });
    try {
      const events = await getEventsService(tripId);
      set({ events: sortEvents(events), isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createEvent: async (data) => {
    const event = await createEventService(data);
    const withCount: EventWithCount = { ...event, event_participation: [] };
    set((state) => ({ events: sortEvents([...state.events, withCount]) }));
    return withCount;
  },

  deleteEvent: async (id) => {
    await deleteEventService(id);
    set((state) => ({ events: state.events.filter((e) => e.id !== id) }));
  },

  updateEvent: async (id, data) => {
    const updated = await updateEventService(id, data);
    set((state) => ({
      events: sortEvents(
        state.events.map((e) =>
          e.id === id ? { ...updated, event_participation: e.event_participation } : e,
        ),
      ),
    }));
  },

  // Optimistic local updates — no round-trip needed
  registerForEvent: (eventId, participantId) => {
    set((state) => ({
      events: state.events.map((e) =>
        e.id === eventId
          ? { ...e, event_participation: [...e.event_participation, { participant_id: participantId }] }
          : e,
      ),
    }));
    registerForEventService(eventId, participantId).catch(() => {
      // Revert on failure
      set((state) => ({
        events: state.events.map((e) =>
          e.id === eventId
            ? { ...e, event_participation: e.event_participation.filter((p) => p.participant_id !== participantId) }
            : e,
        ),
      }));
    });
  },

  unregisterFromEvent: (eventId, participantId) => {
    set((state) => ({
      events: state.events.map((e) =>
        e.id === eventId
          ? { ...e, event_participation: e.event_participation.filter((p) => p.participant_id !== participantId) }
          : e,
      ),
    }));
    unregisterFromEventService(eventId, participantId).catch(() => {
      // Revert on failure
      set((state) => ({
        events: state.events.map((e) =>
          e.id === eventId
            ? { ...e, event_participation: [...e.event_participation, { participant_id: participantId }] }
            : e,
        ),
      }));
    });
  },

  setEvents: (events) => set({ events }),
  setLoading: (isLoading) => set({ isLoading }),
}));
