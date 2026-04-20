-- Enable RLS on trip_invite_url table
ALTER TABLE trip_invite_url ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-runs)
DROP POLICY IF EXISTS "organizers_can_manage_invites" ON trip_invite_url;
DROP POLICY IF EXISTS "authenticated_can_read_invites" ON trip_invite_url;

-- Policy for organizers to manage invites (CRUD)
-- Only organizers and co-organizers can insert, update, or delete invites
-- Uses lowercase 'organizer' and camelCase 'coOrganizer' to match TripRole enum
CREATE POLICY "organizers_can_manage_invites"
ON trip_invite_url
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM trip_participant
    WHERE trip_participant.trip_id = trip_invite_url.trip_id
    AND trip_participant.user_id = auth.uid()
    AND trip_participant.role IN ('organizer', 'coOrganizer')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM trip_participant
    WHERE trip_participant.trip_id = trip_invite_url.trip_id
    AND trip_participant.user_id = auth.uid()
    AND trip_participant.role IN ('organizer', 'coOrganizer')
  )
);

-- Policy for authenticated users to read invites
-- All authenticated users can read invites (needed to redeem/join a trip)
CREATE POLICY "authenticated_can_read_invites"
ON trip_invite_url
FOR SELECT
TO authenticated
USING (true);
