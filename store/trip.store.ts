import { create } from 'zustand';
import type { Trip, TripParticipant } from '@/types';
import type { CreateTripDTO } from '@/types/trip.types';
import type { RedeemInviteResponse } from '@/types/invite.types';
import {
  createTrip as createTripService,
  getTrips as getTripsService,
  getTripParticipant,
  leaveTrip as leaveTripService,
} from '@/services/trip.service';
import {
  generateInviteLink as generateInviteLinkService,
  redeemInviteLink as redeemInviteLinkService,
} from '@/services/invite.service';

interface TripState {
  currentTrip: Trip | null;
  currentParticipant: TripParticipant | null;
  trips: Trip[];
  participants: TripParticipant[];
  isLoading: boolean;
  inviteUrl: string | null;
  isGeneratingInvite: boolean;
  isRedeemingInvite: boolean;
  inviteError: string | null;
  setCurrentTrip: (trip: Trip | null) => void;
  setTrips: (trips: Trip[]) => void;
  setParticipants: (participants: TripParticipant[]) => void;
  setLoading: (isLoading: boolean) => void;
  fetchTrips: () => Promise<void>;
  createTrip: (dto: CreateTripDTO) => Promise<Trip>;
  fetchCurrentParticipant: (tripId: string, userId: string) => Promise<void>;
  generateInvite: (tripId: string) => Promise<string>;
  redeemInvite: (code: string) => Promise<RedeemInviteResponse>;
  leaveTrip: (tripId: string) => Promise<void>;
}

export const useTripStore = create<TripState>()((set) => ({
  currentTrip: null,
  currentParticipant: null,
  trips: [],
  participants: [],
  isLoading: false,
  inviteUrl: null,
  isGeneratingInvite: false,
  isRedeemingInvite: false,
  inviteError: null,

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

  generateInvite: async (tripId: string) => {
    set({ isGeneratingInvite: true, inviteError: null });
    try {
      const inviteUrl = await generateInviteLinkService(tripId);
      set({ inviteUrl, isGeneratingInvite: false });
      return inviteUrl;
    } catch (error: any) {
      set({ isGeneratingInvite: false, inviteError: error.message });
      throw error;
    }
  },

  redeemInvite: async (code: string) => {
    set({ isRedeemingInvite: true, inviteError: null });
    try {
      const result = await redeemInviteLinkService(code);
      set({ isRedeemingInvite: false });
      return result;
    } catch (error: any) {
      set({ isRedeemingInvite: false, inviteError: error.message });
      throw error;
    }
  },

  leaveTrip: async (tripId: string) => {
    await leaveTripService(tripId);
    set((state) => ({ trips: state.trips.filter((t) => t.id !== tripId) }));
  },
}));
