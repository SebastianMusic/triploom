import { create } from 'zustand';
import type { Profile } from '@/types';

interface ProfileState {
  profile: Profile | null;
  isLoading: boolean;
  setProfile: (profile: Profile | null) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useProfileStore = create<ProfileState>()(() => ({
  profile: null,
  isLoading: false,
  setProfile: () => {},
  setLoading: () => {},
}));
