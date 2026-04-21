CREATE POLICY "organizers can kick participants"
ON trip_participant
FOR DELETE
USING (
  is_trip_organizer_or_co(trip_id)
  AND user_id != auth.uid()
  AND role != 'organizer'
);
