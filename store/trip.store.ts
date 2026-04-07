import { create } from 'zustand';
import type { Trip } from '@/types';

interface TripState {
  currentTrip: Trip | null;
  trips: Trip[];
  isLoading: boolean;
  setCurrentTrip: (trip: Trip | null) => void;
  setTrips: (trips: Trip[]) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useTripStore = create<TripState>()(() => ({
  currentTrip: null,
  trips: [],
  isLoading: false,
  setCurrentTrip: () => {},
  setTrips: () => {},
  setLoading: () => {},
}));
