import { supabase } from '@/lib/supabase';
import type { Announcement } from '@/types';
import { TripRole } from '@/types/trip.types';
import type { CreateAnnouncementDTO, UpdateAnnouncementDTO } from '@/types/announcement.types';

async function getParticipant(tripId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user.id;
  if (!userId) throw new Error('Not authenticated.');

  const { data, error } = await supabase
    .from('trip_participant')
    .select('*')
    .eq('trip_id', tripId)
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return data;
}

function assertCanManageAnnouncements(role: string | null) {
  if (role !== TripRole.Organizer && role !== TripRole.CoOrganizer) {
    throw new Error('Only organizers and co-organizers can manage announcements.');
  }
}

export async function getAnnouncements(tripId: string): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from('announcement')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createAnnouncement(
  tripId: string,
  dto: CreateAnnouncementDTO,
): Promise<Announcement> {
  const participant = await getParticipant(tripId);
  assertCanManageAnnouncements(participant.role);

  const { data, error } = await supabase
    .from('announcement')
    .insert({ ...dto, trip_id: tripId, participant_id: participant.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAnnouncement(
  tripId: string,
  announcementId: string,
  dto: UpdateAnnouncementDTO,
): Promise<Announcement> {
  const participant = await getParticipant(tripId);
  assertCanManageAnnouncements(participant.role);

  const { data, error } = await supabase
    .from('announcement')
    .update(dto)
    .eq('id', announcementId)
    .eq('trip_id', tripId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
