## ADDED Requirements

### Requirement: Timeline view
The system SHALL display public articles in chronological order on a timeline.

#### Scenario: View timeline
- **WHEN** a visitor opens the timeline page
- **THEN** all public articles are displayed along a vertical timeline, ordered by publish date descending

#### Scenario: Timeline shows article preview
- **WHEN** hovering or clicking a timeline node
- **THEN** the article title, date, and brief excerpt are shown, with a link to the full article

#### Scenario: Filter timeline by year
- **WHEN** a visitor selects a year filter
- **THEN** only articles from that year are displayed on the timeline
