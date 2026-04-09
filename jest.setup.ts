/**
 * Loads all variables from .env into process.env before tests run.
 * jest-expo handles EXPO_PUBLIC_ vars automatically, but non-prefixed vars
 * (like SUPABASE_SERVICE_ROLE_KEY used in integration tests) need this.
 */
import fs from 'fs';
import path from 'path';

try {
  const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
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
  // .env not present — env vars must be set externally (e.g. CI)
}
