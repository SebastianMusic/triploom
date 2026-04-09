import { supabase } from '@/lib/supabase';
import { getSupabaseAdmin } from '@/lib/supabase.admin';

const TEST_PASSWORD = 'integration-test-pw-123!';

export interface TestUser {
  id: string;
  email: string;
  /** Deletes the auth user, profile, and signs out the regular client. */
  cleanup: () => Promise<void>;
}

/**
 * Creates a throw-away test user for integration tests.
 *
 * - Creates an auth user via the admin API (email confirmation skipped)
 * - Creates the corresponding profile row (required by FK constraints)
 * - Signs in on the shared supabase client so service functions get a real session
 *
 * Call cleanup() in afterAll to remove the user and sign out.
 *
 * @example
 * let user: TestUser;
 * beforeAll(async () => { user = await createTestUser(); });
 * afterAll(async () => { await user.cleanup(); });
 */
export async function createTestUser(): Promise<TestUser> {
  const email = `test-${Date.now()}@triploom-integration.dev`;
  const admin = getSupabaseAdmin();

  // 1. Create auth user (skips email confirmation)
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (authError) throw new Error(`createTestUser: failed to create auth user — ${authError.message}`);
  const userId = authData.user.id;

  // 2. Create profile row — trip.organizer_id FK references profile.id
  const { error: profileError } = await admin.from('profile').insert({ id: userId });
  if (profileError) throw new Error(`createTestUser: failed to create profile — ${profileError.message}`);

  // 3. Sign in on the shared client so getSession() works inside service functions
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: TEST_PASSWORD,
  });
  if (signInError) throw new Error(`createTestUser: failed to sign in — ${signInError.message}`);

  // 4. Verify the session is actually active
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('createTestUser: session is null after sign-in');

  return {
    id: userId,
    email,
    cleanup: async () => {
      await supabase.auth.signOut();
      await admin.from('profile').delete().eq('id', userId);
      await admin.auth.admin.deleteUser(userId);
    },
  };
}
