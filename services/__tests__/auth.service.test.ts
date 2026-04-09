import { signIn, signUp, signOut, getSession } from '../auth.service';
import { signInSchema, signUpSchema } from '@/types/auth.types';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
    },
  },
}));

import { supabase } from '@/lib/supabase';
const mockAuth = supabase.auth as jest.Mocked<typeof supabase.auth>;

const mockSession = { access_token: 'tok', user: { id: 'user-1' } } as any;

beforeEach(() => jest.clearAllMocks());

// --- Schema validation ---

describe('signInSchema', () => {
  it('accepts valid credentials', () => {
    expect(signInSchema.safeParse({ email: 'a@b.com', password: 'secret1' }).success).toBe(true);
  });

  it('rejects invalid email', () => {
    const r = signInSchema.safeParse({ email: 'not-an-email', password: 'secret1' });
    expect(r.success).toBe(false);
  });

  it('rejects short password', () => {
    const r = signInSchema.safeParse({ email: 'a@b.com', password: '123' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe('Password must be at least 6 characters');
  });
});

describe('signUpSchema', () => {
  it('accepts valid sign-up data', () => {
    expect(signUpSchema.safeParse({ username: 'alice', email: 'a@b.com', password: 'secret1' }).success).toBe(true);
  });

  it('rejects short username', () => {
    const r = signUpSchema.safeParse({ username: 'a', email: 'a@b.com', password: 'secret1' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe('Username must be at least 2 characters');
  });
});

// --- Service ---

describe('signIn', () => {
  it('returns the session on success', async () => {
    mockAuth.signInWithPassword.mockResolvedValue({ data: { session: mockSession }, error: null } as any);

    const session = await signIn({ email: 'a@b.com', password: 'secret1' });

    expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.com', password: 'secret1' });
    expect(session).toBe(mockSession);
  });

  it('throws on error', async () => {
    mockAuth.signInWithPassword.mockResolvedValue({ data: { session: null }, error: { message: 'Invalid credentials' } } as any);
    await expect(signIn({ email: 'a@b.com', password: 'wrong' })).rejects.toMatchObject({ message: 'Invalid credentials' });
  });
});

describe('signUp', () => {
  it('passes username through user metadata', async () => {
    mockAuth.signUp.mockResolvedValue({ data: { session: mockSession }, error: null } as any);

    await signUp({ username: 'alice', email: 'a@b.com', password: 'secret1' });

    expect(mockAuth.signUp).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'secret1',
      options: { data: { username: 'alice' } },
    });
  });

  it('returns null session when email confirmation is required', async () => {
    mockAuth.signUp.mockResolvedValue({ data: { session: null }, error: null } as any);
    const session = await signUp({ username: 'alice', email: 'a@b.com', password: 'secret1' });
    expect(session).toBeNull();
  });

  it('throws on error', async () => {
    mockAuth.signUp.mockResolvedValue({ data: { session: null }, error: { message: 'Email already in use' } } as any);
    await expect(signUp({ username: 'alice', email: 'a@b.com', password: 'secret1' })).rejects.toMatchObject({ message: 'Email already in use' });
  });
});

describe('signOut', () => {
  it('calls supabase signOut', async () => {
    mockAuth.signOut.mockResolvedValue({ error: null } as any);
    await signOut();
    expect(mockAuth.signOut).toHaveBeenCalled();
  });

  it('throws on error', async () => {
    mockAuth.signOut.mockResolvedValue({ error: { message: 'Sign out failed' } } as any);
    await expect(signOut()).rejects.toMatchObject({ message: 'Sign out failed' });
  });
});

describe('getSession', () => {
  it('returns the current session', async () => {
    mockAuth.getSession.mockResolvedValue({ data: { session: mockSession }, error: null } as any);
    const session = await getSession();
    expect(session).toBe(mockSession);
  });

  it('returns null when no session', async () => {
    mockAuth.getSession.mockResolvedValue({ data: { session: null }, error: null } as any);
    expect(await getSession()).toBeNull();
  });
});
