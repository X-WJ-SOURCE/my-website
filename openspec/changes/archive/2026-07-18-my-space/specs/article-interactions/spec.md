## ADDED Requirements

### Requirement: Article reactions
The system SHALL allow visitors to react to articles with emoji.

#### Scenario: Add reaction
- **WHEN** a visitor clicks an emoji reaction button (e.g., ❤️, 😂, 👍, 😮, 😢) on an article
- **THEN** the reaction count increments and the visitor's reaction is highlighted

#### Scenario: Toggle reaction
- **WHEN** a visitor clicks the same emoji again
- **THEN** their reaction is removed and the count decrements

#### Scenario: View reactions
- **WHEN** viewing an article
- **THEN** reaction counts for each emoji type are displayed

### Requirement: Article view count
The system SHALL track and display per-article view count.

#### Scenario: Increment view count
- **WHEN** a visitor loads an article page
- **THEN** the view count for that article increments by one

#### Scenario: Display view count
- **WHEN** viewing an article or the article list
- **THEN** the view count is displayed alongside the article

#### Scenario: Avoid duplicate counts
- **WHEN** the same visitor refreshes the article within 30 minutes
- **THEN** the view count does not increment again
