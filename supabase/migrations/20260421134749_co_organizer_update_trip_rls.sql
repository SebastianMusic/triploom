CREATE POLICY "co-organizers can update trip"
ON trip
FOR UPDATE
USING (is_trip_organizer_or_co(id));
