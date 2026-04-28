# Feature Specification: Chat Image Sharing

**Feature Branch**: `003-chat-image-sharing`  
**Created**: 2026-04-27  
**Status**: Draft  
**Input**: User description: "As a Tripparticipant, I want to be able to send pictures in the chat rooms so I can share pictures with the other members of the chat room. I want each message to have up to 10 images that can be clicked on to make them larger and focused as you usually do in like the gallery. Each message with one or more images should also allow to send text along with it."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Send Images in a Chat Message (Priority: P1)

A TripParticipant opens a chat room, taps the image attach button, selects one or more photos from their device (up to 10), optionally types a text caption, and sends the message. The images appear in the conversation for all participants.

**Why this priority**: This is the core feature. Without the ability to send images, nothing else in this feature has value.

**Independent Test**: Can be fully tested by selecting images and sending a message, then verifying the images appear in the chat for both sender and recipient.

**Acceptance Scenarios**:

1. **Given** a TripParticipant is in a chat room, **When** they attach 1–10 images and press send, **Then** the message appears in the conversation with all selected images visible.
2. **Given** a TripParticipant attaches images, **When** they also type text before sending, **Then** both the text and the images appear together in the same message.
3. **Given** a TripParticipant selects images, **When** the total count exceeds 10, **Then** the system prevents selecting more and displays a message indicating the 10-image limit.
4. **Given** a TripParticipant sends a message with only images (no text), **Then** the message is sent successfully without requiring a text caption.

---

### User Story 2 - View Images Full-Screen (Priority: P2)

A TripParticipant viewing a chat message with images can tap any image to open it full-screen. If the message contains multiple images, they can swipe through them in a gallery-style viewer.

**Why this priority**: Sending images is useful even without a viewer, but the user explicitly requested gallery-style viewing — it is the primary way to consume the images and needed for the feature to feel complete.

**Independent Test**: Can be fully tested by tapping an image in any chat message and verifying the full-screen viewer opens and swipe navigation works for multi-image messages.

**Acceptance Scenarios**:

1. **Given** a message with one or more images is visible in the chat, **When** a participant taps an image, **Then** it opens full-screen with a close/dismiss action.
2. **Given** the full-screen viewer is open for a message with multiple images, **When** the participant swipes left or right, **Then** the adjacent images are shown in sequence.
3. **Given** the full-screen viewer is open, **When** the participant taps outside the image or presses back, **Then** the viewer closes and returns to the chat.

---

### Edge Cases

- What happens when an image fails to upload mid-send? The message should not be sent partially; the user should see an error and be able to retry.
- What happens if the user selects images but loses connectivity before sending? The send should fail gracefully with an error message.
- What happens when an image in a received message fails to load? A placeholder should be shown instead of a broken image.
- How does the layout adapt when a message contains a single image vs. a grid of multiple images? A single image is displayed full-width within the bubble. Multiple images use a 2-column grid; if there are more than 4, the 4th tile shows a "+N" count and all images are reachable via the gallery viewer.
- What happens if the user navigates away from the chat while images are still uploading? The upload is cancelled and the in-progress message is discarded; no partial message is sent.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: TripParticipants MUST be able to attach between 1 and 10 images to a single chat message.
- **FR-002**: TripParticipants MUST be able to include optional text alongside images in the same message.
- **FR-003**: TripParticipants MUST be able to send a message containing only images, with no text required.
- **FR-004**: The system MUST prevent attaching more than 10 images to a single message and inform the user of the limit.
- **FR-004a**: After selecting images, the system MUST display a thumbnail strip showing all selected images. Each thumbnail MUST have an individual remove button so the user can deselect images before sending.
- **FR-005**: Images attached to a message MUST be visible to all participants in the chat room.
- **FR-006**: TripParticipants MUST be able to tap any image in a message to view it full-screen.
- **FR-007**: When a message contains multiple images, the full-screen viewer MUST support swiping between images in the order they were attached.
- **FR-008**: The full-screen viewer MUST be dismissible via a close button or back gesture.
- **FR-009**: If an image upload fails, the system MUST notify the user and allow them to retry without losing their composed message.
- **FR-010**: Images MUST be stored per-message so that each image is linked to the message it was sent with.
- **FR-011**: A message with a single image MUST display it full-width within the bubble. A message with multiple images MUST display them in a 2-column grid; if there are more than 4 images, the 4th tile MUST show a "+N" overflow count indicating the remaining images, all of which are reachable via the gallery viewer.

### Key Entities

- **Message**: An existing entity representing a chat message. May now have zero or more associated images alongside optional text content.
- **Chat Image**: Represents a single image attached to a message. Linked to exactly one message. Stores a reference to the uploaded image file. Images are displayed in insertion order (the order they were uploaded); no explicit position column is required.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A TripParticipant can select, attach, and send up to 10 images in a single message in under 30 seconds (excluding network upload time).
- **SC-002**: Images sent in a message are visible to all chat participants within 5 seconds of the send completing under normal network conditions.
- **SC-003**: Tapping an image opens the full-screen viewer in under 1 second.
- **SC-004**: 100% of messages with images display all attached images to recipients without requiring a page refresh or manual reload.
- **SC-005**: Attempting to attach more than 10 images results in a clear user-facing limit message 100% of the time.

## Clarifications

### Session 2026-04-27

- Q: What determines display order for multiple images in a message? → A: Insertion order — images display in the order they were uploaded; no position column is needed.
- Q: Should image files in storage be publicly accessible or restricted to authenticated chat participants? → A: Authenticated participants only — only users who are members of the chat room may access images.
- Q: Can the user review and remove individual images before sending? → A: Yes — a thumbnail strip with per-image remove buttons is shown below the input field before sending.
- Q: What happens if the user navigates away while images are uploading? → A: Cancel — the upload is cancelled and the in-progress message is discarded.
- Q: How should multiple images be laid out in the message bubble? → A: 2-column grid; if more than 4 images, the 4th tile shows a "+N" overflow count; all images are accessible via the gallery viewer.

## Assumptions

- The device photo library (camera roll) is the source for image selection; in-app camera capture is out of scope for this feature.
- Image compression or resizing before upload is handled automatically to keep message sizes reasonable; the user does not configure this.
- All TripParticipants in a chat room have equal permission to send images; no additional role-based restriction is needed beyond existing chat membership.
- The existing `chat_image` table (with `image_url` and `message_id` columns) is the intended storage model for linking images to messages.
- Supabase Storage is used as the file storage backend for uploaded images. The storage bucket is private; images are accessible only to authenticated users who are members of the chat room the message belongs to.
- The 10-image limit per message is enforced on the client side; the database does not enforce this constraint directly.
- Video files are out of scope; only still images are supported.
