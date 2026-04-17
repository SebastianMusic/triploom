import { createTripSchema } from '@/types/trip.types';

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
