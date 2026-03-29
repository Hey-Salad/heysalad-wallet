# Requirements Document

## Introduction

This specification addresses critical authentication and database issues in the HeySalad Wallet mobile application. The app currently experiences multiple failures in the authentication flow including profile creation errors due to database schema constraints, Supabase query timeouts, and potential Metro bundler cache issues causing stale code execution. These issues prevent users from successfully signing up and using the wallet application.

## Glossary

- **HeySalad_Wallet**: The React Native/Expo mobile cryptocurrency wallet application
- **Supabase**: The backend-as-a-service platform providing authentication and database services
- **Profile**: A database record in the `profiles` table containing user information (username, email, phone)
- **Magic_Link**: An email-based passwordless authentication method that sends a clickable link to sign in
- **OTP**: One-Time Password sent via SMS for phone-based authentication
- **Metro_Bundler**: The JavaScript bundler used by React Native to compile and serve the application code
- **RLS**: Row Level Security - Supabase's policy-based access control for database tables
- **Deep_Link**: A URL scheme (heysalad://) that opens the app directly to a specific screen

## Requirements

### Requirement 1

**User Story:** As a new user, I want to create my profile after signing in, so that I can start using the wallet application.

#### Acceptance Criteria

1. WHEN a user submits the profile creation form with a valid username THEN the HeySalad_Wallet SHALL insert a complete profile record including all required database fields
2. WHEN the profiles table requires a `name` field THEN the HeySalad_Wallet SHALL provide a value for the `name` field during profile creation
3. WHEN a user creates a profile THEN the HeySalad_Wallet SHALL handle both email-authenticated and phone-authenticated users by storing the appropriate contact information
4. IF the profile creation fails due to a database constraint violation THEN the HeySalad_Wallet SHALL display a user-friendly error message explaining the issue
5. WHEN a profile is successfully created THEN the HeySalad_Wallet SHALL navigate the user to the main wallet screen within 2 seconds

### Requirement 2

**User Story:** As a user, I want the app to respond quickly when checking my authentication status, so that I can access my wallet without long delays.

#### Acceptance Criteria

1. WHEN the HeySalad_Wallet queries the Supabase profiles table THEN the query SHALL complete within 3 seconds under normal network conditions
2. IF a Supabase query exceeds 5 seconds THEN the HeySalad_Wallet SHALL cancel the query and display a timeout error with retry option
3. WHEN a network error occurs during authentication THEN the HeySalad_Wallet SHALL detect the error type and display an appropriate message (offline, timeout, server error)
4. WHEN the app initializes THEN the HeySalad_Wallet SHALL complete the session check and profile fetch within 5 seconds total
5. IF multiple consecutive timeouts occur THEN the HeySalad_Wallet SHALL suggest the user check their network connection

### Requirement 3

**User Story:** As a user clicking a magic link, I want to be authenticated and directed to the correct screen, so that I can access my wallet seamlessly.

#### Acceptance Criteria

1. WHEN a user clicks a magic link email THEN the HeySalad_Wallet SHALL extract the access_token and refresh_token from the URL
2. WHEN valid tokens are extracted THEN the HeySalad_Wallet SHALL set the Supabase session using those tokens
3. WHEN the session is set successfully THEN the HeySalad_Wallet SHALL check for an existing profile and route accordingly (onboarding or main app)
4. IF the magic link URL is malformed or missing tokens THEN the HeySalad_Wallet SHALL redirect to the sign-in screen with an error message
5. WHEN processing a magic link THEN the HeySalad_Wallet SHALL use only the auth/callback route handler without duplicate deep link handlers

### Requirement 4

**User Story:** As a developer, I want the app to use fresh bundled code, so that recent fixes are applied correctly.

#### Acceptance Criteria

1. WHEN the Metro bundler serves the application THEN the HeySalad_Wallet SHALL use the latest compiled code without stale cache artifacts
2. WHEN code changes are made to authentication handlers THEN the HeySalad_Wallet SHALL reflect those changes after a cache clear and restart
3. WHEN the app starts THEN the HeySalad_Wallet SHALL log version or build information to confirm the correct bundle is running
4. IF stale code is detected (e.g., removed handlers still executing) THEN the developer SHALL clear Metro cache using the documented procedure

### Requirement 5

**User Story:** As a user, I want error messages to display correctly when something goes wrong, so that I understand what happened and can take action.

#### Acceptance Criteria

1. WHEN an error occurs in the application THEN the ErrorBoundary component SHALL catch and display the error gracefully
2. WHEN the ErrorBoundary component is imported THEN the HeySalad_Wallet SHALL resolve the import without undefined reference errors
3. WHEN an error is displayed THEN the HeySalad_Wallet SHALL provide a "Try again" button that resets the error state
4. WHEN the Colors constant is referenced THEN the HeySalad_Wallet SHALL resolve all color properties (surface, red, ink, inkMuted) without undefined errors

### Requirement 6

**User Story:** As a developer, I want the database schema documented, so that I can ensure the app provides all required fields during data operations.

#### Acceptance Criteria

1. WHEN the profiles table schema is queried THEN the documentation SHALL list all columns, their types, and NOT NULL constraints
2. WHEN RLS policies exist on the profiles table THEN the documentation SHALL describe each policy's purpose and conditions
3. WHEN the app creates a profile THEN the code SHALL include all NOT NULL fields as defined in the database schema
4. WHEN the database schema changes THEN the AGENTS.md file SHALL be updated to reflect the current schema
