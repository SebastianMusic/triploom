/**
 * Shared application types.
 * Import from here rather than from individual files to keep imports clean.
 */

export type { Database } from './database.types';

// Derived convenience types from the database schema
import type { Database } from './database.types';

type Tables = Database['public']['Tables'];

export type Trip = Tables['trips']['Row'];
export type TripInsert = Tables['trips']['Insert'];
export type TripUpdate = Tables['trips']['Update'];

export type TripMember = Tables['trip_members']['Row'];

export type Event = Tables['events']['Row'];
export type EventInsert = Tables['events']['Insert'];
export type EventUpdate = Tables['events']['Update'];

export type Task = Tables['tasks']['Row'];
export type TaskInsert = Tables['tasks']['Insert'];
export type TaskUpdate = Tables['tasks']['Update'];

export type Message = Tables['messages']['Row'];
export type MessageInsert = Tables['messages']['Insert'];

export type Profile = Tables['profiles']['Row'];
export type ProfileUpdate = Tables['profiles']['Update'];
