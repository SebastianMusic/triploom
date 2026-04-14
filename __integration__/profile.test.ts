/**
 * Integration tests for profile updates.
 * Runs against the real hosted Supabase database.
 */
import { supabase } from '@/lib/supabase';
import { getSupabaseAdmin } from '@/lib/supabase.admin';
import { getProfile, updateProfile } from '@/services/profile.service';
import { createTestUser, type TestUser } from './helpers/user';

jest.setTimeout(15000);

let user: TestUser;

beforeAll(async () => {
  user = await createTestUser();
});

afterAll(async () => {
  await user.cleanup();
});

describe('updateProfile (integration)', () => {
  it('updates the profile row in the real database', async () => {
    const updated = await updateProfile(user.id, {
      user_name: 'Updated Integration User',
      profile_picture_url: 'https://example.com/profile-updated.png',
      phonenumber: '12345678',
    });

    expect(updated.id).toBe(user.id);
    expect(updated.user_name).toBe('Updated Integration User');
    expect(updated.profile_picture_url).toBe('https://example.com/profile-updated.png');
    expect(updated.phonenumber).toBe('12345678');

    const { data: profile, error } = await getSupabaseAdmin()
      .from('profile')
      .select('*')
      .eq('id', user.id)
      .single();

    expect(error).toBeNull();
    expect(profile?.user_name).toBe('Updated Integration User');
    expect(profile?.profile_picture_url).toBe('https://example.com/profile-updated.png');
    expect(profile?.phonenumber).toBe('12345678');
  });

  it('keeps the updated profile readable for the signed-in user', async () => {
    const profile = await getProfile(user.id);
    const { data: userData, error: userError } = await supabase.auth.getUser();

    expect(profile?.id).toBe(user.id);
    expect(profile?.phonenumber).toBe('12345678');
    expect(userError).toBeNull();
    expect(userData.user?.user_metadata?.full_name).toBe('Updated Integration User');
  });
});
