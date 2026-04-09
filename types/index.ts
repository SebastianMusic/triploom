/**
 * Shared application types.
 * Import from here rather than from individual files to keep imports clean.
 */

export type { Database, Json, Tables, TablesInsert, TablesUpdate, Enums } from './database.types';
export { createTripSchema } from './trip.types';
export type { CreateTripDTO } from './trip.types';
export { signInSchema, signUpSchema } from './auth.types';
export type { SignInDTO, SignUpDTO } from './auth.types';
export { updateSelectedTripSchema } from './profile.types';
export type { UpdateSelectedTripDTO } from './profile.types';

import type { Tables, TablesInsert, TablesUpdate } from './database.types';

// Trip
export type Trip = Tables<'trip'>;
export type TripInsert = TablesInsert<'trip'>;
export type TripUpdate = TablesUpdate<'trip'>;

// Trip participant
export type TripParticipant = Tables<'trip_participant'>;
export type TripParticipantInsert = TablesInsert<'trip_participant'>;
export type TripParticipantUpdate = TablesUpdate<'trip_participant'>;

// Trip group
export type TripGroup = Tables<'trip_group'>;
export type TripGroupInsert = TablesInsert<'trip_group'>;
export type TripGroupUpdate = TablesUpdate<'trip_group'>;

// Trip invite URL
export type TripInviteUrl = Tables<'trip_invite_url'>;
export type TripInviteUrlInsert = TablesInsert<'trip_invite_url'>;
export type TripInviteUrlUpdate = TablesUpdate<'trip_invite_url'>;

// Event
export type Event = Tables<'event'>;
export type EventInsert = TablesInsert<'event'>;
export type EventUpdate = TablesUpdate<'event'>;

// Event participation
export type EventParticipation = Tables<'event_participation'>;
export type EventParticipationInsert = TablesInsert<'event_participation'>;
export type EventParticipationUpdate = TablesUpdate<'event_participation'>;

// Task
export type Task = Tables<'task'>;
export type TaskInsert = TablesInsert<'task'>;
export type TaskUpdate = TablesUpdate<'task'>;

// Task assignment
export type TaskAssignment = Tables<'task_assignment'>;
export type TaskAssignmentInsert = TablesInsert<'task_assignment'>;
export type TaskAssignmentUpdate = TablesUpdate<'task_assignment'>;

// Message
export type Message = Tables<'message'>;
export type MessageInsert = TablesInsert<'message'>;
export type MessageUpdate = TablesUpdate<'message'>;

// Group chat
export type GroupChat = Tables<'group_chat'>;
export type GroupChatInsert = TablesInsert<'group_chat'>;
export type GroupChatUpdate = TablesUpdate<'group_chat'>;

// Chat participant
export type ChatParticipant = Tables<'chat_participant'>;
export type ChatParticipantInsert = TablesInsert<'chat_participant'>;
export type ChatParticipantUpdate = TablesUpdate<'chat_participant'>;

// Chat image
export type ChatImage = Tables<'chat_image'>;
export type ChatImageInsert = TablesInsert<'chat_image'>;
export type ChatImageUpdate = TablesUpdate<'chat_image'>;

// Announcement
export type Announcement = Tables<'announcement'>;
export type AnnouncementInsert = TablesInsert<'announcement'>;
export type AnnouncementUpdate = TablesUpdate<'announcement'>;

// Profile
export type Profile = Tables<'profile'>;
export type ProfileInsert = TablesInsert<'profile'>;
export type ProfileUpdate = TablesUpdate<'profile'>;

// Group membership
export type GroupMembership = Tables<'group_membership'>;
export type GroupMembershipInsert = TablesInsert<'group_membership'>;
export type GroupMembershipUpdate = TablesUpdate<'group_membership'>;

