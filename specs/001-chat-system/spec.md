# Feature Specification: Chat System

**Feature Branch**: `001-chat-system`
**Created**: 2026-04-14
**Status**: Draft
**Input**: Real-time chat system with three chat types: trip global chat, group chat, and event chat.

## Clarifications

### Session 2026-04-14

- Q: When a user opens a chat room, how much message history should load? → A: Load the most recent 50 messages; scroll up loads older batches (pagination).
- Q: How does a participant navigate between the three chat types? → A: The Chat tab shows a list of all chat rooms the participant has access to within the currently active trip; tapping one opens the message view.
- Q: Should the room list show unread message indicators? → A: Yes — a simple dot indicator (no count) on each room that has unread messages since the participant last viewed it.
- Q: What happens to a participant's message access when they are removed from a trip, group, or event? → A: They immediately lose all read access to that chat room. Their past messages remain visible to current members.
- Q: Does real-time message delivery apply to all three chat types? → A: Yes — global, group, and event chats all deliver new messages in real time.
- Q: How are chat rooms ordered in the Chat tab list? → A: Most recently active first — the room with the newest message appears at the top.
- Q: What label is shown for each room in the Chat tab list? → A: Global chat is labelled "General"; group chats use their group name; event chats use the event title.
- Q: How should the chat behave when real-time connectivity is restored after a drop? → A: Automatically reconnect and fetch any missed messages since the connection dropped.
- Q: How many messages should each pagination batch load when scrolling up? → A: 50 messages per batch.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Trip Global Chat (Priority: P1)

As a TripOrganizer, I want a global chat for my trip so that all participants can
communicate in one place.

When a trip is created, a global chat room is automatically created alongside it.
Every participant who joins the trip gains immediate access to the global chat.
Messages appear in real time for everyone in the trip without needing to refresh.

**Why this priority**: The global chat is the backbone of trip communication. It is
the first thing participants expect and delivers value as soon as the first message
is sent. All other chat types build on the same foundation.

**Independent Test**: Can be fully tested by creating a trip, having two participants
join, and verifying that messages sent by one appear instantly for the other — without
any group or event needing to exist.

**Acceptance Scenarios**:

1. **Given** a trip exists, **When** it is created, **Then** a global chat room for
   that trip is automatically available to all current and future participants.
2. **Given** a participant is a member of a trip, **When** they open the global chat,
   **Then** they can read all existing messages and send new ones.
3. **Given** two participants are viewing the global chat, **When** one sends a message,
   **Then** it appears in the other's chat without requiring a manual refresh.
4. **Given** a user is not a member of a trip, **When** they attempt to access its
   global chat, **Then** access is denied.

---

### User Story 2 - Send and Receive Messages in Any Chat (Priority: P2)

As a TripParticipant, I want to send chat messages so that I can communicate with
others in the trip.

A participant can type a message and send it. The message is immediately visible to
all members of the same chat room. Each message shows the sender's display name and
the time it was sent. Messages are displayed in chronological order, newest at the
bottom. A participant can only send messages in chat rooms they have access to.

**Why this priority**: Sending and receiving messages is the core interaction of the
chat feature. Without it, none of the chat rooms have any value.

**Independent Test**: Can be fully tested within the global chat (US1) by verifying
that a sent message is stored, attributed to the correct sender, timestamped, and
visible to other members in real time.

**Acceptance Scenarios**:

1. **Given** a participant is in a chat room, **When** they type and submit a message,
   **Then** the message is saved and immediately visible to all members of that room.
2. **Given** a message is displayed in a chat, **Then** it shows the sender's name
   and the time it was sent.
3. **Given** a participant has no membership in a chat room, **When** they try to
   send a message, **Then** the action is rejected and an error is shown.
4. **Given** a participant opens a chat room, **When** the room loads, **Then** the
   most recent 50 messages are shown in chronological order, oldest at the top, and
   scrolling up loads earlier batches of messages.

---

### User Story 3 - Event Chat (Priority: P3)

As an EventParticipant, I want to send messages in an event chat so that I can
coordinate with other participants of that specific event.

Each event within a trip has its own dedicated chat room. Only participants who are
registered for that event can access its chat. This keeps event-specific planning
separate from the general trip conversation.

**Why this priority**: Event chats are valuable but require both the messaging
foundation (US2) and events to already exist. They are an extension of the core
chat capability rather than a prerequisite for it.

**Independent Test**: Can be fully tested by creating an event, registering two
participants, and verifying that messages sent in the event chat are visible only
to those two participants and not to other trip members.

**Acceptance Scenarios**:

1. **Given** an event exists within a trip, **Then** a dedicated chat room for that
   event is automatically available.
2. **Given** a participant is registered for an event, **When** they open the event
   chat, **Then** they can read and send messages.
3. **Given** a trip participant is not registered for an event, **When** they try to
   access the event chat, **Then** access is denied.
4. **Given** two event participants are viewing the event chat, **When** one sends a
   message, **Then** it appears for the other in real time.

---

### User Story 4 - Group Chat (Priority: P4)

As a TripParticipant who belongs to a group, I want to send messages in my group's
chat so that I can communicate privately with my group members.

A trip can be divided into named groups (e.g. "Team A", "Logistics"). Each group has
its own chat room visible only to its members. A participant may belong to multiple
groups and therefore have access to multiple group chats. Group membership is managed
by the TripOrganizer.

