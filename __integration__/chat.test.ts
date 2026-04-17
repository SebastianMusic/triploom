/**
 * Integration tests for the chat system.
 * Runs against the real hosted Supabase database.
 *
 * Requires in .env:
 *   EXPO_PUBLIC_SUPABASE_URL
 *   EXPO_PUBLIC_SUPABASE_KEY
 *   SUPABASE_SERVICE_ROLE_KEY  (or SUPABASE_SECRET_KEY)
 */
import { getSupabaseAdmin } from '@/lib/supabase.admin';
import { supabase } from '@/lib/supabase';
import {
  getAllChatRooms,
  getAllMessages,
  sendMessage,
  subscribeToMessages,
  markChatRead,
} from '@/services/chat.service';
import { createTestUser, type TestUser } from './helpers/user';

jest.setTimeout(30000);

const TEST_PW = 'integration-test-pw-123!';

async function signInAs(user: TestUser) {
  await supabase.auth.signInWithPassword({ email: user.email, password: TEST_PW });
}

// --- US1: Trip Global Chat ---

describe('US1: Global chat room', () => {
  let user1: TestUser;
  let user2: TestUser;
  let tripId: string;

  beforeAll(async () => {
    user1 = await createTestUser();
    user2 = await createTestUser();
    // createTestUser signs in the last user — restore user1 session
    await signInAs(user1);

    const { data: trip, error: tripError } = await getSupabaseAdmin()
      .from('trip')
      .insert({ name: 'Chat Integration Trip', organizer_id: user1.id })
      .select()
      .single();
    if (tripError) throw tripError;
    tripId = trip.id;

    // Add user1 as trip_participant — trigger adds them to global chat_participant
    const { error: pErr } = await getSupabaseAdmin()
      .from('trip_participant')
      .insert({ trip_id: tripId, user_id: user1.id });
    if (pErr) throw pErr;
  });

  afterAll(async () => {
    await getSupabaseAdmin().from('trip').delete().eq('id', tripId);
    await user2.cleanup();
    await user1.cleanup();
  });

  it('US1-1: global chat room exists after trip INSERT (trigger fired)', async () => {
    const { data, error } = await getSupabaseAdmin()
      .from('group_chat')
      .select('*')
      .eq('trip_id', tripId)
      .is('trip_group_id', null)
      .is('event_id', null);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data![0].chat_name).toBe('General');
  });

  it('US1-2: trip_participant INSERT adds user to chat_participant (trigger fired)', async () => {
    const { data: participant } = await getSupabaseAdmin()
      .from('trip_participant')
      .select('id')
      .eq('trip_id', tripId)
      .eq('user_id', user1.id)
      .single();

    const { data: room } = await getSupabaseAdmin()
      .from('group_chat')
      .select('id')
      .eq('trip_id', tripId)
      .is('trip_group_id', null)
      .is('event_id', null)
      .single();

    const { data, error } = await getSupabaseAdmin()
      .from('chat_participant')
      .select('*')
      .eq('group_chat_id', room!.id)
      .eq('participant_id', participant!.id);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it('US1-3: getAllChatRooms returns global room for trip member', async () => {
    await signInAs(user1);
    const rooms = await getAllChatRooms(tripId);
    expect(rooms.length).toBeGreaterThan(0);
    const global = rooms.find((r) => r.chat_name === 'General');
    expect(global).toBeDefined();
    expect(global!.trip_id).toBe(tripId);
  });

  it('US1-4: non-member getAllChatRooms returns empty', async () => {
    await signInAs(user2);
    const rooms = await getAllChatRooms(tripId);
    expect(rooms).toHaveLength(0);
    await signInAs(user1);
  });

  it('US1-5: two users can send and receive in real time', async () => {
    // Add user2 as trip_participant
    await getSupabaseAdmin()
      .from('trip_participant')
      .insert({ trip_id: tripId, user_id: user2.id });

    const { data: room } = await getSupabaseAdmin()
      .from('group_chat')
      .select('id')
      .eq('trip_id', tripId)
      .is('trip_group_id', null)
      .is('event_id', null)
      .single();
    const roomId = room!.id;

    // user2 subscribes
    await signInAs(user2);
    let receivedMessage: object | null = null;
    const unsubscribe = subscribeToMessages(roomId, (msg) => {
      receivedMessage = msg;
    });

    await new Promise((r) => setTimeout(r, 2000));

    // user1 sends
    await signInAs(user1);
    await sendMessage({ content: 'Hello from user1!', group_chat_id: roomId });

    await new Promise((r) => setTimeout(r, 3000));
    unsubscribe();

    expect(receivedMessage).not.toBeNull();
  });

  it('US1-6: global chat room has chat_name === "General"', async () => {
    await signInAs(user1);
    const rooms = await getAllChatRooms(tripId);
    const global = rooms.find((r) => r.chat_name === 'General');
    expect(global).toBeDefined();
    expect(global!.chat_name).toBe('General');
  });
});

// --- US2: Send and Receive Messages ---

describe('US2: Send and receive messages', () => {
  let user1: TestUser;
  let user2: TestUser;
  let tripId: string;
  let roomId: string;

  beforeAll(async () => {
    user1 = await createTestUser();
    user2 = await createTestUser();
    // Restore user1 session after user2 creation
    await signInAs(user1);

    const { data: trip } = await getSupabaseAdmin()
      .from('trip')
      .insert({ name: 'US2 Trip', organizer_id: user1.id })
      .select()
      .single();
    tripId = trip!.id;

    await getSupabaseAdmin()
      .from('trip_participant')
      .insert({ trip_id: tripId, user_id: user1.id });
    await getSupabaseAdmin()
      .from('trip_participant')
      .insert({ trip_id: tripId, user_id: user2.id });

    const { data: room } = await getSupabaseAdmin()
      .from('group_chat')
      .select('id')
      .eq('trip_id', tripId)
      .is('trip_group_id', null)
      .is('event_id', null)
      .single();
    roomId = room!.id;
  });

  afterAll(async () => {
    await getSupabaseAdmin().from('trip').delete().eq('id', tripId);
    await user2.cleanup();
    await user1.cleanup();
  });

  it('US2-1: sent message is stored and readable by room members', async () => {
    await signInAs(user1);
    const msg = await sendMessage({ content: 'US2 test message', group_chat_id: roomId });
    expect(msg.id).toBeDefined();
    expect(msg.content).toBe('US2 test message');

    const messages = await getAllMessages(roomId, 0);
    expect(messages.some((m) => m.id === msg.id)).toBe(true);
  });

  it('US2-2: message row includes correct user_id and senderName from profile', async () => {
    await signInAs(user1);
    const msg = await sendMessage({ content: 'Sender check', group_chat_id: roomId });
    expect(msg.user_id).toBe(user1.id);
    expect(typeof msg.senderName).toBe('string');
  });

  it('US2-3: created_at is set and messages appear in chronological order', async () => {
    await signInAs(user1);
    await sendMessage({ content: 'First', group_chat_id: roomId });
    await sendMessage({ content: 'Second', group_chat_id: roomId });
    const messages = await getAllMessages(roomId, 0);
    expect(messages[0].created_at).toBeDefined();
    expect(messages.every((m) => m.created_at)).toBe(true);
  });

  it('US2-4: non-member INSERT is rejected by RLS', async () => {
    const outsider = await createTestUser();
    await signInAs(outsider);
    await expect(
      sendMessage({ content: 'Should fail', group_chat_id: roomId })
    ).rejects.toBeDefined();
    await outsider.cleanup();
    await signInAs(user1);
  });

  it('US2-5: getAllMessages page=0 returns <=50, page=1 returns older batch', async () => {
    await signInAs(user1);
    const page0 = await getAllMessages(roomId, 0);
    expect(page0.length).toBeLessThanOrEqual(50);

    const page1 = await getAllMessages(roomId, 1);
    expect(Array.isArray(page1)).toBe(true);
  });

  it('US2-6: getAllMessages with since param returns only messages after that timestamp', async () => {
    await signInAs(user1);
    const cutoff = new Date().toISOString();
    // Small delay so the next insert has a strictly later timestamp
    await new Promise((r) => setTimeout(r, 50));
    const newMsg = await sendMessage({ content: 'After cutoff', group_chat_id: roomId });

    const result = await getAllMessages(roomId, 0, cutoff);

    expect(result.some((m) => m.id === newMsg.id)).toBe(true);
    expect(result.every((m) => m.created_at > cutoff)).toBe(true);
  });

  it('US2-7: markChatRead updates last_read_at and clears has_unread', async () => {
    // Establish a read baseline for user1
    await signInAs(user1);
    await markChatRead(roomId);

    // user2 sends a new message — user1 now has unread
    await signInAs(user2);
    await sendMessage({ content: 'Unread for user1', group_chat_id: roomId });

    // user1 sees the unread indicator
    await signInAs(user1);
    const roomsBefore = await getAllChatRooms(tripId);
    const roomBefore = roomsBefore.find((r) => r.id === roomId);
    expect(roomBefore?.hasUnread).toBe(true);

    // user1 marks the room read
    await markChatRead(roomId);

    // Verify last_read_at was persisted via the admin client
    const { data: participant } = await getSupabaseAdmin()
      .from('trip_participant')
      .select('id')
      .eq('trip_id', tripId)
      .eq('user_id', user1.id)
      .single();
    const { data: cp } = await getSupabaseAdmin()
      .from('chat_participant')
      .select('last_read_at')
      .eq('group_chat_id', roomId)
      .eq('participant_id', participant!.id)
      .single();
    expect(cp?.last_read_at).not.toBeNull();

    // has_unread should now be false
    const roomsAfter = await getAllChatRooms(tripId);
    const roomAfter = roomsAfter.find((r) => r.id === roomId);
    expect(roomAfter?.hasUnread).toBe(false);
  });
});

// --- US3: Event Chat ---

describe('US3: Event chat room', () => {
  let user1: TestUser;
  let user2: TestUser;
  let tripId: string;
  let eventId: string;
  let eventRoomId: string;
  let participantId1: string;
  let participantId2: string;

  beforeAll(async () => {
    user1 = await createTestUser();
    user2 = await createTestUser();
    await signInAs(user1);

    const { data: trip } = await getSupabaseAdmin()
      .from('trip')
      .insert({ name: 'US3 Event Trip', organizer_id: user1.id })
      .select()
      .single();
    tripId = trip!.id;

    const { data: p1 } = await getSupabaseAdmin()
      .from('trip_participant')
      .insert({ trip_id: tripId, user_id: user1.id })
      .select()
      .single();
    participantId1 = p1!.id;

    const { data: p2 } = await getSupabaseAdmin()
      .from('trip_participant')
      .insert({ trip_id: tripId, user_id: user2.id })
      .select()
      .single();
    participantId2 = p2!.id;

    // created_by_id is FK to trip_participant.id — use participantId1
    const { data: event, error: eventErr } = await getSupabaseAdmin()
      .from('event')
      .insert({ trip_id: tripId, title: 'Hiking Day', created_by_id: participantId1 })
      .select()
      .single();
    if (eventErr) throw eventErr;
    eventId = event!.id;

    const { data: room } = await getSupabaseAdmin()
      .from('group_chat')
      .select('id')
      .eq('event_id', eventId)
      .single();
    eventRoomId = room!.id;

    // user1 registers for the event
    await getSupabaseAdmin()
      .from('event_participation')
      .insert({ event_id: eventId, participant_id: participantId1 });
  });

  afterAll(async () => {
    await getSupabaseAdmin().from('trip').delete().eq('id', tripId);
    await user2.cleanup();
    await user1.cleanup();
  });

  it('US3-1: event chat room exists after event INSERT (trigger on_event_created fired)', async () => {
    const { data, error } = await getSupabaseAdmin()
      .from('group_chat')
      .select('*')
      .eq('event_id', eventId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it('US3-2: event_participation INSERT adds user to event chat_participant (trigger fired)', async () => {
    const { data, error } = await getSupabaseAdmin()
      .from('chat_participant')
      .select('*')
      .eq('group_chat_id', eventRoomId)
      .eq('participant_id', participantId1);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it('US3-3: event participant can fetch and send in event chat', async () => {
    await signInAs(user1);
    const msg = await sendMessage({ content: 'Event chat message', group_chat_id: eventRoomId });
    expect(msg.content).toBe('Event chat message');
    const messages = await getAllMessages(eventRoomId, 0);
    expect(messages.some((m) => m.id === msg.id)).toBe(true);
  });

  it('US3-4: trip participant NOT registered for event is denied read and write', async () => {
    await signInAs(user2);
    const rooms = await getAllChatRooms(tripId);
    expect(rooms.some((r) => r.id === eventRoomId)).toBe(false);

    await expect(
      sendMessage({ content: 'Unauthorized', group_chat_id: eventRoomId })
    ).rejects.toBeDefined();

    await signInAs(user1);
  });

  it("US3-5: two event participants receive each other's messages in real time", async () => {
    await getSupabaseAdmin()
      .from('event_participation')
      .insert({ event_id: eventId, participant_id: participantId2 });

    await signInAs(user2);
    let received: object | null = null;
    const unsubscribe = subscribeToMessages(eventRoomId, (msg) => {
      received = msg;
    });

    await new Promise((r) => setTimeout(r, 2000));

    await signInAs(user1);
    await sendMessage({ content: 'RT event msg', group_chat_id: eventRoomId });

    await new Promise((r) => setTimeout(r, 3000));
    unsubscribe();

    expect(received).not.toBeNull();
  });

  it('US3-6: event chat room has chat_name equal to event title', async () => {
    const { data } = await getSupabaseAdmin()
      .from('group_chat')
      .select('chat_name')
      .eq('event_id', eventId)
      .single();
    expect(data!.chat_name).toBe('Hiking Day');
  });
});

// --- US4: Group Chat ---

describe('US4: Group chat room', () => {
  let user1: TestUser;
  let user2: TestUser;
  let user3: TestUser;
  let tripId: string;
  let groupId: string;
  let groupRoomId: string;
  let participantId1: string;
  let participantId2: string;
  let participantId3: string;

  beforeAll(async () => {
    user1 = await createTestUser();
    user2 = await createTestUser();
    user3 = await createTestUser();
    await signInAs(user1);

    const { data: trip } = await getSupabaseAdmin()
      .from('trip')
      .insert({ name: 'US4 Group Trip', organizer_id: user1.id })
      .select()
      .single();
    tripId = trip!.id;

    const { data: p1 } = await getSupabaseAdmin()
      .from('trip_participant')
      .insert({ trip_id: tripId, user_id: user1.id })
      .select()
      .single();
    participantId1 = p1!.id;

    const { data: p2 } = await getSupabaseAdmin()
      .from('trip_participant')
      .insert({ trip_id: tripId, user_id: user2.id })
      .select()
      .single();
    participantId2 = p2!.id;

    const { data: p3 } = await getSupabaseAdmin()
      .from('trip_participant')
      .insert({ trip_id: tripId, user_id: user3.id })
      .select()
      .single();
    participantId3 = p3!.id;

    const { data: group } = await getSupabaseAdmin()
      .from('trip_group')
      .insert({ trip_id: tripId, name: 'Team Alpha' })
      .select()
      .single();
    groupId = group!.id;

    const { data: room } = await getSupabaseAdmin()
      .from('group_chat')
      .select('id')
      .eq('trip_group_id', groupId)
      .single();
    groupRoomId = room!.id;

    await getSupabaseAdmin()
      .from('group_membership')
      .insert({ group_id: groupId, participant_id: participantId1 });
    await getSupabaseAdmin()
      .from('group_membership')
      .insert({ group_id: groupId, participant_id: participantId2 });
  });

  afterAll(async () => {
    await getSupabaseAdmin().from('trip').delete().eq('id', tripId);
    await user3.cleanup();
    await user2.cleanup();
    await user1.cleanup();
  });

  it('US4-1: group chat room exists after trip_group INSERT (trigger on_trip_group_created fired)', async () => {
    const { data, error } = await getSupabaseAdmin()
      .from('group_chat')
      .select('*')
      .eq('trip_group_id', groupId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it('US4-2: group_membership INSERT adds user to group chat_participant (trigger fired)', async () => {
    const { data, error } = await getSupabaseAdmin()
      .from('chat_participant')
      .select('*')
      .eq('group_chat_id', groupRoomId)
      .eq('participant_id', participantId1);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it('US4-3: group member can fetch and send in group chat', async () => {
    await signInAs(user1);
    const msg = await sendMessage({ content: 'Group message', group_chat_id: groupRoomId });
    expect(msg.content).toBe('Group message');
    const messages = await getAllMessages(groupRoomId, 0);
    expect(messages.some((m) => m.id === msg.id)).toBe(true);
  });

  it('US4-4: trip participant not in the group is denied access', async () => {
    await signInAs(user3);
    const rooms = await getAllChatRooms(tripId);
    expect(rooms.some((r) => r.id === groupRoomId)).toBe(false);

    await expect(
      sendMessage({ content: 'Should fail', group_chat_id: groupRoomId })
    ).rejects.toBeDefined();

    await signInAs(user1);
  });

  it('US4-5: participant in two groups sees both rooms and can independently send/receive', async () => {
    await signInAs(user1);

    const { data: group2 } = await getSupabaseAdmin()
      .from('trip_group')
      .insert({ trip_id: tripId, name: 'Team Beta' })
      .select()
      .single();

    await getSupabaseAdmin()
      .from('group_membership')
      .insert({ group_id: group2!.id, participant_id: participantId1 });

    const { data: room2 } = await getSupabaseAdmin()
      .from('group_chat')
      .select('id')
      .eq('trip_group_id', group2!.id)
      .single();

    const rooms = await getAllChatRooms(tripId);
    const roomIds = rooms.map((r) => r.id);
    expect(roomIds).toContain(groupRoomId);
    expect(roomIds).toContain(room2!.id);

    const msg1 = await sendMessage({ content: 'In group 1', group_chat_id: groupRoomId });
    const msg2 = await sendMessage({ content: 'In group 2', group_chat_id: room2!.id });
    expect(msg1.content).toBe('In group 1');
    expect(msg2.content).toBe('In group 2');
  });

  it('US4-6: group chat room has chat_name equal to group name', async () => {
    const { data } = await getSupabaseAdmin()
      .from('group_chat')
      .select('chat_name')
      .eq('trip_group_id', groupId)
      .single();
    expect(data!.chat_name).toBe('Team Alpha');
  });
});
