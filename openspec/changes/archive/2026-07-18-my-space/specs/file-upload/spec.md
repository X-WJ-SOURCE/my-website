## ADDED Requirements

### Requirement: Upload image
The system SHALL accept image uploads via API.

#### Scenario: Upload valid image
- **WHEN** a client uploads a JPG, PNG, GIF, or WebP image under 10MB
- **THEN** the image is saved to disk and a public URL is returned

#### Scenario: Reject invalid file
- **WHEN** a client uploads a non-image file or file exceeding size limit
- **THEN** an error response is returned

### Requirement: Serve images
The system SHALL serve uploaded images via public URL.

#### Scenario: Access image
- **WHEN** a visitor requests an uploaded image URL
- **THEN** the image file is served with appropriate content type

### Requirement: Image deletion
The system SHALL clean up images when associated content is deleted.

#### Scenario: Cascade delete
- **WHEN** an article, comment, or message containing an image is deleted
- **THEN** the associated image file is also removed from disk
