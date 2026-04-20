import { z } from 'zod';
import type { TaskInsert } from '@/types';

export enum TaskType {
  Checkbox = 'checkbox',
  Dropdown = 'dropdown',
}

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  [TaskType.Checkbox]: 'Avkrysning',
  [TaskType.Dropdown]: 'Dropdown',
};

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().nullable().optional(),
  type: z.enum(Object.values(TaskType) as [TaskType, ...TaskType[]]),
  options: z.array(z.string()).nullable().optional(),
  allow_note: z.boolean().optional(),
  due_time: z.string().nullable().optional(),
}) satisfies z.ZodType<Omit<TaskInsert, 'id' | 'created_at' | 'trip_id' | 'phase'>>;

export type CreateTaskDTO = z.infer<typeof createTaskSchema>;
export const updateTaskSchema = createTaskSchema.partial();
export type UpdateTaskDTO = z.infer<typeof updateTaskSchema>;
