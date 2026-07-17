## ADDED Requirements

### Requirement: Post to graffiti wall
The system SHALL allow visitors to post text and images to the public graffiti wall.

#### Scenario: Post text note
- **WHEN** a visitor submits text to the graffiti wall with an optional nickname
- **THEN** a note card appears on the wall at a random position

#### Scenario: Post image note
- **WHEN** a visitor uploads an image to the graffiti wall with optional caption
- **THEN** an image card appears on the wall with the caption

#### Scenario: Post text and image together
- **WHEN** a visitor submits both text and an image
- **THEN** a combined card with text and image appears on the wall

### Requirement: View graffiti wall
The system SHALL render all wall posts in a visually scattered layout.

#### Scenario: Load wall
- **WHEN** a visitor opens the graffiti wall page
- **THEN** all approved posts are displayed in a grid/masonry layout with varied positions and rotations

### Requirement: Graffiti wall moderation
The system SHALL allow admin to manage wall posts.

#### Scenario: Delete wall post
- **WHEN** admin deletes a wall post
- **THEN** the post and its image are removed from the wall

### Requirement: Wall pagination
The system SHALL support loading more wall posts.

#### Scenario: Load more
- **WHEN** visitor scrolls to the bottom of the wall
- **THEN** additional older posts are loaded and appended
