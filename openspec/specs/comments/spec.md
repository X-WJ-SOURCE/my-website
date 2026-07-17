## ADDED Requirements

### Requirement: Post comment on article
The system SHALL allow visitors to post comments on articles.

#### Scenario: Post text comment
- **WHEN** a visitor submits a text comment on an article
- **THEN** the comment appears under the article with a timestamp

#### Scenario: Post comment with image
- **WHEN** a visitor submits a comment with an attached image
- **THEN** the comment displays both text and the uploaded image

### Requirement: View article comments
The system SHALL display all comments for an article.

#### Scenario: Load comments
- **WHEN** a visitor views an article
- **THEN** all approved comments for that article are displayed in chronological order

### Requirement: Comment moderation
The system SHALL allow admin to moderate comments.

#### Scenario: Delete inappropriate comment
- **WHEN** admin deletes a comment
- **THEN** the comment is removed from the article

### Requirement: Anonymous commenting
The system SHALL allow comments without requiring login, with optional nickname.

#### Scenario: Anonymous comment
- **WHEN** a visitor posts a comment without providing a name
- **THEN** the comment is displayed as "Anonymous"
