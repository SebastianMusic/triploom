import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

export async function updateSelectedTrip(tripId: string | null): Promise<Profile> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    throw new Error('No authenticated user');
  }

  const { data, error } = await supabase
    .from('profile')
    .update({ selected_trip: tripId })
    .eq('id', session.user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profile')
    .select()
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, data: Partial<Profile>): Promise<Profile> {
  const { data: updated, error } = await supabase
    .from('profile')
    .update(data)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return updated;
}