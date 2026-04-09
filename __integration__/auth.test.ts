/**
 * Integration tests for auth (signUp trigger, signIn, signOut).
 * Runs against the real hosted Supabase database.
 *
 * Requires in .env:
 *   EXPO_PUBLIC_SUPABASE_URL
 *   EXPO_PUBLIC_SUPABASE_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Note: Supabase's signUp endpoint validates that the email domain has real MX
 * records, so test users are created via the admin API (which bypasses this check).
 * The signUp service itself is covered by unit tests in auth.service.test.ts.
 */
import { supabase } from '@/lib/supabase';
import { getSupabaseAdmin } from '@/lib/supabase.admin';
import { signIn, signOut, getSession } from '@/services/auth.service';

jest.setTimeout(15000);

const TEST_PASSWORD = 'testpassword123!';
const createdUserIds: string[] = [];

async function makeTestAuthUser(label: string) {
  const email = `${label}-${Date.now()}@triploom-integration.dev`;
  const { data, error } = await getSupabaseAdmin().auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { username: label },
  });
  if (error) throw error;
  createdUserIds.push(data.user.id);
  return { id: data.user.id, email };
}

afterAll(async () => {
  await supabase.auth.signOut();
  for (const id of createdUserIds) {
    await getSupabaseAdmin().from('profile').delete().eq('id', id);
    await getSupabaseAdmin().auth.admin.deleteUser(id);
  }
});

// --- Trigger ---

describe('on_auth_user_created trigger', () => {
  it('auto-creates a profile row when a user is created', async () => {
    const { id } = await makeTestAuthUser('trigger-test');

    const { data: profile, error } = await getSupabaseAdmin()
      .from('profile')
      .select('*')
      .eq('id', id)
      .single();

    expect(error).toBeNull();
    expect(profile?.id).toBe(id);
    expect(profile?.user_name).toBe('trigger-test');
  });
});

// --- signIn ---

describe('signIn (integration)', () => {
  let testEmail: string;
  let testUserId: string;

  beforeAll(async () => {
    const u = await makeTestAuthUser('signin');
    testEmail = u.email;
    testUserId = u.id;
  });

  afterEach(async () => {
    await supabase.auth.signOut();
  });

  it('returns a valid session with correct credentials', async () => {
    const session = await signIn({ email: testEmail, password: TEST_PASSWORD });

    expect(session.access_token).toBeDefined();
    expect(session.user.id).toBe(testUserId);
  });

  it('throws with wrong password', async () => {
    await expect(
      signIn({ email: testEmail, password: 'wrongpassword' })
    ).rejects.toBeDefined();
  });

  it('throws with unknown email', async () => {
    await expect(
      signIn({ email: 'nobody@triploom-integration.dev', password: TEST_PASSWORD })
    ).rejects.toBeDefined();
  });
});

// --- signOut ---

describe('signOut (integration)', () => {
  it('clears the session after sign-in', async () => {
    const { email } = await makeTestAuthUser('signout');

    await signIn({ email, password: TEST_PASSWORD });
    expect(await getSession()).not.toBeNull();

    await signOut();
    expect(await getSession()).toBeNull();
  });
});
