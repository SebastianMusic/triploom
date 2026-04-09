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
// Load .env first, then .env.local (which takes precedence for local overrides)
loadEnvFile(path.join(__dirname, '.env'));
loadEnvFile(path.join(__dirname, '.env.local'));
