<<<<<<< HEAD
import { createTripSchema } from '@/types/trip.types';
||||||| parent of cda5913 (added delete trip)
import { supabase } from '@/lib/supabase';
import { getSupabaseAdmin } from '@/lib/supabase.admin';
import { createTrip, getTripParticipant, updateParticipantRole } from '../trip.service';
import { createTripSchema, TripRole } from '@/types/trip.types';
import { createTestUser, TEST_PASSWORD, type TestUser } from '@/__integration__/helpers/user';
=======
import { supabase } from '@/lib/supabase';
import { getSupabaseAdmin } from '@/lib/supabase.admin';
import { createTrip, deleteTrip, getTripParticipant, updateParticipantRole } from '../trip.service';
import { createTripSchema, TripRole } from '@/types/trip.types';
import { createTestUser, TEST_PASSWORD, type TestUser } from '@/__integration__/helpers/user';
>>>>>>> cda5913 (added delete trip)

// Pure Zod schema tests — no Supabase dependency.
// Service behaviour is covered by __integration__/trip.test.ts,
// __integration__/trip-participant.test.ts, and __integration__/trip-roles.test.ts.

describe('createTripSchema', () => {
  it('accepts a valid trip with only name', () => {
    expect(createTripSchema.safeParse({ name: 'My Trip' }).success).toBe(true);
  });

  it('accepts a valid trip with all fields', () => {
    expect(
      createTripSchema.safeParse({
        name: 'Norway Hike',
        description: 'Through the fjords',
        start_date: '2026-07-01',
        end_date: '2026-07-14',
        banner_image_url: null,
      }).success
    ).toBe(true);
  });

  it('rejects an empty name', () => {
    const result = createTripSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Trip name is required');
    }
  });

  it('rejects a missing name', () => {
    expect(createTripSchema.safeParse({}).success).toBe(false);
  });
});
<<<<<<< HEAD
||||||| parent of cda5913 (added delete trip)

// ---------------------------------------------------------------------------
// createTrip
// ---------------------------------------------------------------------------

describe('createTrip', () => {
  it('creates a trip and returns it with the correct name', async () => {
    const trip = await createTrip({ name: 'New Integration Trip' });
    extraTripIds.push(trip.id);

    expect(trip.id).toBeDefined();
    expect(trip.name).toBe('New Integration Trip');
  });

  it('sets organizer_id to the authenticated user', async () => {
    const trip = await createTrip({ name: 'Organizer ID Trip' });
    extraTripIds.push(trip.id);

    expect(trip.organizer_id).toBe(organizer.id);
  });

  it('persists the trip so it can be fetched back via admin', async () => {
    const trip = await createTrip({ name: 'Persistent Trip' });
    extraTripIds.push(trip.id);

    const { data, error } = await getSupabaseAdmin()
      .from('trip')
      .select('*')
      .eq('id', trip.id)
      .single();

    expect(error).toBeNull();
    expect(data?.name).toBe('Persistent Trip');
  });

  it('stores optional description when provided', async () => {
    const trip = await createTrip({ name: 'Described Trip', description: 'Some details' });
    extraTripIds.push(trip.id);

    expect(trip.description).toBe('Some details');
  });
});

// ---------------------------------------------------------------------------
// getTripParticipant
// ---------------------------------------------------------------------------

