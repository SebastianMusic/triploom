import { supabase } from '@/lib/supabase';
import { getSupabaseAdmin } from '@/lib/supabase.admin';
import { signIn, signUp, signOut, getSession } from '../auth.service';
import { signInSchema, signUpSchema } from '@/types/auth.types';
import { createTestUser, TEST_PASSWORD, type TestUser } from '@/__integration__/helpers/user';

jest.setTimeout(20000);

let existingUser: TestUser;
const signUpCreatedIds: string[] = [];

// Creates a user via the signUp service and tracks their ID for cleanup.
// Uses the profile row created by the on_auth_user_created trigger to get the ID.
async function signUpAndTrack(username: string): Promise<{ email: string }> {
  const email = `${username}@triploom-integration.dev`;
  await signUp({ username, email, password: TEST_PASSWORD });
  const { data } = await getSupabaseAdmin()
    .from('profile')
    .select('id')
    .eq('user_name', username)
    .maybeSingle();
  if (data) signUpCreatedIds.push(data.id);
  return { email };
}

beforeAll(async () => {
  existingUser = await createTestUser();
  await supabase.auth.signOut();
});

afterAll(async () => {
  await supabase.auth.signOut();
  for (const id of signUpCreatedIds) {
    await getSupabaseAdmin().from('profile').delete().eq('id', id);
    await getSupabaseAdmin().auth.admin.deleteUser(id);
  }
  await existingUser.cleanup();
});

afterEach(async () => {
  await supabase.auth.signOut();
});

// ---------------------------------------------------------------------------
// signInSchema
// ---------------------------------------------------------------------------

describe('signInSchema', () => {
  it('accepts valid credentials', () => {
    expect(signInSchema.safeParse({ email: 'a@b.com', password: 'secret1' }).success).toBe(true);
  });

  it('rejects invalid email', () => {
    expect(signInSchema.safeParse({ email: 'not-an-email', password: 'secret1' }).success).toBe(false);
  });

  it('rejects short password', () => {
    const r = signInSchema.safeParse({ email: 'a@b.com', password: '123' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe('Password must be at least 6 characters');
  });
});

// ---------------------------------------------------------------------------
// signUpSchema
// ---------------------------------------------------------------------------

describe('signUpSchema', () => {
  it('accepts valid sign-up data', () => {
    expect(
      signUpSchema.safeParse({ username: 'alice', email: 'a@b.com', password: 'secret1' }).success
    ).toBe(true);
  });

  it('rejects short username', () => {
    const r = signUpSchema.safeParse({ username: 'a', email: 'a@b.com', password: 'secret1' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe('Username must be at least 2 characters');
  });
});

// ---------------------------------------------------------------------------
// signIn
// ---------------------------------------------------------------------------

describe('signIn', () => {
  it('returns a session with the correct user id on valid credentials', async () => {
    const session = await signIn({ email: existingUser.email, password: TEST_PASSWORD });

    expect(session.access_token).toBeDefined();
    expect(session.user.id).toBe(existingUser.id);
  });

  it('throws with the wrong password', async () => {
    await expect(
      signIn({ email: existingUser.email, password: 'wrongpassword' })
    ).rejects.toBeDefined();
  });

  it('throws with an unknown email', async () => {
    await expect(
      signIn({ email: 'nobody@triploom-integration.dev', password: TEST_PASSWORD })
    ).rejects.toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// signUp
// ---------------------------------------------------------------------------

describe('signUp', () => {
  it('creates a user and the trigger sets the username from metadata', async () => {
    const username = `svc-signup-${Date.now()}`;
    await signUpAndTrack(username);

    const { data: profile } = await getSupabaseAdmin()
      .from('profile')
      .select('user_name')
      .eq('user_name', username)
      .single();

    expect(profile?.user_name).toBe(username);
  });

  it('throws when signing up with a duplicate email', async () => {
    const username = `svc-dup-${Date.now()}`;
    const { email } = await signUpAndTrack(username);

    await expect(
      signUp({ username: 'duplicate', email, password: TEST_PASSWORD })
    ).rejects.toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// signOut
// ---------------------------------------------------------------------------

describe('signOut', () => {
  it('clears the active session', async () => {
    await signIn({ email: existingUser.email, password: TEST_PASSWORD });
    expect(await getSession()).not.toBeNull();

    await signOut();

    expect(await getSession()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getSession
// ---------------------------------------------------------------------------

describe('getSession', () => {
  it('returns the active session after sign-in', async () => {
    await signIn({ email: existingUser.email, password: TEST_PASSWORD });

    const session = await getSession();

    expect(session).not.toBeNull();
    expect(session?.user.id).toBe(existingUser.id);
  });

  it('returns null when no session is active', async () => {
    expect(await getSession()).toBeNull();
  });
});
