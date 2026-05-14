drop policy if exists "organizers can delete announcements" on announcement;

create policy "organizers can delete announcements"
on announcement
for delete
to authenticated
using (
  exists (
    select 1
    from trip_participant
    where trip_participant.trip_id = announcement.trip_id
      and trip_participant.user_id = auth.uid()
      and trip_participant.role in ('organizer', 'coOrganizer')
  )
);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'announcement'
  ) then
    alter publication supabase_realtime add table announcement;
  end if;
end $$;
