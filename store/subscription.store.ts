import {
    cancelSubscription as cancelSubscriptionService,
    createCheckoutSession as createCheckoutSessionService,
    getSubscription as getSubscriptionService,
} from '@/services/subscription.service';
import type { Subscription } from '@/types';
import { isSubscriptionActive } from '@/types';
import { create } from 'zustand';

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
      console.log('Cancel service called, fetching updated subscription...');
      const subscription = await getSubscriptionService();
      console.log('Updated subscription status:', subscription?.status);
      set({ subscription, isActive: isSubscriptionActive(subscription), isLoading: false });
    } catch (error) {
      console.error('Cancel subscription error:', error);
      set({ isLoading: false });
      throw error;
    }
  },
}));
