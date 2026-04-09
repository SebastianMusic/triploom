import { supabase } from '@/lib/supabase';
import { getSupabaseAdmin } from '@/lib/supabase.admin';

const TEST_PASSWORD = 'integration-test-pw-123!';

export interface TestUser {
  id: string;
  email: string;
  /** Deletes the auth user and profile, and signs out the regular client. */
  cleanup: () => Promise<void>;
}

/**
 * Creates a throw-away test user for integration tests.
 *
 * - Creates an auth user via the admin API (email confirmation skipped)
 * - The on_auth_user_created trigger automatically creates the profile row
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

  // Create auth user — the on_auth_user_created trigger creates the profile row
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { username: 'testuser' },
  });
  if (authError) throw new Error(`createTestUser: failed to create auth user — ${authError.message}`);
  const userId = authData.user.id;

  // Sign in on the shared client so getSession() works inside service functions
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: TEST_PASSWORD,
  });
  if (signInError) throw new Error(`createTestUser: failed to sign in — ${signInError.message}`);

  // Verify the session is actually active
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('createTestUser: session is null after sign-in');

  return {
    id: userId,
    email,
    cleanup: async () => {
      await supabase.auth.signOut();
      // Delete profile before auth user (trip FK to profile must be handled by caller)
      await admin.from('profile').delete().eq('id', userId);
      await admin.auth.admin.deleteUser(userId);
    },
  };
}
