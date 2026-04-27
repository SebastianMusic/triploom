import { create } from 'zustand';
import type { Trip, TripParticipant } from '@/types';
import { TripRole } from '@/types';
import type { CreateTripDTO, TripWithRole } from '@/types/trip.types';
import type { RedeemInviteResponse } from '@/types/invite.types';
import {
  createTrip as createTripService,
  getTrips as getTripsService,
  deleteTrip as deleteTripService,
  getTripParticipant,
  getTripParticipantsWithProfiles,
  kickParticipant as kickParticipantService,
  leaveTrip as leaveTripService,
  updateParticipantRole as updateParticipantRoleService,
  updateTrip as updateTripService,
  type TripParticipantWithProfile,
} from '@/services/trip.service';
import {
  generateInviteLink as generateInviteLinkService,
  redeemInviteLink as redeemInviteLinkService,
} from '@/services/invite.service';

interface TripState {
  currentTrip: Trip | null;
  currentParticipant: TripParticipant | null;
  trips: TripWithRole[];
  participants: TripParticipant[];
  participantsWithProfiles: TripParticipantWithProfile[];
  isLoadingParticipants: boolean;
  isLoading: boolean;
  inviteUrl: string | null;
  isGeneratingInvite: boolean;
  isRedeemingInvite: boolean;
  inviteError: string | null;
  setCurrentTrip: (trip: Trip | null) => void;
  setTrips: (trips: TripWithRole[]) => void;
  fetchTrips: () => Promise<void>;
  setParticipants: (participants: TripParticipant[]) => void;
  setLoading: (isLoading: boolean) => void;
  createTrip: (dto: CreateTripDTO) => Promise<Trip>;
  updateTrip: (tripId: string, updates: Partial<Pick<Trip, 'name' | 'description' | 'start_date' | 'end_date' | 'banner_image_url' | 'event_permission' | 'description_file_url'>>) => Promise<void>;
  deleteTrip: (tripId: string) => Promise<void>;
  fetchCurrentParticipant: (tripId: string, userId: string) => Promise<void>;
  fetchParticipants: (tripId: string) => Promise<void>;
  updateParticipantRole: (tripId: string, actorUserId: string, targetUserId: string, newRole: TripRole) => Promise<void>;
  kickParticipant: (tripId: string, targetUserId: string) => Promise<void>;
  generateInvite: (tripId: string) => Promise<string>;
  redeemInvite: (code: string) => Promise<RedeemInviteResponse>;
  leaveTrip: (tripId: string) => Promise<void>;
}

export const useTripStore = create<TripState>()((set) => ({
  currentTrip: null,
  currentParticipant: null,
  trips: [],
  participants: [],
  participantsWithProfiles: [],
  isLoadingParticipants: false,
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
      set((state) => ({
        trips: [...state.trips, { ...trip, userRole: TripRole.Organizer }],
        isLoading: false,
      }));
      return trip;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateTrip: async (tripId, updates) => {
    const updated = await updateTripService(tripId, updates);
    set((state) => ({
      currentTrip: state.currentTrip?.id === tripId ? updated : state.currentTrip,
      trips: state.trips.map((t) => (t.id === tripId ? { ...t, ...updated } : t)),
    }));
  },

  deleteTrip: async (tripId) => {
    set({ isLoading: true });
    try {
      await deleteTripService(tripId);
      set((state) => ({
        trips: state.trips.filter((t) => t.id !== tripId),
        isLoading: false,
      }));
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchCurrentParticipant: async (tripId, userId) => {
    const participant = await getTripParticipant(tripId, userId);
    set({ currentParticipant: participant });
  },

  fetchParticipants: async (tripId) => {
    set({ isLoadingParticipants: true });
    try {
      const participantsWithProfiles = await getTripParticipantsWithProfiles(tripId);
      set({ participantsWithProfiles, isLoadingParticipants: false });
    } catch (error) {
      set({ isLoadingParticipants: false });
      throw error;
    }
  },

  updateParticipantRole: async (tripId, actorUserId, targetUserId, newRole) => {
    const updated = await updateParticipantRoleService(tripId, actorUserId, targetUserId, newRole);
    set((state) => ({
      participantsWithProfiles: state.participantsWithProfiles.map((p) =>
        p.user_id === targetUserId ? { ...p, role: updated.role } : p,
      ),
    }));
  },

  kickParticipant: async (tripId, targetUserId) => {
    await kickParticipantService(tripId, targetUserId);
    set((state) => ({
      participantsWithProfiles: state.participantsWithProfiles.filter(
        (p) => p.user_id !== targetUserId,
      ),
    }));
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
