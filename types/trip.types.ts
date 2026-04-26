import { z } from 'zod';
import type { TripInsert } from '@/types';

export enum TripRole {
  Organizer = 'organizer',
  CoOrganizer = 'coOrganizer',
  Participant = 'participant',
}

export enum TripEventPermission {
  All = 'all',
  Organizer = 'organizer',
}

// Excludes server-set fields: id, created_at, organizer_id
// The satisfies constraint ensures this stays in sync with the Supabase schema —
// if a column is renamed or removed, TypeScript will catch it here.
export const createTripSchema = z.object({
  name: z.string().min(1, 'Trip name is required'),
  description: z.string().nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  banner_image_url: z.string().nullable().optional(),
  event_permission: z.enum(TripEventPermission).nullable().optional(),
}) satisfies z.ZodType<Omit<TripInsert, 'id' | 'created_at' | 'organizer_id'>>;

export type CreateTripDTO = z.infer<typeof createTripSchema>;

export type TripWithRole = import('@/types').Trip & { userRole: TripRole };
