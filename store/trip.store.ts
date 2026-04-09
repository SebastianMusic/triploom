import { create } from 'zustand';
import type { Trip, TripParticipant } from '@/types';
import type { CreateTripDTO } from '@/types/trip.types';
import { createTrip as createTripService } from '@/services/trip.service';

interface TripState {
  currentTrip: Trip | null;
  trips: Trip[];
  participants: TripParticipant[];
  isLoading: boolean;
  setCurrentTrip: (trip: Trip | null) => void;
  setTrips: (trips: Trip[]) => void;
  setParticipants: (participants: TripParticipant[]) => void;
  setLoading: (isLoading: boolean) => void;
  createTrip: (dto: CreateTripDTO) => Promise<Trip>;
}

export const useTripStore = create<TripState>()((set) => ({
  currentTrip: null,
  trips: [],
  participants: [],
  isLoading: false,

  setCurrentTrip: (trip) => set({ currentTrip: trip }),
  setTrips: (trips) => set({ trips }),
  setParticipants: (participants) => set({ participants }),
  setLoading: (isLoading) => set({ isLoading }),

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
}));
