import { getProfile, updateProfile, updateSelectedTrip } from '../profile.service';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getSession: jest.fn(),
      updateUser: jest.fn(),
    },
  },
}));

import { supabase } from '@/lib/supabase';
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

const mockProfile = {
  id: 'user-1',
  user_name: 'Old Name',
  expo_push_token: null,
  profile_picture_url: 'https://example.com/old.png',
  selected_trip: 'trip-1',
};

beforeEach(() => {
  jest.clearAllMocks();
  (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
    data: { session: { user: { id: 'user-1' } } },
    error: null,
  });
  (mockSupabase.auth.updateUser as jest.Mock).mockResolvedValue({
    data: { user: { id: 'user-1' } },
    error: null,
  });
});

describe('updateSelectedTrip', () => {
  it('updates selected_trip in the profile table', async () => {
    const single = jest.fn().mockResolvedValue({
      data: { ...mockProfile, selected_trip: 'trip-2' },
      error: null,
    });
    const select = jest.fn().mockReturnValue({ single });
    const eq = jest.fn().mockReturnValue({ select });
    const update = jest.fn().mockReturnValue({ eq });

    mockSupabase.from.mockReturnValue({ update } as any);

    const result = await updateSelectedTrip('trip-2');

    expect(mockSupabase.from).toHaveBeenCalledWith('profile');
    expect(update).toHaveBeenCalledWith({ selected_trip: 'trip-2' });
    expect(eq).toHaveBeenCalledWith('id', 'user-1');
    expect(result.selected_trip).toBe('trip-2');
  });
});

describe('getProfile', () => {
  it('fetches the profile by user id', async () => {
    const single = jest.fn().mockResolvedValue({ data: mockProfile, error: null });
    const eq = jest.fn().mockReturnValue({ single });
    const select = jest.fn().mockReturnValue({ eq });

    mockSupabase.from.mockReturnValue({ select } as any);

    const result = await getProfile('user-1');

    expect(mockSupabase.from).toHaveBeenCalledWith('profile');
    expect(eq).toHaveBeenCalledWith('id', 'user-1');
    expect(result).toEqual(mockProfile);
  });
});

describe('updateProfile', () => {
  it('updates the profile table and full name metadata', async () => {
    const updatedProfile = {
      ...mockProfile,
      user_name: 'New Name',
      profile_picture_url: 'https://example.com/new.png',
    };

    const single = jest.fn().mockResolvedValue({ data: updatedProfile, error: null });
    const select = jest.fn().mockReturnValue({ single });
    const eq = jest.fn().mockReturnValue({ select });
    const update = jest.fn().mockReturnValue({ eq });

    mockSupabase.from.mockReturnValue({ update } as any);

    const result = await updateProfile('user-1', {
      user_name: '  New Name  ',
      profile_picture_url: '  https://example.com/new.png  ',
    });

    expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
      data: {
        full_name: 'New Name',
      },
    });
    expect(mockSupabase.from).toHaveBeenCalledWith('profile');
    expect(update).toHaveBeenCalledWith({
      user_name: 'New Name',
      profile_picture_url: 'https://example.com/new.png',
    });
    expect(eq).toHaveBeenCalledWith('id', 'user-1');
    expect(result).toEqual(updatedProfile);
  });

  it('returns the current profile when no profile fields change', async () => {
    const single = jest.fn().mockResolvedValue({ data: mockProfile, error: null });
    const eq = jest.fn().mockReturnValue({ single });
    const select = jest.fn().mockReturnValue({ eq });

    mockSupabase.from.mockReturnValue({ select } as any);

    const result = await updateProfile('user-1', {});

    expect(mockSupabase.auth.updateUser).not.toHaveBeenCalled();
    expect(mockSupabase.from).toHaveBeenCalledWith('profile');
    expect(result).toEqual(mockProfile);
  });

  it('throws when the profile table update fails', async () => {
    const single = jest.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } });
    const select = jest.fn().mockReturnValue({ single });
    const eq = jest.fn().mockReturnValue({ select });
    const update = jest.fn().mockReturnValue({ eq });

    mockSupabase.from.mockReturnValue({ update } as any);

    await expect(updateProfile('user-1', { user_name: 'Broken' })).rejects.toMatchObject({
      message: 'DB error',
    });
  });

  it('throws when auth metadata update fails', async () => {
    (mockSupabase.auth.updateUser as jest.Mock).mockResolvedValue({
      data: { user: null },
      error: { message: 'Auth update failed' },
    });

    await expect(updateProfile('user-1', { user_name: 'Broken' })).rejects.toMatchObject({
      message: 'Auth update failed',
    });
  });
});
