## ADDED Requirements

### Requirement: Admin dashboard
The system SHALL provide a dashboard for the admin.

#### Scenario: View dashboard
- **WHEN** admin logs in
- **THEN** a dashboard is displayed showing overview stats (article count, comment count, unread messages)

### Requirement: Article management UI
The system SHALL provide an interface to manage articles.

#### Scenario: Article list
- **WHEN** admin views the article management page
- **THEN** all articles are listed with title, status (public/private), date, and action buttons

#### Scenario: Create article
- **WHEN** admin writes a new article using the Markdown editor
- **THEN** the article is saved with title, content, tags, and visibility setting

#### Scenario: Edit article
- **WHEN** admin clicks edit on an existing article
- **THEN** the article editor opens pre-filled with existing content

### Requirement: Content moderation UI
The system SHALL provide moderation interfaces for comments, guestbook, private messages, and wall posts.

#### Scenario: Manage comments
- **WHEN** admin views the comments management page
- **THEN** all comments are listed with ability to delete

#### Scenario: Manage private messages
- **WHEN** admin views the private messages page
- **THEN** all message threads are listed with ability to view, reply, and delete

#### Scenario: Manage guestbook and wall
- **WHEN** admin views the guestbook or wall management page
- **THEN** entries are listed with ability to delete

### Requirement: Admin settings
The system SHALL allow admin to change password.

#### Scenario: Change password
- **WHEN** admin submits current password and new password
- **THEN** the password is updated
