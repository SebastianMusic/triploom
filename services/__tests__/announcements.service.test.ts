import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
} from '@/types/announcement.types';

// Pure Zod schema tests — no Supabase dependency.
// Service behaviour is covered by __integration__/announcements.test.ts.

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
    expect(createAnnouncementSchema.safeParse({ description: 'No title here' }).success).toBe(false);
  });

  it('rejects an entirely empty object', () => {
    expect(createAnnouncementSchema.safeParse({}).success).toBe(false);
  });
});

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
