## ADDED Requirements

### Requirement: Post guestbook entry
The system SHALL allow visitors to leave messages on the public guestbook.

#### Scenario: Post text message
- **WHEN** a visitor submits a message on the guestbook page
- **THEN** the message appears in the guestbook list with timestamp

#### Scenario: Post message with image
- **WHEN** a visitor submits a guestbook entry with an attached image
- **THEN** the entry displays both text and the uploaded image

### Requirement: View guestbook
The system SHALL display all guestbook entries.

#### Scenario: Load guestbook
- **WHEN** a visitor opens the guestbook page
- **THEN** all approved guestbook entries are displayed with pagination

### Requirement: Guestbook moderation
The system SHALL allow admin to manage guestbook entries.

#### Scenario: Delete guestbook entry
- **WHEN** admin deletes a guestbook entry
- **THEN** the entry is removed from the guestbook
