#!/usr/bin/env bash
# reset-local-db.sh
#
# Mirrors the hosted Supabase public schema onto the self-hosted Supabase instance.
# Reads all connection details from scripts/.env and hosting/supabase/.env — no arguments needed.
#
# Requirements:
#   - pg_dump and psql installed (brew install libpq / apt install postgresql-client)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Read a single key from an env file (handles unquoted values with spaces/special chars)
get_env() {
  local file="$1" key="$2"
  grep -E "^${key}=" "$file" | head -1 | cut -d'=' -f2-
}

# ── scripts/.env (hosted DB password) ─────────────────────────────────────────
SCRIPTS_ENV="$SCRIPT_DIR/.env"
[[ -f "$SCRIPTS_ENV" ]] || { echo "Error: $SCRIPTS_ENV not found"; exit 1; }

HOSTED_PASSWORD="$(get_env "$SCRIPTS_ENV" HOSTED_SUPABASE_DB)"
[[ -n "$HOSTED_PASSWORD" ]] || { echo "Error: HOSTED_SUPABASE_DB not set in $SCRIPTS_ENV"; exit 1; }

# ── hosting/supabase/.env (self-hosted config) ────────────────────────────────
ENV_FILE="$SCRIPT_DIR/../hosting/supabase/.env"
[[ -f "$ENV_FILE" ]] || { echo "Error: $ENV_FILE not found"; exit 1; }

POSTGRES_PASSWORD="$(get_env "$ENV_FILE" POSTGRES_PASSWORD)"
POSTGRES_PORT="$(get_env "$ENV_FILE" POSTGRES_PORT)"
POSTGRES_DB="$(get_env "$ENV_FILE" POSTGRES_DB)"
POOLER_TENANT_ID="$(get_env "$ENV_FILE" POOLER_TENANT_ID)"
SUPABASE_PUBLIC_URL="$(get_env "$ENV_FILE" SUPABASE_PUBLIC_URL)"
SERVICE_ROLE_KEY="$(get_env "$ENV_FILE" SERVICE_ROLE_KEY)"

# Derive self-hosted DB host from SUPABASE_PUBLIC_URL (strip scheme)
# e.g. https://supabase.triploom.app → supabase.triploom.app
LOCAL_DB_HOST="${SUPABASE_PUBLIC_URL#https://}"
LOCAL_DB_HOST="${LOCAL_DB_HOST#http://}"

# Supavisor requires username format: postgres.{tenant_id}
LOCAL_URL="postgresql://postgres.${POOLER_TENANT_ID}:${POSTGRES_PASSWORD}@${LOCAL_DB_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}"

# ── Hosted Supabase connection ─────────────────────────────────────────────────
HOSTED_HOST="db.ccyrwyfmijmqijpyvefo.supabase.co"
HOSTED_URL="postgresql://postgres:${HOSTED_PASSWORD}@${HOSTED_HOST}:5432/postgres"

DUMP_FILE="/tmp/triploom_schema_$(date +%Y%m%d_%H%M%S).sql"

echo "Self-hosted target: postgresql://postgres:***@${LOCAL_DB_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}"
echo ""

echo "==> [1/6] Dumping public schema from hosted Supabase..."
pg_dump "$HOSTED_URL" \
  --schema=public \
  --no-owner \
  --no-acl \
  -f "$DUMP_FILE"
echo "    Dump written to $DUMP_FILE"

echo "==> [2/6] Dropping all public schema objects on self-hosted instance..."
psql "$LOCAL_URL" <<'DROPSQL'
SET session_replication_role = replica;

DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

GRANT USAGE  ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL    ON SCHEMA public TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES    TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;

SET session_replication_role = DEFAULT;
DROPSQL

echo "==> [3/6] Applying schema dump..."
psql "$LOCAL_URL" -f "$DUMP_FILE"

echo "==> [4/6] Recreating auth.users trigger (not captured by pg_dump --schema=public)..."
psql "$LOCAL_URL" <<'AUTHSQL'
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
AUTHSQL

echo "==> [5/6] Re-adding message to supabase_realtime publication..."
psql "$LOCAL_URL" <<'REALTIMESQL'
ALTER PUBLICATION supabase_realtime ADD TABLE public.message;
REALTIMESQL

echo "==> [6/6] Syncing storage buckets and policies..."
psql "$LOCAL_URL" <<'STORAGESQL'
-- ── Buckets ────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, avif_autodetection)
VALUES
  ('profile_image',    'profile_image',    false, NULL, NULL, false),
  ('chat_image',       'chat_image',       false, NULL, NULL, false),
  ('event_banner',     'event_banner',     false, NULL, NULL, false),
  ('trip_description', 'trip_description', false, NULL, NULL, false),
  ('trip_banner',      'trip_banner',      false, NULL, NULL, false)
ON CONFLICT (id) DO NOTHING;

