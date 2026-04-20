import { createTestUser, type TestUser } from '@/__integration__/helpers/user';
import { getSupabaseAdmin } from '@/lib/supabase.admin';
import {
  createEvent,
  deleteEvent,
  getEvent,
  getEventBannerUrl,
  getEvents,
  registerForEvent,
  unregisterFromEvent,
  updateEvent,
  uploadEventBanner,
} from '../events.service';

jest.setTimeout(20000);

let user: TestUser;
let realFetch: typeof global.fetch;

let tripId: string;
let participantId: string;
const createdEventIds: string[] = [];

function baseEvent() {
  return {
    title: 'Test Event',
    description: 'A test description',
    location: 'Test Location',
    start_time: new Date(Date.now() + 3600_000).toISOString(),
    end_time: new Date(Date.now() + 7200_000).toISOString(),
    trip_id: tripId,
    created_by_id: participantId,
    price_range: null,
    is_optional: null,
    banner_image_url: null,
  };
}

beforeAll(async () => {
  realFetch = global.fetch;
  user = await createTestUser();

  const admin = getSupabaseAdmin();

  // Create a trip owned by the test user
  const { data: trip, error: tripError } = await admin
    .from('trip')
    .insert({ name: 'Test Trip', organizer_id: user.id })
    .select()
    .single();
  if (tripError) throw new Error(`Failed to create test trip: ${tripError.message}`);
  tripId = trip.id;

  // Create a trip_participant for the test user
  const { data: participant, error: partError } = await admin
    .from('trip_participant')
    .insert({ trip_id: tripId, user_id: user.id, role: 'organizer' })
    .select()
    .single();
  if (partError) throw new Error(`Failed to create trip_participant: ${partError.message}`);
  participantId = participant.id;
});

afterAll(async () => {
  global.fetch = realFetch;
  const admin = getSupabaseAdmin();

  // Clean up events
  if (createdEventIds.length > 0) {
    await admin.from('event').delete().in('id', createdEventIds);
  }
  await admin.from('trip_participant').delete().eq('id', participantId);
  await admin.from('trip').delete().eq('id', tripId);
  await user.cleanup();
});

afterEach(() => {
  global.fetch = realFetch;
});

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

// ── createEvent ───────────────────────────────────────────────────────────────

describe('createEvent', () => {
  it('inserts a new event and returns it with an id', async () => {
    const event = await createEvent(baseEvent());
    createdEventIds.push(event.id);

    expect(event.id).toBeDefined();
    expect(event.title).toBe('Test Event');
    expect(event.trip_id).toBe(tripId);
  });

  it('stores is_optional correctly', async () => {
    const event = await createEvent({ ...baseEvent(), is_optional: false });
    createdEventIds.push(event.id);
    expect(event.is_optional).toBe(false);
  });

  it('stores banner_image_url when provided', async () => {
    const event = await createEvent({ ...baseEvent(), banner_image_url: 'some/path' });
    createdEventIds.push(event.id);
    expect(event.banner_image_url).toBe('some/path');
  });
});

// ── getEvent ──────────────────────────────────────────────────────────────────

describe('getEvent', () => {
  it('fetches a single event by id', async () => {
    const created = await createEvent(baseEvent());
    createdEventIds.push(created.id);

    const fetched = await getEvent(created.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.id).toBe(created.id);
    expect(fetched?.title).toBe('Test Event');
  });

  it('returns null for a non-existent id', async () => {
    const result = await getEvent('00000000-0000-0000-0000-000000000000');
    expect(result).toBeNull();
  });
});

// ── getEvents ─────────────────────────────────────────────────────────────────

describe('getEvents', () => {
  it('returns only future events (end_time >= now)', async () => {
    // Insert a past event via admin to bypass RLS on insert
    const { data: pastEvent } = await getSupabaseAdmin()
      .from('event')
      .insert({
        ...baseEvent(),
        title: 'Past Event',
        start_time: new Date(Date.now() - 7200_000).toISOString(),
        end_time: new Date(Date.now() - 3600_000).toISOString(),
      })
      .select()
      .single();
    if (pastEvent) createdEventIds.push(pastEvent.id);

    const futureEvent = await createEvent({ ...baseEvent(), title: 'Future Event' });
    createdEventIds.push(futureEvent.id);

    const events = await getEvents(tripId);
    const titles = events.map((e) => e.title);
    expect(titles).toContain('Future Event');
    expect(titles).not.toContain('Past Event');
  });

  it('orders results by start_time ascending', async () => {
    const later = await createEvent({
      ...baseEvent(),
      title: 'Later Event',
      start_time: new Date(Date.now() + 10_000_000).toISOString(),
      end_time: new Date(Date.now() + 11_000_000).toISOString(),
    });
    createdEventIds.push(later.id);

    const sooner = await createEvent({
      ...baseEvent(),
      title: 'Sooner Event',
      start_time: new Date(Date.now() + 5_000_000).toISOString(),
      end_time: new Date(Date.now() + 6_000_000).toISOString(),
    });
    createdEventIds.push(sooner.id);

    const events = await getEvents(tripId);
    const idx = (title: string) => events.findIndex((e) => e.title === title);
    expect(idx('Sooner Event')).toBeLessThan(idx('Later Event'));
  });

  it('includes event_participation count array', async () => {
    const event = await createEvent(baseEvent());
    createdEventIds.push(event.id);

    const events = await getEvents(tripId);
    const found = events.find((e) => e.id === event.id);
    expect(found).toBeDefined();
    expect(Array.isArray(found?.event_participation)).toBe(true);
  });
});

