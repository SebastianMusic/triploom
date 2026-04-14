/**
 * Integration tests for getTripParticipant and updateParticipantRole.
 * Runs against the real hosted Supabase database.
 *
 * Requires in .env:
 *   EXPO_PUBLIC_SUPABASE_URL
 *   EXPO_PUBLIC_SUPABASE_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 */
import { supabase } from '@/lib/supabase';
import { getSupabaseAdmin } from '@/lib/supabase.admin';
import { createTrip, getTripParticipant, updateParticipantRole } from '@/services/trip.service';
import { TripRole } from '@/types/trip.types';
import { createTestUser, TEST_PASSWORD, type TestUser } from './helpers/user';

jest.setTimeout(15000);

let actor: TestUser;
let target: TestUser;
let tripId: string;

beforeAll(async () => {
  const admin = getSupabaseAdmin();

  // Create actor and sign in as them
  actor = await createTestUser();

  // createTrip inserts the trip AND auto-adds actor as organizer in trip_participant
  const trip = await createTrip({ name: 'Participant Role Integration Trip' });
  tripId = trip.id;

  // Create target. createTestUser signs in as the new user, overwriting the session —
  // re-sign in as actor immediately after
  target = await createTestUser();

  const { error: reSignInError } = await supabase.auth.signInWithPassword({
    email: actor.email,
    password: TEST_PASSWORD,
  });
  if (reSignInError) throw new Error(`Setup: failed to re-sign in as actor — ${reSignInError.message}`);

  // Add target as a participant via admin (bypasses RLS)
  const { error: participantError } = await admin.from('trip_participant').insert({
    trip_id: tripId,
    user_id: target.id,
    role: TripRole.Participant,
  });
  if (participantError) throw new Error(`Setup: failed to insert target participant — ${participantError.message}`);
});

afterAll(async () => {
  const admin = getSupabaseAdmin();

  // Clean up in FK-safe order: participant rows → trip → users
  await admin.from('trip_participant').delete().eq('trip_id', tripId);
  await admin.from('trip').delete().eq('id', tripId);
  await target.cleanup();
  await actor.cleanup();
});

// ---------------------------------------------------------------------------
// getTripParticipant (integration)
// ---------------------------------------------------------------------------

describe('getTripParticipant (integration)', () => {
  it('returns the persisted participant row with all correct fields', async () => {
    const result = await getTripParticipant(tripId, actor.id);

    expect(result.trip_id).toBe(tripId);
    expect(result.user_id).toBe(actor.id);
    expect(result.role).toBe(TripRole.Organizer);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeDefined();
  });

  it('throws when no participant record exists for that user/trip combo', async () => {
    await expect(
      getTripParticipant(tripId, 'non-existent-user-id')
    ).rejects.toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// updateParticipantRole (integration)
// ---------------------------------------------------------------------------

describe('updateParticipantRole (integration)', () => {
  // Reset both rows to a known state and ensure actor is signed in before each test
  beforeEach(async () => {
    const admin = getSupabaseAdmin();

    const { error: e1 } = await admin
      .from('trip_participant')
      .update({ role: TripRole.Organizer })
      .eq('trip_id', tripId)
      .eq('user_id', actor.id);
    if (e1) throw new Error(`beforeEach: failed to reset actor role — ${e1.message}`);

    const { error: e2 } = await admin
      .from('trip_participant')
      .update({ role: TripRole.Participant })
      .eq('trip_id', tripId)
      .eq('user_id', target.id);
    if (e2) throw new Error(`beforeEach: failed to reset target role — ${e2.message}`);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: actor.email,
      password: TEST_PASSWORD,
    });
    if (signInError) throw new Error(`beforeEach: failed to re-sign in as actor — ${signInError.message}`);
  });

  it('organizer promotes target participant → coOrganizer and the change is persisted in DB', async () => {
    await updateParticipantRole(tripId, actor.id, target.id, TripRole.CoOrganizer);

    // Verify the role was actually written to the DB, not just returned
    const { data, error } = await getSupabaseAdmin()
      .from('trip_participant')
      .select('role')
      .eq('trip_id', tripId)
      .eq('user_id', target.id)
      .single();

    expect(error).toBeNull();
    expect(data?.role).toBe(TripRole.CoOrganizer);
  });

  it('coOrganizer cannot promote to organizer', async () => {
    // Promote target to coOrganizer via admin
    const { error: promoteError } = await getSupabaseAdmin()
      .from('trip_participant')
      .update({ role: TripRole.CoOrganizer })
      .eq('trip_id', tripId)
      .eq('user_id', target.id);
    if (promoteError) throw new Error(`Test setup: failed to promote target — ${promoteError.message}`);

    // Sign in as target (now a coOrganizer) so the service reads their session
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: target.email,
      password: TEST_PASSWORD,
    });
    if (signInError) throw new Error(`Test setup: failed to sign in as target — ${signInError.message}`);

    // target (coOrganizer) tries to grant organizer role — should be blocked
    await expect(
      updateParticipantRole(tripId, target.id, actor.id, TripRole.Organizer)
    ).rejects.toThrow('Co-organizers cannot promote to organizer.');
  });
});
