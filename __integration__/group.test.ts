import { getSupabaseAdmin } from '@/lib/supabase.admin';
import { supabase } from '@/lib/supabase';
import {
  createTripGroups,
  deleteGroup,
  getTripGroupsWithMembers,
  joinGroup,
  leaveGroup,
  updateGroup,
} from '@/services/group.service';
import { createGroupsSchema, updateGroupSchema } from '@/types';
import { TripRole } from '@/types/trip.types';
import { createTestUser, TEST_PASSWORD, type TestUser } from './helpers/user';

jest.setTimeout(30000);

async function signInAs(user: TestUser) {
  const { error } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: TEST_PASSWORD,
  });
  if (error) throw error;
}

describe('group service (integration)', () => {
  let organizer: TestUser;
  let member: TestUser;
  let tripId: string;
  let memberParticipantId: string;
  let createdGroupIds: string[] = [];

  beforeAll(async () => {
    organizer = await createTestUser();
    member = await createTestUser();

    await signInAs(organizer);

    const { data: trip, error: tripError } = await getSupabaseAdmin()
      .from('trip')
      .insert({ name: 'Group Integration Trip', organizer_id: organizer.id })
      .select()
      .single();
    if (tripError) throw tripError;
    tripId = trip.id;

    const { data: organizerParticipant, error: organizerParticipantError } = await getSupabaseAdmin()
      .from('trip_participant')
      .insert({ trip_id: tripId, user_id: organizer.id, role: TripRole.Organizer })
      .select()
      .single();
    if (organizerParticipantError) throw organizerParticipantError;
    expect(organizerParticipant.id).toBeDefined();

    const { data: memberParticipant, error: memberParticipantError } = await getSupabaseAdmin()
      .from('trip_participant')
      .insert({ trip_id: tripId, user_id: member.id, role: TripRole.Participant })
      .select()
      .single();
    if (memberParticipantError) throw memberParticipantError;
    memberParticipantId = memberParticipant.id;
  });

  afterAll(async () => {
    if (createdGroupIds.length > 0) {
      await getSupabaseAdmin().from('trip_group').delete().in('id', createdGroupIds);
    }
    await getSupabaseAdmin().from('trip').delete().eq('id', tripId);
    await member.cleanup();
    await organizer.cleanup();
  });

  it('creates groups in the database for a trip organizer', async () => {
    await signInAs(organizer);
    const groups = await createTripGroups({
      tripId,
      baseName: 'Cabin',
      count: 2,
      maxMembers: 4,
    });

    createdGroupIds = groups.map((group) => group.id);

    expect(groups).toHaveLength(2);
    expect(groups[0].name).toBe('Cabin 1');
    expect(groups[1].name).toBe('Cabin 2');
  });

  it('fetches groups with nested memberships', async () => {
    await signInAs(organizer);
    const groups = await getTripGroupsWithMembers(tripId);

    expect(groups.length).toBeGreaterThan(0);
    expect(groups[0].trip_id).toBe(tripId);
    expect(Array.isArray(groups[0].group_membership)).toBe(true);
  });

  it('persists join and leave membership changes', async () => {
    const groupId = createdGroupIds[0];

    await signInAs(member);
    await joinGroup(groupId, memberParticipantId);

    const { data: joinedRow, error: joinedError } = await getSupabaseAdmin()
      .from('group_membership')
      .select('*')
      .eq('group_id', groupId)
      .eq('participant_id', memberParticipantId)
      .single();

    expect(joinedError).toBeNull();
    expect(joinedRow?.group_id).toBe(groupId);

    await leaveGroup(groupId, memberParticipantId);

    const { data: leftRows, error: leftError } = await getSupabaseAdmin()
      .from('group_membership')
      .select('*')
      .eq('group_id', groupId)
      .eq('participant_id', memberParticipantId);

    expect(leftError).toBeNull();
    expect(leftRows).toHaveLength(0);
  });

  it('updates a group in the database', async () => {
    const groupId = createdGroupIds[0];

    await signInAs(organizer);
    const updated = await updateGroup(groupId, {
      name: 'Cabin North',
      description: 'Quiet side',
      max_members: 5,
    });

    expect(updated.name).toBe('Cabin North');
    expect(updated.description).toBe('Quiet side');
    expect(updated.max_members).toBe(5);
  });

  it('deletes a group from the database', async () => {
    await signInAs(organizer);
    const groups = await createTripGroups({
      tripId,
      baseName: 'Delete Me',
      count: 1,
    });
    const groupId = groups[0].id;

    await deleteGroup(groupId);

    const { data, error } = await getSupabaseAdmin()
      .from('trip_group')
      .select('*')
      .eq('id', groupId);

    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  it('validates group DTOs before DB work', () => {
    const createResult = createGroupsSchema.safeParse({
      tripId,
      baseName: '',
      count: 0,
    });
    expect(createResult.success).toBe(false);
    if (!createResult.success) {
      expect(createResult.error.issues[0].message).toBe('Group name is required');
    }

    const updateResult = updateGroupSchema.safeParse({
      name: '',
      max_members: 0,
    });
    expect(updateResult.success).toBe(false);
    if (!updateResult.success) {
      expect(updateResult.error.issues[0].message).toBe('Group name is required');
    }
  });
});
