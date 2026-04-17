/**
 * Integration tests for updateParticipantRole — actor permission matrix.
 * Tests scenarios not covered by trip-participant.test.ts:
 * organizer demoting / promoting to organizer, coOrg actor success paths,
 * participant actor rejection, and null-role actor rejection.
 *
 * Requires in .env:
 *   EXPO_PUBLIC_SUPABASE_URL
 *   EXPO_PUBLIC_SUPABASE_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 */
import { supabase } from '@/lib/supabase';
import { getSupabaseAdmin } from '@/lib/supabase.admin';
import { createTrip, updateParticipantRole } from '@/services/trip.service';
import { TripRole } from '@/types/trip.types';
import { createTestUser, TEST_PASSWORD, type TestUser } from './helpers/user';

jest.setTimeout(20000);

let organizer: TestUser;
let coOrg: TestUser;
let target: TestUser;
let tripId: string;

beforeAll(async () => {
  const admin = getSupabaseAdmin();

  organizer = await createTestUser();
  const trip = await createTrip({ name: 'Trip Roles Integration Trip' });
  tripId = trip.id;

  coOrg = await createTestUser();
  const { error: e1 } = await admin
    .from('trip_participant')
    .insert({ trip_id: tripId, user_id: coOrg.id, role: TripRole.CoOrganizer });
  if (e1) throw new Error(`Setup: failed to insert coOrg — ${e1.message}`);

  target = await createTestUser();
  const { error: e2 } = await admin
    .from('trip_participant')
    .insert({ trip_id: tripId, user_id: target.id, role: TripRole.Participant });
  if (e2) throw new Error(`Setup: failed to insert target — ${e2.message}`);

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: organizer.email,
    password: TEST_PASSWORD,
  });
  if (signInError) throw new Error(`Setup: failed to sign in as organizer — ${signInError.message}`);
});

afterAll(async () => {
  const admin = getSupabaseAdmin();
  await admin.from('trip_participant').delete().eq('trip_id', tripId);
  await admin.from('trip').delete().eq('id', tripId);
  await target.cleanup();
  await coOrg.cleanup();
  await organizer.cleanup();
});

beforeEach(async () => {
  const admin = getSupabaseAdmin();
  await admin
    .from('trip_participant')
    .update({ role: TripRole.Participant })
    .eq('trip_id', tripId)
    .eq('user_id', target.id);
  await admin
    .from('trip_participant')
    .update({ role: TripRole.CoOrganizer })
    .eq('trip_id', tripId)
    .eq('user_id', coOrg.id);
  await supabase.auth.signInWithPassword({ email: organizer.email, password: TEST_PASSWORD });
});

// ---------------------------------------------------------------------------
// organizer actor — additional paths beyond trip-participant.test.ts
// ---------------------------------------------------------------------------

describe('updateParticipantRole — organizer actor', () => {
  it('promotes target → organizer', async () => {
    const result = await updateParticipantRole(tripId, organizer.id, target.id, TripRole.Organizer);
    expect(result.role).toBe(TripRole.Organizer);
  });

  it('demotes coOrganizer → participant', async () => {
    const result = await updateParticipantRole(tripId, organizer.id, coOrg.id, TripRole.Participant);
    expect(result.role).toBe(TripRole.Participant);
  });

  it('returns the updated participant row with correct shape', async () => {
    const result = await updateParticipantRole(tripId, organizer.id, target.id, TripRole.CoOrganizer);
    expect(result.trip_id).toBe(tripId);
    expect(result.user_id).toBe(target.id);
    expect(result.role).toBe(TripRole.CoOrganizer);
  });
});

// ---------------------------------------------------------------------------
// coOrganizer actor
// ---------------------------------------------------------------------------

describe('updateParticipantRole — coOrganizer actor', () => {
  it('promotes target participant → coOrganizer', async () => {
    await supabase.auth.signInWithPassword({ email: coOrg.email, password: TEST_PASSWORD });
    const result = await updateParticipantRole(tripId, coOrg.id, target.id, TripRole.CoOrganizer);
    expect(result.role).toBe(TripRole.CoOrganizer);
  });

  it('demotes another coOrganizer → participant', async () => {
    await getSupabaseAdmin()
      .from('trip_participant')
      .update({ role: TripRole.CoOrganizer })
      .eq('trip_id', tripId)
      .eq('user_id', target.id);
    await supabase.auth.signInWithPassword({ email: coOrg.email, password: TEST_PASSWORD });
    const result = await updateParticipantRole(tripId, coOrg.id, target.id, TripRole.Participant);
    expect(result.role).toBe(TripRole.Participant);
  });

  it("throws when trying to change an organizer's role", async () => {
    await supabase.auth.signInWithPassword({ email: coOrg.email, password: TEST_PASSWORD });
    await expect(
      updateParticipantRole(tripId, coOrg.id, organizer.id, TripRole.Participant)
    ).rejects.toThrow("Co-organizers cannot change an organizer's role.");
  });
});

// ---------------------------------------------------------------------------
// participant actor
// ---------------------------------------------------------------------------

describe('updateParticipantRole — participant actor', () => {
  it('throws regardless of target role or new role', async () => {
    await supabase.auth.signInWithPassword({ email: target.email, password: TEST_PASSWORD });
    await expect(
      updateParticipantRole(tripId, target.id, coOrg.id, TripRole.Participant)
    ).rejects.toThrow('Participants do not have permission to change roles.');
  });
});

// ---------------------------------------------------------------------------
// null-role actor
// ---------------------------------------------------------------------------

describe('updateParticipantRole — null role actor', () => {
  it('throws when actor has no role set', async () => {
    await getSupabaseAdmin()
      .from('trip_participant')
      .update({ role: null })
      .eq('trip_id', tripId)
      .eq('user_id', target.id);
    await supabase.auth.signInWithPassword({ email: target.email, password: TEST_PASSWORD });
    await expect(
      updateParticipantRole(tripId, target.id, coOrg.id, TripRole.CoOrganizer)
    ).rejects.toThrow('Participants do not have permission to change roles.');
  });
});
