/**
 * Unit tests for timeout and retry logic
 * 
 * **Feature: auth-critical-fixes**
 * 
 * These tests verify the timeout and retry functionality
 * as specified in the design document.
 * 
 * **Validates: Requirements 2.2, 2.5**
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  withTimeout,
  withRetry,
  calculateBackoffDelay,
  RetryConfig,
  DEFAULT_RETRY_CONFIG,
} from './retry';

// Mock the networkError module
vi.mock('./networkError', () => ({
  classifyNetworkError: vi.fn((error) => {
    const message = String(error?.message || '').toLowerCase();
    const name = String(error?.name || '').toLowerCase();
    
    if (name === 'timeouterror' || message.includes('timeout')) {
      return { type: 'timeout', message: 'Request timed out', retryable: true, originalError: error };
    }
    if (message.includes('network') || message.includes('offline')) {
      return { type: 'offline', message: 'You appear to be offline', retryable: true, originalError: error };
    }
    if (error?.status >= 500) {
      return { type: 'server', message: 'Server error', retryable: true, originalError: error };
    }
    return { type: 'unknown', message: 'Unknown error', retryable: true, originalError: error };
  }),
  createTimeoutError: vi.fn((timeoutMs: number) => {
    const error = new Error(`Request timed out after ${timeoutMs}ms`);
    error.name = 'TimeoutError';
    return error;
  }),
}));

describe('withTimeout', () => {
  /**
   * Test timeout triggers after specified duration
   * **Validates: Requirements 2.2**
   */
  it('should timeout after specified duration', async () => {
    const slowOperation = new Promise((resolve) => {
      setTimeout(() => resolve('success'), 200);
    });

    // Use a short timeout for testing
    await expect(withTimeout(slowOperation, 50)).rejects.toThrow('timed out');
  });

  it('should resolve if operation completes before timeout', async () => {
    const fastOperation = new Promise((resolve) => {
      setTimeout(() => resolve('success'), 10);
    });

    const result = await withTimeout(fastOperation, 100);
    expect(result).toBe('success');
  });

  it('should propagate errors from the operation', async () => {
    const failingOperation = Promise.reject(new Error('Operation failed'));

    await expect(withTimeout(failingOperation, 1000)).rejects.toThrow('Operation failed');
  });

  it('should use the exact timeout duration specified', async () => {
    const operation = new Promise((resolve) => {
      setTimeout(() => resolve('success'), 100);
    });

    // Test with 50ms timeout (should fail because operation takes 100ms)
    await expect(withTimeout(operation, 50)).rejects.toThrow('timed out');
  });

  /**
   * Test 5 second timeout as per requirements
   * **Validates: Requirements 2.2**
   */
  it('should have 5 second default timeout in config', () => {
    expect(DEFAULT_RETRY_CONFIG.timeout).toBe(5000);
  });
});

describe('calculateBackoffDelay', () => {
  const config: RetryConfig = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 5000,
    backoffMultiplier: 2,
    timeout: 5000,
  };

  /**
   * Test retry with backoff
   * **Validates: Requirements 2.5**
   */
  it('should calculate exponential backoff correctly', () => {
    // First attempt: 1000 * 2^0 = 1000
    expect(calculateBackoffDelay(0, config)).toBe(1000);
    
    // Second attempt: 1000 * 2^1 = 2000
    expect(calculateBackoffDelay(1, config)).toBe(2000);
    
    // Third attempt: 1000 * 2^2 = 4000
    expect(calculateBackoffDelay(2, config)).toBe(4000);
  });

  it('should cap delay at maxDelay', () => {
    // Fourth attempt: 1000 * 2^3 = 8000, but capped at 5000
    expect(calculateBackoffDelay(3, config)).toBe(5000);
    
    // Fifth attempt: 1000 * 2^4 = 16000, but capped at 5000
    expect(calculateBackoffDelay(4, config)).toBe(5000);
  });

  it('should use default config values correctly', () => {
    // Test with default config
    expect(calculateBackoffDelay(0, DEFAULT_RETRY_CONFIG)).toBe(1000);
    expect(calculateBackoffDelay(1, DEFAULT_RETRY_CONFIG)).toBe(2000);
  });
});

describe('withRetry', () => {
  const testConfig: RetryConfig = {
    maxRetries: 2,
    initialDelay: 10, // Short delays for testing
    maxDelay: 50,
    backoffMultiplier: 2,
    timeout: 100, // Short timeout for testing
  };

  it('should succeed on first attempt if operation succeeds', async () => {
    const operation = vi.fn().mockResolvedValue('success');
    
    const result = await withRetry(operation, testConfig);
    
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and succeed on subsequent attempt', async () => {
    let callCount = 0;
    const operation = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(new Error('First failure'));
      }
      return Promise.resolve('success');
    });
    
    const result = await withRetry(operation, testConfig);
    
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('should throw after max retries exceeded', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('Always fails'));
    
    await expect(withRetry(operation, testConfig)).rejects.toBeDefined();
    
    // Initial attempt + 2 retries = 3 total calls
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('should call onRetry callback before each retry', async () => {
    let callCount = 0;
    const operation = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount <= 2) {
        return Promise.reject(new Error(`Failure ${callCount}`));
      }
      return Promise.resolve('success');
    });
    
    const onRetry = vi.fn();
    
    await withRetry(operation, testConfig, onRetry);
    
    // onRetry should be called twice (before retry 1 and retry 2)
    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenNthCalledWith(1, 1, expect.objectContaining({ type: expect.any(String) }));
    expect(onRetry).toHaveBeenNthCalledWith(2, 2, expect.objectContaining({ type: expect.any(String) }));
  });

  /**
   * Test multiple timeout suggestion
   * **Validates: Requirements 2.5**
   */
  it('should track timeout errors for network connection suggestion', async () => {
    const timeoutError = new Error('Request timed out');
    timeoutError.name = 'TimeoutError';
    
    const operation = vi.fn().mockRejectedValue(timeoutError);
    const onRetry = vi.fn();
    
    await expect(withRetry(operation, testConfig, onRetry)).rejects.toBeDefined();
    
    // Verify onRetry was called with timeout errors
    expect(onRetry).toHaveBeenCalledWith(
      expect.any(Number),
      expect.objectContaining({ type: 'timeout' })
    );
  });
});

describe('DEFAULT_RETRY_CONFIG', () => {
  it('should have correct default values', () => {
    expect(DEFAULT_RETRY_CONFIG.maxRetries).toBe(2);
    expect(DEFAULT_RETRY_CONFIG.initialDelay).toBe(1000);
    expect(DEFAULT_RETRY_CONFIG.maxDelay).toBe(5000);
    expect(DEFAULT_RETRY_CONFIG.backoffMultiplier).toBe(2);
    expect(DEFAULT_RETRY_CONFIG.timeout).toBe(5000);
  });

  /**
   * Test timeout triggers after 5 seconds
   * **Validates: Requirements 2.2**
   */
  it('should have 5 second timeout as per requirements', () => {
    expect(DEFAULT_RETRY_CONFIG.timeout).toBe(5000);
  });
});
