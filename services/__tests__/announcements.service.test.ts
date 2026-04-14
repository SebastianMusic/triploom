import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
} from '../announcements.service';
import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
} from '@/types/announcement.types';
import { TripRole } from '@/types/trip.types';
import type { Announcement, TripParticipant } from '@/types';

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

const mockParticipant: TripParticipant = {
  id: 'participant-3',
  trip_id: 'trip-1',
  user_id: 'user-participant',
  role: TripRole.Participant,
  created_at: '2026-04-01T00:00:00Z',
};

const mockNullRoleParticipant: TripParticipant = {
  id: 'participant-4',
  trip_id: 'trip-1',
  user_id: 'user-null-role',
  role: null,
  created_at: '2026-04-01T00:00:00Z',
};

const mockAnnouncement: Announcement = {
  id: 'ann-1',
  trip_id: 'trip-1',
  participant_id: 'participant-1',
  title: 'Pack light',
  description: 'We have limited luggage space.',
  created_at: '2026-04-10T10:00:00Z',
};

// ---------------------------------------------------------------------------
// Mock chain helpers
// ---------------------------------------------------------------------------

/**
 * Mocks: .select('*').eq(trip_id).eq(user_id).single()
 * Used by the internal getParticipant helper.
 */
function mockParticipantFetch(data: TripParticipant | null, error: object | null = null) {
  const single = jest.fn().mockResolvedValue({ data, error });
  const eq2 = jest.fn().mockReturnValue({ single });
  const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
  const select = jest.fn().mockReturnValue({ eq: eq1 });
  return { select } as any;
}

/**
 * Mocks: .select('*').eq('trip_id', ...).order(...)
 * Used by getAnnouncements.
 */
function mockGetAnnouncementsChain(data: Announcement[], error: object | null = null) {
  const order = jest.fn().mockResolvedValue({ data, error });
  const eq = jest.fn().mockReturnValue({ order });
  const select = jest.fn().mockReturnValue({ eq });
  return { fromReturn: { select } as any, order, eq };
}

/**
 * Mocks: .insert({...}).select().single()
 * Used by createAnnouncement.
 */
function mockInsertChain(data: Announcement | null, error: object | null = null) {
  const single = jest.fn().mockResolvedValue({ data, error });
  const select = jest.fn().mockReturnValue({ single });
  const insert = jest.fn().mockReturnValue({ select });
  return { fromReturn: { insert } as any, insert };
}

/**
 * Mocks: .update({...}).eq('id', ...).eq('trip_id', ...).select().single()
 * Used by updateAnnouncement.
 */
function mockUpdateChain(data: Announcement | null, error: object | null = null) {
  const single = jest.fn().mockResolvedValue({ data, error });
  const select = jest.fn().mockReturnValue({ single });
  const eq2 = jest.fn().mockReturnValue({ select });
  const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
  const update = jest.fn().mockReturnValue({ eq: eq1 });
  return { fromReturn: { update } as any, update };
}

// ---------------------------------------------------------------------------
// Shared beforeEach — default to an authenticated organizer session
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
  (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
    data: { session: { user: { id: 'user-organizer' } } },
    error: null,
  });
});

// ---------------------------------------------------------------------------
// createAnnouncementSchema
// ---------------------------------------------------------------------------

