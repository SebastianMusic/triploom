import { create } from 'zustand';
import type { Trip, TripParticipant } from '@/types';
import type { CreateTripDTO } from '@/types/trip.types';
import {
  createTrip as createTripService,
  getTrips as getTripsService,
  getTripParticipant,
} from '@/services/trip.service';

interface TripState {
  currentTrip: Trip | null;
  currentParticipant: TripParticipant | null;
  trips: Trip[];
  participants: TripParticipant[];
  isLoading: boolean;
  setCurrentTrip: (trip: Trip | null) => void;
  setTrips: (trips: Trip[]) => void;
  setParticipants: (participants: TripParticipant[]) => void;
  setLoading: (isLoading: boolean) => void;
  fetchTrips: () => Promise<void>;
  createTrip: (dto: CreateTripDTO) => Promise<Trip>;
  fetchCurrentParticipant: (tripId: string, userId: string) => Promise<void>;
}

export const useTripStore = create<TripState>()((set) => ({
  currentTrip: null,
  currentParticipant: null,
  trips: [],
  participants: [],
  isLoading: false,

  setCurrentTrip: (trip) => set({ currentTrip: trip }),
  setTrips: (trips) => set({ trips }),
  setParticipants: (participants) => set({ participants }),
  setLoading: (isLoading) => set({ isLoading }),

  fetchTrips: async () => {
    set({ isLoading: true });
    try {
      const trips = await getTripsService();
      set({ trips, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createTrip: async (dto) => {
    set({ isLoading: true });
    try {
      const trip = await createTripService(dto);
      set((state) => ({ trips: [...state.trips, trip], isLoading: false }));
      return trip;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchCurrentParticipant: async (tripId, userId) => {
    const participant = await getTripParticipant(tripId, userId);
    set({ currentParticipant: participant });
  },
}));
