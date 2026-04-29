import { create } from 'zustand';
import type { Subscription } from '@/types';
import { isSubscriptionActive } from '@/types';
import {
  getSubscription as getSubscriptionService,
  cancelSubscription as cancelSubscriptionService,
  createCheckoutSession as createCheckoutSessionService,
} from '@/services/subscription.service';

interface SubscriptionState {
  subscription: Subscription | null;
  isLoading: boolean;
  isActive: boolean;
  fetchSubscription: () => Promise<void>;
  createCheckoutSession: () => Promise<string>;
  cancelSubscription: () => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>()((set) => ({
  subscription: null,
  isLoading: false,
  isActive: false,

  fetchSubscription: async () => {
    set({ isLoading: true });
    try {
      const subscription = await getSubscriptionService();
      set({ subscription, isActive: isSubscriptionActive(subscription), isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createCheckoutSession: async () => {
    set({ isLoading: true });
    try {
      const url = await createCheckoutSessionService();
      set({ isLoading: false });
      return url;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  cancelSubscription: async () => {
    set({ isLoading: true });
    try {
      await cancelSubscriptionService();
      const subscription = await getSubscriptionService();
      set({ subscription, isActive: isSubscriptionActive(subscription), isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));
