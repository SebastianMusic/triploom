import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';
import { updateSelectedTrip, getProfile } from '@/services/profile.service';

interface ProfileState {
  profile: Profile | null;
  selectedTrip: string | null;
  isLoading: boolean;
  setProfile: (profile: Profile | null) => void;
  setLoading: (isLoading: boolean) => void;
  fetchProfile: () => Promise<void>;
  setSelectedTrip: (tripId: string | null) => Promise<void>;
}

export const useProfileStore = create<ProfileState>()((set) => ({
  profile: null,
  selectedTrip: null,
  isLoading: false,

  setProfile: (profile) => set({ profile, selectedTrip: profile?.selected_trip ?? null }),

  setLoading: (isLoading) => set({ isLoading }),

  fetchProfile: async () => {
    set({ isLoading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await getProfile(session.user.id);
        set({
          profile,
          selectedTrip: profile?.selected_trip ?? null,
          isLoading: false,
        });
      }
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
}));
