import { z } from 'zod';
import type { AnnouncementInsert, AnnouncementUpdate } from '@/types';

export const createAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable().optional(),
}) satisfies z.ZodType<Omit<AnnouncementInsert, 'id' | 'created_at' | 'trip_id' | 'participant_id'>>;

export const updateAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().nullable().optional(),
}) satisfies z.ZodType<Omit<AnnouncementUpdate, 'id' | 'created_at' | 'trip_id' | 'participant_id'>>;

export type CreateAnnouncementDTO = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementDTO = z.infer<typeof updateAnnouncementSchema>;
