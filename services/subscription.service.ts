import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Subscription } from '@/types';

export async function getSubscription(): Promise<Subscription | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('No authenticated user');

  const { data, error } = await supabase
    .from('subscription')
    .select('*')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function cancelSubscription(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('No authenticated user');

  const { data, error } = await supabase.functions.invoke('cancel-subscription', {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body = await (error.context as Response).json().catch(() => null) as { error?: string } | null;
      if (body?.error) throw new Error(body.error);
    }
    throw error;
  }
  if (!data?.canceled) throw new Error('Cancellation failed');
}

export async function createCheckoutSession(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('No authenticated user');

  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body = await (error.context as Response).json().catch(() => null) as { error?: string } | null;
      if (body?.error) throw new Error(body.error);
    }
    throw error;
  }
  if (!data?.url) throw new Error('No checkout URL returned');
  return data.url as string;
}
