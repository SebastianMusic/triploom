import { z } from 'zod';
import type { EventInsert } from '@/types';

export const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  location: z.string().min(1, 'Location is required'),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  price_range: z.string().optional(),
}) satisfies z.ZodType<
  Omit<EventInsert, 'id' | 'created_at' | 'created_by_id' | 'trip_id' | 'banner_image_url' | 'is_optional'>
>;

export type CreateEventDTO = z.infer<typeof createEventSchema>;
