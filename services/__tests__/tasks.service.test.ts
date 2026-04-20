import { supabase } from '@/lib/supabase';
import { getTasks, createTask, updateTask, deleteTask } from '@/services/tasks.service';
import { TaskType } from '@/types/tasks.types';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const mockTask = {
  id: 'task-1',
  trip_id: 'trip-1',
  title: 'Pack passport',
  description: 'Keep it in backpack',
  type: TaskType.Checkbox,
  phase: 'Before flight',
  due_time: '2026-07-01T00:00:00Z',
  created_at: '2026-01-01T00:00:00Z',
};

describe('getTasks', () => {
  it('returns tasks for a trip', async () => {
    const order = jest.fn().mockResolvedValue({ data: [mockTask], error: null });
    const eq = jest.fn().mockReturnValue({ order });
    const select = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    const result = await getTasks('trip-1');

    expect(supabase.from).toHaveBeenCalledWith('task');
    expect(result).toEqual([mockTask]);
  });

  it('throws on error', async () => {
    const order = jest.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } });
    const eq = jest.fn().mockReturnValue({ order });
    const select = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    await expect(getTasks('trip-1')).rejects.toEqual({ message: 'DB error' });
  });
});

describe('createTask', () => {
  it('inserts task with trip_id and returns the row', async () => {
    const single = jest.fn().mockResolvedValue({ data: mockTask, error: null });
    const select = jest.fn().mockReturnValue({ single });
    const insert = jest.fn().mockReturnValue({ select });
    (supabase.from as jest.Mock).mockReturnValue({ insert });

    const result = await createTask('trip-1', {
      title: 'Pack passport',
      type: TaskType.Checkbox,
      phase: 'Before flight',
    });

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ trip_id: 'trip-1', title: 'Pack passport' })
    );
    expect(result).toEqual(mockTask);
  });

  it('throws on error', async () => {
    const single = jest.fn().mockResolvedValue({ data: null, error: { message: 'RLS error' } });
    const select = jest.fn().mockReturnValue({ single });
    const insert = jest.fn().mockReturnValue({ select });
    (supabase.from as jest.Mock).mockReturnValue({ insert });

    await expect(
      createTask('trip-1', { title: 'Test', type: TaskType.Checkbox })
    ).rejects.toEqual({ message: 'RLS error' });
  });
});

describe('updateTask', () => {
  it('updates task and returns the row', async () => {
    const updated = { ...mockTask, phase: 'During trip' };
    const single = jest.fn().mockResolvedValue({ data: updated, error: null });
    const select = jest.fn().mockReturnValue({ single });
    const eq = jest.fn().mockReturnValue({ select });
    const update = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock).mockReturnValue({ update });

    const result = await updateTask('task-1', { phase: 'During trip' });

    expect(eq).toHaveBeenCalledWith('id', 'task-1');
    expect(result.phase).toBe('During trip');
  });
});

describe('deleteTask', () => {
  it('deletes task without error', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null });
    const del = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock).mockReturnValue({ delete: del });

    await expect(deleteTask('task-1')).resolves.toBeUndefined();
    expect(eq).toHaveBeenCalledWith('id', 'task-1');
  });

  it('throws on error', async () => {
    const eq = jest.fn().mockResolvedValue({ error: { message: 'not found' } });
    const del = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock).mockReturnValue({ delete: del });

    await expect(deleteTask('task-1')).rejects.toEqual({ message: 'not found' });
  });
});

describe('createTaskSchema validation', () => {
  it('rejects empty title', () => {
    const { createTaskSchema } = require('@/types/tasks.types');
    const result = createTaskSchema.safeParse({ title: '', type: TaskType.Checkbox });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Task title is required');
    }
  });

  it('accepts valid task', () => {
    const { createTaskSchema } = require('@/types/tasks.types');
    const result = createTaskSchema.safeParse({
      title: 'Pack passport',
      type: TaskType.Checkbox,
      phase: 'Before flight',
    });
    expect(result.success).toBe(true);
  });
});
