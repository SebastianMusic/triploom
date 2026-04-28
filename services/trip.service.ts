import { supabase } from '@/lib/supabase';
import type { Profile, Trip, TripParticipant, TripUpdate } from '@/types';

const DESCRIPTION_FILE_BUCKET = 'trip_description';
const TRIP_BANNER_BUCKET = 'trip_banner';

export async function uploadTripBanner(localUri: string, tripId: string): Promise<string> {
  const path = `${tripId}/${generateUUID()}`;
  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();
  const { error } = await supabase.storage
    .from(TRIP_BANNER_BUCKET)
    .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: false });
  if (error) throw error;
  return path;
}

export async function getTripBannerUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(TRIP_BANNER_BUCKET)
    .createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function uploadTripDescriptionFile(
  localUri: string,
  tripId: string,
  fileName: string,
): Promise<string> {
  const ext = fileName.split('.').pop() ?? 'pdf';
  const path = `${tripId}/${generateUUID()}.${ext}`;
  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();

  const { error } = await supabase.storage
    .from(DESCRIPTION_FILE_BUCKET)
    .upload(path, arrayBuffer, { contentType: 'application/octet-stream', upsert: false });

  if (error) throw error;
  return path;
}

export async function getTripDescriptionFileUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(DESCRIPTION_FILE_BUCKET)
    .createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
}

export async function deleteTripDescriptionFile(path: string): Promise<void> {
  await supabase.storage.from(DESCRIPTION_FILE_BUCKET).remove([path]);
}
import type { CreateTripDTO, TripWithRole } from '@/types/trip.types';
import { TripRole } from '@/types/trip.types';

export type TripParticipantWithProfile = TripParticipant & { profile: Profile | null };

export async function getTrips(): Promise<TripWithRole[]> {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user.id;
  if (!userId) return [];

  const { data: participantRows, error: participantError } = await supabase
    .from('trip_participant')
    .select('trip_id, role')
    .eq('user_id', userId);

  if (participantError) throw participantError;

  const tripIds = (participantRows ?? []).map((row) => row.trip_id).filter(Boolean) as string[];
  if (tripIds.length === 0) return [];

  const roleMap = new Map(participantRows!.map((row) => [row.trip_id, row.role as TripRole]));

  const { data: trips, error: tripsError } = await supabase
    .from('trip')
    .select('*')
    .in('id', tripIds);

  if (tripsError) throw tripsError;
  return (trips ?? []).map((trip) => ({
    ...trip,
    userRole: roleMap.get(trip.id) ?? TripRole.Participant,
  }));
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
  if (!userId) throw new Error('Not authenticated');

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
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;
  if (!userId) throw new Error('Not authenticated.');

  const participant = await getTripParticipant(id, userId);
  if (participant.role !== TripRole.Organizer) {
    throw new Error('Only the organizer can delete a trip.');
  }

  const { error } = await supabase.from('trip').delete().eq('id', id);
  if (error) throw error;
}

export type ParticipantWithProfile = TripParticipant & {
  profile: { user_name: string | null; profile_picture_url: string | null } | null;
};

export async function getTripParticipants(tripId: string): Promise<ParticipantWithProfile[]> {
  const { data, error } = await supabase
    .from('trip_participant')
    .select('*, profile:profile(user_name, profile_picture_url)')
    .eq('trip_id', tripId);
  if (error) throw error;
  return data as ParticipantWithProfile[];
}

export async function getTripParticipantsWithProfiles(tripId: string): Promise<TripParticipantWithProfile[]> {
  const { data, error } = await supabase
    .from('trip_participant')
    .select('*, profile(*)')
    .eq('trip_id', tripId);
  if (error) throw error;
  return (data ?? []) as TripParticipantWithProfile[];
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
export async function kickParticipant(tripId: string, targetUserId: string): Promise<void> {
  const { error } = await supabase
    .from('trip_participant')
    .delete()
    .eq('trip_id', tripId)
    .eq('user_id', targetUserId);
  if (error) throw error;
}

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
