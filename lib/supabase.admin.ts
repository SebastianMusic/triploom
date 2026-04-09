import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

/**
 * Admin Supabase client using the secret key.
 * Bypasses Row Level Security — use only in tests and server-side admin operations.
 * Never expose this client or the secret key to the frontend bundle.
 *
 * Note: Supports both new secret key (sb_secret_...) and legacy service_role key.
 * Get your secret key from: Supabase Dashboard → Project Settings → API → Secret keys
 *
 * Lazy singleton: the client is only created when first accessed,
 * so importing this file does not throw if credentials are missing.
 */
let _adminClient: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseAdmin() {
	if (!_adminClient) {
		// Support both new secret key (recommended) and legacy service role key
		const adminKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

		if (!adminKey) {
			throw new Error(
				'Missing admin key. Set SUPABASE_SECRET_KEY (recommended) or SUPABASE_SERVICE_ROLE_KEY in your .env file. ' +
				'Get your secret key from Supabase Dashboard → Project Settings → API → Secret keys'
			);
		}

		_adminClient = createClient<Database>(
			process.env.EXPO_PUBLIC_SUPABASE_URL!,
			adminKey,
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
