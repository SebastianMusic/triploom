import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

const PROFILE_IMAGE_BUCKET = 'profile_image';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Uploads a local image URI to the profile_image bucket.
 * Path structure: {userId}/{uuid} — guarantees uniqueness and ties the file to the user.
 * Returns the image ID (UUID filename) to store in profile.profile_picture_url.
 * Automatically removes the previous profile image from storage if one exists.
 */
export async function uploadProfileImage(localUri: string): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('No authenticated user');

  const userId = session.user.id;
  const imageId = generateUUID();
  const storagePath = `${userId}/${imageId}`;

  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();

  const { error } = await supabase.storage
    .from(PROFILE_IMAGE_BUCKET)
    .upload(storagePath, arrayBuffer, { contentType: 'image/jpeg', upsert: false });

  if (error) throw error;

  // Clean up previous image so the bucket doesn't accumulate orphaned files
  const currentProfile = await getProfile(userId);
  if (currentProfile?.profile_picture_url) {
    await supabase.storage
      .from(PROFILE_IMAGE_BUCKET)
      .remove([`${userId}/${currentProfile.profile_picture_url}`]);
  }

  return imageId;
}

/**
 * Creates a 60-second signed URL for a profile image.
 * imageId is the value stored in profile.profile_picture_url.
 */
export async function getProfileImageUrl(imageId: string): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data, error } = await supabase.storage
    .from(PROFILE_IMAGE_BUCKET)
    .createSignedUrl(`${session.user.id}/${imageId}`, 60);

  if (error) throw error;
  return data.signedUrl;
}

type UpdateProfileData = Partial<Pick<Profile, 'user_name' | 'profile_picture_url' | 'phonenumber'>>;

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

  if (error) {
    if (error.code === 'PGRST116') throw new Error('Profile not found');
    throw error;
  }
  return data;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profile')
    .select()
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
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
    ...(data.phonenumber !== undefined ? { phonenumber: data.phonenumber?.trim() || null } : {}),
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

  if (error) {
    if (error.code === 'PGRST116') throw new Error('Profile not found');
    throw error;
  }
  return updated;
}