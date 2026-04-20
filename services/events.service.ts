import { supabase } from '@/lib/supabase';
import type { Event, EventInsert, EventUpdate } from '@/types';

export async function getEvents(tripId: string): Promise<Event[]> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('event')
    .select('*')
    .eq('trip_id', tripId)
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