describe('createAnnouncementSchema', () => {
  it('accepts a valid payload with title only', () => {
    expect(createAnnouncementSchema.safeParse({ title: 'Hello' }).success).toBe(true);
  });

  it('accepts a valid payload with title and description', () => {
    expect(
      createAnnouncementSchema.safeParse({ title: 'Hello', description: 'Details here' }).success
    ).toBe(true);
  });

  it('accepts null description', () => {
    expect(
      createAnnouncementSchema.safeParse({ title: 'Hello', description: null }).success
    ).toBe(true);
  });

  it('rejects an empty title', () => {
    const result = createAnnouncementSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Title is required');
    }
  });

  it('rejects a missing title', () => {
    const result = createAnnouncementSchema.safeParse({ description: 'No title here' });
    expect(result.success).toBe(false);
  });

  it('rejects an entirely empty object', () => {
    expect(createAnnouncementSchema.safeParse({}).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// updateAnnouncementSchema
// ---------------------------------------------------------------------------

describe('updateAnnouncementSchema', () => {
  it('accepts an empty object (all fields are optional)', () => {
    expect(updateAnnouncementSchema.safeParse({}).success).toBe(true);
  });

  it('accepts title only', () => {
    expect(updateAnnouncementSchema.safeParse({ title: 'New title' }).success).toBe(true);
  });

  it('accepts description only', () => {
    expect(updateAnnouncementSchema.safeParse({ description: 'Updated desc' }).success).toBe(true);
  });

  it('accepts null description', () => {
    expect(updateAnnouncementSchema.safeParse({ description: null }).success).toBe(true);
  });

  it('accepts both title and description', () => {
    expect(
      updateAnnouncementSchema.safeParse({ title: 'T', description: 'D' }).success
    ).toBe(true);
  });

  it('rejects an empty string title when title is provided', () => {
    const result = updateAnnouncementSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Title is required');
    }
  });
});

// ---------------------------------------------------------------------------
// getAnnouncements
// ---------------------------------------------------------------------------

describe('getAnnouncements', () => {
  it('returns the announcements array for a trip', async () => {
    const { fromReturn } = mockGetAnnouncementsChain([mockAnnouncement]);
    mockSupabase.from.mockReturnValue(fromReturn);

    const result = await getAnnouncements('trip-1');

    expect(mockSupabase.from).toHaveBeenCalledWith('announcement');
    expect(result).toEqual([mockAnnouncement]);
  });

  it('returns an empty array when no announcements exist', async () => {
    const { fromReturn } = mockGetAnnouncementsChain([]);
    mockSupabase.from.mockReturnValue(fromReturn);

    const result = await getAnnouncements('trip-1');

    expect(result).toEqual([]);
  });

  it('filters by the correct trip_id', async () => {
    const { fromReturn, eq } = mockGetAnnouncementsChain([]);
    mockSupabase.from.mockReturnValue(fromReturn);

    await getAnnouncements('trip-99');

    expect(eq).toHaveBeenCalledWith('trip_id', 'trip-99');
  });

  it('orders results by created_at descending', async () => {
    const { fromReturn, order } = mockGetAnnouncementsChain([mockAnnouncement]);
    mockSupabase.from.mockReturnValue(fromReturn);

    await getAnnouncements('trip-1');

    expect(order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('throws when Supabase returns an error', async () => {
    const { fromReturn } = mockGetAnnouncementsChain([], { message: 'DB error' });
    mockSupabase.from.mockReturnValue(fromReturn);

    await expect(getAnnouncements('trip-1')).rejects.toMatchObject({ message: 'DB error' });
  });
});

// ---------------------------------------------------------------------------
// createAnnouncement — success cases
// ---------------------------------------------------------------------------

describe('createAnnouncement — success', () => {
  it('organizer can create an announcement', async () => {
    const { fromReturn } = mockInsertChain(mockAnnouncement);
    mockSupabase.from
      .mockReturnValueOnce(mockParticipantFetch(mockOrganizer))
      .mockReturnValueOnce(fromReturn);

    const result = await createAnnouncement('trip-1', { title: 'Pack light' });

    expect(result).toEqual(mockAnnouncement);
  });

  it('coOrganizer can create an announcement', async () => {
    (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { user: { id: 'user-co' } } },
      error: null,
    });

    const { fromReturn } = mockInsertChain(mockAnnouncement);
    mockSupabase.from
      .mockReturnValueOnce(mockParticipantFetch(mockCoOrganizer))
      .mockReturnValueOnce(fromReturn);

    const result = await createAnnouncement('trip-1', { title: 'Pack light' });

    expect(result).toEqual(mockAnnouncement);
  });

  it('inserts with the correct trip_id and participant_id', async () => {
    const { fromReturn, insert } = mockInsertChain(mockAnnouncement);
    mockSupabase.from
      .mockReturnValueOnce(mockParticipantFetch(mockOrganizer))
      .mockReturnValueOnce(fromReturn);

    await createAnnouncement('trip-1', { title: 'Pack light', description: 'Keep it under 10kg' });

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Pack light',
        description: 'Keep it under 10kg',
        trip_id: 'trip-1',
        participant_id: mockOrganizer.id,
      })
    );
  });

  it('returns the created announcement row', async () => {
    const { fromReturn } = mockInsertChain(mockAnnouncement);
    mockSupabase.from
      .mockReturnValueOnce(mockParticipantFetch(mockOrganizer))
      .mockReturnValueOnce(fromReturn);

    const result = await createAnnouncement('trip-1', { title: 'Pack light' });

    expect(result.id).toBe('ann-1');
    expect(result.trip_id).toBe('trip-1');
  });
});

// ---------------------------------------------------------------------------
// createAnnouncement — role enforcement
// ---------------------------------------------------------------------------

describe('createAnnouncement — role enforcement', () => {
  it('throws when the user is a plain participant', async () => {
    (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { user: { id: 'user-participant' } } },
      error: null,
    });
    mockSupabase.from.mockReturnValueOnce(mockParticipantFetch(mockParticipant));

    await expect(
      createAnnouncement('trip-1', { title: 'Hello' })
    ).rejects.toThrow('Only organizers and co-organizers can manage announcements.');
  });

  it('throws when the user has a null role', async () => {
    (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { user: { id: 'user-null-role' } } },
      error: null,
    });
    mockSupabase.from.mockReturnValueOnce(mockParticipantFetch(mockNullRoleParticipant));

    await expect(
      createAnnouncement('trip-1', { title: 'Hello' })
    ).rejects.toThrow('Only organizers and co-organizers can manage announcements.');
  });

  it('throws when the user is not authenticated', async () => {
    (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    await expect(
      createAnnouncement('trip-1', { title: 'Hello' })
    ).rejects.toThrow('Not authenticated.');
  });
});

