## ADDED Requirements

### Requirement: Theme toggle
The system SHALL support light and dark themes.

#### Scenario: Toggle theme
- **WHEN** a visitor clicks the theme toggle button
- **THEN** the page switches between light and dark theme instantly

#### Scenario: Persist preference
- **WHEN** a visitor selects a theme
- **THEN** the preference is saved to localStorage and applied on subsequent visits

#### Scenario: System default
- **WHEN** a first-time visitor loads the site
- **THEN** the theme matches the visitor's system preference (prefers-color-scheme)
