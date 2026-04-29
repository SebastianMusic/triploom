import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
	Deno.env.get("SUPABASE_URL")!,
	Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const EXPO_CHUNK_SIZE = 100;

function chunkArray<T>(arr: T[], size: number): T[][] {
	const chunks: T[][] = [];
	for (let i = 0; i < arr.length; i += size) {
		chunks.push(arr.slice(i, i + size));
	}
	return chunks;
}

/** Returns all expo push tokens for participants of a given trip. */
export async function getPushTokensForTrip(tripId: string): Promise<string[]> {
	return getPushTokensForTripExcluding(tripId, null);
}

/** Returns expo push tokens for all trip participants except the given user. */
export async function getPushTokensForTripExcluding(
	tripId: string,
	excludeUserId: string | null,
): Promise<string[]> {
	let query = supabase
		.from("trip_participant")
		.select("profile:user_id(expo_push_token, id)")
		.eq("trip_id", tripId);

	if (excludeUserId) {
		query = query.neq("user_id", excludeUserId);
	}

	const { data, error } = await query;

	if (error) {
		throw new Error(`Failed to fetch trip participants: ${error.message}`);
	}

	return (data as any[])
		.map((row) => row.profile?.expo_push_token)
		.filter((token): token is string => typeof token === "string");
}

/** Returns expo push tokens for the given list of user IDs. */
export async function getPushTokensForUsers(userIds: string[]): Promise<string[]> {
	if (userIds.length === 0) return [];
	const { data, error } = await supabase
		.from("profile")
		.select("expo_push_token")
		.in("id", userIds);
	if (error) throw new Error(`Failed to fetch user tokens: ${error.message}`);
	return (data as any[])
		.map((row) => row.expo_push_token)
		.filter((token): token is string => typeof token === "string");
}

/** Returns expo push tokens for all chat room participants except the given user.
 *  chat_participant.participant_id → trip_participant.id → trip_participant.user_id → profile.id
 */
export async function getPushTokensForChatRoomExcluding(
	chatRoomId: string,
	excludeUserId: string | null,
): Promise<string[]> {
	const { data, error } = await supabase
		.from("chat_participant")
		.select("trip_participant:participant_id(user_id, profile:user_id(expo_push_token))")
		.eq("group_chat_id", chatRoomId);
	if (error) throw new Error(`Failed to fetch chat room participants: ${error.message}`);
	return (data as any[])
		.filter((row) => !excludeUserId || row.trip_participant?.user_id !== excludeUserId)
		.map((row) => row.trip_participant?.profile?.expo_push_token)
		.filter((token): token is string => typeof token === "string");
}

/** Sends a push notification to the given list of expo push tokens. */
export async function sendNotification(
	tokens: string[],
	title: string,
	body: string,
	data?: Record<string, string>,
) {
	if (tokens.length === 0) {
		console.log("No tokens to send to, skipping.");
		return [];
	}

	console.log(`Sending to ${tokens.length} device(s)`);

	const messages = tokens.map((token) => ({
		to: token,
		sound: "default",
		title,
		body,
		...(data ? { data } : {}),
	}));

	const chunks = chunkArray(messages, EXPO_CHUNK_SIZE);
	console.log(`Sending in ${chunks.length} chunk(s) of up to ${EXPO_CHUNK_SIZE}`);

	const results = await Promise.all(
		chunks.map((chunk) =>
			fetch("https://exp.host/--/api/v2/push/send", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(chunk),
			}).then((res) => res.json())
		),
	);

	console.log(`Expo response: ${JSON.stringify(results, null, 2)}`);
	return results.flat();
}