**Why this priority**: Group chats add segmented communication for larger trips. They
depend on the messaging foundation (US2) and a groups/membership concept. They are
lower priority than event chats because the trip organizer must first create groups
before they have any value.

**Independent Test**: Can be fully tested by creating a group with two members and
verifying that a message sent in the group chat is visible only to those two members
and not to other trip participants outside the group.

**Acceptance Scenarios**:

1. **Given** a group exists within a trip, **Then** a dedicated chat room for that
   group is automatically available to its members.
2. **Given** a participant is a member of a group, **When** they open the group chat,
   **Then** they can read and send messages.
3. **Given** a trip participant is not a member of a group, **When** they try to
   access the group chat, **Then** access is denied.
4. **Given** a participant belongs to two groups, **When** they view their chats,
   **Then** both group chats are accessible independently.

---

### Edge Cases

- What happens when a participant is removed from a trip mid-conversation? They
  immediately lose all read and write access to the global chat and all group/event
  chats tied to that trip. Their previously sent messages remain visible to current
  members.
- What happens when an event is deleted? The event chat and its messages are no
  longer accessible. Message history handling (archive vs. delete) is out of scope
  for this version.
- What happens when a participant is added to a group that already has chat history?
  They can read all previous messages from the moment they join.
- What happens if a message fails to send due to connectivity loss? The UI shows an
  error state and allows the user to retry.
- What happens when the real-time connection drops and is restored? The chat
  automatically reconnects and fetches any messages that arrived while disconnected.
  No manual refresh is required.
- What happens when a chat room has no messages yet? The UI shows an empty state
  prompting the first participant to send a message.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST automatically create a global chat room when a new trip
  is created.
- **FR-002**: The system MUST automatically create a chat room when a new event is
  created within a trip.
- **FR-003**: The system MUST automatically create a chat room when a new group is
  created within a trip.
- **FR-004**: A participant MUST only be able to read or send messages in chat rooms
  they have membership access to (trip member, event participant, or group member).
- **FR-005**: Users MUST be able to send a text message in any chat room they have
  access to.
- **FR-006**: All members of a chat room MUST see new messages appear without
  manually refreshing the screen. This applies to all three chat types: global,
  group, and event.
- **FR-007**: Every message MUST display the sender's display name and the timestamp
  of when it was sent.
- **FR-008**: Messages in a chat room MUST be displayed in chronological order,
  oldest at the top and newest at the bottom.
- **FR-009**: A chat room MUST load the 50 most recent messages on open. Users MUST
  be able to scroll up to load earlier messages in batches of 50.
- **FR-010**: The system MUST prevent non-members from reading or writing to a chat
  room.
- **FR-011**: The Chat tab MUST display a list of all chat rooms the participant has
  access to within the currently active trip (global chat, accessible group chats,
  accessible event chats). Tapping a room opens its message view.
- **FR-012**: Chat rooms from other trips MUST NOT appear in the Chat tab list.
- **FR-014**: Chat rooms in the list MUST be ordered by most recent activity — the
  room whose last message was sent most recently appears at the top.
- **FR-015**: The global chat room MUST be labelled "General" in the room list. Group
  chat rooms MUST use their group name. Event chat rooms MUST use the event title.
- **FR-013**: The room list MUST show a dot indicator next to any chat room that
  contains messages the participant has not yet viewed. The dot MUST disappear when
  the participant opens and views that room.

### Key Entities

- **ChatRoom**: Represents a single chat space. Has a type (global, group, or event),
  belongs to a trip, and is linked to its owning entity (the trip itself, a group, or
  an event).
- **Message**: A single text message. Belongs to a chat room, authored by a
  participant, and carries a timestamp.
- **ChatMembership**: Records which participants have access to which chat rooms.
  Derived from trip membership (global), group membership (group chat), and event
  registration (event chat). Not stored redundantly — membership is inferred from
  existing relationships.
- **ChatReadReceipt**: Records the last time a participant viewed each chat room.
  Used to determine whether the unread dot indicator should be shown. One record
  per participant per chat room.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new message sent by one participant appears on another participant's
  screen within 3 seconds under normal network conditions.
- **SC-002**: All participants of a chat room can independently verify they see the
  same message history in the same order.
- **SC-003**: A participant with no access to a chat room is unable to read or send
  any message in that room, verified by attempting the action and receiving a
  rejection.
- **SC-004**: When a chat room is opened, the 50 most recent messages load before the
  user can send a new one. Scrolling to the top triggers loading of earlier batches.
- **SC-005**: A participant belonging to multiple chat rooms (e.g. global + two group
  chats + one event chat) can switch between them and each shows its own independent
  message history.

## Assumptions

- Users are already authenticated. This feature does not introduce a new sign-in flow.
- Trips, events, and groups already exist or will be built as separate features. This
  spec covers chat rooms and messages only.
- Text-only messages are in scope. File/image attachments are out of scope for this
  version.
- Message editing and deletion are out of scope for this version.
- Push notifications for new messages are out of scope for this version.
- A participant's display name is already stored in their profile and does not need to
  be collected here.
- Chat rooms are never deleted when a group or event is removed; their messages become
  inaccessible but are retained for audit purposes. Final retention policy is deferred.
- Group membership is managed by the TripOrganizer via a separate feature; this spec
  assumes groups and memberships can already be created.
