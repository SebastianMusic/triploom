import { getSupabaseAdmin } from '@/lib/supabase.admin';
import { createTask, deleteTask, getTasks, updateTask } from '@/services/tasks.service';
import { createTaskSchema, TaskType } from '@/types/tasks.types';
import { createTrip } from '@/services/trip.service';
import { createTestUser, type TestUser } from './helpers/user';

jest.setTimeout(15000);

let user: TestUser;
const createdTripIds: string[] = [];
const createdTaskIds: string[] = [];

beforeAll(async () => {
  user = await createTestUser();
});

afterAll(async () => {
  if (createdTaskIds.length > 0) {
    await getSupabaseAdmin().from('task').delete().in('id', createdTaskIds);
  }
  if (createdTripIds.length > 0) {
    await getSupabaseAdmin().from('trip').delete().in('id', createdTripIds);
  }
  await user.cleanup();
});

describe('tasks (integration)', () => {
  it('creates a task in the database', async () => {
    const trip = await createTrip({ name: 'Task Integration Trip' });
    createdTripIds.push(trip.id);

    const task = await createTask(trip.id, {
      title: 'Pack passport',
      description: 'Keep it in your backpack',
      type: TaskType.Checkbox,
      phase: 'Before flight',
      due_time: '2026-07-01T00:00:00Z',
    });
    createdTaskIds.push(task.id);

    expect(task.trip_id).toBe(trip.id);
    expect(task.title).toBe('Pack passport');
    expect(task.phase).toBe('Before flight');
    expect(task.type).toBe(TaskType.Checkbox);
  });

  it('fetches tasks for the selected trip only', async () => {
    const trip = await createTrip({ name: 'Task Filter Trip' });
    createdTripIds.push(trip.id);

    const task = await createTask(trip.id, {
      title: 'Check in online',
      type: TaskType.YesNo,
      phase: 'Before flight',
    });
    createdTaskIds.push(task.id);

    const tasks = await getTasks(trip.id);

    expect(tasks.some((t) => t.id === task.id)).toBe(true);
  });

  it('updates an existing task', async () => {
    const trip = await createTrip({ name: 'Task Update Trip' });
    createdTripIds.push(trip.id);

    const task = await createTask(trip.id, {
      title: 'Bring adapter',
      type: TaskType.Info,
      phase: 'Before flight',
    });
    createdTaskIds.push(task.id);

    const updatedTask = await updateTask(task.id, {
      phase: 'During trip',
      due_time: '2026-07-10T00:00:00Z',
    });

    expect(updatedTask.phase).toBe('During trip');
    expect(updatedTask.due_time).toBe('2026-07-10T00:00:00+00:00');
  });

  it('deletes a task from the database', async () => {
    const trip = await createTrip({ name: 'Task Delete Trip' });
    createdTripIds.push(trip.id);

    const task = await createTask(trip.id, {
      title: 'Cancel roaming',
      type: TaskType.Checkbox,
      phase: 'Before flight',
    });

    await deleteTask(task.id);

    const { data, error } = await getSupabaseAdmin()
      .from('task')
      .select('*')
      .eq('id', task.id)
      .maybeSingle();

    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it('rejects invalid input before the DB call', () => {
    const result = createTaskSchema.safeParse({
      title: '',
      type: TaskType.Checkbox,
      phase: 'Before flight',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Task title is required');
    }
  });
});
