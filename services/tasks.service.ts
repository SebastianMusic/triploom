import { supabase } from '@/lib/supabase';
import type { Task, TaskAssignment, TaskField, TaskFieldOption, TaskFieldResponse } from '@/types';
import type { CreateTaskDTO, UpdateTaskDTO, CreateTaskFieldDTO } from '@/types/tasks.types';

export type TaskFieldWithOptions = TaskField & { options: TaskFieldOption[] };

export type AssignmentWithParticipant = TaskAssignment & {
  trip_participant: {
    user_id: string | null;
    profile: { user_name: string | null; profile_picture_url: string | null } | null;
  };
};

export type FieldResponseWithParticipant = TaskFieldResponse & {
  trip_participant: {
    user_id: string | null;
    profile: { user_name: string | null; profile_picture_url: string | null } | null;
  };
};

// --- Task CRUD ---

export async function getAllTasks(tripId: string): Promise<Task[]> {
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

// --- Task fields ---

export async function getTaskFields(taskIds: string[]): Promise<TaskFieldWithOptions[]> {
  if (!taskIds.length) return [];
  const { data, error } = await supabase
    .from('task_field')
    .select('*, options:task_field_option(*)')
    .in('task_id', taskIds)
    .order('sort_order');
  if (error) throw error;
  return data as TaskFieldWithOptions[];
}

export async function createTaskField(
  taskId: string,
  dto: CreateTaskFieldDTO,
  optionLabels: string[]
): Promise<TaskFieldWithOptions> {
  const { data: field, error: fieldError } = await supabase
    .from('task_field')
    .insert({ ...dto, task_id: taskId })
    .select()
    .single();
  if (fieldError) throw fieldError;

  let options: TaskFieldOption[] = [];
  if (optionLabels.length > 0) {
    const { data, error } = await supabase
      .from('task_field_option')
      .insert(optionLabels.map((label, i) => ({ task_field_id: field.id, label, sort_order: i })))
      .select();
    if (error) throw error;
    options = data;
  }

  return { ...field, options };
}

export async function updateTaskField(id: string, dto: Partial<CreateTaskFieldDTO>): Promise<TaskField> {
  const { data, error } = await supabase
    .from('task_field')
    .update(dto)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTaskField(id: string): Promise<void> {
  const { error } = await supabase.from('task_field').delete().eq('id', id);
  if (error) throw error;
}

// --- Assignments (overall task completion) ---

export async function getAssignments(participantId: string, taskIds: string[]): Promise<TaskAssignment[]> {
  if (!taskIds.length) return [];
  const { data, error } = await supabase
    .from('task_assignment')
    .select('*')
    .eq('participant_id', participantId)
    .in('task_id', taskIds);
  if (error) throw error;
  return data;
}

export async function getAllAssignments(taskIds: string[]): Promise<AssignmentWithParticipant[]> {
  if (!taskIds.length) return [];
  const { data, error } = await supabase
    .from('task_assignment')
    .select('*, trip_participant!inner(user_id, profile:profile(user_name, profile_picture_url))')
    .in('task_id', taskIds);
  if (error) throw error;
  return data as AssignmentWithParticipant[];
}

export async function upsertAssignment(
  taskId: string,
  participantId: string,
  patch: { is_completed?: boolean }
): Promise<TaskAssignment> {
  const { data, error } = await supabase
    .from('task_assignment')
    .upsert(
      { task_id: taskId, participant_id: participantId, completed_at: new Date().toISOString(), ...patch },
      { onConflict: 'task_id,participant_id' }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

// --- Field responses ---

export async function getMyFieldResponses(
  participantId: string,
  fieldIds: string[]
): Promise<TaskFieldResponse[]> {
  if (!fieldIds.length) return [];
  const { data, error } = await supabase
    .from('task_field_response')
    .select('*')
    .eq('participant_id', participantId)
    .in('task_field_id', fieldIds);
  if (error) throw error;
  return data;
}

export async function getAllFieldResponses(fieldIds: string[]): Promise<FieldResponseWithParticipant[]> {
  if (!fieldIds.length) return [];
  const { data, error } = await supabase
    .from('task_field_response')
    .select('*, trip_participant!inner(user_id, profile:profile(user_name, profile_picture_url))')
    .in('task_field_id', fieldIds);
  if (error) throw error;
  return data as FieldResponseWithParticipant[];
}

export async function upsertFieldResponse(
  fieldId: string,
  participantId: string,
  patch: { option_id?: string | null; is_checked?: boolean | null; value?: string | null }
): Promise<TaskFieldResponse> {
  const { data, error } = await supabase
    .from('task_field_response')
    .upsert(
      { task_field_id: fieldId, participant_id: participantId, ...patch },
      { onConflict: 'task_field_id,participant_id,option_id' }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMyFieldResponses(participantId: string, fieldIds: string[]): Promise<void> {
  if (!fieldIds.length) return;
  const { error } = await supabase
    .from('task_field_response')
    .delete()
    .eq('participant_id', participantId)
    .in('task_field_id', fieldIds);
  if (error) throw error;
}

export async function sendTaskReminder(taskTitle: string, userIds: string[]): Promise<void> {
  if (!userIds.length) return;

  const { error } = await supabase.functions.invoke('send-notification', {
    body: { title: 'Task reminder', body: taskTitle, user_ids: userIds },
  });
  if (error) throw error;
}
