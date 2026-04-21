import { createTestUser, type TestUser } from '@/__integration__/helpers/user';
import { getSupabaseAdmin } from '@/lib/supabase.admin';
import { createTrip } from '@/services/trip.service';
import {
  getParticipatedTripCount,
  getProfile,
  getProfileImageUrl,
  updateProfile,
  updateSelectedTrip,
  uploadProfileImage,
} from '../profile.service';

jest.setTimeout(20000);

let user: TestUser;
let realFetch: typeof global.fetch;
const createdTripIds: string[] = [];

beforeAll(async () => {
  realFetch = global.fetch;
  user = await createTestUser();
});

afterAll(async () => {
  global.fetch = realFetch;
  const admin = getSupabaseAdmin();
  if (createdTripIds.length > 0) {
    await admin.from('trip_participant').delete().in('trip_id', createdTripIds);
    await admin.from('trip').delete().in('id', createdTripIds);
  }
  await user.cleanup();
});

afterEach(() => {
  global.fetch = realFetch;
});

// Mocks only fetch('file://...') calls — Supabase HTTP calls go through unchanged
function mockLocalFetch() {
  global.fetch = jest.fn().mockImplementation((url: string, options?: RequestInit) => {
    if (url.startsWith('file://')) {
      return Promise.resolve({
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
      });
    }
    return realFetch(url, options);
  });
}

// ── getProfile ────────────────────────────────────────────────────────────────

describe('getProfile', () => {
  it('fetches the profile row for an existing user', async () => {
    const profile = await getProfile(user.id);
    expect(profile).not.toBeNull();
    expect(profile?.id).toBe(user.id);
  });

  it('returns null for a non-existent user id', async () => {
    const profile = await getProfile('00000000-0000-0000-0000-000000000000');
    expect(profile).toBeNull();
  });
});

// -- getParticipatedTripCount -------------------------------------------------

describe('getParticipatedTripCount', () => {
  it('counts trip participation rows for the user', async () => {
    const startingCount = await getParticipatedTripCount(user.id);
    const firstTrip = await createTrip({ name: 'Profile Count Test 1' });
    const secondTrip = await createTrip({ name: 'Profile Count Test 2' });
    createdTripIds.push(firstTrip.id, secondTrip.id);

    const count = await getParticipatedTripCount(user.id);
    expect(count).toBe(startingCount + 2);
  });
});

// ── updateProfile ─────────────────────────────────────────────────────────────

describe('updateProfile', () => {
  it('updates user_name in the profile table', async () => {
    const result = await updateProfile(user.id, { user_name: 'Service Test User' });
    expect(result.id).toBe(user.id);
    expect(result.user_name).toBe('Service Test User');
  });

  it('updates phonenumber in the profile table', async () => {
    const result = await updateProfile(user.id, { phonenumber: '12345678' });
    expect(result.phonenumber).toBe('12345678');
  });

  it('trims whitespace from user_name', async () => {
    const result = await updateProfile(user.id, { user_name: '  Trimmed Name  ' });
    expect(result.user_name).toBe('Trimmed Name');
  });

  it('stores null when user_name is empty string', async () => {
    const result = await updateProfile(user.id, { user_name: '' });
    expect(result.user_name).toBeNull();
  });

  it('stores null when phonenumber is empty string', async () => {
    const result = await updateProfile(user.id, { phonenumber: '' });
    expect(result.phonenumber).toBeNull();
  });

  it('returns the current profile when no fields are provided', async () => {
    const result = await updateProfile(user.id, {});
    expect(result.id).toBe(user.id);
  });

  it('persists changes readable via getProfile', async () => {
    await updateProfile(user.id, { user_name: 'Persisted Name', phonenumber: '87654321' });
    const profile = await getProfile(user.id);
    expect(profile?.user_name).toBe('Persisted Name');
    expect(profile?.phonenumber).toBe('87654321');
  });
});

// ── updateSelectedTrip ────────────────────────────────────────────────────────

describe('updateSelectedTrip', () => {
  it('clears selected_trip when set to null', async () => {
    const result = await updateSelectedTrip(null);
    expect(result.id).toBe(user.id);
    expect(result.selected_trip).toBeNull();
  });
});

// ── uploadProfileImage ────────────────────────────────────────────────────────

describe('uploadProfileImage', () => {
  it('uploads the image and returns a valid UUID', async () => {
    mockLocalFetch();
    const imageId = await uploadProfileImage('file:///tmp/photo.jpg');
    expect(imageId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('fetches the local URI to read image bytes', async () => {
    mockLocalFetch();
    await uploadProfileImage('file:///tmp/photo.jpg');
    expect(global.fetch).toHaveBeenCalledWith('file:///tmp/photo.jpg');
  });

  it('deletes the previous image when a new one is uploaded', async () => {
    mockLocalFetch();
    const firstId = await uploadProfileImage('file:///tmp/photo1.jpg');
    await updateProfile(user.id, { profile_picture_url: firstId });

    const secondId = await uploadProfileImage('file:///tmp/photo2.jpg');
    expect(secondId).not.toBe(firstId);
  });
});

// ── getProfileImageUrl ────────────────────────────────────────────────────────

describe('getProfileImageUrl', () => {
  it('returns a signed URL for an uploaded image', async () => {
    mockLocalFetch();
    const imageId = await uploadProfileImage('file:///tmp/photo.jpg');
    await updateProfile(user.id, { profile_picture_url: imageId });
    global.fetch = realFetch;

    const url = await getProfileImageUrl(imageId);
    expect(url).toMatch(/^https?:\/\//);
  });
});
