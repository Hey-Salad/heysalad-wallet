# Implementation Plan

- [x] 1. Fix Profile Creation to Include All Required Fields
  - [x] 1.1 Update onboarding-profile.tsx to include `name` field in profile data
    - Add `name` field to profileData object, using username as default value
    - Ensure both email and phone auth paths include the name field
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 1.2 Write property test for profile data completeness
    - **Property 1: Profile Creation Includes All Required Fields**
    - **Validates: Requirements 1.1, 1.2, 6.3**
  - [x] 1.3 Write property test for contact information matching auth method
    - **Property 2: Contact Information Matches Auth Method**
    - **Validates: Requirements 1.3**

- [x] 2. Improve Error Handling for Profile Creation
  - [x] 2.1 Add user-friendly error messages for constraint violations
    - Handle "name" constraint violation specifically
    - Handle username uniqueness violation
    - Display clear error messages to user
    - _Requirements: 1.4_
  - [x] 2.2 Write unit tests for profile creation error handling
    - Test constraint violation error messages
    - Test username taken error message
    - _Requirements: 1.4_

- [x] 3. Checkpoint - Verify profile creation works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Improve Supabase Query Timeout Handling
  - [x] 4.1 Add error classification utility function
    - Create function to classify errors as offline/timeout/server/unknown
    - Return appropriate user-facing messages for each type
    - _Requirements: 2.3_
  - [x] 4.2 Write property test for error classification
    - **Property 6: Error Classification**
    - **Validates: Requirements 2.3**
  - [x] 4.3 Update SupabaseProvider with improved timeout handling
    - Add retry logic with exponential backoff
    - Improve error messages based on error type
    - Handle multiple consecutive timeouts
    - _Requirements: 2.1, 2.2, 2.5_
  - [x] 4.4 Write unit tests for timeout and retry logic
    - Test timeout triggers after 5 seconds
    - Test retry with backoff
    - Test multiple timeout suggestion
    - _Requirements: 2.2, 2.5_

- [x] 5. Verify Magic Link Token Handling
  - [x] 5.1 Review and verify auth/callback.tsx token extraction
    - Ensure access_token and refresh_token are extracted from URL hash
    - Verify session is set correctly with extracted tokens
    - Verify routing logic based on profile existence
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 5.2 Write property test for token extraction
    - **Property 3: Magic Link Token Extraction**
    - **Validates: Requirements 3.1**
  - [x] 5.3 Write property test for malformed URL handling
    - **Property 5: Malformed URL Handling**
    - **Validates: Requirements 3.4**
  - [x] 5.4 Write property test for routing logic
    - **Property 4: Profile Routing Logic**
    - **Validates: Requirements 3.3**

- [x] 6. Checkpoint - Verify auth flow works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Verify ErrorBoundary Component
  - [x] 7.1 Verify ErrorBoundary exports and imports correctly
    - Check named export in ErrorBoundary.tsx
    - Verify import in app/_layout.tsx
    - Verify Colors constant has all required properties
    - _Requirements: 5.1, 5.2, 5.4_
  - [x] 7.2 Write property test for ErrorBoundary
    - **Property 7: ErrorBoundary Catches Errors**
    - **Validates: Requirements 5.1**
  - [x] 7.3 Write unit test for error reset functionality
    - Test "Try again" button resets error state
    - _Requirements: 5.3_

- [x] 8. Add Build Version Logging
  - [x] 8.1 Add version/build info logging on app startup
    - Log app version from app.json on startup
    - Help identify if correct bundle is running
    - _Requirements: 4.3_

- [x] 9. Update Documentation
  - [x] 9.1 Document profiles table schema in AGENTS.md
    - Add profiles table columns, types, and constraints
    - Document RLS policies if applicable
    - _Requirements: 6.1, 6.2, 6.4_

- [x] 10. Final Checkpoint - Verify all fixes work end-to-end
  - Ensure all tests pass, ask the user if questions arise.
