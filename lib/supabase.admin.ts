import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

/**
 * Admin Supabase client using the service role key.
 * Bypasses Row Level Security — use only in tests and server-side admin operations.
 * Never expose this client or the service role key to the frontend bundle.
 *
 * Lazy singleton: the client is only created when first accessed,
 * so importing this file does not throw if credentials are missing.
 */
let _adminClient: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseAdmin() {
  if (!_adminClient) {
    _adminClient = createClient<Database>(
      process.env.EXPO_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return _adminClient;
}
