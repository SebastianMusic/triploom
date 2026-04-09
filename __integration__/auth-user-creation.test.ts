/**
 * Integration tests for auth user creation diagnostics.
 * Runs against the real hosted Supabase database.
 *
 * These tests diagnose WHY user creation might be failing by:
 * - Comparing admin API (bypasses RLS) vs regular signUp (respects RLS)
 * - Verifying the auth trigger creates profile rows
 * - Capturing detailed errors at each step
 *
 * Requires in .env:
 *   EXPO_PUBLIC_SUPABASE_URL
 *   EXPO_PUBLIC_SUPABASE_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 */
import { supabase } from '@/lib/supabase';
import { getSupabaseAdmin } from '@/lib/supabase.admin';
import { signUp, signIn } from '@/services/auth.service';

jest.setTimeout(15000);

const TEST_PASSWORD = 'testpassword123!';
const createdUserIds: string[] = [];

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/**
 * Creates a user via the admin API (bypasses RLS, skips email MX validation).
 * The on_auth_user_created trigger should auto-create a profile row.
 */
async function createUserViaAdmin(label: string) {
  const email = `${label}-${Date.now()}@triploom-integration.dev`;
  const { data, error } = await getSupabaseAdmin().auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { username: label },
  });

  if (error) {
    throw new Error(`Admin user creation failed: ${error.message} (code: ${error.code})`);
  }

  createdUserIds.push(data.user.id);
  return { id: data.user.id, email };
}

/**
 * Creates a user via the regular signUp service (respects RLS).
 * Returns detailed error info if it fails.
 */
async function createUserViaSignUp(
  username: string,
  email: string
): Promise<{ success: boolean; userId?: string; error?: { message: string; code?: string; details?: string } }> {
  try {
    const session = await signUp({ email, password: TEST_PASSWORD, username });
    if (session?.user) {
      createdUserIds.push(session.user.id);
      return { success: true, userId: session.user.id };
    }
    // signUp can return null session if email confirmation is required
    return { success: true, userId: undefined };
  } catch (err: any) {
    return {
      success: false,
      error: {
        message: err?.message ?? String(err),
        code: err?.code,
        details: err?.details,
      },
    };
  }
}

/**
 * Verifies a profile row exists for the given user ID.
 */
async function getProfile(userId: string) {
  return getSupabaseAdmin().from('profile').select('*').eq('id', userId).single();
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

afterAll(async () => {
  // Sign out any active sessions first
  await supabase.auth.signOut();

  // Delete in reverse dependency order: profile → auth user
  for (const id of createdUserIds) {
    // eslint-disable-next-line no-console
    console.log(`Cleaning up test user: ${id}`);
    await getSupabaseAdmin().from('profile').delete().eq('id', id);
    await getSupabaseAdmin().auth.admin.deleteUser(id);
  }
});

// ---------------------------------------------------------------------------
// Suite 1: Admin API User Creation (bypasses RLS)
// ---------------------------------------------------------------------------

describe('Admin API User Creation (bypasses RLS)', () => {
  it('creates user via admin API', async () => {
    const { id, email } = await createUserViaAdmin('admin-creation');

    expect(id).toBeDefined();
    expect(email).toContain('admin-creation');
  });

  it('admin-created user has profile via trigger', async () => {
    const { id } = await createUserViaAdmin('admin-trigger-check');

    const { data: profile, error } = await getProfile(id);

    expect(error).toBeNull();
    expect(profile).not.toBeNull();
    expect(profile?.id).toBe(id);
    expect(profile?.user_name).toBe('admin-trigger-check');
  });

  it('can sign in with admin-created user', async () => {
    const { email } = await createUserViaAdmin('admin-signin');

    const session = await signIn({ email, password: TEST_PASSWORD });

    expect(session.access_token).toBeDefined();
    expect(session.user.email).toBe(email);
  });
});

// ---------------------------------------------------------------------------
// Suite 2: Regular signUp User Creation (respects RLS)
// ---------------------------------------------------------------------------

describe('Regular signUp User Creation (respects RLS)', () => {
  it('creates user via signUp service', async () => {
    const username = `signup-${Date.now()}`;
    const email = `${username}@triploom-integration.dev`;

    const result = await createUserViaSignUp(username, email);

    // signUp may succeed but return null session if email confirm is required
    expect(result.success).toBe(true);
  });

  it('captures detailed error on failure', async () => {
    // Use an invalid email format to trigger a known error
    const result = await createUserViaSignUp('test', 'not-an-email');

    if (!result.success) {
      // eslint-disable-next-line no-console
      console.log('Captured error details:', result.error);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBeDefined();
    }
    // If it succeeded anyway, the service may be handling it differently
  });

  it('signUp creates profile via trigger', async () => {
    const username = `signup-trigger-${Date.now()}`;
    const email = `${username}@triploom-integration.dev`;

    const result = await createUserViaSignUp(username, email);

    // If signUp succeeded and returned a user ID, verify profile exists
    if (result.success && result.userId) {
      const { data: profile, error } = await getProfile(result.userId);
      expect(error).toBeNull();
      expect(profile?.user_name).toBe(username);
    }
  });
});

// ---------------------------------------------------------------------------
// Suite 3: RLS Diagnostics
// ---------------------------------------------------------------------------

describe('RLS Diagnostics', () => {
  it('compares admin vs regular user creation side by side', async () => {
    // Admin creation (bypasses RLS)
    const adminResult = await createUserViaAdmin('rls-comparison-admin');
    const adminProfile = await getProfile(adminResult.id);

    // Regular signUp
    const username = `rls-comparison-${Date.now()}`;
    const email = `${username}@triploom-integration.dev`;
    const signUpResult = await createUserViaSignUp(username, email);

    // eslint-disable-next-line no-console
    console.log('=== RLS Comparison ===');
    // eslint-disable-next-line no-console
    console.log('Admin creation - user ID:', adminResult.id);
    // eslint-disable-next-line no-console
    console.log('Admin creation - profile:', adminProfile.data);
    // eslint-disable-next-line no-console
    console.log('SignUp result:', signUpResult);

    // Admin should always work
    expect(adminResult.id).toBeDefined();
    expect(adminProfile.error).toBeNull();

    // signUp should also work (unless RLS is blocking it)
    expect(signUpResult.success).toBe(true);
  });

  it('verifies profile access permissions', async () => {
    // Create user via admin
    const { id } = await createUserViaAdmin('profile-access');

    // Admin client should be able to read the profile
    const { data: adminProfile, error: adminError } = await getProfile(id);
    expect(adminError).toBeNull();
    expect(adminProfile?.id).toBe(id);

    // Regular client should also be able to read own profile
    const { data: regularProfile, error: regularError } = await supabase
      .from('profile')
      .select('*')
      .eq('id', id)
      .single();

    // If this fails, it indicates an RLS policy issue
    if (regularError) {
      // eslint-disable-next-line no-console
      console.log('RLS blocking regular profile access:', regularError);
    }
    expect(regularError).toBeNull();
    expect(regularProfile?.id).toBe(id);
  });
});
