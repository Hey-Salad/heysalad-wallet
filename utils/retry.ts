/**
 * Retry and timeout utilities for async operations
 * 
 * This module provides retry logic with exponential backoff and timeout handling
 * for Supabase operations.
 * 
 * **Feature: auth-critical-fixes**
 * **Validates: Requirements 2.1, 2.2, 2.5**
 */

import { classifyNetworkError, NetworkError, createTimeoutError } from './networkError';

/**
 * Retry configuration for async operations
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  timeout: number;
}

/**
 * Default retry configuration
 * - 15 second timeout for iOS Simulator compatibility
 * - 2 retries with exponential backoff
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  initialDelay: 1000,
  maxDelay: 5000,
  backoffMultiplier: 2,
  timeout: 15000, // Increased from 5000ms to 15000ms for iOS Simulator
};

/**
 * Executes a promise with a timeout
 * **Validates: Requirements 2.2**
 * 
 * @param promise - The promise to execute
 * @param timeoutMs - Timeout in milliseconds
 * @returns The promise result or throws a timeout error
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(createTimeoutError(timeoutMs));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

/**
 * Calculates delay for exponential backoff
 * 
 * @param attempt - Current attempt number (0-indexed)
 * @param config - Retry configuration
 * @returns Delay in milliseconds
 */
export function calculateBackoffDelay(attempt: number, config: RetryConfig): number {
  const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt);
  return Math.min(delay, config.maxDelay);
}

/**
 * Executes an async operation with retry logic and exponential backoff
 * **Validates: Requirements 2.1, 2.2, 2.5**
 * 
 * @param operation - The async operation to execute
 * @param config - Retry configuration
 * @param onRetry - Optional callback called before each retry
 * @returns The operation result
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  onRetry?: (attempt: number, error: NetworkError) => void
): Promise<T> {
  let lastError: NetworkError | null = null;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // Execute operation with timeout
      const result = await withTimeout(operation(), config.timeout);
      return result;
    } catch (error) {
      lastError = classifyNetworkError(error);
      
      // If this is the last attempt, throw the error
      if (attempt === config.maxRetries) {
        throw lastError;
      }
      
      // If error is not retryable, throw immediately
      if (!lastError.retryable) {
        throw lastError;
      }
      
      // Calculate backoff delay
      const delay = calculateBackoffDelay(attempt, config);
      console.log(`[Retry] Attempt ${attempt + 1}/${config.maxRetries} after ${delay}ms`);
      
      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Unknown error');
}
