import { createTaskSchema, createTaskFieldSchema, TaskFieldType } from '@/types/tasks.types';

// Pure Zod schema tests — no Supabase dependency.
// Service behaviour is covered by __integration__/task.test.ts.

describe('createTaskSchema', () => {
  it('accepts a valid task with title only', () => {
    expect(
      createTaskSchema.safeParse({ title: 'Pack passport' }).success
    ).toBe(true);
  });

  it('accepts optional fields as null', () => {
    expect(
      createTaskSchema.safeParse({
        title: 'Check in',
        description: null,
        due_time: null,
      }).success
    ).toBe(true);
  });

  it('rejects empty title', () => {
    const result = createTaskSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Task title is required');
    }
  });

  it('rejects missing title', () => {
    const result = createTaskSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('createTaskFieldSchema', () => {
  it('accepts a checkbox field', () => {
    expect(
      createTaskFieldSchema.safeParse({ type: TaskFieldType.Checkbox, label: 'Packed' }).success
    ).toBe(true);
  });

  it('accepts a dropdown field', () => {
    expect(
      createTaskFieldSchema.safeParse({ type: TaskFieldType.Dropdown, label: 'Seat preference' }).success
    ).toBe(true);
  });

  it('accepts a text_input field', () => {
    expect(
      createTaskFieldSchema.safeParse({ type: TaskFieldType.TextInput, label: 'Notes' }).success
    ).toBe(true);
  });

  it('rejects empty label', () => {
    const result = createTaskFieldSchema.safeParse({ type: TaskFieldType.Checkbox, label: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Field label is required');
    }
  });

  it('rejects invalid type', () => {
    const result = createTaskFieldSchema.safeParse({ type: 'invalid', label: 'Test' });
    expect(result.success).toBe(false);
  });
});
