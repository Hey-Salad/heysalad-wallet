/**
 * Magic Link URL parsing utilities
 * 
 * **Feature: auth-critical-fixes**
 * 
 * These utilities handle parsing magic link URLs and extracting tokens
 * for authentication.
 */

/**
 * Result of parsing a magic link URL
 */
export interface MagicLinkTokens {
  access_token: string;
  refresh_token: string;
}

/**
 * Error result when parsing fails
 */
export interface MagicLinkError {
  type: 'missing_tokens' | 'invalid_url' | 'not_callback';
  message: string;
}

/**
 * Result type for magic link parsing
 */
export type MagicLinkParseResult = 
  | { success: true; tokens: MagicLinkTokens }
  | { success: false; error: MagicLinkError };

/**
 * Extracts access_token and refresh_token from a magic link URL.
 * 
 * Supabase magic links can have tokens in either:
 * 1. Query parameters: ?access_token=...&refresh_token=...
 * 2. Hash fragment: #access_token=...&refresh_token=...
 * 
 * This function handles both cases.
 * 
 * @param url - The magic link URL to parse
 * @returns ParseResult with tokens or error
 */
export function extractTokensFromUrl(url: string | null | undefined): MagicLinkParseResult {
  // Handle null/undefined/empty URL
  if (!url || url.trim() === '') {
    return {
      success: false,
      error: {
        type: 'invalid_url',
        message: 'No URL provided',
      },
    };
  }

  // Check if this is a callback URL
  if (!url.includes('auth/callback')) {
    return {
      success: false,
      error: {
        type: 'not_callback',
        message: 'URL is not an auth callback',
      },
    };
  }

  try {
    const urlObj = new URL(url);
    
    // Try query parameters first
    let access_token = urlObj.searchParams.get('access_token');
    let refresh_token = urlObj.searchParams.get('refresh_token');

    // If not in query params, check the hash/fragment (Supabase default)
    if (!access_token && urlObj.hash) {
      const hashParams = new URLSearchParams(urlObj.hash.substring(1));
      access_token = hashParams.get('access_token');
      refresh_token = hashParams.get('refresh_token');
    }

    // Validate tokens exist
    if (!access_token || !refresh_token) {
      return {
        success: false,
        error: {
          type: 'missing_tokens',
          message: 'Invalid magic link. Missing required tokens.',
        },
      };
    }

    return {
      success: true,
      tokens: {
        access_token,
        refresh_token,
      },
    };
  } catch (e) {
    return {
      success: false,
      error: {
        type: 'invalid_url',
        message: 'Failed to parse URL',
      },
    };
  }
}

/**
 * Determines the routing destination based on profile existence.
 * 
 * @param hasProfile - Whether the user has an existing profile
 * @returns The route to navigate to
 */
export function getRouteForProfile(hasProfile: boolean): string {
  return hasProfile ? '/(tabs)/(wallet)' : '/onboarding-profile';
}

/**
 * Creates a magic link URL for testing purposes.
 * 
 * @param accessToken - The access token
 * @param refreshToken - The refresh token
 * @param useHash - Whether to put tokens in hash (true) or query params (false)
 * @returns A properly formatted magic link URL
 */
export function createMagicLinkUrl(
  accessToken: string,
  refreshToken: string,
  useHash: boolean = true
): string {
  const baseUrl = 'heysalad://auth/callback';
  
  if (useHash) {
    return `${baseUrl}#access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}`;
  } else {
    return `${baseUrl}?access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}`;
  }
}
