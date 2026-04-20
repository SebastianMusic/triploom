import { supabase } from '@/lib/supabase';
import type { Task } from '@/types';
import type { CreateTaskDTO, UpdateTaskDTO } from '@/types/tasks.types';

export async function getTasks(tripId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('task')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createTask(tripId: string, dto: CreateTaskDTO): Promise<Task> {
  const { data, error } = await supabase
    .from('task')
    .insert({ ...dto, trip_id: tripId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTask(id: string, dto: UpdateTaskDTO): Promise<Task> {
  const { data, error } = await supabase
    .from('task')
    .update(dto)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('task').delete().eq('id', id);
  if (error) throw error;
}
