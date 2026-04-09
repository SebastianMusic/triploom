import { supabase } from '@/lib/supabase';
import type { Trip, TripParticipant, TripUpdate } from '@/types';
import type { CreateTripDTO } from '@/types/trip.types';

export async function getTrips(): Promise<Trip[]> {
  const { data, error } = await supabase.from('trip').select('*');
  if (error) throw error;
  return data;
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

  const { data, error } = await supabase
    .from('trip')
    .insert({ ...dto, organizer_id: session?.user.id })
    .select()
    .single();
  if (error) throw error;
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
