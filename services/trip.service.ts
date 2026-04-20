import { supabase } from '@/lib/supabase';
import type { Trip, TripParticipant, TripUpdate } from '@/types';
import type { CreateTripDTO } from '@/types/trip.types';
import { TripRole } from '@/types/trip.types';

export async function getTrips(): Promise<Trip[]> {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user.id;
  if (!userId) return [];

  const { data: participantRows, error: participantError } = await supabase
    .from('trip_participant')
    .select('trip_id')
    .eq('user_id', userId);

  if (participantError) throw participantError;

  const tripIds = (participantRows ?? []).map((row) => row.trip_id).filter(Boolean) as string[];
  if (tripIds.length === 0) return [];

  const { data: trips, error: tripsError } = await supabase
    .from('trip')
    .select('*')
    .in('id', tripIds);

  if (tripsError) throw tripsError;
  return trips ?? [];
}

export async function getTripById(id: string): Promise<Trip> {
  const { data, error } = await supabase
    .from('trip')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createTrip(dto: CreateTripDTO): Promise<Trip> {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user.id;

  const { data, error } = await supabase
    .from('trip')
    .insert({ ...dto, organizer_id: userId })
    .select()
    .single();
  if (error) throw error;

  const { error: participantError } = await supabase
    .from('trip_participant')
    .insert({ trip_id: data.id, user_id: userId, role: TripRole.Organizer });
  if (participantError) throw participantError;

  return data;
}

export async function updateTrip(id: string, updates: TripUpdate): Promise<Trip> {
  const { data, error } = await supabase
    .from('trip')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTrip(id: string): Promise<void> {
  const { error } = await supabase.from('trip').delete().eq('id', id);
  if (error) throw error;
}

export async function getTripParticipants(tripId: string): Promise<TripParticipant[]> {
  const { data, error } = await supabase
    .from('trip_participant')
    .select('*')
    .eq('trip_id', tripId);
  if (error) throw error;
  return data;
}

export async function getTripParticipant(tripId: string, userId: string): Promise<TripParticipant> {
  const { data, error } = await supabase
    .from('trip_participant')
    .select('*')
    .eq('trip_id', tripId)
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return data;
}

// Permission rules:
//   organizer    → can set any role on any participant
//   coOrganizer  → can promote participant → coOrganizer, demote coOrganizer → participant
//                  cannot touch organizers or grant organizer
//   participant  → no permission
export async function leaveTrip(tripId: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user.id;
  if (!userId) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('trip_participant')
    .delete()
    .eq('trip_id', tripId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function updateParticipantRole(
  tripId: string,
  actorUserId: string,
  targetUserId: string,
  newRole: TripRole,
): Promise<TripParticipant> {
  const [actor, target] = await Promise.all([
    getTripParticipant(tripId, actorUserId),
    getTripParticipant(tripId, targetUserId),
  ]);

  const actorRole = actor.role as TripRole | null;

  if (actorRole === TripRole.Participant || actorRole === null) {
    throw new Error('Participants do not have permission to change roles.');
  }

  if (actorRole === TripRole.CoOrganizer) {
    if (newRole === TripRole.Organizer) {
      throw new Error('Co-organizers cannot promote to organizer.');
    }
    if (target.role === TripRole.Organizer) {
      throw new Error('Co-organizers cannot change an organizer\'s role.');
    }
  }

  const { data, error } = await supabase
    .from('trip_participant')
    .update({ role: newRole })
    .eq('id', target.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
