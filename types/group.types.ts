import { z } from 'zod';

import type { TablesInsert, TablesUpdate } from './database.types';

type TripGroupInsert = TablesInsert<'trip_group'>;
type TripGroupUpdate = TablesUpdate<'trip_group'>;

const optionalDescription = z
  .string()
  .trim()
  .max(240, 'Description must be 240 characters or fewer')
  .optional();

const optionalMaxMembers = z
  .number()
  .int('Max members must be a whole number')
  .min(1, 'Max members must be at least 1')
  .nullable()
  .optional();

export const createGroupSchema = z.object({
  trip_id: z.string().min(1, 'Trip is required'),
  name: z
    .string()
    .trim()
    .min(1, 'Group name is required')
    .max(80, 'Group name must be 80 characters or fewer'),
  description: optionalDescription,
  max_members: optionalMaxMembers,
}) satisfies z.ZodType<
  Required<Pick<TripGroupInsert, 'trip_id' | 'name'>> &
  Pick<TripGroupInsert, 'description' | 'max_members'>
>;

export const createGroupsSchema = z.object({
  tripId: z.string().min(1, 'Trip is required'),
  baseName: z
    .string()
    .trim()
    .min(1, 'Group name is required')
    .max(80, 'Group name must be 80 characters or fewer'),
  count: z
    .number()
    .int('Number of groups must be a whole number')
    .min(1, 'Must create at least 1 group')
    .max(200, 'Maximum 200 groups at once'),
  description: optionalDescription,
  maxMembers: optionalMaxMembers,
});

export const updateGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Group name is required')
    .max(80, 'Group name must be 80 characters or fewer'),
  description: optionalDescription,
  max_members: optionalMaxMembers,
}) satisfies z.ZodType<Required<Pick<TripGroupUpdate, 'name'>> & Pick<TripGroupUpdate, 'description' | 'max_members'>>;

export type CreateGroupDTO = z.infer<typeof createGroupSchema>;
export type CreateGroupsDTO = z.infer<typeof createGroupsSchema>;
export type UpdateGroupDTO = z.infer<typeof updateGroupSchema>;