-- ── Storage policies (drop first so re-runs are idempotent) ───────────────
DROP POLICY IF EXISTS "Authenticated users can read any profile image" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own profile images"             ON storage.objects;
DROP POLICY IF EXISTS "Users can update own profile images"             ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own profile images"             ON storage.objects;
DROP POLICY IF EXISTS "Users can read own profile images"               ON storage.objects;
DROP POLICY IF EXISTS "chat participants can upload chat images"         ON storage.objects;
DROP POLICY IF EXISTS "chat participants can read chat images"           ON storage.objects;
DROP POLICY IF EXISTS "chat participants can delete chat images"         ON storage.objects;
DROP POLICY IF EXISTS "trip members can upload event banners"           ON storage.objects;
DROP POLICY IF EXISTS "trip members can read event banners"             ON storage.objects;
DROP POLICY IF EXISTS "trip members can delete event banners"           ON storage.objects;
DROP POLICY IF EXISTS "Trip members can read description files"         ON storage.objects;
DROP POLICY IF EXISTS "Organizers can upload description files"         ON storage.objects;
DROP POLICY IF EXISTS "Organizers can delete description files"         ON storage.objects;
DROP POLICY IF EXISTS "trip members can read trip banners"              ON storage.objects;
DROP POLICY IF EXISTS "trip members can upload trip banners"            ON storage.objects;
DROP POLICY IF EXISTS "trip members can delete trip banners"            ON storage.objects;

-- profile_image
CREATE POLICY "Authenticated users can read any profile image"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'profile_image');

CREATE POLICY "Users can upload own profile images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'profile_image'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own profile images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'profile_image'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own profile images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'profile_image'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- chat_image
CREATE POLICY "chat participants can upload chat images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'chat_image'
    AND EXISTS (
      SELECT 1 FROM chat_participant cp
      JOIN trip_participant tp ON tp.id = cp.participant_id
      WHERE cp.group_chat_id = (storage.foldername(name))[1]::uuid
        AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "chat participants can read chat images"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'chat_image'
    AND EXISTS (
      SELECT 1 FROM chat_participant cp
      JOIN trip_participant tp ON tp.id = cp.participant_id
      WHERE cp.group_chat_id = (storage.foldername(name))[1]::uuid
        AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "chat participants can delete chat images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'chat_image'
    AND EXISTS (
      SELECT 1 FROM chat_participant cp
      JOIN trip_participant tp ON tp.id = cp.participant_id
      WHERE cp.group_chat_id = (storage.foldername(name))[1]::uuid
        AND tp.user_id = auth.uid()
    )
  );

-- event_banner
CREATE POLICY "trip members can read event banners"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'event_banner');

CREATE POLICY "trip members can upload event banners"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'event_banner'
    AND (
      EXISTS (
        SELECT 1 FROM trip_participant tp
        WHERE (tp.id)::text      = (storage.foldername(name))[1]
           OR (tp.trip_id)::text = (storage.foldername(name))[1]
      )
      OR (
        (storage.foldername(name))[1] = 'trips'
        AND EXISTS (
          SELECT 1 FROM trip_participant tp
          WHERE (tp.trip_id)::text = (storage.foldername(name))[2]
            AND tp.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "trip members can delete event banners"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'event_banner');

-- trip_description
CREATE POLICY "Trip members can read description files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'trip_description'
    AND EXISTS (
      SELECT 1 FROM trip_participant tp
      WHERE tp.trip_id::text = (storage.foldername(name))[1]
        AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can upload description files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'trip_description'
    AND is_trip_organizer_or_co((storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "Organizers can delete description files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'trip_description'
    AND is_trip_organizer_or_co((storage.foldername(name))[1]::uuid)
  );

-- trip_banner
CREATE POLICY "trip members can read trip banners"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'trip_banner');

CREATE POLICY "trip members can upload trip banners"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'trip_banner'
    AND EXISTS (
      SELECT 1 FROM trip_participant tp
      WHERE tp.trip_id::text = (storage.foldername(name))[1]
        AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "trip members can delete trip banners"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'trip_banner');
STORAGESQL

echo "==> [7/7] Copying edge functions into hosting volume..."
FUNCTIONS_SRC="$SCRIPT_DIR/../supabase/functions"
FUNCTIONS_DEST="$SCRIPT_DIR/../hosting/supabase/volumes/functions"

# Wipe existing deployed functions (keep only the runtime's own dirs)
find "$FUNCTIONS_DEST" -mindepth 1 -maxdepth 1 -type d | while read -r dir; do
  fn_name="$(basename "$dir")"
  # hello and main are part of the edge runtime itself — leave them
  [[ "$fn_name" == "hello" || "$fn_name" == "main" ]] && continue
  rm -rf "$dir"
done

for fn_dir in "$FUNCTIONS_SRC"/*/; do
  fn_name="$(basename "$fn_dir")"
  [[ "$fn_name" == _* ]] && continue          # skip _shared etc.
  [[ ! -f "$fn_dir/index.ts" ]] && continue   # skip non-function dirs
  echo "    Copying $fn_name"
  cp -r "$fn_dir" "$FUNCTIONS_DEST/$fn_name"
done

# Copy _shared so functions that import from it can resolve it
if [[ -d "$FUNCTIONS_SRC/_shared" ]]; then
  echo "    Copying _shared"
  cp -r "$FUNCTIONS_SRC/_shared" "$FUNCTIONS_DEST/_shared"
fi

echo ""
echo "Done. Self-hosted Supabase now mirrors hosted schema."
echo "Dump file kept at: $DUMP_FILE"
