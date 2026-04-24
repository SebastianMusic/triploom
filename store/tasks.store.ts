import { create } from 'zustand';
import type { Task, TaskAssignment, TaskFieldResponse } from '@/types';
import type { CreateTaskDTO, UpdateTaskDTO, CreateTaskFieldDTO } from '@/types/tasks.types';
import * as tasksService from '@/services/tasks.service';
import type { AssignmentWithParticipant, TaskFieldWithOptions, FieldResponseWithParticipant } from '@/services/tasks.service';

interface TasksState {
  tasks: Task[];
  fields: Record<string, TaskFieldWithOptions[]>;
  assignments: Record<string, TaskAssignment>;
  allAssignments: Record<string, AssignmentWithParticipant[]>;
  myFieldResponses: Record<string, TaskFieldResponse[]>;
  allFieldResponses: Record<string, FieldResponseWithParticipant[]>;
  isLoading: boolean;

  getAllTasks: (tripId: string) => Promise<void>;
  fetchAssignments: (participantId: string, taskIds: string[]) => Promise<void>;
  fetchAllAssignments: (taskIds: string[]) => Promise<void>;
  fetchTaskFields: (taskIds: string[]) => Promise<void>;
  fetchMyFieldResponses: (participantId: string, fieldIds: string[]) => Promise<void>;
  fetchAllFieldResponses: (fieldIds: string[]) => Promise<void>;

  createTask: (tripId: string, dto: CreateTaskDTO) => Promise<Task>;
  updateTask: (id: string, dto: UpdateTaskDTO) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;

  createTaskField: (taskId: string, dto: CreateTaskFieldDTO, optionLabels: string[]) => Promise<void>;
  deleteTaskField: (taskId: string, fieldId: string) => Promise<void>;

  upsertAssignment: (taskId: string, participantId: string, patch: { is_completed?: boolean }) => Promise<void>;
  upsertFieldResponse: (
    fieldId: string,
    participantId: string,
    patch: { option_id?: string | null; is_checked?: boolean | null; value?: string | null }
  ) => Promise<void>;
  deleteMyFieldResponses: (participantId: string, fieldIds: string[]) => Promise<void>;
  sendTaskReminder: (taskTitle: string, userIds: string[]) => Promise<void>;
}

export const useTasksStore = create<TasksState>()((set) => ({
  tasks: [],
  fields: {},
  assignments: {},
  allAssignments: {},
  myFieldResponses: {},
  allFieldResponses: {},
  isLoading: false,

  getAllTasks: async (tripId) => {
    set({ isLoading: true });
    try {
      const tasks = await tasksService.getAllTasks(tripId);
      set({ tasks, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchAssignments: async (participantId, taskIds) => {
    const list = await tasksService.getAssignments(participantId, taskIds);
    const map: Record<string, TaskAssignment> = {};
    for (const a of list) map[a.task_id] = a;
    set({ assignments: map });
  },

  fetchAllAssignments: async (taskIds) => {
    const list = await tasksService.getAllAssignments(taskIds);
    const map: Record<string, AssignmentWithParticipant[]> = {};
    for (const a of list) {
      if (!map[a.task_id]) map[a.task_id] = [];
      map[a.task_id].push(a);
    }
    set({ allAssignments: map });
  },

  fetchTaskFields: async (taskIds) => {
    const list = await tasksService.getTaskFields(taskIds);
    const updated: Record<string, TaskFieldWithOptions[]> = {};
    for (const id of taskIds) updated[id] = [];
    for (const f of list) updated[f.task_id].push(f);
    set((state) => ({ fields: { ...state.fields, ...updated } }));
  },

  fetchMyFieldResponses: async (participantId, fieldIds) => {
    const list = await tasksService.getMyFieldResponses(participantId, fieldIds);
    const map: Record<string, TaskFieldResponse[]> = {};
    for (const r of list) {
      if (!map[r.task_field_id]) map[r.task_field_id] = [];
      map[r.task_field_id].push(r);
    }
    set({ myFieldResponses: map });
  },

  fetchAllFieldResponses: async (fieldIds) => {
    const list = await tasksService.getAllFieldResponses(fieldIds);
    const map: Record<string, FieldResponseWithParticipant[]> = {};
    for (const r of list) {
      if (!map[r.task_field_id]) map[r.task_field_id] = [];
      map[r.task_field_id].push(r);
    }
    set({ allFieldResponses: map });
  },

  createTask: async (tripId, dto) => {
    const task = await tasksService.createTask(tripId, dto);
    set((state) => ({ tasks: [...state.tasks, task] }));
    return task;
  },

  updateTask: async (id, dto) => {
    const updated = await tasksService.updateTask(id, dto);
    set((state) => ({ tasks: state.tasks.map((t) => (t.id === id ? updated : t)) }));
    return updated;
  },

  deleteTask: async (id) => {
    await tasksService.deleteTask(id);
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
      fields: Object.fromEntries(Object.entries(state.fields).filter(([k]) => k !== id)),
    }));
  },

  createTaskField: async (taskId, dto, optionLabels) => {
    const field = await tasksService.createTaskField(taskId, dto, optionLabels);
    set((state) => ({
      fields: { ...state.fields, [taskId]: [...(state.fields[taskId] ?? []), field] },
    }));
  },

  deleteTaskField: async (taskId, fieldId) => {
    await tasksService.deleteTaskField(fieldId);
    set((state) => ({
      fields: {
        ...state.fields,
        [taskId]: (state.fields[taskId] ?? []).filter((f) => f.id !== fieldId),
      },
    }));
  },

  upsertAssignment: async (taskId, participantId, patch) => {
    const updated = await tasksService.upsertAssignment(taskId, participantId, patch);
    set((state) => ({ assignments: { ...state.assignments, [taskId]: updated } }));
  },

  upsertFieldResponse: async (fieldId, participantId, patch) => {
    const updated = await tasksService.upsertFieldResponse(fieldId, participantId, patch);
    set((state) => {
      const existing = state.myFieldResponses[fieldId] ?? [];
      const filtered = existing.filter((r) => r.option_id !== (patch.option_id ?? null));
      return { myFieldResponses: { ...state.myFieldResponses, [fieldId]: [...filtered, updated] } };
    });
  },

  deleteMyFieldResponses: async (participantId, fieldIds) => {
    await tasksService.deleteMyFieldResponses(participantId, fieldIds);
    set((state) => {
      const updated = { ...state.myFieldResponses };
      for (const id of fieldIds) delete updated[id];
      return { myFieldResponses: updated };
    });
  },

  sendTaskReminder: async (taskTitle, userIds) => {
    await tasksService.sendTaskReminder(taskTitle, userIds);
  },
}));
