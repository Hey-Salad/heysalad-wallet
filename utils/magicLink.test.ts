/**
 * Property-based tests for magic link URL parsing
 * 
 * **Feature: auth-critical-fixes**
 * 
 * These tests verify the correctness properties defined in the design document
 * using fast-check for property-based testing.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  extractTokensFromUrl,
  getRouteForProfile,
  createMagicLinkUrl,
  MagicLinkParseResult,
} from './magicLink';

/**
 * **Feature: auth-critical-fixes, Property 3: Magic Link Token Extraction**
 * 
 * *For any* valid magic link URL containing access_token and refresh_token
 * in the hash fragment, the token extraction function SHALL return both
 * tokens correctly parsed.
 * 
 * **Validates: Requirements 3.1**
 */
describe('Property 3: Magic Link Token Extraction', () => {
  // Arbitrary for valid JWT-like tokens (alphanumeric with dots and underscores)
  const tokenArb = fc.stringMatching(/^[A-Za-z0-9_-]{10,100}(\.[A-Za-z0-9_-]{10,100}){0,2}$/);

  it('should extract tokens from hash fragment for any valid token pair', () => {
    fc.assert(
      fc.property(
        tokenArb,
        tokenArb,
        (accessToken, refreshToken) => {
          // Create a magic link URL with tokens in hash
          const url = createMagicLinkUrl(accessToken, refreshToken, true);
          
          const result = extractTokensFromUrl(url);
          
          // Property: Extraction should succeed
          expect(result.success).toBe(true);
          
          if (result.success) {
            // Property: Extracted tokens should match original tokens
            expect(result.tokens.access_token).toBe(accessToken);
            expect(result.tokens.refresh_token).toBe(refreshToken);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should extract tokens from query parameters for any valid token pair', () => {
    fc.assert(
      fc.property(
        tokenArb,
        tokenArb,
        (accessToken, refreshToken) => {
          // Create a magic link URL with tokens in query params
          const url = createMagicLinkUrl(accessToken, refreshToken, false);
          
          const result = extractTokensFromUrl(url);
          
          // Property: Extraction should succeed
          expect(result.success).toBe(true);
          
          if (result.success) {
            // Property: Extracted tokens should match original tokens
            expect(result.tokens.access_token).toBe(accessToken);
            expect(result.tokens.refresh_token).toBe(refreshToken);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should round-trip tokens through URL creation and extraction', () => {
    fc.assert(
      fc.property(
        tokenArb,
        tokenArb,
        fc.boolean(),
        (accessToken, refreshToken, useHash) => {
          // Create URL
          const url = createMagicLinkUrl(accessToken, refreshToken, useHash);
          
          // Extract tokens
          const result = extractTokensFromUrl(url);
          
          // Property: Round-trip should preserve tokens exactly
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.tokens.access_token).toBe(accessToken);
            expect(result.tokens.refresh_token).toBe(refreshToken);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: auth-critical-fixes, Property 5: Malformed URL Handling**
 * 
 * *For any* magic link URL that is malformed or missing required tokens,
 * the URL parser SHALL return an error result and the app SHALL redirect
 * to sign-in with an error message.
 * 
 * **Validates: Requirements 3.4**
 */
describe('Property 5: Malformed URL Handling', () => {
  it('should return error for null/undefined/empty URLs', () => {
    const emptyInputArb = fc.oneof(
      fc.constant(null),
      fc.constant(undefined),
      fc.constant(''),
      fc.constant('   '),
    );

    fc.assert(
      fc.property(emptyInputArb, (input) => {
        const result = extractTokensFromUrl(input as any);
        
        // Property: Should fail for empty inputs
        expect(result.success).toBe(false);
        
        if (!result.success) {
          // Property: Should have an error type
          expect(['invalid_url', 'not_callback', 'missing_tokens']).toContain(result.error.type);
          // Property: Should have an error message
          expect(result.error.message.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should return error for URLs without auth/callback path', () => {
    const nonCallbackUrlArb = fc.oneof(
      fc.constant('heysalad://home'),
      fc.constant('heysalad://settings'),
      fc.constant('https://example.com/login'),
      fc.webUrl(),
    ).filter(url => !url.includes('auth/callback'));

    fc.assert(
      fc.property(nonCallbackUrlArb, (url) => {
        const result = extractTokensFromUrl(url);
        
        // Property: Should fail for non-callback URLs
        expect(result.success).toBe(false);
        
        if (!result.success) {
          expect(result.error.type).toBe('not_callback');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should return error for callback URLs missing tokens', () => {
    const missingTokenUrlArb = fc.oneof(
      // No tokens at all
      fc.constant('heysalad://auth/callback'),
      // Only access_token
      fc.constant('heysalad://auth/callback#access_token=abc123'),
      // Only refresh_token
      fc.constant('heysalad://auth/callback#refresh_token=xyz789'),
      // Empty tokens
      fc.constant('heysalad://auth/callback#access_token=&refresh_token='),
    );

    fc.assert(
      fc.property(missingTokenUrlArb, (url) => {
        const result = extractTokensFromUrl(url);
        
        // Property: Should fail for URLs missing tokens
        expect(result.success).toBe(false);
        
        if (!result.success) {
          expect(result.error.type).toBe('missing_tokens');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should return error for completely invalid URLs', () => {
    // Generate strings that are not valid URLs
    const invalidUrlArb = fc.oneof(
      fc.constant('not a url at all'),
      fc.constant(':::invalid:::'),
      fc.constant('auth/callback without scheme'),
    );

    fc.assert(
      fc.property(invalidUrlArb, (input) => {
        const result = extractTokensFromUrl(input);
        
        // Property: Should fail for invalid URLs
        expect(result.success).toBe(false);
        
        if (!result.success) {
          expect(['invalid_url', 'not_callback']).toContain(result.error.type);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should always return a well-formed error result for any malformed input', () => {
    // Generate various malformed inputs
    const malformedInputArb = fc.oneof(
      fc.constant(null),
      fc.constant(undefined),
      fc.constant(''),
      fc.string().filter(s => !s.includes('auth/callback')),
      fc.constant('heysalad://auth/callback'), // Missing tokens
    );

    fc.assert(
      fc.property(malformedInputArb, (input) => {
        const result = extractTokensFromUrl(input as any);
        
        // Property: Result should always be well-formed
        expect(typeof result.success).toBe('boolean');
        
        if (!result.success) {
          // Property: Error should have type and message
          expect(typeof result.error.type).toBe('string');
          expect(typeof result.error.message).toBe('string');
          expect(result.error.message.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: auth-critical-fixes, Property 4: Profile Routing Logic**
 * 
 * *For any* authenticated session, when checking for profile existence,
 * if a profile exists the app SHALL route to the main wallet screen,
 * and if no profile exists the app SHALL route to the onboarding screen.
 * 
 * **Validates: Requirements 3.3**
 */
describe('Property 4: Profile Routing Logic', () => {
  it('should route to wallet for any user with profile', () => {
    fc.assert(
      fc.property(fc.constant(true), (hasProfile) => {
        const route = getRouteForProfile(hasProfile);
        
        // Property: Users with profiles should go to wallet
        expect(route).toBe('/(tabs)/(wallet)');
      }),
      { numRuns: 100 }
    );
  });

  it('should route to onboarding for any user without profile', () => {
    fc.assert(
      fc.property(fc.constant(false), (hasProfile) => {
        const route = getRouteForProfile(hasProfile);
        
        // Property: Users without profiles should go to onboarding
        expect(route).toBe('/onboarding-profile');
      }),
      { numRuns: 100 }
    );
  });

  it('should always return a valid route for any boolean input', () => {
    fc.assert(
      fc.property(fc.boolean(), (hasProfile) => {
        const route = getRouteForProfile(hasProfile);
        
        // Property: Route should always be a non-empty string
        expect(typeof route).toBe('string');
        expect(route.length).toBeGreaterThan(0);
        
        // Property: Route should be one of the two valid routes
        expect(['/(tabs)/(wallet)', '/onboarding-profile']).toContain(route);
        
        // Property: Route should be deterministic based on hasProfile
        expect(getRouteForProfile(hasProfile)).toBe(route);
      }),
      { numRuns: 100 }
    );
  });

  it('should be consistent across multiple calls with same input', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.integer({ min: 1, max: 10 }),
        (hasProfile, numCalls) => {
          const routes = Array.from({ length: numCalls }, () => getRouteForProfile(hasProfile));
          
          // Property: All calls with same input should return same route
          expect(new Set(routes).size).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Unit tests for edge cases
 */
describe('Magic Link Edge Cases', () => {
  describe('extractTokensFromUrl', () => {
    it('should handle URL-encoded tokens', () => {
      const accessToken = 'token+with/special=chars';
      const refreshToken = 'refresh+token/special=chars';
      
      const url = createMagicLinkUrl(accessToken, refreshToken, true);
      const result = extractTokensFromUrl(url);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.tokens.access_token).toBe(accessToken);
        expect(result.tokens.refresh_token).toBe(refreshToken);
      }
    });

    it('should prefer query params over hash when both present', () => {
      const url = 'heysalad://auth/callback?access_token=query_access&refresh_token=query_refresh#access_token=hash_access&refresh_token=hash_refresh';
      
      const result = extractTokensFromUrl(url);
      
      expect(result.success).toBe(true);
      if (result.success) {
        // Query params should take precedence
        expect(result.tokens.access_token).toBe('query_access');
        expect(result.tokens.refresh_token).toBe('query_refresh');
      }
    });

    it('should handle real Supabase magic link format', () => {
      const url = 'heysalad://auth/callback#access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c&refresh_token=v1.MjAyMy0wMS0wMVQwMDowMDowMFo.abc123xyz';
      
      const result = extractTokensFromUrl(url);
      
      expect(result.success).toBe(true);
    });
  });

  describe('createMagicLinkUrl', () => {
    it('should create valid URL with hash', () => {
      const url = createMagicLinkUrl('access', 'refresh', true);
      
      expect(url).toContain('heysalad://auth/callback');
      expect(url).toContain('#');
      expect(url).toContain('access_token=access');
      expect(url).toContain('refresh_token=refresh');
    });

    it('should create valid URL with query params', () => {
      const url = createMagicLinkUrl('access', 'refresh', false);
      
      expect(url).toContain('heysalad://auth/callback');
      expect(url).toContain('?');
      expect(url).toContain('access_token=access');
      expect(url).toContain('refresh_token=refresh');
    });
  });
});
