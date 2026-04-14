import { createTrip, getTripParticipant, updateParticipantRole } from '../trip.service';
import { createTripSchema, TripRole } from '@/types/trip.types';
import type { TripParticipant } from '@/types';

// Mock the supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: { getSession: jest.fn() },
  },
}));

import { supabase } from '@/lib/supabase';
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockTrip = {
  id: 'trip-1',
  name: 'Norway Hike',
  description: 'A trip through the fjords',
  start_date: null,
  end_date: null,
  banner_image_url: null,
  event_permission: null,
  organizer_id: 'user-organizer',
  created_at: '2026-04-09T00:00:00Z',
};

const mockOrganizer: TripParticipant = {
  id: 'participant-1',
  trip_id: 'trip-1',
  user_id: 'user-organizer',
  role: TripRole.Organizer,
  created_at: '2026-04-01T00:00:00Z',
};

const mockCoOrganizer: TripParticipant = {
  id: 'participant-2',
  trip_id: 'trip-1',
  user_id: 'user-co',
  role: TripRole.CoOrganizer,
  created_at: '2026-04-01T00:00:00Z',
};

const mockParticipantUser: TripParticipant = {
  id: 'participant-3',
  trip_id: 'trip-1',
  user_id: 'user-participant',
  role: TripRole.Participant,
  created_at: '2026-04-01T00:00:00Z',
};

const mockNullRoleUser: TripParticipant = {
  id: 'participant-4',
  trip_id: 'trip-1',
  user_id: 'user-null',
  role: null,
  created_at: '2026-04-01T00:00:00Z',
};

// ---------------------------------------------------------------------------
// Mock chain helpers
// ---------------------------------------------------------------------------

/**
 * Mocks the chain: .select('*').eq(...).eq(...).single()
 * Used by getTripParticipant.
 */
function mockFetch(data: TripParticipant | null, error: object | null = null) {
  const single = jest.fn().mockResolvedValue({ data, error });
  const eq2 = jest.fn().mockReturnValue({ single });
  const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
  const select = jest.fn().mockReturnValue({ eq: eq1 });
  return { select } as any;
}

/**
 * Mocks the chain: .update({...}).eq(...).select().single()
 * Used by the role update query in updateParticipantRole.
 * Returns the `update` mock so callers can assert on call args.
 */
function mockUpdateChain(data: TripParticipant | null, error: object | null = null) {
  const single = jest.fn().mockResolvedValue({ data, error });
  const selectFn = jest.fn().mockReturnValue({ single });
  const eq = jest.fn().mockReturnValue({ select: selectFn });
  const update = jest.fn().mockReturnValue({ eq });
  return { fromReturn: { update } as any, update };
}

/**
 * Sets up all three `from` calls for a successful updateParticipantRole:
 *   1. actor fetch
 *   2. target fetch
 *   3. role update
 */
function mockUpdateParticipantRole(
  actor: TripParticipant,
  target: TripParticipant,
  updated: TripParticipant,
) {
  const { fromReturn, update } = mockUpdateChain(updated);
  mockSupabase.from
    .mockReturnValueOnce(mockFetch(actor))
    .mockReturnValueOnce(mockFetch(target))
    .mockReturnValueOnce(fromReturn);
  return { update };
}

// ---------------------------------------------------------------------------
// Shared beforeEach
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
  (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
    data: { session: { user: { id: 'user-organizer' } } },
    error: null,
  });
});

// ---------------------------------------------------------------------------
// createTripSchema
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// createTrip
// ---------------------------------------------------------------------------

describe('createTrip', () => {
  function mockInsertSuccess(returnData: typeof mockTrip) {
    const single = jest.fn().mockResolvedValue({ data: returnData, error: null });
    const select = jest.fn().mockReturnValue({ single });
    const insert = jest.fn().mockReturnValue({ select });
    mockSupabase.from.mockReturnValue({ insert } as any);
    return { insert, select, single };
  }

  it('inserts the trip with organizer_id from the session', async () => {
    const { insert } = mockInsertSuccess(mockTrip);

    const result = await createTrip({ name: 'Norway Hike' });

    expect(mockSupabase.from).toHaveBeenCalledWith('trip');
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Norway Hike', organizer_id: 'user-organizer' })
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
    const single = jest.fn().mockResolvedValue({ data: { ...mockTrip, organizer_id: null }, error: null });
    const select = jest.fn().mockReturnValue({ single });
    const insert = jest.fn().mockReturnValue({ select });
    mockSupabase.from.mockReturnValue({ insert } as any);

    await createTrip({ name: 'Anonymous Trip' });

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ organizer_id: undefined })
    );
  });
});

