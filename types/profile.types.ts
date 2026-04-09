import { z } from 'zod';
import type { ProfileUpdate } from '@/types';

export const updateSelectedTripSchema = z.object({
  selected_trip: z.string().nullable(),
}) satisfies z.ZodType<Pick<ProfileUpdate, 'selected_trip'>>;

export type UpdateSelectedTripDTO = z.infer<typeof updateSelectedTripSchema>;