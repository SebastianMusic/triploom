alter table public.profile
  drop constraint if exists profile_selected_trip_fkey;

alter table public.profile
  add constraint profile_selected_trip_fkey
  foreign key (selected_trip)
  references public.trip (id)
  on delete set null;