// ---------------------------------------------------------------------------
// getTripParticipant
// ---------------------------------------------------------------------------

describe('getTripParticipant', () => {
  it('returns the participant row when found', async () => {
    mockSupabase.from.mockReturnValue(mockFetch(mockOrganizer));

    const result = await getTripParticipant('trip-1', 'user-organizer');

    expect(mockSupabase.from).toHaveBeenCalledWith('trip_participant');
    expect(result).toEqual(mockOrganizer);
  });

  it('throws when Supabase returns an error', async () => {
    mockSupabase.from.mockReturnValue(mockFetch(null, { message: 'not found' }));

    await expect(getTripParticipant('trip-1', 'ghost-user')).rejects.toMatchObject({
      message: 'not found',
    });
  });
});

// ---------------------------------------------------------------------------
// updateParticipantRole — organizer actor
// ---------------------------------------------------------------------------

describe('updateParticipantRole — organizer actor', () => {
  it('promotes participant → coOrganizer and calls update with the correct role', async () => {
    const updated = { ...mockParticipantUser, role: TripRole.CoOrganizer };
    const { update } = mockUpdateParticipantRole(mockOrganizer, mockParticipantUser, updated);

    await updateParticipantRole('trip-1', mockOrganizer.user_id!, mockParticipantUser.user_id!, TripRole.CoOrganizer);

    expect(update).toHaveBeenCalledWith({ role: TripRole.CoOrganizer });
  });

  it('promotes participant → organizer', async () => {
    const updated = { ...mockParticipantUser, role: TripRole.Organizer };
    const { update } = mockUpdateParticipantRole(mockOrganizer, mockParticipantUser, updated);

    await updateParticipantRole('trip-1', mockOrganizer.user_id!, mockParticipantUser.user_id!, TripRole.Organizer);

    expect(update).toHaveBeenCalledWith({ role: TripRole.Organizer });
  });

  it('demotes another organizer → participant', async () => {
    const anotherOrganizer: TripParticipant = { ...mockOrganizer, id: 'participant-99', user_id: 'user-organizer-2' };
    const updated = { ...anotherOrganizer, role: TripRole.Participant };
    const { update } = mockUpdateParticipantRole(mockOrganizer, anotherOrganizer, updated);

    await updateParticipantRole('trip-1', mockOrganizer.user_id!, anotherOrganizer.user_id!, TripRole.Participant);

    expect(update).toHaveBeenCalledWith({ role: TripRole.Participant });
  });

  it('demotes another organizer → coOrganizer', async () => {
    const anotherOrganizer: TripParticipant = { ...mockOrganizer, id: 'participant-99', user_id: 'user-organizer-2' };
    const updated = { ...anotherOrganizer, role: TripRole.CoOrganizer };
    const { update } = mockUpdateParticipantRole(mockOrganizer, anotherOrganizer, updated);

    await updateParticipantRole('trip-1', mockOrganizer.user_id!, anotherOrganizer.user_id!, TripRole.CoOrganizer);

    expect(update).toHaveBeenCalledWith({ role: TripRole.CoOrganizer });
  });

  it('returns the updated participant row', async () => {
    const updated = { ...mockParticipantUser, role: TripRole.CoOrganizer };
    mockUpdateParticipantRole(mockOrganizer, mockParticipantUser, updated);

    const result = await updateParticipantRole('trip-1', mockOrganizer.user_id!, mockParticipantUser.user_id!, TripRole.CoOrganizer);

    expect(result).toEqual(updated);
  });
});

// ---------------------------------------------------------------------------
// updateParticipantRole — coOrganizer actor
// ---------------------------------------------------------------------------

