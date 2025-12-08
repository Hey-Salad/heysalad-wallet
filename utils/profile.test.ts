/**
 * Property-based tests for profile creation
 * 
 * **Feature: auth-critical-fixes**
 * 
 * These tests verify the correctness properties defined in the design document
 * using fast-check for property-based testing.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  createProfileData,
  validateProfileData,
  contactInfoMatchesAuthMethod,
  parseProfileError,
  getErrorMessage,
  User,
  ProfileError,
  ProfileErrorType,
} from './profile';

/**
 * **Feature: auth-critical-fixes, Property 1: Profile Creation Includes All Required Fields**
 * 
 * *For any* valid username and authenticated user, when creating a profile,
 * the profile data object SHALL contain all NOT NULL fields defined in the
 * database schema (auth_user_id, username, name).
 * 
 * **Validates: Requirements 1.1, 1.2, 6.3**
 */
describe('Property 1: Profile Creation Includes All Required Fields', () => {
  it('should always include auth_user_id, username, and name for any valid input', () => {
    // Arbitrary for valid usernames (non-empty, non-whitespace-only strings)
    const validUsernameArb = fc.string({ minLength: 1 })
      .filter(s => s.trim().length > 0);
    
    // Arbitrary for user IDs (UUID-like strings)
    const userIdArb = fc.uuid();
    
    // Arbitrary for optional email
    const emailArb = fc.option(fc.emailAddress(), { nil: undefined });
    
    // Arbitrary for optional phone
    const phoneArb = fc.option(
      fc.stringMatching(/^\+[1-9]\d{6,14}$/),
      { nil: undefined }
    );

    fc.assert(
      fc.property(
        userIdArb,
        validUsernameArb,
        emailArb,
        phoneArb,
        (userId, username, email, phone) => {
          const user: User = { id: userId, email, phone };
          const profileData = createProfileData(user, username);
          
          // Property: All required fields must be present and non-empty
          expect(profileData.auth_user_id).toBe(userId);
          expect(profileData.username).toBe(username.trim());
          expect(profileData.name).toBe(username.trim());
          
          // Validate using the validation function
          expect(validateProfileData(profileData)).toBe(true);
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design doc
    );
  });

  it('should use username as the default value for name field', () => {
    const validUsernameArb = fc.string({ minLength: 1 })
      .filter(s => s.trim().length > 0);
    const userIdArb = fc.uuid();

    fc.assert(
      fc.property(
        userIdArb,
        validUsernameArb,
        (userId, username) => {
          const user: User = { id: userId };
          const profileData = createProfileData(user, username);
          
          // Property: name should equal trimmed username
          expect(profileData.name).toBe(profileData.username);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: auth-critical-fixes, Property 2: Contact Information Matches Auth Method**
 * 
 * *For any* authenticated user, when creating a profile, if the user authenticated
 * via email then the profile SHALL contain the email field, and if the user
 * authenticated via phone then the profile SHALL contain the phone field.
 * 
 * **Validates: Requirements 1.3**
 */
describe('Property 2: Contact Information Matches Auth Method', () => {
  it('should include email when user authenticated via email', () => {
    const userIdArb = fc.uuid();
    const emailArb = fc.emailAddress();
    const validUsernameArb = fc.string({ minLength: 1 })
      .filter(s => s.trim().length > 0);

    fc.assert(
      fc.property(
        userIdArb,
        emailArb,
        validUsernameArb,
        (userId, email, username) => {
          const user: User = { id: userId, email };
          const profileData = createProfileData(user, username);
          
          // Property: email-authenticated users should have email in profile
          expect(profileData.email).toBe(email);
          expect(contactInfoMatchesAuthMethod(user, profileData)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include phone when user authenticated via phone', () => {
    const userIdArb = fc.uuid();
    const phoneArb = fc.stringMatching(/^\+[1-9]\d{6,14}$/);
    const validUsernameArb = fc.string({ minLength: 1 })
      .filter(s => s.trim().length > 0);

    fc.assert(
      fc.property(
        userIdArb,
        phoneArb,
        validUsernameArb,
        (userId, phone, username) => {
          const user: User = { id: userId, phone };
          const profileData = createProfileData(user, username);
          
          // Property: phone-authenticated users should have phone in profile
          expect(profileData.phone).toBe(phone);
          expect(contactInfoMatchesAuthMethod(user, profileData)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include both email and phone when user has both', () => {
    const userIdArb = fc.uuid();
    const emailArb = fc.emailAddress();
    const phoneArb = fc.stringMatching(/^\+[1-9]\d{6,14}$/);
    const validUsernameArb = fc.string({ minLength: 1 })
      .filter(s => s.trim().length > 0);

    fc.assert(
      fc.property(
        userIdArb,
        emailArb,
        phoneArb,
        validUsernameArb,
        (userId, email, phone, username) => {
          const user: User = { id: userId, email, phone };
          const profileData = createProfileData(user, username);
          
          // Property: users with both should have both in profile
          expect(profileData.email).toBe(email);
          expect(profileData.phone).toBe(phone);
          expect(contactInfoMatchesAuthMethod(user, profileData)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not include email or phone when user has neither', () => {
    const userIdArb = fc.uuid();
    const validUsernameArb = fc.string({ minLength: 1 })
      .filter(s => s.trim().length > 0);

    fc.assert(
      fc.property(
        userIdArb,
        validUsernameArb,
        (userId, username) => {
          const user: User = { id: userId };
          const profileData = createProfileData(user, username);
          
          // Property: users without contact info should not have it in profile
          expect(profileData.email).toBeUndefined();
          expect(profileData.phone).toBeUndefined();
          expect(contactInfoMatchesAuthMethod(user, profileData)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Unit tests for profile creation error handling
 * 
 * **Feature: auth-critical-fixes**
 * 
 * These tests verify that profile creation errors are correctly parsed
 * and user-friendly messages are returned.
 * 
 * **Validates: Requirements 1.4**
 */
describe('Profile Error Handling', () => {
  describe('parseProfileError', () => {
    it('should return name_constraint error for name NOT NULL violation', () => {
      const error = {
        message: 'null value in column "name" of relation "profiles" violates not-null constraint',
        code: '23502',
      };
      
      const result = parseProfileError(error);
      
      expect(result.type).toBe('name_constraint');
      expect(result.message).toBe('Profile creation failed: Name is required. Please try again.');
      expect(result.originalError).toBe(error);
    });

    it('should return username_taken error for unique constraint violation', () => {
      const error = {
        message: 'duplicate key value violates unique constraint "profiles_username_key"',
        code: '23505',
      };
      
      const result = parseProfileError(error);
      
      expect(result.type).toBe('username_taken');
      expect(result.message).toBe('Username is already taken. Please choose another one.');
    });

    it('should return username_taken error when code is 23505', () => {
      const error = {
        message: 'some other message',
        code: '23505',
      };
      
      const result = parseProfileError(error);
      
      expect(result.type).toBe('username_taken');
    });

    it('should return username_constraint error for username NOT NULL violation', () => {
      const error = {
        message: 'null value in column "username" of relation "profiles" violates not-null constraint',
        code: '23502',
      };
      
      const result = parseProfileError(error);
      
      expect(result.type).toBe('username_constraint');
      expect(result.message).toBe('Profile creation failed: Username is required. Please try again.');
    });

    it('should return auth_user_constraint error for auth_user_id violations', () => {
      const error = {
        message: 'insert or update on table "profiles" violates foreign key constraint "profiles_auth_user_id_fkey"',
        code: '23503',
      };
      
      const result = parseProfileError(error);
      
      expect(result.type).toBe('auth_user_constraint');
      expect(result.message).toBe('Profile creation failed: Authentication error. Please sign in again.');
    });

    it('should return network_error for network-related errors', () => {
      const error = {
        message: 'Network request failed',
        code: 'NETWORK_ERROR',
      };
      
      const result = parseProfileError(error);
      
      expect(result.type).toBe('network_error');
      expect(result.message).toBe('Unable to connect. Please check your internet connection.');
    });

    it('should return network_error for connection errors', () => {
      const error = {
        message: 'Failed to establish connection',
      };
      
      const result = parseProfileError(error);
      
      expect(result.type).toBe('network_error');
    });

    it('should return network_error for fetch errors', () => {
      const error = {
        message: 'fetch failed',
      };
      
      const result = parseProfileError(error);
      
      expect(result.type).toBe('network_error');
    });

    it('should return unknown error for unrecognized errors', () => {
      const error = {
        message: 'Something completely unexpected happened',
        code: 'UNKNOWN',
      };
      
      const result = parseProfileError(error);
      
      expect(result.type).toBe('unknown');
      expect(result.message).toBe('An unexpected error occurred. Please try again.');
    });

    it('should return unknown error for null/undefined errors', () => {
      expect(parseProfileError(null).type).toBe('unknown');
      expect(parseProfileError(undefined).type).toBe('unknown');
    });

    it('should return unknown error for empty object', () => {
      const result = parseProfileError({});
      
      expect(result.type).toBe('unknown');
    });
  });

  describe('getErrorMessage', () => {
    it('should return correct message for each error type', () => {
      const errorTypes: ProfileErrorType[] = [
        'name_constraint',
        'username_taken',
        'username_constraint',
        'auth_user_constraint',
        'network_error',
        'unknown',
      ];

      errorTypes.forEach((type) => {
        const message = getErrorMessage(type);
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
      });
    });

    it('should return user-friendly message for name_constraint', () => {
      expect(getErrorMessage('name_constraint')).toContain('Name is required');
    });

    it('should return user-friendly message for username_taken', () => {
      expect(getErrorMessage('username_taken')).toContain('already taken');
    });
  });
});
