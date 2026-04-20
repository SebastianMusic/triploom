import { supabase } from '@/lib/supabase';
import type { Event, EventInsert, EventParticipationInsert, EventUpdate } from '@/types';

export type EventWithCount = Event & {
  event_participation: { participant_id: string }[];
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
    .select('*, event_participation(participant_id)')
    .eq('trip_id', tripId)
    .gte('end_time', now)
    .order('start_time', { ascending: true });

  if (error) throw error;
  return data as EventWithCount[];
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
