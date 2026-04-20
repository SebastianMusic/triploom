import { supabase } from '@/lib/supabase';

export interface RedeemInviteResponse {
  trip_id: string;
  message?: string;
}

/**
 * Generates an invite link for a trip.
 * Only organizers and co-organizers can generate invite links.
 * @param tripId - The ID of the trip to generate an invite for
 * @returns The invite URL (e.g., "triploom://join/{token}")
 * @throws Error if the request fails or user lacks permission
 */
export async function generateInviteLink(tripId: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('generate-invite', {
    body: { trip_id: tripId },
  });

  if (error) {
    throw new Error(`Failed to generate invite link: ${error.message}`);
  }

  if (!data || !data.invite_url) {
    throw new Error('Invalid response from server: missing invite_url');
  }

  return data.invite_url;
}

/**
 * Redeems an invite code to join a trip.
 * @param code - The invite code to redeem
 * @returns Object containing trip_id and optional message
 * @throws Error if the request fails, code is invalid, or user cannot join
 */
export async function redeemInviteLink(code: string): Promise<RedeemInviteResponse> {
  const { data, error } = await supabase.functions.invoke('redeem-invite', {
    body: { invite_code: code },
  });

  if (error) {
    throw new Error(`Failed to redeem invite: ${error.message}`);
  }

  if (!data || !data.trip_id) {
    throw new Error('Invalid response from server: missing trip_id');
  }

  return {
    trip_id: data.trip_id,
    message: data.message,
  };
}
