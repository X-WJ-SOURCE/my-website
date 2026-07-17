## ADDED Requirements

### Requirement: Admin can manage articles
The system SHALL allow the admin to create, read, update, and delete articles.

#### Scenario: Create public article
- **WHEN** admin writes a Markdown article and sets visibility to "public"
- **THEN** the article is saved and visible to all visitors

#### Scenario: Create private article
- **WHEN** admin writes a Markdown article and sets visibility to "private"
- **THEN** the article is only visible after admin login

#### Scenario: Edit article
- **WHEN** admin edits an existing article
- **THEN** the article content and metadata are updated

#### Scenario: Delete article
- **WHEN** admin deletes an article
- **THEN** the article and its associated comments are removed

### Requirement: Article tags and categories
The system SHALL support organizing articles with tags.

#### Scenario: Add tags to article
- **WHEN** admin assigns one or more tags to an article
- **THEN** the tags are saved and displayed on the article page

#### Scenario: Filter articles by tag
- **WHEN** a visitor clicks on a tag
- **THEN** all public articles with that tag are listed

### Requirement: Markdown rendering with images
The system SHALL render Markdown content including embedded images.

#### Scenario: Render Markdown with image
- **WHEN** an article containing Markdown syntax and image references is viewed
- **THEN** the content is rendered as formatted HTML with images displayed

### Requirement: Article list pagination
The system SHALL paginate the article list.

#### Scenario: Paginate articles
- **WHEN** there are more than 10 articles
- **THEN** the article list is split into pages with navigation
