import { supabase } from '@/lib/supabase';
import { createGroupSchema, createGroupsSchema, updateGroupSchema } from '@/types';
import type { CreateGroupDTO, CreateGroupsDTO, Profile, TripGroup, UpdateGroupDTO } from '@/types';

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

export async function createTripGroups(dto: CreateGroupsDTO): Promise<TripGroup[]> {
  const parsed = createGroupsSchema.parse(dto);
  const rows = Array.from({ length: parsed.count }, (_, i) => createGroupSchema.parse({
    trip_id: parsed.tripId,
    name: parsed.count === 1 ? parsed.baseName : `${parsed.baseName} ${i + 1}`,
    description: parsed.description,
    max_members: parsed.maxMembers ?? null,
  }) satisfies CreateGroupDTO);

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

export async function updateGroup(groupId: string, dto: UpdateGroupDTO): Promise<TripGroup> {
  const parsed = updateGroupSchema.parse(dto);
  const { data, error } = await supabase
    .from('trip_group')
    .update({
      name: parsed.name,
      description: parsed.description || null,
      max_members: parsed.max_members ?? null,
    })
    .eq('id', groupId)
    .select()
    .single();
  if (error) throw error;
  return data as TripGroup;
}

export async function deleteGroup(groupId: string): Promise<void> {
  const { error } = await supabase
    .from('trip_group')
    .delete()
    .eq('id', groupId);
  if (error) throw error;
}

export async function deleteGroups(groupIds: string[]): Promise<void> {
  if (groupIds.length === 0) return;
  const { error } = await supabase
    .from('trip_group')
    .delete()
    .in('id', groupIds);
  if (error) throw error;
}
