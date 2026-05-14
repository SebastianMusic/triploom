/**
 * Integration tests for the announcements service.
 * Runs against the real hosted Supabase database.
 *
 * Requires in .env:
 *   EXPO_PUBLIC_SUPABASE_URL
 *   EXPO_PUBLIC_SUPABASE_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 */
import { supabase } from '@/lib/supabase';
import { getSupabaseAdmin } from '@/lib/supabase.admin';
import { createTrip } from '@/services/trip.service';
import { TripRole } from '@/types/trip.types';
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '@/services/announcements.service';
import { createTestUser, TEST_PASSWORD, type TestUser } from './helpers/user';

jest.setTimeout(20000);

let organizer: TestUser;
let coOrganizer: TestUser;
let participant: TestUser;
let tripId: string;

beforeAll(async () => {
  const admin = getSupabaseAdmin();

  organizer = await createTestUser();
  const trip = await createTrip({ name: 'Announcement Integration Trip' });
  tripId = trip.id;

  coOrganizer = await createTestUser();
  const { error: coError } = await admin.from('trip_participant').insert({
    trip_id: tripId,
    user_id: coOrganizer.id,
    role: TripRole.CoOrganizer,
  });
  if (coError) throw new Error(`Setup: failed to insert co-organizer — ${coError.message}`);

  participant = await createTestUser();
  const { error: pError } = await admin.from('trip_participant').insert({
    trip_id: tripId,
    user_id: participant.id,
    role: TripRole.Participant,
  });
  if (pError) throw new Error(`Setup: failed to insert participant — ${pError.message}`);

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: organizer.email,
    password: TEST_PASSWORD,
  });
  if (signInError) throw new Error(`Setup: failed to re-sign in as organizer — ${signInError.message}`);
});

afterAll(async () => {
  const admin = getSupabaseAdmin();
  await admin.from('announcement').delete().eq('trip_id', tripId);
  await admin.from('trip_participant').delete().eq('trip_id', tripId);
  await admin.from('trip').delete().eq('id', tripId);
  await participant.cleanup();
  await coOrganizer.cleanup();
  await organizer.cleanup();
});

beforeEach(async () => {
  const { error } = await supabase.auth.signInWithPassword({
    email: organizer.email,
    password: TEST_PASSWORD,
  });
  if (error) throw new Error(`beforeEach: failed to re-sign in as organizer — ${error.message}`);
});

// ---------------------------------------------------------------------------
// getAnnouncements
// ---------------------------------------------------------------------------

describe('getAnnouncements', () => {
  it('returns an empty array when no announcements exist', async () => {
    const result = await getAnnouncements(tripId);
    expect(Array.isArray(result)).toBe(true);
  });

  it('returns created announcements for the trip', async () => {
    const admin = getSupabaseAdmin();
    const { data: participant_row } = await admin
      .from('trip_participant')
      .select('id')
      .eq('trip_id', tripId)
      .eq('user_id', organizer.id)
      .single();

    const { data: ann } = await admin
      .from('announcement')
      .insert({ trip_id: tripId, participant_id: participant_row!.id, title: 'Test fetch' })
      .select()
      .single();

    const result = await getAnnouncements(tripId);
    expect(result.some((a) => a.id === ann!.id)).toBe(true);

    await admin.from('announcement').delete().eq('id', ann!.id);
  });

  it('orders results newest-first', async () => {
    const admin = getSupabaseAdmin();
    const { data: participant_row } = await admin
      .from('trip_participant')
      .select('id')
      .eq('trip_id', tripId)
      .eq('user_id', organizer.id)
      .single();

    const pid = participant_row!.id;
    const { data: first } = await admin
      .from('announcement')
      .insert({ trip_id: tripId, participant_id: pid, title: 'First' })
      .select()
      .single();
    const { data: second } = await admin
      .from('announcement')
      .insert({ trip_id: tripId, participant_id: pid, title: 'Second' })
      .select()
      .single();

    const result = await getAnnouncements(tripId);
    const ids = result.map((a) => a.id);
    expect(ids.indexOf(second!.id)).toBeLessThan(ids.indexOf(first!.id));

    await admin.from('announcement').delete().in('id', [first!.id, second!.id]);
  });
});

// ---------------------------------------------------------------------------
// createAnnouncement — success
// ---------------------------------------------------------------------------

describe('createAnnouncement — success', () => {
  it('organizer can create an announcement and it is persisted in the DB', async () => {
    const result = await createAnnouncement(tripId, { title: 'Pack light' });

    expect(result.id).toBeDefined();
    expect(result.trip_id).toBe(tripId);
    expect(result.title).toBe('Pack light');

    const { data } = await getSupabaseAdmin()
      .from('announcement')
      .select('id')
      .eq('id', result.id)
      .single();
    expect(data?.id).toBe(result.id);

    await getSupabaseAdmin().from('announcement').delete().eq('id', result.id);
  });

  it('co-organizer can create an announcement', async () => {
    await supabase.auth.signInWithPassword({ email: coOrganizer.email, password: TEST_PASSWORD });

    const result = await createAnnouncement(tripId, { title: 'Co-org post' });

    expect(result.id).toBeDefined();
    expect(result.trip_id).toBe(tripId);

    await getSupabaseAdmin().from('announcement').delete().eq('id', result.id);
  });

  it('stores optional description when provided', async () => {
    const result = await createAnnouncement(tripId, {
      title: 'With desc',
      description: 'Bring sunscreen',
    });

    expect(result.description).toBe('Bring sunscreen');

    await getSupabaseAdmin().from('announcement').delete().eq('id', result.id);
  });

  it('stores null description when omitted', async () => {
    const result = await createAnnouncement(tripId, { title: 'No desc' });

    expect(result.description).toBeNull();

    await getSupabaseAdmin().from('announcement').delete().eq('id', result.id);
  });
});