// ---------------------------------------------------------------------------
// createAnnouncement — DB errors
// ---------------------------------------------------------------------------

describe('createAnnouncement — DB errors', () => {
  it('throws when the participant fetch fails', async () => {
    mockSupabase.from.mockReturnValueOnce(
      mockParticipantFetch(null, { message: 'participant not found' })
    );

    await expect(
      createAnnouncement('trip-1', { title: 'Hello' })
    ).rejects.toMatchObject({ message: 'participant not found' });
  });

  it('throws when the insert fails', async () => {
    const { fromReturn } = mockInsertChain(null, { message: 'insert failed' });
    mockSupabase.from
      .mockReturnValueOnce(mockParticipantFetch(mockOrganizer))
      .mockReturnValueOnce(fromReturn);

    await expect(
      createAnnouncement('trip-1', { title: 'Hello' })
    ).rejects.toMatchObject({ message: 'insert failed' });
  });
});

// ---------------------------------------------------------------------------
// updateAnnouncement — success cases
// ---------------------------------------------------------------------------

describe('updateAnnouncement — success', () => {
  it('organizer can update an announcement', async () => {
    const updated = { ...mockAnnouncement, title: 'Updated title' };
    const { fromReturn } = mockUpdateChain(updated);
    mockSupabase.from
      .mockReturnValueOnce(mockParticipantFetch(mockOrganizer))
      .mockReturnValueOnce(fromReturn);

    const result = await updateAnnouncement('trip-1', 'ann-1', { title: 'Updated title' });

    expect(result).toEqual(updated);
  });

  it('coOrganizer can update an announcement', async () => {
    (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { user: { id: 'user-co' } } },
      error: null,
    });

    const updated = { ...mockAnnouncement, title: 'Co update' };
    const { fromReturn } = mockUpdateChain(updated);
    mockSupabase.from
      .mockReturnValueOnce(mockParticipantFetch(mockCoOrganizer))
      .mockReturnValueOnce(fromReturn);

    const result = await updateAnnouncement('trip-1', 'ann-1', { title: 'Co update' });

    expect(result).toEqual(updated);
  });

  it('passes the correct DTO fields to the update query', async () => {
    const { fromReturn, update } = mockUpdateChain(mockAnnouncement);
    mockSupabase.from
      .mockReturnValueOnce(mockParticipantFetch(mockOrganizer))
      .mockReturnValueOnce(fromReturn);

    await updateAnnouncement('trip-1', 'ann-1', { title: 'New', description: 'New desc' });

    expect(update).toHaveBeenCalledWith({ title: 'New', description: 'New desc' });
  });

  it('scopes the update to the given announcement id', async () => {
    const { fromReturn, update } = mockUpdateChain(mockAnnouncement);
    const eq1 = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockAnnouncement, error: null }),
        }),
      }),
    });
    const scopedUpdate = jest.fn().mockReturnValue({ eq: eq1 });
    mockSupabase.from
      .mockReturnValueOnce(mockParticipantFetch(mockOrganizer))
      .mockReturnValueOnce({ update: scopedUpdate } as any);

    await updateAnnouncement('trip-1', 'ann-1', { title: 'x' });

    expect(eq1).toHaveBeenCalledWith('id', 'ann-1');
  });

  it('scopes the update to the correct trip_id', async () => {
    const single = jest.fn().mockResolvedValue({ data: mockAnnouncement, error: null });
    const select = jest.fn().mockReturnValue({ single });
    const eq2 = jest.fn().mockReturnValue({ select });
    const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
    const update = jest.fn().mockReturnValue({ eq: eq1 });

    mockSupabase.from
      .mockReturnValueOnce(mockParticipantFetch(mockOrganizer))
      .mockReturnValueOnce({ update } as any);

    await updateAnnouncement('trip-1', 'ann-1', { title: 'x' });

    expect(eq2).toHaveBeenCalledWith('trip_id', 'trip-1');
  });

  it('returns the updated announcement row', async () => {
    const updated = { ...mockAnnouncement, description: null };
    const { fromReturn } = mockUpdateChain(updated);
    mockSupabase.from
      .mockReturnValueOnce(mockParticipantFetch(mockOrganizer))
      .mockReturnValueOnce(fromReturn);

    const result = await updateAnnouncement('trip-1', 'ann-1', { description: null });

    expect(result.description).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// updateAnnouncement — role enforcement
// ---------------------------------------------------------------------------

describe('updateAnnouncement — role enforcement', () => {
  it('throws when the user is a plain participant', async () => {
    (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { user: { id: 'user-participant' } } },
      error: null,
    });
    mockSupabase.from.mockReturnValueOnce(mockParticipantFetch(mockParticipant));

    await expect(
      updateAnnouncement('trip-1', 'ann-1', { title: 'No' })
    ).rejects.toThrow('Only organizers and co-organizers can manage announcements.');
  });

  it('throws when the user has a null role', async () => {
    (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { user: { id: 'user-null-role' } } },
      error: null,
    });
    mockSupabase.from.mockReturnValueOnce(mockParticipantFetch(mockNullRoleParticipant));

    await expect(
      updateAnnouncement('trip-1', 'ann-1', { title: 'No' })
    ).rejects.toThrow('Only organizers and co-organizers can manage announcements.');
  });

  it('throws when the user is not authenticated', async () => {
    (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    await expect(
      updateAnnouncement('trip-1', 'ann-1', { title: 'No' })
    ).rejects.toThrow('Not authenticated.');
  });
});

// ---------------------------------------------------------------------------
// updateAnnouncement — DB errors
// ---------------------------------------------------------------------------

describe('updateAnnouncement — DB errors', () => {
  it('throws when the participant fetch fails', async () => {
    mockSupabase.from.mockReturnValueOnce(
      mockParticipantFetch(null, { message: 'participant not found' })
    );

    await expect(
      updateAnnouncement('trip-1', 'ann-1', { title: 'Hello' })
    ).rejects.toMatchObject({ message: 'participant not found' });
  });

  it('throws when the update query fails', async () => {
    const { fromReturn } = mockUpdateChain(null, { message: 'update failed' });
    mockSupabase.from
      .mockReturnValueOnce(mockParticipantFetch(mockOrganizer))
      .mockReturnValueOnce(fromReturn);

    await expect(
      updateAnnouncement('trip-1', 'ann-1', { title: 'Hello' })
    ).rejects.toMatchObject({ message: 'update failed' });
  });
});
