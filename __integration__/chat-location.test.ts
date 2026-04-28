/**
 * Integration tests for location message sharing in chat.
 * Runs against the real hosted Supabase database.
 */
import { getSupabaseAdmin } from '@/lib/supabase.admin';
import { supabase } from '@/lib/supabase';
import { getAllMessages, sendLocationMessage } from '@/services/chat.service';
import { createTestUser, type TestUser } from './helpers/user';

jest.setTimeout(30000);

const TEST_PW = 'integration-test-pw-123!';

async function signInAs(user: TestUser) {
  await supabase.auth.signInWithPassword({ email: user.email, password: TEST_PW });
}

describe('Location messages in chat', () => {
  let user: TestUser;
  let tripId: string;
  let chatRoomId: string;

  beforeAll(async () => {
    user = await createTestUser();

    const { data: trip, error: tripError } = await getSupabaseAdmin()
      .from('trip')
      .insert({ name: 'Location Test Trip', organizer_id: user.id })
      .select()
      .single();
    if (tripError) throw tripError;
    tripId = trip.id;

    await getSupabaseAdmin().from('trip_participant').insert({ trip_id: tripId, user_id: user.id });

    const { data: chatRoom, error: chatError } = await getSupabaseAdmin()
      .from('group_chat')
      .select()
      .eq('trip_id', tripId)
      .single();
    if (chatError) throw chatError;
    chatRoomId = chatRoom.id;

    await signInAs(user);
  });

  afterAll(async () => {
    await getSupabaseAdmin().from('trip').delete().eq('id', tripId);
    await user.cleanup();
  });

  it('sends a location message with coordinates and label', async () => {
    const result = await sendLocationMessage({
      group_chat_id: chatRoomId,
      latitude: 59.9139,
      longitude: 10.7522,
      label: 'Oslo sentrum',
    });

    expect(result.type).toBe('location');
    expect(result.content).toBeNull();
    expect(result.location).not.toBeNull();
    expect(result.location?.latitude).toBe(59.9139);
    expect(result.location?.longitude).toBe(10.7522);
    expect(result.location?.label).toBe('Oslo sentrum');
    expect(result.user_id).toBe(user.id);
  });

  it('sends a location message without a label', async () => {
    const result = await sendLocationMessage({
      group_chat_id: chatRoomId,
      latitude: 60.3913,
      longitude: 5.3221,
    });

    expect(result.type).toBe('location');
    expect(result.location?.latitude).toBe(60.3913);
    expect(result.location?.longitude).toBe(5.3221);
    expect(result.location?.label).toBeNull();
  });

  it('returns location data when fetching messages', async () => {
    const messages = await getAllMessages(chatRoomId);
    const locationMessages = messages.filter((m) => m.type === 'location');

    expect(locationMessages.length).toBeGreaterThanOrEqual(2);
    for (const msg of locationMessages) {
      expect(msg.location).not.toBeNull();
      expect(typeof msg.location?.latitude).toBe('number');
      expect(typeof msg.location?.longitude).toBe('number');
    }
  });

  it('regular text messages have type text and no location', async () => {
    const { data: textMsg, error } = await getSupabaseAdmin()
      .from('message')
      .insert({ content: 'hello', type: 'text', group_chat_id: chatRoomId, user_id: user.id })
      .select()
      .single();
    if (error) throw error;

    const messages = await getAllMessages(chatRoomId);
    const found = messages.find((m) => m.id === textMsg.id);

    expect(found?.type).toBe('text');
    expect(found?.location).toBeNull();
  });
});
