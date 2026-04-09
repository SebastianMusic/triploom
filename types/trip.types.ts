import { z } from 'zod';
import type { TripInsert } from '@/types';

// Excludes server-set fields: id, created_at, organizer_id, event_permission
// The satisfies constraint ensures this stays in sync with the Supabase schema —
// if a column is renamed or removed, TypeScript will catch it here.
export const createTripSchema = z.object({
  name: z.string().min(1, 'Trip name is required'),
  description: z.string().nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  banner_image_url: z.string().nullable().optional(),
}) satisfies z.ZodType<Omit<TripInsert, 'id' | 'created_at' | 'organizer_id' | 'event_permission'>>;

export type CreateTripDTO = z.infer<typeof createTripSchema>;
