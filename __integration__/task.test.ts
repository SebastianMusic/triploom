import { getSupabaseAdmin } from '@/lib/supabase.admin';
import { createTask, deleteTask, getAllTasks, updateTask, getAssignments, getAllAssignments, upsertAssignment } from '@/services/tasks.service';
import { createTaskSchema } from '@/types/tasks.types';
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
      due_time: '2026-07-01T00:00:00Z',
    });
    createdTaskIds.push(task.id);

    expect(task.trip_id).toBe(trip.id);
    expect(task.title).toBe('Pack passport');
  });

  it('fetches tasks for the selected trip only', async () => {
    const trip = await createTrip({ name: 'Task Filter Trip' });
    createdTripIds.push(trip.id);

    const task = await createTask(trip.id, { title: 'Check in online' });
    createdTaskIds.push(task.id);

    const tasks = await getAllTasks(trip.id);

    expect(tasks.some((t: { id: string }) => t.id === task.id)).toBe(true);
  });

  it('updates an existing task', async () => {
    const trip = await createTrip({ name: 'Task Update Trip' });
    createdTripIds.push(trip.id);

    const task = await createTask(trip.id, { title: 'Bring adapter' });
    createdTaskIds.push(task.id);

    const updatedTask = await updateTask(task.id, {
      due_time: '2026-07-10T00:00:00Z',
    });

    expect(updatedTask.due_time).toBe('2026-07-10T00:00:00+00:00');
  });

  it('deletes a task from the database', async () => {
    const trip = await createTrip({ name: 'Task Delete Trip' });
    createdTripIds.push(trip.id);

    const task = await createTask(trip.id, { title: 'Cancel roaming' });

    await deleteTask(task.id);

    const { data, error } = await getSupabaseAdmin()
      .from('task')
      .select('*')
      .eq('id', task.id)
      .maybeSingle();

    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it('upserts an assignment and returns the persisted row', async () => {
    const trip = await createTrip({ name: 'Assignment Upsert Trip' });
    createdTripIds.push(trip.id);

    const task = await createTask(trip.id, { title: 'Upsert task' });
    createdTaskIds.push(task.id);

    const { data: participant } = await getSupabaseAdmin()
      .from('trip_participant')
      .select('id')
      .eq('trip_id', trip.id)
      .eq('user_id', user.id)
      .single();

    const assignment = await upsertAssignment(task.id, participant!.id, { is_completed: true });

    expect(assignment.task_id).toBe(task.id);
    expect(assignment.participant_id).toBe(participant!.id);
    expect(assignment.is_completed).toBe(true);
  });

  it('getAssignments returns assignments for the current participant', async () => {
    const trip = await createTrip({ name: 'Assignment Fetch Trip' });
    createdTripIds.push(trip.id);

    const task = await createTask(trip.id, { title: 'Fetch task' });
    createdTaskIds.push(task.id);

    const { data: participant } = await getSupabaseAdmin()
      .from('trip_participant')
      .select('id')
      .eq('trip_id', trip.id)
      .eq('user_id', user.id)
      .single();

    await upsertAssignment(task.id, participant!.id, { is_completed: false });

    const assignments = await getAssignments(participant!.id, [task.id]);

    expect(assignments).toHaveLength(1);
    expect(assignments[0].task_id).toBe(task.id);
  });

  it('getAllAssignments returns assignments with participant info', async () => {
    const trip = await createTrip({ name: 'All Assignments Trip' });
    createdTripIds.push(trip.id);

    const task = await createTask(trip.id, { title: 'All assignments task' });
    createdTaskIds.push(task.id);

    const { data: participant } = await getSupabaseAdmin()
      .from('trip_participant')
      .select('id')
      .eq('trip_id', trip.id)
      .eq('user_id', user.id)
      .single();

    await upsertAssignment(task.id, participant!.id, { is_completed: true });

    const all = await getAllAssignments([task.id]);
    const found = all.find((a) => a.task_id === task.id);

    expect(found).toBeDefined();
    expect(found?.trip_participant).toBeDefined();
    expect(found?.trip_participant.user_id).toBe(user.id);
  });

  it('rejects invalid input before the DB call', () => {
    const result = createTaskSchema.safeParse({ title: '' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Task title is required');
    }
  });
});
