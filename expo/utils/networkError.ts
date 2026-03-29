/**
 * Network error classification utilities for Supabase operations
 * 
 * This module provides error classification for network-related errors
 * during Supabase operations, returning appropriate user-facing messages.
 * 
 * **Feature: auth-critical-fixes**
 * **Validates: Requirements 2.3**
 */

/**
 * Network error types for classification
 */
export type NetworkErrorType = 'offline' | 'timeout' | 'server' | 'unknown';

/**
 * Classified network error with type and user-facing message
 */
export interface NetworkError {
  type: NetworkErrorType;
  message: string;
  retryable: boolean;
  originalError?: unknown;
}

/**
 * User-facing messages for each error type
 */
const NETWORK_ERROR_MESSAGES: Record<NetworkErrorType, string> = {
  offline: 'You appear to be offline. Please check your connection.',
  timeout: 'Request timed out. Please try again.',
  server: 'Server error. Please try again later.',
  unknown: 'An unexpected error occurred. Please try again.',
};

/**
 * Determines if an error type is retryable
 */
const RETRYABLE_ERRORS: Record<NetworkErrorType, boolean> = {
  offline: true,
  timeout: true,
  server: true,
  unknown: true,
};

/**
 * Classifies a network error and returns appropriate user-facing message
 * 
 * Classification logic:
 * - offline: Network unavailable, fetch failed, no connection
 * - timeout: Request exceeded time limit, AbortError
 * - server: HTTP 5xx errors, server-side failures
 * - unknown: Unrecognized errors
 * 
 * @param error - The error to classify
 * @returns NetworkError with type, message, and retryable flag
 */
export function classifyNetworkError(error: unknown): NetworkError {
  // Handle null/undefined errors
  if (!error) {
    return {
      type: 'unknown',
      message: NETWORK_ERROR_MESSAGES.unknown,
      retryable: RETRYABLE_ERRORS.unknown,
      originalError: error,
    };
  }

  // Extract error details
  const errorObj = error as Record<string, unknown>;
  const message = String(errorObj.message || '').toLowerCase();
  const name = String(errorObj.name || '').toLowerCase();
  const code = String(errorObj.code || '').toLowerCase();
  const status = errorObj.status as number | undefined;

  // Check for timeout errors
  // AbortError is thrown when AbortController.abort() is called
  // Also check for timeout-related messages
  if (
    name === 'aborterror' ||
    name === 'timeouterror' ||
    code === 'abort_err' ||
    code === 'timeout' ||
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('aborted')
  ) {
    return {
      type: 'timeout',
      message: NETWORK_ERROR_MESSAGES.timeout,
      retryable: RETRYABLE_ERRORS.timeout,
      originalError: error,
    };
  }

  // Check for offline/network errors
  // These occur when the device has no network connectivity
  if (
    name === 'networkerror' ||
    code === 'network_error' ||
    message.includes('network') ||
    message.includes('offline') ||
    message.includes('no internet') ||
    message.includes('fetch failed') ||
    message.includes('failed to fetch') ||
    message.includes('connection') ||
    message.includes('econnrefused') ||
    message.includes('enotfound')
  ) {
    return {
      type: 'offline',
      message: NETWORK_ERROR_MESSAGES.offline,
      retryable: RETRYABLE_ERRORS.offline,
      originalError: error,
    };
  }

  // Check for server errors (HTTP 5xx)
  if (
    (status && status >= 500 && status < 600) ||
    message.includes('server error') ||
    message.includes('internal server') ||
    message.includes('502') ||
    message.includes('503') ||
    message.includes('504') ||
    code === 'server_error'
  ) {
    return {
      type: 'server',
      message: NETWORK_ERROR_MESSAGES.server,
      retryable: RETRYABLE_ERRORS.server,
      originalError: error,
    };
  }

  // Unknown error - return generic message
  return {
    type: 'unknown',
    message: NETWORK_ERROR_MESSAGES.unknown,
    retryable: RETRYABLE_ERRORS.unknown,
    originalError: error,
  };
}

/**
 * Gets the user-facing message for a given error type
 * 
 * @param errorType - The type of network error
 * @returns User-facing error message
 */
export function getNetworkErrorMessage(errorType: NetworkErrorType): string {
  return NETWORK_ERROR_MESSAGES[errorType];
}

/**
 * Checks if an error type is retryable
 * 
 * @param errorType - The type of network error
 * @returns true if the error is retryable
 */
export function isRetryableError(errorType: NetworkErrorType): boolean {
  return RETRYABLE_ERRORS[errorType];
}

/**
 * Creates a timeout error for use with AbortController
 * 
 * @param timeoutMs - The timeout duration in milliseconds
 * @returns Error object representing a timeout
 */
export function createTimeoutError(timeoutMs: number): Error {
  const error = new Error(`Request timed out after ${timeoutMs}ms`);
  error.name = 'TimeoutError';
  return error;
}