// ── updateEvent ───────────────────────────────────────────────────────────────

describe('updateEvent', () => {
  it('updates text fields', async () => {
    const event = await createEvent(baseEvent());
    createdEventIds.push(event.id);

    const updated = await updateEvent(event.id, {
      title: 'Updated Title',
      description: 'Updated Description',
      location: 'Updated Location',
    });
    expect(updated.title).toBe('Updated Title');
    expect(updated.description).toBe('Updated Description');
    expect(updated.location).toBe('Updated Location');
  });

  it('updates is_optional flag', async () => {
    const event = await createEvent({ ...baseEvent(), is_optional: null });
    createdEventIds.push(event.id);

    const updated = await updateEvent(event.id, { is_optional: false });
    expect(updated.is_optional).toBe(false);

    const restored = await updateEvent(event.id, { is_optional: true });
    expect(restored.is_optional).toBe(true);
  });

  it('updates price_range', async () => {
    const event = await createEvent(baseEvent());
    createdEventIds.push(event.id);

    const updated = await updateEvent(event.id, { price_range: '100–200 kr' });
    expect(updated.price_range).toBe('100–200 kr');
  });

  it('persists changes readable via getEvent', async () => {
    const event = await createEvent(baseEvent());
    createdEventIds.push(event.id);

    await updateEvent(event.id, { title: 'Persisted Title' });
    const fetched = await getEvent(event.id);
    expect(fetched?.title).toBe('Persisted Title');
  });
});

// ── deleteEvent ───────────────────────────────────────────────────────────────

describe('deleteEvent', () => {
  it('removes the event from the database', async () => {
    const event = await createEvent(baseEvent());

    await deleteEvent(event.id);

    const fetched = await getEvent(event.id);
    expect(fetched).toBeNull();
  });
});

// ── uploadEventBanner ─────────────────────────────────────────────────────────

describe('uploadEventBanner', () => {
  it('uploads a banner and returns a storage path', async () => {
    mockLocalFetch();
    const path = await uploadEventBanner('file:///tmp/banner.jpg', participantId);
    expect(path).toMatch(new RegExp(`^${participantId}/`));
  });

  it('fetches the local URI to read image bytes', async () => {
    mockLocalFetch();
    await uploadEventBanner('file:///tmp/banner.jpg', participantId);
    expect(global.fetch).toHaveBeenCalledWith('file:///tmp/banner.jpg');
  });

  it('each upload returns a unique path', async () => {
    mockLocalFetch();
    const first = await uploadEventBanner('file:///tmp/banner1.jpg', participantId);
    const second = await uploadEventBanner('file:///tmp/banner2.jpg', participantId);
    expect(first).not.toBe(second);
  });

  it('stores the returned path on the event and retrieves it via getEvent', async () => {
    mockLocalFetch();
    const path = await uploadEventBanner('file:///tmp/banner.jpg', participantId);
    global.fetch = realFetch;

    const event = await createEvent({ ...baseEvent(), banner_image_url: path });
    createdEventIds.push(event.id);

    const fetched = await getEvent(event.id);
    expect(fetched?.banner_image_url).toBe(path);
  });
});

// ── getEventBannerUrl ─────────────────────────────────────────────────────────

describe('getEventBannerUrl', () => {
  it('returns a signed HTTPS URL for an uploaded banner', async () => {
    mockLocalFetch();
    const path = await uploadEventBanner('file:///tmp/banner.jpg', participantId);
    global.fetch = realFetch;

    const url = await getEventBannerUrl(path);
    expect(url).toMatch(/^https?:\/\//);
  });

  it('returns null for a non-existent path', async () => {
    const url = await getEventBannerUrl('nonexistent/00000000-path');
    expect(url).toBeNull();
  });
});

// ── registerForEvent / unregisterFromEvent ────────────────────────────────────

describe('registerForEvent and unregisterFromEvent', () => {
  it('registers a participant for an event', async () => {
    const event = await createEvent(baseEvent());
    createdEventIds.push(event.id);

    await registerForEvent(event.id, participantId);

    const events = await getEvents(tripId);
    const found = events.find((e) => e.id === event.id);
    expect(found?.event_participation.some((p) => p.participant_id === participantId)).toBe(true);
  });

  it('unregisters a participant from an event', async () => {
    const event = await createEvent(baseEvent());
    createdEventIds.push(event.id);

    await registerForEvent(event.id, participantId);
    await unregisterFromEvent(event.id, participantId);

    const events = await getEvents(tripId);
    const found = events.find((e) => e.id === event.id);
    expect(found?.event_participation.some((p) => p.participant_id === participantId)).toBe(false);
  });

  it('does not throw when unregistering a participant who is not registered', async () => {
    const event = await createEvent(baseEvent());
    createdEventIds.push(event.id);

    await expect(unregisterFromEvent(event.id, participantId)).resolves.not.toThrow();
  });
});
