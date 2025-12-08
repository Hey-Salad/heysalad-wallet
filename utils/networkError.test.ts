/**
 * Property-based tests for network error classification
 * 
 * **Feature: auth-critical-fixes**
 * 
 * These tests verify the correctness properties defined in the design document
 * using fast-check for property-based testing.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  classifyNetworkError,
  getNetworkErrorMessage,
  isRetryableError,
  createTimeoutError,
  NetworkErrorType,
} from './networkError';

/**
 * **Feature: auth-critical-fixes, Property 6: Error Classification**
 * 
 * *For any* network error during Supabase operations, the error handler SHALL
 * classify the error as one of: offline, timeout, or server error, and return
 * an appropriate user-facing message.
 * 
 * **Validates: Requirements 2.3**
 */
describe('Property 6: Error Classification', () => {
  // Valid error types that the classifier should return
  const validErrorTypes: NetworkErrorType[] = ['offline', 'timeout', 'server', 'unknown'];

  it('should always return a valid error type for any error input', () => {
    // Arbitrary for various error-like objects
    const errorArb = fc.oneof(
      // Error with message
      fc.record({
        message: fc.string(),
        name: fc.option(fc.string(), { nil: undefined }),
        code: fc.option(fc.string(), { nil: undefined }),
        status: fc.option(fc.integer({ min: 100, max: 599 }), { nil: undefined }),
      }),
      // Just a string message
      fc.record({ message: fc.string() }),
      // Error with name only
      fc.record({ name: fc.string() }),
      // Error with code only
      fc.record({ code: fc.string() }),
      // Empty object
      fc.constant({}),
      // Null/undefined
      fc.constant(null),
      fc.constant(undefined),
    );

    fc.assert(
      fc.property(errorArb, (error) => {
        const result = classifyNetworkError(error);
        
        // Property: Result must always have a valid type
        expect(validErrorTypes).toContain(result.type);
        
        // Property: Result must always have a non-empty message
        expect(typeof result.message).toBe('string');
        expect(result.message.length).toBeGreaterThan(0);
        
        // Property: Result must always have a retryable flag
        expect(typeof result.retryable).toBe('boolean');
      }),
      { numRuns: 100 }
    );
  });

  it('should classify timeout-related errors as timeout', () => {
    // Arbitrary for timeout-like error messages
    const timeoutMessageArb = fc.oneof(
      fc.constant('timeout'),
      fc.constant('timed out'),
      fc.constant('aborted'),
      fc.constant('Request timeout'),
      fc.constant('Connection timed out'),
      fc.constant('Operation was aborted'),
    );

    const timeoutNameArb = fc.oneof(
      fc.constant('AbortError'),
      fc.constant('TimeoutError'),
    );

    fc.assert(
      fc.property(
        fc.oneof(
          fc.record({ message: timeoutMessageArb }),
          fc.record({ name: timeoutNameArb }),
          fc.record({ code: fc.constant('ABORT_ERR') }),
          fc.record({ code: fc.constant('timeout') }),
        ),
        (error) => {
          const result = classifyNetworkError(error);
          
          // Property: Timeout-related errors should be classified as timeout
          expect(result.type).toBe('timeout');
          expect(result.message).toContain('timed out');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should classify offline-related errors as offline', () => {
    // Arbitrary for offline-like error messages
    const offlineMessageArb = fc.oneof(
      fc.constant('network'),
      fc.constant('offline'),
      fc.constant('no internet'),
      fc.constant('fetch failed'),
      fc.constant('Failed to fetch'),
      fc.constant('connection'),
      fc.constant('ECONNREFUSED'),
      fc.constant('ENOTFOUND'),
    );

    fc.assert(
      fc.property(
        fc.oneof(
          fc.record({ message: offlineMessageArb }),
          fc.record({ name: fc.constant('NetworkError') }),
          fc.record({ code: fc.constant('NETWORK_ERROR') }),
        ),
        (error) => {
          const result = classifyNetworkError(error);
          
          // Property: Offline-related errors should be classified as offline
          expect(result.type).toBe('offline');
          expect(result.message).toContain('offline');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should classify server errors (5xx) as server', () => {
    // Arbitrary for server error status codes
    const serverStatusArb = fc.integer({ min: 500, max: 599 });

    fc.assert(
      fc.property(
        fc.oneof(
          fc.record({ status: serverStatusArb, message: fc.constant('') }),
          fc.record({ message: fc.constant('server error') }),
          fc.record({ message: fc.constant('internal server error') }),
          fc.record({ code: fc.constant('server_error') }),
        ),
        (error) => {
          const result = classifyNetworkError(error);
          
          // Property: Server errors should be classified as server
          expect(result.type).toBe('server');
          expect(result.message).toContain('Server error');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve original error in result', () => {
    const errorArb = fc.record({
      message: fc.string(),
      code: fc.option(fc.string(), { nil: undefined }),
    });

    fc.assert(
      fc.property(errorArb, (error) => {
        const result = classifyNetworkError(error);
        
        // Property: Original error should be preserved
        expect(result.originalError).toBe(error);
      }),
      { numRuns: 100 }
    );
  });

  it('should return consistent messages for each error type', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...validErrorTypes),
        (errorType) => {
          const message = getNetworkErrorMessage(errorType);
          
          // Property: Each error type should have a non-empty message
          expect(typeof message).toBe('string');
          expect(message.length).toBeGreaterThan(0);
          
          // Property: Message should be consistent for same type
          expect(getNetworkErrorMessage(errorType)).toBe(message);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly identify retryable errors', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...validErrorTypes),
        (errorType) => {
          const retryable = isRetryableError(errorType);
          
          // Property: All error types should have a defined retryable status
          expect(typeof retryable).toBe('boolean');
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Unit tests for network error utilities
 */
describe('Network Error Utilities', () => {
  describe('createTimeoutError', () => {
    it('should create an error with TimeoutError name', () => {
      const error = createTimeoutError(5000);
      
      expect(error.name).toBe('TimeoutError');
      expect(error.message).toContain('5000');
      expect(error.message).toContain('timed out');
    });

    it('should be classifiable as timeout', () => {
      const error = createTimeoutError(3000);
      const result = classifyNetworkError(error);
      
      expect(result.type).toBe('timeout');
    });
  });

  describe('classifyNetworkError edge cases', () => {
    it('should handle Error instances', () => {
      const error = new Error('Network request failed');
      const result = classifyNetworkError(error);
      
      expect(result.type).toBe('offline');
    });

    it('should handle AbortError', () => {
      const error = new DOMException('The operation was aborted', 'AbortError');
      const result = classifyNetworkError(error);
      
      expect(result.type).toBe('timeout');
    });

    it('should handle HTTP 500 status', () => {
      const error = { status: 500, message: 'Internal Server Error' };
      const result = classifyNetworkError(error);
      
      expect(result.type).toBe('server');
    });

    it('should handle HTTP 503 status', () => {
      const error = { status: 503, message: 'Service Unavailable' };
      const result = classifyNetworkError(error);
      
      expect(result.type).toBe('server');
    });

    it('should not classify HTTP 4xx as server error', () => {
      const error = { status: 404, message: 'Not Found' };
      const result = classifyNetworkError(error);
      
      expect(result.type).toBe('unknown');
    });

    it('should handle empty string message', () => {
      const error = { message: '' };
      const result = classifyNetworkError(error);
      
      expect(validErrorTypes).toContain(result.type);
    });
  });
});

// Helper for type checking
const validErrorTypes: NetworkErrorType[] = ['offline', 'timeout', 'server', 'unknown'];
