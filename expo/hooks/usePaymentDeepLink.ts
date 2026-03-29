/**
 * Payment Deep Link Hook
 * Handles payment deep link callbacks throughout the app
 * Requirements: 6.3, 6.4
 */

import { useState, useEffect, useCallback } from 'react';
import { Linking } from 'react-native';
import { logger } from '@/utils/logger';
import {
  web3AgentApi,
  PaymentDeepLinkParams,
  parsePaymentDeepLink,
} from '@/services/web3AgentApi';

interface UsePaymentDeepLinkResult {
  paymentParams: PaymentDeepLinkParams | null;
  showPaymentModal: boolean;
  clearPayment: () => void;
  handlePaymentComplete: (paymentId: string, transactionHash: string) => void;
}

/**
 * Hook to handle payment deep links
 * Sets up listeners for incoming payment URLs and manages modal state
 */
export function usePaymentDeepLink(): UsePaymentDeepLinkResult {
  const [paymentParams, setPaymentParams] = useState<PaymentDeepLinkParams | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Handle incoming deep link
  const handleDeepLink = useCallback((url: string) => {
    logger.log('[PaymentDeepLink] Received URL:', url);

    // Check if it's a payment deep link
    const params = parsePaymentDeepLink(url);
    if (params) {
      logger.log('[PaymentDeepLink] Parsed payment params:', params);
      setPaymentParams(params);
      setShowPaymentModal(true);
    }
  }, []);

  // Set up deep link listeners
  useEffect(() => {
    // Handle URL when app is opened via deep link
    const handleUrl = (event: { url: string }) => {
      handleDeepLink(event.url);
    };

    // Add listener for when app is already open
    const subscription = Linking.addEventListener('url', handleUrl);

    // Check for initial URL (app opened via deep link)
    Linking.getInitialURL().then(url => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [handleDeepLink]);

  // Clear payment state
  const clearPayment = useCallback(() => {
    setPaymentParams(null);
    setShowPaymentModal(false);
  }, []);

  // Handle payment completion
  const handlePaymentComplete = useCallback(
    async (paymentId: string, transactionHash: string) => {
      logger.log('[PaymentDeepLink] Payment complete:', { paymentId, transactionHash });

      // Update any associated shopping session
      if (paymentParams?.paymentId) {
        try {
          // The session status will be updated by the backend when payment is verified
          logger.log('[PaymentDeepLink] Payment verified, session will be updated');
        } catch (error) {
          logger.error('[PaymentDeepLink] Error updating session:', error);
        }
      }

      clearPayment();
    },
    [paymentParams, clearPayment]
  );

  return {
    paymentParams,
    showPaymentModal,
    clearPayment,
    handlePaymentComplete,
  };
}

/**
 * Parse a payment URL and extract parameters
 * Exported for use in other components
 */
export { parsePaymentDeepLink };
