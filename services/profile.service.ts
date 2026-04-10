import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

type UpdateProfileData = Partial<Pick<Profile, 'user_name' | 'profile_picture_url'>>;

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

export async function updateProfile(
  userId: string,
  data: UpdateProfileData,
  _options?: unknown,
): Promise<Profile> {
  const profileUpdates: UpdateProfileData = {
    ...(data.user_name !== undefined ? { user_name: data.user_name?.trim() || null } : {}),
    ...(data.profile_picture_url !== undefined
      ? { profile_picture_url: data.profile_picture_url?.trim() || null }
      : {}),
  };

  const authMetadataUpdates = {
    ...(data.user_name !== undefined ? { full_name: data.user_name?.trim() || null } : {}),
  };

  if (Object.keys(authMetadataUpdates).length > 0) {
    const { error: authError } = await supabase.auth.updateUser({
      data: authMetadataUpdates,
    });

    if (authError) throw authError;
  }

  if (Object.keys(profileUpdates).length === 0) {
    const currentProfile = await getProfile(userId);

    if (!currentProfile) {
      throw new Error('Profile not found');
    }

    return currentProfile;
  }

  const { data: updated, error } = await supabase
    .from('profile')
    .update(profileUpdates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return updated;
}