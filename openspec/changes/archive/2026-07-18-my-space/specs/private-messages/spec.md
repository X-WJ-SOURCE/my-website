## ADDED Requirements

### Requirement: Send private message
The system SHALL allow visitors to send private messages to the admin anonymously.

#### Scenario: Send anonymous message
- **WHEN** a visitor submits a private message with optional nickname and optional image
- **THEN** the message is stored and only visible to admin in the dashboard

#### Scenario: Send message with image
- **WHEN** a visitor attaches an image to a private message
- **THEN** the image is uploaded and associated with the message

### Requirement: Admin view private messages
The system SHALL display private messages in the admin dashboard.

#### Scenario: View messages list
- **WHEN** admin opens the private messages section
- **THEN** all messages are listed with sender info, content, and timestamp

#### Scenario: View single message thread
- **WHEN** admin clicks on a message
- **THEN** the full message thread with replies is displayed

### Requirement: Admin reply to private message
The system SHALL allow admin to reply to private messages.

#### Scenario: Admin reply
- **WHEN** admin writes a reply to a private message
- **THEN** the reply is saved and visible to the original sender when they view the thread

### Requirement: Sender view reply
The system SHALL allow the original sender to view admin replies.

#### Scenario: Check reply with thread ID
- **WHEN** a visitor accesses a private message thread with the correct thread ID
- **THEN** they can see the admin's replies

### Requirement: Message deletion
The system SHALL allow admin to delete private message threads.

#### Scenario: Delete thread
- **WHEN** admin deletes a private message thread
- **THEN** the entire thread and associated images are removed
