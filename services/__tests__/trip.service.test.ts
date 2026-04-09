import { createTrip } from '../trip.service';
import { createTripSchema } from '@/types/trip.types';

// Mock the supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: { getSession: jest.fn() },
  },
}));

// Get a reference to the mocked module
import { supabase } from '@/lib/supabase';
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

const mockTrip = {
  id: 'trip-1',
  name: 'Norway Hike',
  description: 'A trip through the fjords',
  start_date: null,
  end_date: null,
  banner_image_url: null,
  event_permission: null,
  organizer_id: 'user-1',
  created_at: '2026-04-09T00:00:00Z',
};

// Helper to set up a successful Supabase chain for .insert().select().single()
function mockInsertSuccess(returnData: typeof mockTrip) {
  const single = jest.fn().mockResolvedValue({ data: returnData, error: null });
  const select = jest.fn().mockReturnValue({ single });
  const insert = jest.fn().mockReturnValue({ select });
  mockSupabase.from.mockReturnValue({ insert } as any);
  return { insert, select, single };
}

beforeEach(() => {
  jest.clearAllMocks();
  (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
    data: { session: { user: { id: 'user-1' } } },
    error: null,
  });
});

// --- Schema validation ---

describe('createTripSchema', () => {
  it('accepts a valid trip with only name', () => {
    const result = createTripSchema.safeParse({ name: 'My Trip' });
    expect(result.success).toBe(true);
  });

  it('accepts a valid trip with all fields', () => {
    const result = createTripSchema.safeParse({
      name: 'Norway Hike',
      description: 'Through the fjords',
      start_date: '2026-07-01',
      end_date: '2026-07-14',
      banner_image_url: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty name', () => {
    const result = createTripSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Trip name is required');
    }
  });

  it('rejects a missing name', () => {
    const result = createTripSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// --- Service ---

describe('createTrip', () => {
  it('inserts the trip with organizer_id from the session', async () => {
    const { insert } = mockInsertSuccess(mockTrip);

    const result = await createTrip({ name: 'Norway Hike' });

    expect(mockSupabase.from).toHaveBeenCalledWith('trip');
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Norway Hike', organizer_id: 'user-1' })
    );
    expect(result).toEqual(mockTrip);
  });

  it('returns the created trip', async () => {
    mockInsertSuccess(mockTrip);
    const result = await createTrip({ name: 'Norway Hike', description: 'Through the fjords' });
    expect(result.id).toBe('trip-1');
    expect(result.name).toBe('Norway Hike');
  });

  it('throws when Supabase returns an error', async () => {
    const single = jest.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } });
    const select = jest.fn().mockReturnValue({ single });
    const insert = jest.fn().mockReturnValue({ select });
    mockSupabase.from.mockReturnValue({ insert } as any);

    await expect(createTrip({ name: 'Norway Hike' })).rejects.toMatchObject({ message: 'DB error' });
  });

  it('works when there is no active session (organizer_id is undefined)', async () => {
    (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null,
    });
    const { insert } = mockInsertSuccess({ ...mockTrip, organizer_id: null });

    await createTrip({ name: 'Anonymous Trip' });

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ organizer_id: undefined })
    );
  });
});
