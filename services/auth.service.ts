import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import type { SignInDTO, SignUpDTO } from '@/types/auth.types';

export async function signIn({ email, password }: SignInDTO): Promise<Session> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

/**
 * Creates a new auth user. The username is passed via user metadata so the
 * database trigger (on_auth_user_created) can create the profile row automatically.
 *
 * If email confirmation is enabled in Supabase, session will be null and the
 * user must confirm their email before they can sign in.
 */
export async function signUp({ email, password, username }: SignUpDTO): Promise<Session | null> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
    },
  });
  if (error) throw error;
  return data.session;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
