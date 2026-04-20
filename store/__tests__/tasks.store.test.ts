import { act } from '@testing-library/react-native';
import { useTasksStore } from '../tasks.store';

jest.mock('@/services/tasks.service', () => ({
  getAllTasks: jest.fn(),
  createTask: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
  getAssignments: jest.fn(),
  getAllAssignments: jest.fn(),
  getTaskFields: jest.fn(),
  getMyFieldResponses: jest.fn(),
  getAllFieldResponses: jest.fn(),
  upsertAssignment: jest.fn(),
  upsertFieldResponse: jest.fn(),
}));

import * as tasksService from '@/services/tasks.service';

const mockTask = {
  id: 'task-1',
  trip_id: 'trip-1',
  title: 'Pack passport',
  description: null,
  due_time: null,
  created_at: '2026-01-01T00:00:00Z',
  phase: null,
};

const mockAssignment = {
  id: 'assign-1',
  task_id: 'task-1',
  participant_id: 'participant-1',
  is_completed: false,
  completed_at: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  useTasksStore.setState({
    tasks: [],
    fields: {},
    assignments: {},
    allAssignments: {},
    myFieldResponses: {},
    allFieldResponses: {},
    isLoading: false,
  });
});

describe('getAllTasks', () => {
  it('sets tasks and clears isLoading on success', async () => {
    (tasksService.getAllTasks as jest.Mock).mockResolvedValue([mockTask]);

    await act(async () => {
      await useTasksStore.getState().getAllTasks('trip-1');
    });

    expect(useTasksStore.getState().tasks).toEqual([mockTask]);
    expect(useTasksStore.getState().isLoading).toBe(false);
  });

  it('resets isLoading and re-throws on error', async () => {
    (tasksService.getAllTasks as jest.Mock).mockRejectedValue(new Error('fetch error'));

    let caughtError: Error | null = null;
    await act(async () => {
      try {
        await useTasksStore.getState().getAllTasks('trip-1');
      } catch (err) {
        caughtError = err as Error;
      }
    });

    expect(caughtError).not.toBeNull();
    expect(useTasksStore.getState().isLoading).toBe(false);
  });
});

describe('createTask', () => {
  it('appends new task to the list', async () => {
    (tasksService.createTask as jest.Mock).mockResolvedValue(mockTask);

    await act(async () => {
      await useTasksStore.getState().createTask('trip-1', { title: 'Pack passport' });
    });

    expect(useTasksStore.getState().tasks).toEqual([mockTask]);
  });

  it('re-throws on error', async () => {
    (tasksService.createTask as jest.Mock).mockRejectedValue(new Error('RLS error'));

    let caughtError: Error | null = null;
    await act(async () => {
      try {
        await useTasksStore.getState().createTask('trip-1', { title: 'Test' });
      } catch (err) {
        caughtError = err as Error;
      }
    });

    expect(caughtError).not.toBeNull();
  });
});

describe('updateTask', () => {
  it('replaces the task in the list', async () => {
    const updated = { ...mockTask, title: 'Updated' };
    useTasksStore.setState({ tasks: [mockTask] });
    (tasksService.updateTask as jest.Mock).mockResolvedValue(updated);

    await act(async () => {
      await useTasksStore.getState().updateTask('task-1', { title: 'Updated' });
    });

    expect(useTasksStore.getState().tasks[0].title).toBe('Updated');
  });
});

describe('deleteTask', () => {
  it('removes the task from the list', async () => {
    useTasksStore.setState({ tasks: [mockTask] });
    (tasksService.deleteTask as jest.Mock).mockResolvedValue(undefined);

    await act(async () => {
      await useTasksStore.getState().deleteTask('task-1');
    });

    expect(useTasksStore.getState().tasks).toEqual([]);
  });
});

describe('fetchAssignments', () => {
  it('builds assignments map keyed by task_id', async () => {
    (tasksService.getAssignments as jest.Mock).mockResolvedValue([mockAssignment]);

    await act(async () => {
      await useTasksStore.getState().fetchAssignments('participant-1', ['task-1']);
    });

    expect(useTasksStore.getState().assignments['task-1']).toEqual(mockAssignment);
  });
});

describe('upsertAssignment', () => {
  it('updates the assignment in state', async () => {
    const updated = { ...mockAssignment, is_completed: true };
    (tasksService.upsertAssignment as jest.Mock).mockResolvedValue(updated);

    await act(async () => {
      await useTasksStore.getState().upsertAssignment('task-1', 'participant-1', { is_completed: true });
    });

    expect(useTasksStore.getState().assignments['task-1'].is_completed).toBe(true);
  });
});
