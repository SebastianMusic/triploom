import { supabase } from '@/lib/supabase';
import type { Event, EventInsert, EventParticipationInsert, EventUpdate } from '@/types';

const EVENT_BANNER_BUCKET = 'event_banner';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function uploadEventBanner(
  localUri: string,
  participantId: string,
): Promise<string> {
  const path = `${participantId}/${generateUUID()}`;
  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();

  const { error } = await supabase.storage
    .from(EVENT_BANNER_BUCKET)
    .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: false });

  if (error) throw error;
  return path;
}

export async function getEventBannerUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(EVENT_BANNER_BUCKET)
    .createSignedUrl(path, 3600);

  if (error) return null;
  return data.signedUrl;
}

export type EventWithCount = Event & {
  event_participation: { participant_id: string }[];
  creator: { profile: { user_name: string | null } | null } | null;
};

export async function getEvent(id: string): Promise<Event | null> {
  const { data, error } = await supabase
    .from('event')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getEvents(tripId: string): Promise<EventWithCount[]> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('event')
    .select('*, event_participation(participant_id), creator:trip_participant!event_created_by_id_fkey(profile(user_name))')
    .eq('trip_id', tripId)
    .gte('end_time', now)
    .order('start_time', { ascending: true });

  if (error) throw error;
  return data as EventWithCount[];
}

export async function getUpcomingEventsForTrips(tripIds: string[]): Promise<Event[]> {
  if (!tripIds.length) return [];

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('event')
    .select('*')
    .in('trip_id', tripIds)
    .gte('end_time', now)
    .order('start_time', { ascending: true });

  if (error) throw error;
  return data;
}

export async function createEvent(data: EventInsert): Promise<Event> {
  const { data: event, error } = await supabase
    .from('event')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return event;
}

export async function updateEvent(id: string, data: EventUpdate): Promise<Event> {
  const { data: event, error } = await supabase
    .from('event')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return event;
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from('event').delete().eq('id', id);
  if (error) throw error;
}

export async function registerForEvent(
  eventId: string,
  participantId: string,
): Promise<void> {
  const insert: EventParticipationInsert = {
    event_id: eventId,
    participant_id: participantId,
  };
  const { error } = await supabase.from('event_participation').insert(insert);
  if (error) throw error;
}

export type EventParticipant = {
  participant_id: string;
  user_id: string | null;
  user_name: string | null;
  profile_picture_url: string | null;
};

export async function getEventParticipants(eventId: string): Promise<EventParticipant[]> {
  // Step 1: get all participant IDs — avoids inner-join RLS drop when embedding trip_participant
  const { data: participations, error: epError } = await supabase
    .from('event_participation')
    .select('participant_id')
    .eq('event_id', eventId);
  if (epError) throw epError;
  if (!participations || participations.length === 0) return [];

  const participantIds = participations.map((p) => p.participant_id);

  // Step 2: fetch profile data for those participant IDs
  const { data: tpData, error: tpError } = await supabase
    .from('trip_participant')
    .select('id, user_id, profile(user_name, profile_picture_url)')
    .in('id', participantIds);
  if (tpError) throw tpError;

  const tpMap = new Map((tpData ?? []).map((tp) => [tp.id, tp]));

  return participantIds.map((pid) => {
    const tp = tpMap.get(pid);
    const profile = tp?.profile as { user_name: string | null; profile_picture_url: string | null } | null;
    return {
      participant_id: pid,
      user_id: tp?.user_id ?? null,
      user_name: profile?.user_name ?? null,
      profile_picture_url: profile?.profile_picture_url ?? null,
    };
  });
}

export async function unregisterFromEvent(
  eventId: string,
  participantId: string,
): Promise<void> {
  const { error } = await supabase
    .from('event_participation')
    .delete()
    .eq('event_id', eventId)
    .eq('participant_id', participantId);
  if (error) throw error;
}
