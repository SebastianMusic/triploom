import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { TripRole } from "../_shared/types.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

interface RedeemInviteRequest {
  invite_code: string;
}

interface RedeemInviteResponse {
  trip_id?: string;
  message?: string;
  error?: string;
}

Deno.serve(async (req) => {
  // Only accept POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" } as RedeemInviteResponse),
      { status: 405, headers: { "Content-Type": "application/json" } },
    );
  }

  // Extract JWT from Authorization header
  const authHeader = req.headers.get("Authorization");
  const jwt = authHeader?.replace("Bearer ", "");

  if (!jwt) {
    return new Response(
      JSON.stringify({ error: "Authentication required" } as RedeemInviteResponse),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  // Validate JWT and get user
  const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);

  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: "Invalid or expired token" } as RedeemInviteResponse),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  const userId = user.id;

  // Parse request body
  let body: RedeemInviteRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON in request body" } as RedeemInviteResponse),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  let { invite_code } = body;

  // Validate invite_code
  if (!invite_code || typeof invite_code !== "string") {
    return new Response(
      JSON.stringify({ error: "invite_code is required" } as RedeemInviteResponse),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // Accept bare token, triploom://join/<token>, or https://triploom.app/invite?code=<token>
  try {
    const parsed = new URL(invite_code);
    invite_code = parsed.searchParams.get("code") ?? parsed.pathname.split("/").pop() ?? invite_code;
  } catch {
    // Not a URL — already a bare token
  }

  try {
    // Query trip_invite_url to find matching invite
    const { data: invite, error: inviteError } = await supabase
      .from("trip_invite_url")
      .select("trip_id, expiration_date")
      .eq("invite_url", invite_code)
      .single();

    if (inviteError || !invite) {
      return new Response(
        JSON.stringify({ error: "Invalid invite code" } as RedeemInviteResponse),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    // Check if invite has expired
    if (invite.expiration_date && new Date(invite.expiration_date) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Invite code has expired" } as RedeemInviteResponse),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    const tripId = invite.trip_id;

    // Check if user is already a participant in this trip
    const { data: existingParticipant, error: participantCheckError } = await supabase
      .from("trip_participant")
      .select("id")
      .eq("trip_id", tripId)
      .eq("user_id", userId)
      .maybeSingle();

    if (participantCheckError) {
      throw participantCheckError;
    }

    if (existingParticipant) {
      // User is already a participant - return success with trip_id
      return new Response(
        JSON.stringify({
          trip_id: tripId,
          message: "User is already a participant in this trip",
        } as RedeemInviteResponse),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // Create trip_participant record
    const { error: insertError } = await supabase
      .from("trip_participant")
      .insert({
        trip_id: tripId,
        user_id: userId,
        role: TripRole.Participant,
      });

    if (insertError) {
      // Handle unique constraint violation (race condition)
      if (insertError.code === "23505") {
        return new Response(
          JSON.stringify({
            trip_id: tripId,
            message: "User is already a participant in this trip",
          } as RedeemInviteResponse),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      throw insertError;
    }

    // Return success response
    return new Response(
      JSON.stringify({
        trip_id: tripId,
        message: "Successfully joined trip",
      } as RedeemInviteResponse),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("Error redeeming invite:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" } as RedeemInviteResponse),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
