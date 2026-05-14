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

function throwIfNoAnnouncementWasDeleted(error: unknown): never {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'PGRST116'
  ) {
    throw new Error(
      'Announcement was not deleted. The database is missing the announcement delete policy.',
    );
  }
  throw error;
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

export async function deleteAnnouncement(
  tripId: string,
  announcementId: string,
): Promise<void> {
  const participant = await getParticipant(tripId);
  assertCanManageAnnouncements(participant.role);

  const { error } = await supabase
    .from('announcement')
    .delete()
    .eq('id', announcementId)
    .eq('trip_id', tripId)
    .select('id')
    .single();
  if (error) throwIfNoAnnouncementWasDeleted(error);
}

export function subscribeToAnnouncements(
  tripId: string,
  onAnnouncementCreated: (announcement: Announcement) => void,
  onAnnouncementUpdated: (announcement: Announcement) => void,
  onAnnouncementDeleted: (announcementId: string) => void,
  onStatusChange?: (status: string) => void,
): () => void {
  const channel = supabase
    .channel(`announcements:${tripId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'announcement',
        filter: `trip_id=eq.${tripId}`,
      },
      (payload) => {
        onAnnouncementCreated(payload.new as Announcement);
      },
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'announcement',
        filter: `trip_id=eq.${tripId}`,
      },
      (payload) => {
        onAnnouncementUpdated(payload.new as Announcement);
      },
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'announcement',
        filter: `trip_id=eq.${tripId}`,
      },
      (payload) => {
        onAnnouncementDeleted((payload.old as { id: string }).id);
      },
    )
    .subscribe((status) => {
      onStatusChange?.(status);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}
