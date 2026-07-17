## ADDED Requirements

### Requirement: Admin login
The system SHALL allow the admin to log in with credentials.

#### Scenario: Successful login
- **WHEN** admin submits correct username and password
- **THEN** a JWT token is returned and stored, admin is redirected to dashboard

#### Scenario: Failed login
- **WHEN** admin submits incorrect credentials
- **THEN** an error message is displayed and no token is issued

### Requirement: Admin logout
The system SHALL allow the admin to log out.

#### Scenario: Logout
- **WHEN** admin clicks logout
- **THEN** the JWT token is cleared and admin is redirected to home page

### Requirement: Protected routes
The system SHALL protect admin-only pages with authentication.

#### Scenario: Unauthorized access
- **WHEN** a visitor without valid JWT token attempts to access admin pages or private articles
- **THEN** they are redirected to the login page

### Requirement: Token persistence
The system SHALL persist the JWT token across sessions.

#### Scenario: Token survives refresh
- **WHEN** admin refreshes the page while logged in
- **THEN** the admin session remains active
