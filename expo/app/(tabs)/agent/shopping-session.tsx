/**
 * Shopping Session Screen
 * Displays shopping progress and payment links
 * Requirements: 6.2
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ShoppingCart,
  Check,
  X,
  RefreshCw,
  CreditCard,
  Package,
  AlertCircle,
  Clock,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import {
  web3AgentApi,
  ShoppingSession,
  CartItem,
  SubstituteItem,
} from '@/services/web3AgentApi';

// =============================================================================
// Types
// =============================================================================

type SessionStatusType = 'in_progress' | 'completed' | 'failed' | 'paused';

// =============================================================================
// Component
// =============================================================================

export default function ShoppingSessionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId?: string }>();

  const [session, setSession] = useState<ShoppingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch session data
  const fetchSession = useCallback(async () => {
    if (!params.sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }

    try {
      const response = await web3AgentApi.getShoppingSession(params.sessionId);
      if (response.success && response.data) {
        setSession(response.data);
        setError(null);
      } else {
        setError(response.error || 'Failed to load session');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [params.sessionId]);

  // Initial fetch
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Auto-refresh for in-progress sessions
  useEffect(() => {
    if (session?.status === 'in_progress') {
      const interval = setInterval(fetchSession, 5000);
      return () => clearInterval(interval);
    }
  }, [session?.status, fetchSession]);

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSession();
  }, [fetchSession]);

  // Handle resume session
  const handleResume = async () => {
    if (!params.sessionId) return;

    try {
      setLoading(true);
      const response = await web3AgentApi.resumeShopping(params.sessionId);
      if (response.success) {
        Alert.alert('Success', 'Shopping session resumed');
        fetchSession();
      } else {
        Alert.alert('Error', response.error || 'Failed to resume session');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  // Handle payment
  const handlePayment = async () => {
    if (!session?.paymentLink) {
      Alert.alert('Error', 'No payment link available');
      return;
    }

    const opened = await web3AgentApi.openPaymentDeepLink(session.paymentLink);
    if (!opened) {
      Alert.alert('Error', 'Could not open payment link');
    }
  };

  // Get status color and icon
  const getStatusInfo = (status: SessionStatusType) => {
    switch (status) {
      case 'completed':
        return { color: '#16a34a', icon: Check, label: 'Completed' };
      case 'failed':
        return { color: '#dc2626', icon: X, label: 'Failed' };
      case 'paused':
        return { color: '#f59e0b', icon: Clock, label: 'Paused' };
      default:
        return { color: Colors.brand.cherryRed, icon: RefreshCw, label: 'In Progress' };
    }
  };

  // Render cart item
  const renderCartItem = (item: CartItem, index: number) => (
    <View key={`cart-${index}`} style={styles.cartItem}>
      <View style={styles.cartItemInfo}>
        <Text style={styles.cartItemName}>{item.name}</Text>
        <Text style={styles.cartItemBrand}>{item.brand || 'Generic'}</Text>
      </View>
      <View style={styles.cartItemRight}>
        <Text style={styles.cartItemQuantity}>x{item.quantity}</Text>
        <Text style={styles.cartItemPrice}>£{item.price.toFixed(2)}</Text>
      </View>
    </View>
  );

  // Render substitute item
  const renderSubstitute = (item: SubstituteItem, index: number) => (
    <View key={`sub-${index}`} style={styles.substituteItem}>
      <View style={styles.substituteHeader}>
        <AlertCircle size={16} color="#f59e0b" />
        <Text style={styles.substituteLabel}>Substituted</Text>
      </View>
      <Text style={styles.substituteOriginal}>
        Original: {item.originalItem}
      </Text>
      <View style={styles.substituteNew}>
        <Text style={styles.substituteNewName}>{item.substitute.name}</Text>
        <Text style={styles.substituteReason}>{item.reason}</Text>
        <Text style={styles.substitutePrice}>
          £{item.substitute.price.toFixed(2)}
        </Text>
      </View>
    </View>
  );

  // Loading state
  if (loading && !session) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.brand.cherryRed} />
        <Text style={styles.loadingText}>Loading session...</Text>
      </View>
    );
  }

  // Error state
  if (error && !session) {
    return (
      <View style={styles.centerContainer}>
        <AlertCircle size={48} color={Colors.brand.cherryRed} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchSession}>
          <RefreshCw size={16} color={Colors.brand.white} />
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!session) return null;

  const statusInfo = getStatusInfo(session.status);
  const StatusIcon = statusInfo.icon;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Status Card */}
      <View style={styles.statusCard}>
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
          <StatusIcon size={16} color={Colors.brand.white} />
          <Text style={styles.statusText}>{statusInfo.label}</Text>
        </View>
        <Text style={styles.storeName}>{session.store.toUpperCase()}</Text>
        <Text style={styles.sessionId}>Session: {session.id.slice(0, 8)}...</Text>
      </View>

      {/* Progress indicator for in-progress */}
      {session.status === 'in_progress' && (
        <View style={styles.progressCard}>
          <ActivityIndicator size="small" color={Colors.brand.cherryRed} />
          <Text style={styles.progressText}>
            Shopping in progress... {session.lastCheckpoint}
          </Text>
        </View>
      )}

      {/* Error message */}
      {session.errorMessage && (
        <View style={styles.errorCard}>
          <AlertCircle size={20} color="#dc2626" />
          <Text style={styles.errorCardText}>{session.errorMessage}</Text>
        </View>
      )}

      {/* Cart Items */}
      {session.cartItems.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ShoppingCart size={20} color={Colors.brand.ink} />
            <Text style={styles.sectionTitle}>
              Cart ({session.cartItems.length} items)
            </Text>
          </View>
          {session.cartItems.map(renderCartItem)}
        </View>
      )}

      {/* Unavailable Items */}
      {session.itemsUnavailable.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <X size={20} color="#dc2626" />
            <Text style={styles.sectionTitle}>Unavailable Items</Text>
          </View>
          {session.itemsUnavailable.map((item, index) => (
            <View key={`unavail-${index}`} style={styles.unavailableItem}>
              <Text style={styles.unavailableText}>{item}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Substitutes */}
      {session.substitutes.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Package size={20} color="#f59e0b" />
            <Text style={styles.sectionTitle}>Substitutions</Text>
          </View>
          {session.substitutes.map(renderSubstitute)}
        </View>
      )}

      {/* Total */}
      <View style={styles.totalCard}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>
            £{(session.cartTotal - session.deliveryFee).toFixed(2)}
          </Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Delivery</Text>
          <Text style={styles.totalValue}>£{session.deliveryFee.toFixed(2)}</Text>
        </View>
        <View style={[styles.totalRow, styles.totalRowFinal]}>
          <Text style={styles.totalLabelFinal}>Total</Text>
          <Text style={styles.totalValueFinal}>
            £{session.cartTotal.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {session.status === 'paused' && (
          <TouchableOpacity style={styles.resumeButton} onPress={handleResume}>
            <RefreshCw size={20} color={Colors.brand.white} />
            <Text style={styles.resumeButtonText}>Resume Shopping</Text>
          </TouchableOpacity>
        )}

        {session.status === 'completed' && session.paymentLink && (
          <TouchableOpacity style={styles.payButton} onPress={handlePayment}>
            <CreditCard size={20} color={Colors.brand.white} />
            <Text style={styles.payButtonText}>Pay with USDC</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.brand.white,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.brand.inkMuted,
  },
  errorText: {
    fontSize: 16,
    color: Colors.brand.ink,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.brand.cherryRed,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.brand.white,
  },
  statusCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.brand.white,
  },
  storeName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.brand.ink,
    marginTop: 8,
  },
  sessionId: {
    fontSize: 12,
    color: Colors.brand.inkMuted,
  },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: Colors.brand.lightPeach,
    borderRadius: 12,
  },
  progressText: {
    fontSize: 14,
    color: Colors.brand.ink,
    flex: 1,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
  },
  errorCardText: {
    fontSize: 14,
    color: '#dc2626',
    flex: 1,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.brand.ink,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 8,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.brand.ink,
  },
  cartItemBrand: {
    fontSize: 12,
    color: Colors.brand.inkMuted,
    marginTop: 2,
  },
  cartItemRight: {
    alignItems: 'flex-end',
  },
  cartItemQuantity: {
    fontSize: 12,
    color: Colors.brand.inkMuted,
  },
  cartItemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.brand.ink,
  },
  unavailableItem: {
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    marginBottom: 8,
  },
  unavailableText: {
    fontSize: 14,
    color: '#dc2626',
  },
  substituteItem: {
    padding: 14,
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    marginBottom: 8,
  },
  substituteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  substituteLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
  },
  substituteOriginal: {
    fontSize: 12,
    color: Colors.brand.inkMuted,
    textDecorationLine: 'line-through',
    marginBottom: 8,
  },
  substituteNew: {
    gap: 4,
  },
  substituteNewName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.brand.ink,
  },
  substituteReason: {
    fontSize: 12,
    color: Colors.brand.inkMuted,
  },
  substitutePrice: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.brand.ink,
  },
  totalCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalRowFinal: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.brand.border,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 14,
    color: Colors.brand.inkMuted,
  },
  totalValue: {
    fontSize: 14,
    color: Colors.brand.ink,
  },
  totalLabelFinal: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.brand.ink,
  },
  totalValueFinal: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.brand.cherryRed,
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f59e0b',
    paddingVertical: 16,
    borderRadius: 16,
  },
  resumeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.brand.white,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.brand.cherryRed,
    paddingVertical: 16,
    borderRadius: 16,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.brand.white,
  },
});
