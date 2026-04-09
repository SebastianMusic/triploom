import { create } from 'zustand';
import type { Task } from '@/types';

interface TasksState {
  tasks: Task[];
  isLoading: boolean;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  removeTask: (id: string) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useTasksStore = create<TasksState>()(() => ({
  tasks: [],
  isLoading: false,
  setTasks: () => {},
  addTask: () => {},
  removeTask: () => {},
  setLoading: () => {},
}));
