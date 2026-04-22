import { supabase } from '@/lib/supabase';
import type { Profile, TripGroup } from '@/types';

export type GroupMemberWithProfile = {
  participant_id: string;
  role: string | null;
  trip_participant: {
    user_id: string;
    role: string | null;
    profile: Profile | null;
  } | null;
};

export type GroupWithMembers = TripGroup & {
  group_membership: GroupMemberWithProfile[];
};

export async function getTripGroupsWithMembers(tripId: string): Promise<GroupWithMembers[]> {
  const { data, error } = await supabase
    .from('trip_group')
    .select('*, group_membership(participant_id, role, trip_participant(user_id, role, profile(*)))')
    .eq('trip_id', tripId)
    .order('created_at');
  if (error) throw error;
  return (data ?? []) as GroupWithMembers[];
}

export type CreateGroupsDTO = {
  tripId: string;
  baseName: string;
  count: number;
  description?: string;
  maxMembers?: number;
};

export async function createTripGroups(dto: CreateGroupsDTO): Promise<TripGroup[]> {
  const rows = Array.from({ length: dto.count }, (_, i) => ({
    trip_id: dto.tripId,
    name: dto.count === 1 ? dto.baseName.trim() : `${dto.baseName.trim()} ${i + 1}`,
    description: dto.description?.trim() || null,
    max_members: dto.maxMembers ?? null,
  }));

  const { data, error } = await supabase
    .from('trip_group')
    .insert(rows)
    .select();
  if (error) throw error;
  return data as TripGroup[];
}

export async function joinGroup(groupId: string, participantId: string): Promise<void> {
  // Check max_members before inserting to avoid a recursive RLS policy
  const { data: group, error: groupError } = await supabase
    .from('trip_group')
    .select('max_members')
    .eq('id', groupId)
    .single();
  if (groupError) throw groupError;

  if (group.max_members !== null) {
    const { count, error: countError } = await supabase
      .from('group_membership')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId);
    if (countError) throw countError;
    if ((count ?? 0) >= group.max_members) {
      throw new Error('Group is full');
    }
  }

  const { error } = await supabase
    .from('group_membership')
    .insert({ group_id: groupId, participant_id: participantId, role: null });
  if (error) throw error;
}

export async function leaveGroup(groupId: string, participantId: string): Promise<void> {
  const { error } = await supabase
    .from('group_membership')
    .delete()
    .eq('group_id', groupId)
    .eq('participant_id', participantId);
  if (error) throw error;
}

export async function deleteGroup(groupId: string): Promise<void> {
  const { error } = await supabase
    .from('trip_group')
    .delete()
    .eq('id', groupId);
  if (error) throw error;
}