// ---------------------------------------------------------------------------
// createAnnouncement — role enforcement
// ---------------------------------------------------------------------------

describe('createAnnouncement — role enforcement', () => {
  it('plain participant is blocked', async () => {
    await supabase.auth.signInWithPassword({ email: participant.email, password: TEST_PASSWORD });

    await expect(
      createAnnouncement(tripId, { title: 'Should fail' })
    ).rejects.toThrow('Only organizers and co-organizers can manage announcements.');
  });

  it('unauthenticated user is blocked', async () => {
    await supabase.auth.signOut();

    await expect(
      createAnnouncement(tripId, { title: 'Should fail' })
    ).rejects.toThrow('Not authenticated.');
  });
});

// ---------------------------------------------------------------------------
// updateAnnouncement — success
// ---------------------------------------------------------------------------

describe('updateAnnouncement — success', () => {
  let announcementId: string;

  beforeEach(async () => {
    const result = await createAnnouncement(tripId, { title: 'Original title' });
    announcementId = result.id;
  });

  afterEach(async () => {
    await getSupabaseAdmin().from('announcement').delete().eq('id', announcementId);
  });

  it('organizer can update the title and change is persisted in DB', async () => {
    const result = await updateAnnouncement(tripId, announcementId, { title: 'Updated title' });

    expect(result.title).toBe('Updated title');

    const { data } = await getSupabaseAdmin()
      .from('announcement')
      .select('title')
      .eq('id', announcementId)
      .single();
    expect(data?.title).toBe('Updated title');
  });

  it('co-organizer can update an announcement', async () => {
    await supabase.auth.signInWithPassword({ email: coOrganizer.email, password: TEST_PASSWORD });

    const result = await updateAnnouncement(tripId, announcementId, { title: 'Co-org edit' });

    expect(result.title).toBe('Co-org edit');
  });

  it('can clear description by setting it to null', async () => {
    await updateAnnouncement(tripId, announcementId, { description: 'Temp desc' });
    const result = await updateAnnouncement(tripId, announcementId, { description: null });

    expect(result.description).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// updateAnnouncement — role enforcement
// ---------------------------------------------------------------------------

describe('updateAnnouncement — role enforcement', () => {
  let announcementId: string;

  beforeAll(async () => {
    await supabase.auth.signInWithPassword({ email: organizer.email, password: TEST_PASSWORD });
    const result = await createAnnouncement(tripId, { title: 'Role enforcement fixture' });
    announcementId = result.id;
  });

  afterAll(async () => {
    await getSupabaseAdmin().from('announcement').delete().eq('id', announcementId);
  });

  it('plain participant is blocked', async () => {
    await supabase.auth.signInWithPassword({ email: participant.email, password: TEST_PASSWORD });

    await expect(
      updateAnnouncement(tripId, announcementId, { title: 'Should fail' })
    ).rejects.toThrow('Only organizers and co-organizers can manage announcements.');
  });

  it('unauthenticated user is blocked', async () => {
    await supabase.auth.signOut();

    await expect(
      updateAnnouncement(tripId, announcementId, { title: 'Should fail' })
    ).rejects.toThrow('Not authenticated.');
  });
});

// ---------------------------------------------------------------------------
// deleteAnnouncement
// ---------------------------------------------------------------------------

describe('deleteAnnouncement', () => {
  let announcementId: string;

  beforeEach(async () => {
    await supabase.auth.signInWithPassword({ email: organizer.email, password: TEST_PASSWORD });
    const result = await createAnnouncement(tripId, { title: 'Delete fixture' });
    announcementId = result.id;
  });

  afterEach(async () => {
    await getSupabaseAdmin().from('announcement').delete().eq('id', announcementId);
  });

  it('organizer can delete an announcement and it is removed from the DB', async () => {
    await deleteAnnouncement(tripId, announcementId);

    const { data } = await getSupabaseAdmin()
      .from('announcement')
      .select('id')
      .eq('id', announcementId)
      .maybeSingle();
    expect(data).toBeNull();
  });

  it('co-organizer can delete an announcement', async () => {
    await supabase.auth.signInWithPassword({ email: coOrganizer.email, password: TEST_PASSWORD });

    await deleteAnnouncement(tripId, announcementId);

    const { data } = await getSupabaseAdmin()
      .from('announcement')
      .select('id')
      .eq('id', announcementId)
      .maybeSingle();
    expect(data).toBeNull();
  });

  it('plain participant is blocked and the announcement remains in the DB', async () => {
    await supabase.auth.signInWithPassword({ email: participant.email, password: TEST_PASSWORD });

    await expect(deleteAnnouncement(tripId, announcementId)).rejects.toThrow(
      'Only organizers and co-organizers can manage announcements.',
    );

    const { data } = await getSupabaseAdmin()
      .from('announcement')
      .select('id')
      .eq('id', announcementId)
      .single();
    expect(data?.id).toBe(announcementId);
  });
});
