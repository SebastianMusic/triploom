import { create } from 'zustand';
import type { Task } from '@/types';
import type { CreateTaskDTO, UpdateTaskDTO } from '@/types/tasks.types';
import * as tasksService from '@/services/tasks.service';

interface TasksState {
  tasks: Task[];
  isLoading: boolean;
  fetchTasks: (tripId: string) => Promise<void>;
  createTask: (tripId: string, dto: CreateTaskDTO) => Promise<Task>;
  updateTask: (id: string, dto: UpdateTaskDTO) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
}

export const useTasksStore = create<TasksState>()((set) => ({
  tasks: [],
  isLoading: false,

  fetchTasks: async (tripId) => {
    set({ isLoading: true });
    try {
      const tasks = await tasksService.getTasks(tripId);
      set({ tasks });
    } catch (error) {
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  createTask: async (tripId, dto) => {
    const task = await tasksService.createTask(tripId, dto);
    set((state) => ({ tasks: [...state.tasks, task] }));
    return task;
  },

  updateTask: async (id, dto) => {
    const updated = await tasksService.updateTask(id, dto);
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? updated : t)),
    }));
    return updated;
  },

  deleteTask: async (id) => {
    await tasksService.deleteTask(id);
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
  },
}));
