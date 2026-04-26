/**
 * Integration tests for trip creation.
 * Runs against the real hosted Supabase database.
 *
 * Requires in .env:
 *   EXPO_PUBLIC_SUPABASE_URL
 *   EXPO_PUBLIC_SUPABASE_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 */
import { getSupabaseAdmin } from '@/lib/supabase.admin';
import { createTrip } from '@/services/trip.service';
import { createTripSchema, TripEventPermission } from '@/types/trip.types';
import { createTestUser, type TestUser } from './helpers/user';

jest.setTimeout(15000);

let user: TestUser;
const createdTripIds: string[] = [];

beforeAll(async () => {
  user = await createTestUser();
});

afterAll(async () => {
  if (createdTripIds.length > 0) {
    await getSupabaseAdmin().from('trip').delete().in('id', createdTripIds);
  }
  await user.cleanup();
});

describe('createTrip (integration)', () => {
  it('creates a trip in the database and returns it', async () => {
    const trip = await createTrip({ name: 'Integration Test Trip' });
    createdTripIds.push(trip.id);

    expect(trip.id).toBeDefined();
    expect(trip.name).toBe('Integration Test Trip');
    expect(trip.organizer_id).toBe(user.id);
    expect(trip.created_at).toBeDefined();
  });

  it('persists the trip so it can be fetched back', async () => {
    const created = await createTrip({ name: 'Persistent Trip' });
    createdTripIds.push(created.id);

    const { data, error } = await getSupabaseAdmin()
      .from('trip')
      .select('*')
      .eq('id', created.id)
      .single();

    expect(error).toBeNull();
    expect(data?.name).toBe('Persistent Trip');
    expect(data?.organizer_id).toBe(user.id);
  });

  it('stores optional fields correctly', async () => {
    const trip = await createTrip({
      name: 'Full Trip',
      description: 'A detailed description',
      start_date: '2026-07-01',
      end_date: '2026-07-14',
      event_permission: TripEventPermission.Organizer,
    });
    createdTripIds.push(trip.id);

    expect(trip.description).toBe('A detailed description');
    expect(trip.start_date).toBe('2026-07-01');
    expect(trip.end_date).toBe('2026-07-14');
    expect(trip.event_permission).toBe(TripEventPermission.Organizer);
  });

  it('sets null for omitted optional fields', async () => {
    const trip = await createTrip({ name: 'Minimal Trip' });
    createdTripIds.push(trip.id);

    expect(trip.description).toBeNull();
    expect(trip.start_date).toBeNull();
    expect(trip.end_date).toBeNull();
    expect(trip.banner_image_url).toBeNull();
  });

  it('rejects an empty name before hitting the DB', () => {
    const result = createTripSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Trip name is required');
    }
  });
});