describe('updateParticipantRole — coOrganizer actor', () => {
  it('promotes participant → coOrganizer', async () => {
    const updated = { ...mockParticipantUser, role: TripRole.CoOrganizer };
    const { update } = mockUpdateParticipantRole(mockCoOrganizer, mockParticipantUser, updated);

    await updateParticipantRole('trip-1', mockCoOrganizer.user_id!, mockParticipantUser.user_id!, TripRole.CoOrganizer);

    expect(update).toHaveBeenCalledWith({ role: TripRole.CoOrganizer });
  });

  it('demotes coOrganizer → participant', async () => {
    const anotherCo: TripParticipant = { ...mockCoOrganizer, id: 'participant-99', user_id: 'user-co-2' };
    const updated = { ...anotherCo, role: TripRole.Participant };
    const { update } = mockUpdateParticipantRole(mockCoOrganizer, anotherCo, updated);

    await updateParticipantRole('trip-1', mockCoOrganizer.user_id!, anotherCo.user_id!, TripRole.Participant);

    expect(update).toHaveBeenCalledWith({ role: TripRole.Participant });
  });

  it('throws when trying to promote anyone to organizer', async () => {
    mockSupabase.from
      .mockReturnValueOnce(mockFetch(mockCoOrganizer))
      .mockReturnValueOnce(mockFetch(mockParticipantUser));

    await expect(
      updateParticipantRole('trip-1', mockCoOrganizer.user_id!, mockParticipantUser.user_id!, TripRole.Organizer)
    ).rejects.toThrow('Co-organizers cannot promote to organizer.');
  });

  it('throws when trying to demote an organizer', async () => {
    mockSupabase.from
      .mockReturnValueOnce(mockFetch(mockCoOrganizer))
      .mockReturnValueOnce(mockFetch(mockOrganizer));

    await expect(
      updateParticipantRole('trip-1', mockCoOrganizer.user_id!, mockOrganizer.user_id!, TripRole.Participant)
    ).rejects.toThrow("Co-organizers cannot change an organizer's role.");
  });
});

// ---------------------------------------------------------------------------
// updateParticipantRole — participant actor
// ---------------------------------------------------------------------------

describe('updateParticipantRole — participant actor', () => {
  it('throws regardless of the target role or new role', async () => {
    mockSupabase.from
      .mockReturnValueOnce(mockFetch(mockParticipantUser))
      .mockReturnValueOnce(mockFetch(mockCoOrganizer));

    await expect(
      updateParticipantRole('trip-1', mockParticipantUser.user_id!, mockCoOrganizer.user_id!, TripRole.Participant)
    ).rejects.toThrow('Participants do not have permission to change roles.');
  });
});

// ---------------------------------------------------------------------------
// updateParticipantRole — null role actor
// ---------------------------------------------------------------------------

describe('updateParticipantRole — null role actor', () => {
  it('throws when actor has no role set', async () => {
    mockSupabase.from
      .mockReturnValueOnce(mockFetch(mockNullRoleUser))
      .mockReturnValueOnce(mockFetch(mockParticipantUser));

    await expect(
      updateParticipantRole('trip-1', mockNullRoleUser.user_id!, mockParticipantUser.user_id!, TripRole.CoOrganizer)
    ).rejects.toThrow('Participants do not have permission to change roles.');
  });
});

// ---------------------------------------------------------------------------
// updateParticipantRole — DB errors
// ---------------------------------------------------------------------------

describe('updateParticipantRole — DB errors', () => {
  it('throws when the actor fetch fails', async () => {
    mockSupabase.from
      .mockReturnValueOnce(mockFetch(null, { message: 'actor fetch failed' }))
      .mockReturnValueOnce(mockFetch(mockParticipantUser));

    await expect(
      updateParticipantRole('trip-1', 'user-organizer', mockParticipantUser.user_id!, TripRole.CoOrganizer)
    ).rejects.toMatchObject({ message: 'actor fetch failed' });
  });

  it('throws when the target fetch fails', async () => {
    mockSupabase.from
      .mockReturnValueOnce(mockFetch(mockOrganizer))
      .mockReturnValueOnce(mockFetch(null, { message: 'target fetch failed' }));

    await expect(
      updateParticipantRole('trip-1', mockOrganizer.user_id!, 'ghost-user', TripRole.CoOrganizer)
    ).rejects.toMatchObject({ message: 'target fetch failed' });
  });

  it('throws when the update query fails', async () => {
    const { fromReturn } = mockUpdateChain(null, { message: 'update failed' });
    mockSupabase.from
      .mockReturnValueOnce(mockFetch(mockOrganizer))
      .mockReturnValueOnce(mockFetch(mockParticipantUser))
      .mockReturnValueOnce(fromReturn);

    await expect(
      updateParticipantRole('trip-1', mockOrganizer.user_id!, mockParticipantUser.user_id!, TripRole.CoOrganizer)
    ).rejects.toMatchObject({ message: 'update failed' });
  });
});
