/**
 * Loads variables from .env and .env.local into process.env before tests run.
 * .env.local takes precedence over .env for local secrets.
 * jest-expo handles EXPO_PUBLIC_ vars automatically, but non-prefixed vars
 * (like SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY used in integration tests) need this.
 */
import fs from 'fs';
import path from 'path';
function loadEnvFile(filePath: string): void {
	try {
		const envFile = fs.readFileSync(filePath, 'utf8');
		for (const line of envFile.split('\n')) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith('#')) continue;
			const idx = trimmed.indexOf('=');
			if (idx === -1) continue;
			const key = trimmed.slice(0, idx).trim();
			const val = trimmed.slice(idx + 1).trim().replace(/^(['"])(.*)\1$/, '$2');
			if (!(key in process.env)) process.env[key] = val;
		}
	} catch {
		// file not present — skip silently
	}
}
if (process.env.TEST_TARGET === 'selfhosted') {
  // Read credentials directly from the self-hosted .env so they never go stale
  const raw: Record<string, string> = {};
  loadEnvFile(path.join(__dirname, 'hosting/supabase/.env'));
  // Re-read into a local map so we can rename keys to what the app expects
  try {
    const envFile = fs.readFileSync(path.join(__dirname, 'hosting/supabase/.env'), 'utf8');
    for (const line of envFile.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      raw[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim().replace(/^(['"])(.*)\1$/, '$2');
    }
  } catch { /* ignore */ }
  process.env.EXPO_PUBLIC_SUPABASE_URL    = raw.SUPABASE_PUBLIC_URL;
  process.env.EXPO_PUBLIC_SUPABASE_KEY    = raw.SUPABASE_PUBLISHABLE_KEY;
  process.env.SUPABASE_SERVICE_ROLE_KEY   = raw.SERVICE_ROLE_KEY;
  process.env.SUPABASE_SECRET_KEY         = raw.SUPABASE_SECRET_KEY;
} else {
  loadEnvFile(path.join(__dirname, '.env'));
  loadEnvFile(path.join(__dirname, '.env.local'));
}
