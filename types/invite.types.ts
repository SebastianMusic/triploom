import { z } from 'zod';

export const generateInviteSchema = z.object({
  trip_id: z.string().min(1, 'Trip ID is required'),
}) satisfies z.ZodType<{ trip_id: string }>;

export const redeemInviteSchema = z.object({
  invite_code: z.string().min(1, 'Invite code is required'),
}) satisfies z.ZodType<{ invite_code: string }>;

export type GenerateInviteDTO = z.infer<typeof generateInviteSchema>;
export type RedeemInviteDTO = z.infer<typeof redeemInviteSchema>;

export type GenerateInviteResponse = { invite_url: string };
export type RedeemInviteResponse = { trip_id: string; message?: string };
