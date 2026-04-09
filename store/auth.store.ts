import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import {
	signIn as signInService,
	signUp as signUpService,
	signOut as signOutService,
} from '@/services/auth.service';
import type { SignInDTO, SignUpDTO } from '@/types/auth.types';

interface AuthState {
	session: Session | null;
	isLoading: boolean;
	/**
	 * Call once on app start (from the root layout).
	 * Restores any persisted session and listens for auth state changes.
	 */
	initialize: () => void;
	signIn: (dto: SignInDTO) => Promise<void>;
	signUp: (dto: SignUpDTO) => Promise<Session | null>;
	signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
	session: null,
	isLoading: true,

	initialize: () => {
		supabase.auth.getSession().then(({ data: { session } }) => {
			set({ session, isLoading: false });
		});

		supabase.auth.onAuthStateChange((_event, session) => {
			set({ session });
		});
	},

	signIn: async (dto) => {
		set({ isLoading: true });
		try {
			const session = await signInService(dto);
			set({ session, isLoading: false });
		} catch (error) {
			set({ isLoading: false });
			throw error;
		}
	},

	signUp: async (dto) => {
		set({ isLoading: true });
		try {
			const session = await signUpService(dto);
			set({ session, isLoading: false });
			return session;
		} catch (error) {
			set({ isLoading: false });
			throw error;
		}
	},

	signOut: async () => {
		set({ isLoading: true });
		try {
			await signOutService();
			set({ session: null, isLoading: false });
		} catch (error) {
			set({ isLoading: false });
			throw error;
		}
	},
}));