describe('getTripParticipant', () => {
  it('returns the participant row with all correct fields', async () => {
    const result = await getTripParticipant(tripId, organizer.id);

    expect(result.trip_id).toBe(tripId);
    expect(result.user_id).toBe(organizer.id);
    expect(result.role).toBe(TripRole.Organizer);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeDefined();
  });

  it('throws when no participant record exists for that user/trip combo', async () => {
    await expect(
      getTripParticipant(tripId, '00000000-0000-0000-0000-000000000000')
    ).rejects.toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// updateParticipantRole — organizer actor
// ---------------------------------------------------------------------------

describe('updateParticipantRole — organizer actor', () => {
  it('promotes target participant → coOrganizer and persists the change', async () => {
    const result = await updateParticipantRole(tripId, organizer.id, target.id, TripRole.CoOrganizer);

    expect(result.role).toBe(TripRole.CoOrganizer);

    const { data } = await getSupabaseAdmin()
      .from('trip_participant')
      .select('role')
      .eq('trip_id', tripId)
      .eq('user_id', target.id)
      .single();
    expect(data?.role).toBe(TripRole.CoOrganizer);
  });

  it('promotes target participant → organizer', async () => {
    const result = await updateParticipantRole(tripId, organizer.id, target.id, TripRole.Organizer);

    expect(result.role).toBe(TripRole.Organizer);
  });

  it('demotes coOrganizer → participant', async () => {
    await getSupabaseAdmin()
      .from('trip_participant')
      .update({ role: TripRole.CoOrganizer })
      .eq('trip_id', tripId)
      .eq('user_id', target.id);

    const result = await updateParticipantRole(tripId, organizer.id, target.id, TripRole.Participant);

    expect(result.role).toBe(TripRole.Participant);
  });

  it('returns the updated participant row', async () => {
    const result = await updateParticipantRole(tripId, organizer.id, target.id, TripRole.CoOrganizer);

    expect(result.trip_id).toBe(tripId);
    expect(result.user_id).toBe(target.id);
    expect(result.role).toBe(TripRole.CoOrganizer);
  });
});

// ---------------------------------------------------------------------------
// updateParticipantRole — coOrganizer actor
// ---------------------------------------------------------------------------

describe('updateParticipantRole — coOrganizer actor', () => {
  it('promotes target participant → coOrganizer', async () => {
    const result = await updateParticipantRole(tripId, coOrg.id, target.id, TripRole.CoOrganizer);

    expect(result.role).toBe(TripRole.CoOrganizer);
  });

  it('demotes another coOrganizer → participant', async () => {
    await getSupabaseAdmin()
      .from('trip_participant')
      .update({ role: TripRole.CoOrganizer })
      .eq('trip_id', tripId)
      .eq('user_id', target.id);

    const result = await updateParticipantRole(tripId, coOrg.id, target.id, TripRole.Participant);

    expect(result.role).toBe(TripRole.Participant);
  });

  it('throws when trying to promote anyone to organizer', async () => {
    await expect(
      updateParticipantRole(tripId, coOrg.id, target.id, TripRole.Organizer)
    ).rejects.toThrow('Co-organizers cannot promote to organizer.');
  });

  it("throws when trying to change an organizer's role", async () => {
    await expect(
      updateParticipantRole(tripId, coOrg.id, organizer.id, TripRole.Participant)
    ).rejects.toThrow("Co-organizers cannot change an organizer's role.");
  });
});

// ---------------------------------------------------------------------------
// updateParticipantRole — participant actor
// ---------------------------------------------------------------------------

describe('updateParticipantRole — participant actor', () => {
  it('throws regardless of target role or new role', async () => {
    await expect(
      updateParticipantRole(tripId, target.id, coOrg.id, TripRole.Participant)
    ).rejects.toThrow('Participants do not have permission to change roles.');
  });
});

// ---------------------------------------------------------------------------
// updateParticipantRole — null role actor
// ---------------------------------------------------------------------------

describe('updateParticipantRole — null role actor', () => {
  it('throws when actor has no role set', async () => {
    await getSupabaseAdmin()
      .from('trip_participant')
      .update({ role: null })
      .eq('trip_id', tripId)
      .eq('user_id', target.id);

    await expect(
      updateParticipantRole(tripId, target.id, coOrg.id, TripRole.CoOrganizer)
    ).rejects.toThrow('Participants do not have permission to change roles.');
  });
});
=======

// ---------------------------------------------------------------------------
// createTrip
// ---------------------------------------------------------------------------

describe('createTrip', () => {
  it('creates a trip and returns it with the correct name', async () => {
    const trip = await createTrip({ name: 'New Integration Trip' });
    extraTripIds.push(trip.id);

    expect(trip.id).toBeDefined();
    expect(trip.name).toBe('New Integration Trip');
  });

  it('sets organizer_id to the authenticated user', async () => {
    const trip = await createTrip({ name: 'Organizer ID Trip' });
    extraTripIds.push(trip.id);

    expect(trip.organizer_id).toBe(organizer.id);
  });

  it('persists the trip so it can be fetched back via admin', async () => {
    const trip = await createTrip({ name: 'Persistent Trip' });
    extraTripIds.push(trip.id);

    const { data, error } = await getSupabaseAdmin()
      .from('trip')
      .select('*')
      .eq('id', trip.id)
      .single();

    expect(error).toBeNull();
    expect(data?.name).toBe('Persistent Trip');
  });

  it('stores optional description when provided', async () => {
    const trip = await createTrip({ name: 'Described Trip', description: 'Some details' });
    extraTripIds.push(trip.id);

    expect(trip.description).toBe('Some details');
  });
});

// ---------------------------------------------------------------------------
// getTripParticipant
// ---------------------------------------------------------------------------

describe('getTripParticipant', () => {
  it('returns the participant row with all correct fields', async () => {
    const result = await getTripParticipant(tripId, organizer.id);

    expect(result.trip_id).toBe(tripId);
    expect(result.user_id).toBe(organizer.id);
    expect(result.role).toBe(TripRole.Organizer);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeDefined();
  });

  it('throws when no participant record exists for that user/trip combo', async () => {
    await expect(
      getTripParticipant(tripId, '00000000-0000-0000-0000-000000000000')
    ).rejects.toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// updateParticipantRole — organizer actor
// ---------------------------------------------------------------------------

describe('updateParticipantRole — organizer actor', () => {
  it('promotes target participant → coOrganizer and persists the change', async () => {
    const result = await updateParticipantRole(tripId, organizer.id, target.id, TripRole.CoOrganizer);

    expect(result.role).toBe(TripRole.CoOrganizer);

    const { data } = await getSupabaseAdmin()
      .from('trip_participant')
      .select('role')
      .eq('trip_id', tripId)
      .eq('user_id', target.id)
      .single();
    expect(data?.role).toBe(TripRole.CoOrganizer);
  });

  it('promotes target participant → organizer', async () => {
    const result = await updateParticipantRole(tripId, organizer.id, target.id, TripRole.Organizer);

    expect(result.role).toBe(TripRole.Organizer);
  });

  it('demotes coOrganizer → participant', async () => {
    await getSupabaseAdmin()
      .from('trip_participant')
      .update({ role: TripRole.CoOrganizer })
      .eq('trip_id', tripId)
      .eq('user_id', target.id);

    const result = await updateParticipantRole(tripId, organizer.id, target.id, TripRole.Participant);

    expect(result.role).toBe(TripRole.Participant);
  });

  it('returns the updated participant row', async () => {
    const result = await updateParticipantRole(tripId, organizer.id, target.id, TripRole.CoOrganizer);

    expect(result.trip_id).toBe(tripId);
    expect(result.user_id).toBe(target.id);
    expect(result.role).toBe(TripRole.CoOrganizer);
  });
});

// ---------------------------------------------------------------------------
// updateParticipantRole — coOrganizer actor
// ---------------------------------------------------------------------------

describe('updateParticipantRole — coOrganizer actor', () => {
  it('promotes target participant → coOrganizer', async () => {
    const result = await updateParticipantRole(tripId, coOrg.id, target.id, TripRole.CoOrganizer);

    expect(result.role).toBe(TripRole.CoOrganizer);
  });

  it('demotes another coOrganizer → participant', async () => {
    await getSupabaseAdmin()
      .from('trip_participant')
      .update({ role: TripRole.CoOrganizer })
      .eq('trip_id', tripId)
      .eq('user_id', target.id);

    const result = await updateParticipantRole(tripId, coOrg.id, target.id, TripRole.Participant);

    expect(result.role).toBe(TripRole.Participant);
  });

  it('throws when trying to promote anyone to organizer', async () => {
    await expect(
      updateParticipantRole(tripId, coOrg.id, target.id, TripRole.Organizer)
    ).rejects.toThrow('Co-organizers cannot promote to organizer.');
  });

  it("throws when trying to change an organizer's role", async () => {
    await expect(
      updateParticipantRole(tripId, coOrg.id, organizer.id, TripRole.Participant)
    ).rejects.toThrow("Co-organizers cannot change an organizer's role.");
  });
});

// ---------------------------------------------------------------------------
// updateParticipantRole — participant actor
// ---------------------------------------------------------------------------

describe('updateParticipantRole — participant actor', () => {
  it('throws regardless of target role or new role', async () => {
    await expect(
      updateParticipantRole(tripId, target.id, coOrg.id, TripRole.Participant)
    ).rejects.toThrow('Participants do not have permission to change roles.');
  });
});

// ---------------------------------------------------------------------------
// updateParticipantRole — null role actor
// ---------------------------------------------------------------------------

describe('updateParticipantRole — null role actor', () => {
  it('throws when actor has no role set', async () => {
    await getSupabaseAdmin()
      .from('trip_participant')
      .update({ role: null })
      .eq('trip_id', tripId)
      .eq('user_id', target.id);

    await expect(
      updateParticipantRole(tripId, target.id, coOrg.id, TripRole.CoOrganizer)
    ).rejects.toThrow('Participants do not have permission to change roles.');
  });
});

// ---------------------------------------------------------------------------
// deleteTrip
// ---------------------------------------------------------------------------

describe('deleteTrip', () => {
  it('deletes the trip when called by the organizer', async () => {
    const trip = await createTrip({ name: 'Trip To Delete' });

    await expect(deleteTrip(trip.id)).resolves.toBeUndefined();

    const { data } = await getSupabaseAdmin()
      .from('trip')
      .select('id')
      .eq('id', trip.id)
      .maybeSingle();
    expect(data).toBeNull();
  });

  it('throws when a coOrganizer tries to delete', async () => {
    const trip = await createTrip({ name: 'Protected Trip - coOrg' });
    extraTripIds.push(trip.id);

    const admin = getSupabaseAdmin();
    await admin.from('trip_participant').insert({
      trip_id: trip.id,
      user_id: coOrg.id,
      role: TripRole.CoOrganizer,
    });

    await supabase.auth.signInWithPassword({ email: coOrg.email, password: TEST_PASSWORD });

    await expect(deleteTrip(trip.id)).rejects.toThrow('Only the organizer can delete a trip.');

    await supabase.auth.signInWithPassword({ email: organizer.email, password: TEST_PASSWORD });
  });

  it('throws when a participant tries to delete', async () => {
    const trip = await createTrip({ name: 'Protected Trip - participant' });
    extraTripIds.push(trip.id);

    const admin = getSupabaseAdmin();
    await admin.from('trip_participant').insert({
      trip_id: trip.id,
      user_id: target.id,
      role: TripRole.Participant,
    });

    await supabase.auth.signInWithPassword({ email: target.email, password: TEST_PASSWORD });

    await expect(deleteTrip(trip.id)).rejects.toThrow('Only the organizer can delete a trip.');

    await supabase.auth.signInWithPassword({ email: organizer.email, password: TEST_PASSWORD });
  });
});
>>>>>>> cda5913 (added delete trip)
