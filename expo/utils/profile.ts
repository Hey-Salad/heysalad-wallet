/**
 * Profile data utilities for creating and validating profile data
 * 
 * This module extracts the profile creation logic to enable property-based testing
 */

export interface User {
  id: string;
  email?: string;
  phone?: string;
}

export interface ProfileData {
  auth_user_id: string;
  username: string;
  name: string;
  email?: string;
  phone?: string;
}

/**
 * Creates profile data object with all required fields
 * 
 * @param user - The authenticated user object
 * @param username - The chosen username
 * @returns ProfileData object with all required fields populated
 */
export function createProfileData(user: User, username: string): ProfileData {
  const trimmedUsername = username.trim();
  
  // Prepare profile data - include ALL required fields
  // The 'name' field is required by the database schema (NOT NULL constraint)
  const profileData: ProfileData = {
    auth_user_id: user.id,
    username: trimmedUsername,
    name: trimmedUsername, // Use username as default value for name (required field)
  };

  // Add email if it exists (for email auth)
  if (user.email) {
    profileData.email = user.email;
  }

  // Add phone if it exists (for phone auth)
  if (user.phone) {
    profileData.phone = user.phone;
  }

  return profileData;
}

/**
 * Validates that profile data contains all required fields
 * 
 * @param profileData - The profile data to validate
 * @returns true if all required fields are present and non-empty
 */
export function validateProfileData(profileData: ProfileData): boolean {
  return (
    typeof profileData.auth_user_id === 'string' &&
    profileData.auth_user_id.length > 0 &&
    typeof profileData.username === 'string' &&
    profileData.username.length > 0 &&
    typeof profileData.name === 'string' &&
    profileData.name.length > 0
  );
}

/**
 * Checks if contact information matches the authentication method
 * 
 * @param user - The authenticated user
 * @param profileData - The created profile data
 * @returns true if contact info correctly matches auth method
 */
export function contactInfoMatchesAuthMethod(user: User, profileData: ProfileData): boolean {
  // If user authenticated via email, profile should have email
  if (user.email && !profileData.email) {
    return false;
  }
  
  // If user authenticated via phone, profile should have phone
  if (user.phone && !profileData.phone) {
    return false;
  }
  
  // Email should match if present
  if (user.email && profileData.email !== user.email) {
    return false;
  }
  
  // Phone should match if present
  if (user.phone && profileData.phone !== user.phone) {
    return false;
  }
  
  return true;
}

/**
 * Error types for profile creation
 */
export type ProfileErrorType = 
  | 'name_constraint'
  | 'username_taken'
  | 'profile_exists'
  | 'username_constraint'
  | 'auth_user_constraint'
  | 'network_error'
  | 'unknown';

/**
 * Parsed profile error with type and user-friendly message
 */
export interface ProfileError {
  type: ProfileErrorType;
  message: string;
  originalError?: unknown;
}

/**
 * User-friendly error messages for each error type
 */
const ERROR_MESSAGES: Record<ProfileErrorType, string> = {
  name_constraint: 'Profile creation failed: Name is required. Please try again.',
  username_taken: 'Username is already taken. Please choose another one.',
  profile_exists: 'Your profile already exists. Redirecting...',
  username_constraint: 'Profile creation failed: Username is required. Please try again.',
  auth_user_constraint: 'Profile creation failed: Authentication error. Please sign in again.',
  network_error: 'Unable to connect. Please check your internet connection.',
  unknown: 'An unexpected error occurred. Please try again.',
};

/**
 * Parses a Supabase error and returns a user-friendly ProfileError
 * 
 * Handles the following constraint violations:
 * - "name" NOT NULL constraint violation
 * - "username" uniqueness constraint violation
 * - "username" NOT NULL constraint violation
 * - "auth_user_id" constraint violations
 * 
 * @param error - The error from Supabase
 * @returns ProfileError with type and user-friendly message
 */
export function parseProfileError(error: unknown): ProfileError {
  // Handle null/undefined errors
  if (!error) {
    return {
      type: 'unknown',
      message: ERROR_MESSAGES.unknown,
      originalError: error,
    };
  }

  // Extract error details
  const errorObj = error as Record<string, unknown>;
  const message = (errorObj.message as string) || '';
  const code = (errorObj.code as string) || '';
  const details = (errorObj.details as string) || '';

  // Check for network errors
  if (
    message.toLowerCase().includes('network') ||
    message.toLowerCase().includes('fetch') ||
    message.toLowerCase().includes('connection') ||
    code === 'NETWORK_ERROR'
  ) {
    return {
      type: 'network_error',
      message: ERROR_MESSAGES.network_error,
      originalError: error,
    };
  }

  // Check for unique constraint violations (code 23505)
  // Need to distinguish between:
  // 1. auth_user_id unique violation = profile already exists for this user
  // 2. username unique violation = username taken by another user
  if (
    code === '23505' ||
    message.includes('duplicate key') ||
    message.includes('unique constraint')
  ) {
    // Check if it's the auth_user_id constraint (profile already exists)
    if (
      message.includes('auth_user_id') ||
      message.includes('profiles_auth_user_id_key') ||
      message.includes('profiles_pkey')
    ) {
      return {
        type: 'profile_exists',
        message: ERROR_MESSAGES.profile_exists,
        originalError: error,
      };
    }
    
    // Otherwise it's a username uniqueness violation
    return {
      type: 'username_taken',
      message: ERROR_MESSAGES.username_taken,
      originalError: error,
    };
  }
  
  // Also check for explicit username already exists message
  if (message.includes('username') && message.includes('already exists')) {
    return {
      type: 'username_taken',
      message: ERROR_MESSAGES.username_taken,
      originalError: error,
    };
  }

  // Check for username NOT NULL constraint (check before "name" since "username" contains "name")
  // Use column name pattern to be more specific
  if (
    message.includes('"username"') && 
    (message.includes('not-null') || message.includes('null value'))
  ) {
    return {
      type: 'username_constraint',
      message: ERROR_MESSAGES.username_constraint,
      originalError: error,
    };
  }

  // Check for "name" constraint violation (NOT NULL)
  // Supabase error: "null value in column \"name\" of relation \"profiles\" violates not-null constraint"
  if (
    message.includes('"name"') && 
    (message.includes('not-null') || message.includes('null value'))
  ) {
    return {
      type: 'name_constraint',
      message: ERROR_MESSAGES.name_constraint,
      originalError: error,
    };
  }

  // Check for auth_user_id constraint violations
  if (
    message.includes('auth_user_id') ||
    message.includes('auth_user') ||
    details.includes('auth_user')
  ) {
    return {
      type: 'auth_user_constraint',
      message: ERROR_MESSAGES.auth_user_constraint,
      originalError: error,
    };
  }

  // Unknown error - return generic message
  return {
    type: 'unknown',
    message: ERROR_MESSAGES.unknown,
    originalError: error,
  };
}

/**
 * Gets the user-friendly message for a given error type
 * 
 * @param errorType - The type of profile error
 * @returns User-friendly error message
 */
export function getErrorMessage(errorType: ProfileErrorType): string {
  return ERROR_MESSAGES[errorType];
}
