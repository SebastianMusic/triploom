import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';
import {
  getParticipatedTripCountForCurrentEmail,
  updateSelectedTrip,
  getProfile,
  updateProfile,
  uploadProfileImage,
  getProfileImageUrl,
} from '@/services/profile.service';

interface ProfileState {
  profile: Profile | null;
  displayAvatarUrl: string;
  selectedTrip: string | null;
  participatedTripCount: number | null;
  participatedTripCountEmail: string | null;
  isLoading: boolean;
  setProfile: (profile: Profile | null) => void;
  setLoading: (isLoading: boolean) => void;
  fetchProfile: () => Promise<void>;
  fetchParticipatedTripCount: () => Promise<void>;
  setSelectedTrip: (tripId: string | null) => Promise<void>;
  saveProfileChanges: (changes: { localImageUri?: string; userName?: string | null; phoneNumber?: string | null }) => Promise<void>;
}

export const useProfileStore = create<ProfileState>()((set) => ({
  profile: null,
  displayAvatarUrl: '',
  selectedTrip: null,
  participatedTripCount: null,
  participatedTripCountEmail: null,
  isLoading: false,

  setProfile: (profile) => set({ profile, selectedTrip: profile?.selected_trip ?? null }),

  setLoading: (isLoading) => set({ isLoading }),

  fetchProfile: async () => {
    set({ isLoading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await getProfile(session.user.id);
        const participatedTripCountResult = await getParticipatedTripCountForCurrentEmail();
        const displayAvatarUrl = profile?.profile_picture_url
          ? (await getProfileImageUrl(profile.profile_picture_url).catch(() => null)) ?? ''
          : '';
        set({
          profile,
          displayAvatarUrl,
          selectedTrip: profile?.selected_trip ?? null,
          participatedTripCount: participatedTripCountResult.count,
          participatedTripCountEmail: participatedTripCountResult.email,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchParticipatedTripCount: async () => {
    set({ isLoading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated user');

      const participatedTripCountResult = await getParticipatedTripCountForCurrentEmail();
      set({
        participatedTripCount: participatedTripCountResult.count,
        participatedTripCountEmail: participatedTripCountResult.email,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  setSelectedTrip: async (tripId) => {
    set({ isLoading: true });
    try {
      const updatedProfile = await updateSelectedTrip(tripId);
      set({
        profile: updatedProfile,
        selectedTrip: updatedProfile.selected_trip,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  saveProfileChanges: async ({ localImageUri, userName, phoneNumber }) => {
    set({ isLoading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated user');

      // Upload local image first if the user took a new photo
      let profilePictureUrl: string | undefined;
      if (localImageUri) {
        profilePictureUrl = await uploadProfileImage(localImageUri);
      }

      const updated = await updateProfile(session.user.id, {
        ...(userName !== undefined ? { user_name: userName } : {}),
        ...(profilePictureUrl !== undefined ? { profile_picture_url: profilePictureUrl } : {}),
        ...(phoneNumber !== undefined ? { phonenumber: phoneNumber } : {}),
      });

      const displayAvatarUrl = updated.profile_picture_url
        ? (await getProfileImageUrl(updated.profile_picture_url).catch(() => null)) ?? ''
        : '';
      set({ profile: updated, displayAvatarUrl, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));
