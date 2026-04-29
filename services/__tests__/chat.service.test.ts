import { sendMessageSchema } from '@/types';

// Pure Zod schema tests — no Supabase dependency.
// Service behaviour is covered by __integration__/chat.test.ts.

const VALID_UUID = '123e4567-e89b-42d3-a456-556642440000';

describe('sendMessageSchema', () => {
  it('accepts valid content and group_chat_id', () => {
    const result = sendMessageSchema.safeParse({
      content: 'Hello world',
      group_chat_id: VALID_UUID,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty content', () => {
    const result = sendMessageSchema.safeParse({
      content: '',
      group_chat_id: VALID_UUID,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Message must have text or at least one image');
    }
  });

  it('rejects content over 2000 chars', () => {
    const result = sendMessageSchema.safeParse({
      content: 'a'.repeat(2001),
      group_chat_id: VALID_UUID,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid uuid for group_chat_id', () => {
    const result = sendMessageSchema.safeParse({
      content: 'Hello',
      group_chat_id: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('accepts image-only message with no content', () => {
    const result = sendMessageSchema.safeParse({
      group_chat_id: VALID_UUID,
      imageStoragePaths: ['roomid/imageid'],
    });
    expect(result.success).toBe(true);
  });

  it('accepts message with both content and images', () => {
    const result = sendMessageSchema.safeParse({
      content: 'Check this out',
      group_chat_id: VALID_UUID,
      imageStoragePaths: ['roomid/imageid'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects more than 10 images', () => {
    const result = sendMessageSchema.safeParse({
      group_chat_id: VALID_UUID,
      imageStoragePaths: Array.from({ length: 11 }, (_, i) => `roomid/image${i}`),
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty imageStoragePaths with no content', () => {
    const result = sendMessageSchema.safeParse({
      group_chat_id: VALID_UUID,
      imageStoragePaths: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Message must have text or at least one image');
    }
  });
});
