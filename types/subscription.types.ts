import type { Tables } from './database.types';

export enum SubscriptionStatus {
  Active = 'active',
  Canceling = 'canceling',
  Inactive = 'inactive',
  Canceled = 'canceled',
  PastDue = 'past_due',
}

export type Subscription = Tables<'subscription'>;
export type SubscriptionInsert = import('./database.types').TablesInsert<'subscription'>;
export type SubscriptionUpdate = import('./database.types').TablesUpdate<'subscription'>;

export function isSubscriptionActive(subscription: Subscription | null): boolean {
  if (!subscription) return false;
  return subscription.status === SubscriptionStatus.Active || subscription.status === SubscriptionStatus.Canceling;
}
