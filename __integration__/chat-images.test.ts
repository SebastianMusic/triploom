/**
 * Integration tests for chat image sharing.
 * Runs against the real hosted Supabase database.
 *
 * Requires in .env:
 *   EXPO_PUBLIC_SUPABASE_URL
 *   EXPO_PUBLIC_SUPABASE_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 */
import { getSupabaseAdmin } from '@/lib/supabase.admin';
import { supabase } from '@/lib/supabase';
import {
  uploadChatImage,
  deleteUploadedImages,
  sendMessage,
  getAllMessages,
  deleteMessage,
} from '@/services/chat.service';
import { createTestUser, TEST_PASSWORD, type TestUser } from './helpers/user';

jest.setTimeout(60000);

async function signInAs(user: TestUser) {
  await supabase.auth.signInWithPassword({ email: user.email, password: TEST_PASSWORD });
}

describe('Chat Image Sharing', () => {
  let user1: TestUser;
  let user2: TestUser;
  let nonParticipant: TestUser;
  let tripId: string;
  let groupChatId: string;

  beforeAll(async () => {
    user1 = await createTestUser();
    user2 = await createTestUser();
    nonParticipant = await createTestUser();
    await signInAs(user1);

    const { data: trip, error: tripError } = await getSupabaseAdmin()
      .from('trip')
      .insert({ name: 'Image Sharing Test Trip', organizer_id: user1.id })
      .select()
      .single();
    if (tripError) throw tripError;
    tripId = trip.id;

    // Add user1 and user2 as trip participants (triggers add them to general chat)
    const { error: p1Err } = await getSupabaseAdmin()
      .from('trip_participant')
      .insert({ trip_id: tripId, user_id: user1.id });
    if (p1Err) throw p1Err;
    const { error: p2Err } = await getSupabaseAdmin()
      .from('trip_participant')
      .insert({ trip_id: tripId, user_id: user2.id });
    if (p2Err) throw p2Err;

    // Find the general chat room
    const { data: chats, error: chatErr } = await getSupabaseAdmin()
      .from('group_chat')
      .select('id')
      .eq('trip_id', tripId)
      .is('trip_group_id', null)
      .is('event_id', null);
    if (chatErr) throw chatErr;
    groupChatId = chats![0].id;
  });

  afterAll(async () => {
    await getSupabaseAdmin().from('trip').delete().eq('id', tripId);
    await nonParticipant.cleanup();
    await user2.cleanup();
    await user1.cleanup();
  });

  // --- uploadChatImage ---

  describe('uploadChatImage', () => {
    it('uploads an image and returns a storage path', async () => {
      await signInAs(user1);
      const pngBase64 =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const binary = atob(pngBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'image/png' });

      const path = await uploadChatImage(groupChatId, { blob, mimeType: 'image/png' });

      expect(typeof path).toBe('string');
      expect(path.startsWith(groupChatId)).toBe(true);
      expect(path.split('/').length).toBe(2);

      // Clean up
      await getSupabaseAdmin().storage.from('chat_image').remove([path]);
    });
  });

  // --- sendMessage with images ---

  describe('sendMessage with images', () => {
    let uploadedPath: string;

    beforeAll(async () => {
      await signInAs(user1);
      // Pre-upload an image so sendMessage tests have a real path to use
      const pngBase64 =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const binary = atob(pngBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'image/png' });
      uploadedPath = await uploadChatImage(groupChatId, { blob, mimeType: 'image/png' });
    });

    it('inserts chat_image rows and returns signed URLs', async () => {
      await signInAs(user1);
      const msg = await sendMessage({
        content: 'Check out this photo',
        group_chat_id: groupChatId,
        imageStoragePaths: [uploadedPath],
      });

      expect(msg.images).toHaveLength(1);
      expect(msg.images[0].path).toBe(uploadedPath);
      expect(msg.images[0].url).toMatch(/^https?:\/\//);

      // Verify DB row
      const { data } = await getSupabaseAdmin()
        .from('chat_image')
        .select('*')
        .eq('message_id', msg.id);
      expect(data).toHaveLength(1);
      expect(data![0].image_url).toBe(uploadedPath);

      // Clean up
      await getSupabaseAdmin().from('message').delete().eq('id', msg.id);
    });

    it('succeeds with image-only message (no text content)', async () => {
      await signInAs(user1);
      const msg = await sendMessage({
        group_chat_id: groupChatId,
        imageStoragePaths: [uploadedPath],
      });

      expect(msg.content).toBeNull();
      expect(msg.images).toHaveLength(1);

      // Clean up
      await getSupabaseAdmin().from('message').delete().eq('id', msg.id);
    });
  });

  // --- getAllMessages returns images ---

  describe('getAllMessages', () => {
    let messageId: string;
    let storagePath: string;

    beforeAll(async () => {
      await signInAs(user1);
      // Upload image and send a message with it
      const pngBase64 =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const binary = atob(pngBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'image/png' });
      storagePath = await uploadChatImage(groupChatId, { blob, mimeType: 'image/png' });
      const msg = await sendMessage({
        content: 'Photo for getAllMessages test',
        group_chat_id: groupChatId,
        imageStoragePaths: [storagePath],
      });
      messageId = msg.id;
    });

    afterAll(async () => {
      await getSupabaseAdmin().from('message').delete().eq('id', messageId);
    });

    it('returns images array populated with signed URLs', async () => {
      await signInAs(user1);
      const messages = await getAllMessages(groupChatId);
      const found = messages.find((m) => m.id === messageId);

      expect(found).toBeDefined();
      expect(found!.images).toHaveLength(1);
      expect(found!.images[0].path).toBe(storagePath);
      expect(found!.images[0].url).toMatch(/^https?:\/\//);
    });

    it('returns images: [] for text-only messages', async () => {
      await signInAs(user1);
      const messages = await getAllMessages(groupChatId);
      const textOnly = messages.filter((m) => m.id !== messageId);
      for (const msg of textOnly) {
        expect(Array.isArray(msg.images)).toBe(true);
      }
    });
  });

  // --- RLS: non-participant cannot read chat_image rows ---

  describe('RLS', () => {
    let messageId: string;
    let storagePath: string;

    beforeAll(async () => {
      await signInAs(user1);
      const pngBase64 =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const binary = atob(pngBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'image/png' });
      storagePath = await uploadChatImage(groupChatId, { blob, mimeType: 'image/png' });
      const msg = await sendMessage({
        content: 'RLS test message',
        group_chat_id: groupChatId,
        imageStoragePaths: [storagePath],
      });
      messageId = msg.id;
    });

    afterAll(async () => {
      await getSupabaseAdmin().from('message').delete().eq('id', messageId);
    });

    it('blocks non-participant from reading chat_image rows', async () => {
      await signInAs(nonParticipant);
      const { data } = await supabase
        .from('chat_image')
        .select('*')
        .eq('message_id', messageId);
      expect(data).toHaveLength(0);
    });

    it('blocks non-owner from inserting chat_image rows', async () => {
      await signInAs(user2);
      const { error } = await supabase
        .from('chat_image')
        .insert({ image_url: storagePath, message_id: messageId });
      expect(error).not.toBeNull();
    });
  });

  // --- deleteMessage cleans up images ---

  describe('deleteMessage', () => {
    describe('with images', () => {
      let messageId: string;
      let storagePath: string;

      beforeAll(async () => {
        await signInAs(user1);
        const pngBase64 =
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        const binary = atob(pngBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: 'image/png' });
        storagePath = await uploadChatImage(groupChatId, { blob, mimeType: 'image/png' });
        const msg = await sendMessage({
          content: 'Message to be deleted',
          group_chat_id: groupChatId,
          imageStoragePaths: [storagePath],
        });
        messageId = msg.id;
        await deleteMessage(messageId);
      });

      afterAll(async () => {
        await getSupabaseAdmin().from('message').delete().eq('id', messageId);
      });

      it('soft-deletes the message row', async () => {
        const { data } = await getSupabaseAdmin()
          .from('message')
          .select('content, deleted_at')
          .eq('id', messageId)
          .single();
        expect(data!.content).toBeNull();
        expect(data!.deleted_at).not.toBeNull();
      });

      it('removes chat_image rows from the database', async () => {
        const { data } = await getSupabaseAdmin()
          .from('chat_image')
          .select('*')
          .eq('message_id', messageId);
        expect(data).toHaveLength(0);
      });

      it('removes the image file from storage', async () => {
        const filename = storagePath.split('/')[1];
        const { data: files } = await getSupabaseAdmin()
          .storage.from('chat_image')
          .list(groupChatId);
        const found = (files ?? []).find((f) => f.name === filename);
        expect(found).toBeUndefined();
      });
    });

    describe('without images', () => {
      let messageId: string;

      beforeAll(async () => {
        await signInAs(user1);
        const msg = await sendMessage({
          content: 'Text-only message to be deleted',
          group_chat_id: groupChatId,
        });
        messageId = msg.id;
      });

      afterAll(async () => {
        await getSupabaseAdmin().from('message').delete().eq('id', messageId);
      });

      it('soft-deletes the message without errors', async () => {
        await signInAs(user1);
        const result = await deleteMessage(messageId);
        expect(result.deleted_at).not.toBeNull();
        expect(result.content).toBeNull();
      });
    });
  });

  // --- deleteUploadedImages ---

  describe('deleteUploadedImages', () => {
    it('removes uploaded files from storage without throwing', async () => {
      await signInAs(user1);
      const pngBase64 =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const binary = atob(pngBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'image/png' });
      const path = await uploadChatImage(groupChatId, { blob, mimeType: 'image/png' });

      await expect(deleteUploadedImages([path])).resolves.toBeUndefined();
    });

    it('does not throw for non-existent paths', async () => {
      await signInAs(user1);
      await expect(deleteUploadedImages([`${groupChatId}/does-not-exist`])).resolves.toBeUndefined();
    });
  });
});
