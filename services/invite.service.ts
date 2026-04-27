import { supabase } from '@/lib/supabase';

export interface RedeemInviteResponse {
  trip_id: string;
  message?: string;
}

const INVITE_BASE_URL = 'https://triploom.app/invite';

export async function fetchInviteLink(tripId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('trip_invite_url')
    .select('invite_url')
    .eq('trip_id', tripId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return `${INVITE_BASE_URL}?code=${data.invite_url}`;
}

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
