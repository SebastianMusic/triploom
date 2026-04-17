# Service & Store Interface Contracts: Chat System

**Phase**: 1 | **Date**: 2026-04-14 | **Plan**: [../plan.md](../plan.md)

These are the internal contracts between layers. They define the expected function
signatures and behaviours before any code is written. The integration tests verify
these contracts against the real database.

---

## `chat.service.ts` — Service Layer

Sole point of contact with Supabase. All functions throw on error.

```ts
/**
 * Fetch all chat rooms the current user has access to within a trip,
 * ordered by most recent message activity (newest first).
 * Includes unread indicator and last activity timestamp.
 */
export async function getAllChatRooms(tripId: string): Promise<ChatRoomWithMeta[]>

/**
 * Fetch a page of messages for a chat room.
 * page=0 returns the 50 most recent messages (newest at index 0 before reversal).
 * Caller should reverse the array for display (oldest at top).
 * page=1 returns the next 50 older messages, etc.
 */
export async function getAllMessages(
  roomId: string,
  page?: number
): Promise<MessageWithSender[]>

/**
 * Send a message to a chat room.
 * Sets user_id from the current auth session.
 * Returns the persisted message with sender name resolved.
 */
export async function sendMessage(dto: SendMessageDTO): Promise<MessageWithSender>

/**
 * Subscribe to new messages in a chat room via Supabase Realtime.
 * Calls onMessage for every INSERT event on the message table for this room.
 * Returns an unsubscribe function — must be called when leaving the room.
 */
export function subscribeToMessages(
  roomId: string,
  onMessage: (message: MessageWithSender) => void
): () => void

/**
 * Mark a chat room as read for the current user.
 * Updates chat_participant.last_read_at to now().
 * Called when a user opens a chat room.
 */
export async function markChatRead(roomId: string): Promise<void>

// ------- Private helper (not exported) -------

/**
 * Reshapes a raw Supabase message row (with nested profile join) into MessageWithSender.
 * Used in three places inside chat.service.ts:
 *   - getAllMessages: maps each row in the returned array
 *   - sendMessage: maps the single inserted row
 *   - subscribeToMessages: maps payload.new from the realtime INSERT event
 */
function mapToMessageWithSender(raw: {
  id: string;
  content: string | null;
  created_at: string;
  group_chat_id: string | null;
  user_id: string | null;
  profile: { user_name: string | null } | null;
}): MessageWithSender
```

---

## `chat.store.ts` — Store Layer

Holds UI state. Actions call service functions — no direct Supabase calls.

```ts
interface ChatState {
  // State
  chatRooms: ChatRoomWithMeta[];
  activeChatRoomId: string | null;
  messages: MessageWithSender[];
  currentPage: number;           // tracks pagination offset
  isLoading: boolean;
  isSending: boolean;

  // Actions
  /**
   * Load all accessible chat rooms for the active trip.
   * Replaces chatRooms in state.
   */
  getAllChatRooms: (tripId: string) => Promise<void>;

  /**
   * Load the first page of messages for a room.
   * Replaces messages in state. Resets currentPage to 0.
   */
  getAllMessages: (roomId: string) => Promise<void>;

  /**
   * Load the next page of older messages for the current room.
   * Prepends to messages in state. Increments currentPage.
   */
  loadMoreMessages: (roomId: string) => Promise<void>;

  /**
   * Send a message in the active room.
   * Validates with sendMessageSchema before calling service.
   */
  sendMessage: (dto: SendMessageDTO) => Promise<void>;

  /**
   * Open a chat room:
   *   1. Set activeChatRoomId
   *   2. getAllMessages
   *   3. markChatRead
   *   4. Subscribe to realtime (addMessage callback)
   * Clears unread dot for the opened room in chatRooms list.
   */
  openChatRoom: (roomId: string) => Promise<void>;

  /**
   * Close the active chat room:
   *   1. Unsubscribe from realtime channel
   *   2. Clear messages
   *   3. Set activeChatRoomId to null
   */
  closeChatRoom: () => void;

  /**
   * Called by the realtime subscription on new message INSERT.
   * Appends message to the end of messages list.
   */
  addMessage: (message: MessageWithSender) => void;
}
```

---

## Error Handling Contract

| Layer | Behaviour |
|-------|-----------|
| Service | Always `throw error` — no silent failures, no default returns |
| Store | Wrap service calls in `try/catch`; `set({ isLoading: false })` in catch; re-throw |
| UI | Wrap store action calls in `try/catch`; show error state to user |

---

## Realtime Channel Naming

| Channel name pattern | Scope |
|----------------------|-------|
| `messages:{group_chat_id}` | One channel per open room |

Example: room `abc-123` → channel `messages:abc-123`

The channel listens to:
```ts
{
  event: 'INSERT',
  schema: 'public',
  table: 'message',
  filter: `group_chat_id=eq.${roomId}`
}
```

---

## Acceptance Criteria Coverage

| FR | Covered by |
|----|-----------|
| FR-001 | DB trigger `on_trip_created` |
| FR-002 | DB trigger `on_event_created` |
| FR-003 | DB trigger `on_trip_group_created` |
| FR-004 | RLS policies on `message` and `group_chat` |
| FR-005 | `sendMessage` service + store action |
| FR-006 | `subscribeToMessages` + `addMessage` store action |
| FR-007 | `MessageWithSender.senderName` + `created_at` |
| FR-008 | `getAllMessages` returns ascending order after reversal |
| FR-009 | `getAllMessages(page=0)` returns 50; `loadMoreMessages` fetches next 50 |
| FR-010 | RLS `with check` on message INSERT |
| FR-011 | `getAllChatRooms` + chat room list screen |
| FR-012 | `getAllChatRooms(tripId)` scoped to one trip |
| FR-013 | `ChatRoomWithMeta.hasUnread` + dot indicator in `chat-room-list-item.tsx` |
| FR-014 | `getAllChatRooms` orders by `lastActivityAt` descending |
| FR-015 | `chat_name` set by triggers: "General" / group name / event title |
