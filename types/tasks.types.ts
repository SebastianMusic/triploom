import type { TaskFieldInsert, TaskFieldOptionInsert, TaskInsert } from '@/types';
import { z } from 'zod';

export enum TaskFieldType {
  Checkbox = 'checkbox',
  SingleChoice = 'single_choice',
  TextInput = 'text_input',
}

export const TASK_FIELD_TYPE_LABELS: Record<TaskFieldType, string> = {
  [TaskFieldType.Checkbox]: 'Checkbox',
  [TaskFieldType.SingleChoice]: 'Single choice',
  [TaskFieldType.TextInput]: 'Text input',
};

export const TASK_FIELD_TYPE_OPTIONS = Object.values(TaskFieldType);

export function fieldNeedsOptions(type: TaskFieldType): boolean {
  return type === TaskFieldType.SingleChoice;
}

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().nullable().optional(),
  due_time: z.string().nullable().optional(),
  event_id: z.string().nullable().optional(),
  is_mandatory: z.boolean().optional(),
}) satisfies z.ZodType<Omit<TaskInsert, 'id' | 'created_at' | 'trip_id'>>;

export const updateTaskSchema = createTaskSchema.partial();

export const createTaskFieldSchema = z.object({
  type: z.enum(Object.values(TaskFieldType) as [TaskFieldType, ...TaskFieldType[]]),
  label: z.string().min(1, 'Field label is required'),
  sort_order: z.number().optional(),
}) satisfies z.ZodType<Omit<TaskFieldInsert, 'id' | 'task_id'>>;

export type CreateTaskDTO = z.infer<typeof createTaskSchema>;
export type UpdateTaskDTO = z.infer<typeof updateTaskSchema>;
export type CreateTaskFieldDTO = z.infer<typeof createTaskFieldSchema>;

export const createTaskFieldOptionSchema = z.object({
  label: z.string().min(1, 'Option label is required'),
  sort_order: z.number().optional(),
}) satisfies z.ZodType<Omit<TaskFieldOptionInsert, 'id' | 'task_field_id'>>;

export type CreateTaskFieldOptionDTO = z.infer<typeof createTaskFieldOptionSchema>;

export type FieldDraft = {
  tempId: string;
  type: TaskFieldType;
  label: string;
  options: string[];
};
