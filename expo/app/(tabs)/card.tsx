/**
 * Card Tab Screen - Display and manage virtual cards in HeySalad Wallet
 * Features: Card display, freeze/unfreeze, card details, create new card
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Switch,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Clipboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useCardStore, Card } from '@/stores/cardStore';
import { useCloudflareAuth } from '@/providers/CloudflareAuthProvider';
import HSButton from '@/components/HSButton';
import HSCardDisplay from '@/components/HSCardDisplay';

export default function CardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useCloudflareAuth();
  const { 
    cards, 
    selectedCard, 
    isLoading, 
    error, 
    fetchCards, 
    freezeCard, 
    unfreezeCard, 
    createCard,
    selectCard 
  } = useCardStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showCardData, setShowCardData] = useState(false);
  const [freezeLoading, setFreezeLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  // Get cardholder name from user
  const cardholderName = user?.email?.split('@')[0]?.toUpperCase() || 'CARDHOLDER';

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchCards();
    } finally {
      setRefreshing(false);
    }
  }, [fetchCards]);

  const handleCreateCard = async () => {
    setCreateLoading(true);
    try {
      await createCard();
      Alert.alert('Success! 🎉', 'Your new virtual card is ready to use.');
    } catch (err) {
      Alert.alert('Error', 'Failed to create card. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleToggleFreeze = async () => {
    if (!selectedCard || freezeLoading) return;
    
    setFreezeLoading(true);
    try {
      if (selectedCard.status === 'active') {
        await freezeCard(selectedCard.id);
      } else if (selectedCard.status === 'inactive') {
        await unfreezeCard(selectedCard.id);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to update card status.');
    } finally {
      setFreezeLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied ✅', `${label} copied to clipboard`);
  };

  const isFrozen = selectedCard?.status === 'inactive';
  const isCanceled = selectedCard?.status === 'canceled';
  const hasCards = cards.length > 0;

  // No cards state
  if (!isLoading && !hasCards) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.contentPadded}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand.cherryRed} />}
        >
          <View style={styles.emptyCard}>
            <Ionicons name="card-outline" size={64} color={Colors.brand.cherryRed} />
            <Text style={styles.emptyTitle}>Get Your Card</Text>
            <Text style={styles.emptyText}>
              Create an instant virtual Visa card for online payments
            </Text>
            <HSButton
              title={createLoading ? "Creating..." : "Create Virtual Card"}
              onPress={handleCreateCard}
              loading={createLoading}
              variant="primary"
              style={styles.createButton}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.contentPadded}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand.cherryRed} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Card</Text>
        </View>

        {isLoading && !selectedCard && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.brand.cherryRed} />
          </View>
        )}

        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <HSButton variant="secondary" title="Retry" onPress={onRefresh} />
          </View>
        )}

        {selectedCard && (
          <>
            {/* Card Badge */}
            <View style={styles.cardBadgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>VIRTUAL</Text>
              </View>
            </View>

            {/* Card Display */}
            <View style={styles.cardContainer}>
              <HSCardDisplay 
                card={selectedCard} 
                cardholderName={cardholderName}
              />
            </View>

            {/* Card Selector (if multiple cards) */}
            {cards.length > 1 && (
              <View style={styles.cardSelector}>
                {cards.map((card, index) => (
                  <TouchableOpacity
                    key={card.id}
                    style={[
                      styles.selectorDot,
                      selectedCard.id === card.id && styles.selectorDotActive
                    ]}
                    onPress={() => selectCard(card.id)}
                  />
                ))}
              </View>
            )}

            {/* Show Card Details Button */}
            <TouchableOpacity 
              style={styles.showDetailsButton} 
              onPress={() => setShowCardData(!showCardData)}
            >
              <Ionicons 
                name={showCardData ? 'eye-off-outline' : 'eye-outline'} 
                size={20} 
                color={Colors.brand.ink} 
              />
              <Text style={styles.showDetailsText}>
                {showCardData ? 'Hide Card Details' : 'Show Card Details'}
              </Text>
            </TouchableOpacity>

            {/* Card Data Section */}
            {showCardData && (
              <View style={styles.cardDataSection}>
                <TouchableOpacity 
                  style={styles.dataRow} 
                  onPress={() => copyToClipboard(`4242424242424${selectedCard.last4}`, 'Card number')}
                >
                  <View style={styles.dataLeft}>
                    <Ionicons name="card-outline" size={20} color={Colors.brand.ink} />
                    <View>
                      <Text style={styles.dataLabel}>Card Number</Text>
                      <Text style={styles.dataValue}>4242 4242 4242 {selectedCard.last4}</Text>
                    </View>
                  </View>
                  <Ionicons name="copy-outline" size={20} color={Colors.brand.inkMuted} />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.dataRow} 
                  onPress={() => copyToClipboard(
                    `${String(selectedCard.exp_month).padStart(2, '0')}/${String(selectedCard.exp_year).slice(-2)}`, 
                    'Expiry'
                  )}
                >
                  <View style={styles.dataLeft}>
                    <Ionicons name="calendar-outline" size={20} color={Colors.brand.ink} />
                    <View>
                      <Text style={styles.dataLabel}>Expiry Date</Text>
                      <Text style={styles.dataValue}>
                        {String(selectedCard.exp_month).padStart(2, '0')}/{String(selectedCard.exp_year).slice(-2)}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="copy-outline" size={20} color={Colors.brand.inkMuted} />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.dataRow, { borderBottomWidth: 0 }]} 
                  onPress={() => copyToClipboard('123', 'CVC')}
                >
                  <View style={styles.dataLeft}>
                    <Ionicons name="lock-closed-outline" size={20} color={Colors.brand.ink} />
                    <View>
                      <Text style={styles.dataLabel}>CVC</Text>
                      <Text style={styles.dataValue}>123</Text>
                    </View>
                  </View>
                  <Ionicons name="copy-outline" size={20} color={Colors.brand.inkMuted} />
                </TouchableOpacity>
              </View>
            )}

            {/* Card Controls */}
            <View style={styles.controlsCard}>
              <View style={styles.controlRow}>
                <View style={styles.controlLeft}>
                  <Ionicons 
                    name="snow-outline" 
                    size={22} 
                    color={isFrozen ? '#3b82f6' : Colors.brand.inkMuted} 
                  />
                  <Text style={styles.controlLabel}>
                    {isFrozen ? 'Unfreeze Card' : 'Freeze Card'}
                  </Text>
                </View>
                <Switch
                  value={isFrozen}
                  onValueChange={handleToggleFreeze}
                  disabled={isCanceled || freezeLoading}
                  trackColor={{ false: '#e5e5e5', true: '#3b82f6' }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.controlRow}>
                <View style={styles.controlLeft}>
                  <Ionicons name="globe-outline" size={22} color={Colors.brand.inkMuted} />
                  <Text style={styles.controlLabel}>Online Payments</Text>
                </View>
                <Switch
                  value={true}
                  onValueChange={() => {}}
                  disabled={isFrozen}
                  trackColor={{ false: '#e5e5e5', true: Colors.brand.green }}
                  thumbColor="#fff"
                />
              </View>

              <View style={[styles.controlRow, { borderBottomWidth: 0 }]}>
                <View style={styles.controlLeft}>
                  <Ionicons name="wifi-outline" size={22} color={Colors.brand.inkMuted} />
                  <Text style={styles.controlLabel}>Contactless</Text>
                </View>
                <Switch
                  value={true}
                  onValueChange={() => {}}
                  disabled={isFrozen}
                  trackColor={{ false: '#e5e5e5', true: Colors.brand.green }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            {/* Spending Limits */}
            <View style={styles.limitsCard}>
              <Text style={styles.limitsTitle}>Spending Limits</Text>
              <View style={styles.limitRow}>
                <Text style={styles.limitLabel}>Daily</Text>
                <Text style={styles.limitValue}>£500</Text>
              </View>
              <View style={styles.limitRow}>
                <Text style={styles.limitLabel}>Monthly</Text>
                <Text style={styles.limitValue}>£5,000</Text>
              </View>
            </View>

            {/* Add Another Card */}
            <TouchableOpacity style={styles.addCardBtn} onPress={handleCreateCard}>
              <Ionicons name="add-circle-outline" size={22} color={Colors.brand.inkMuted} />
              <Text style={styles.addCardText}>Add New Card</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.brand.white 
  },
  scrollView: { 
    flex: 1 
  },
  contentPadded: { 
    paddingHorizontal: 20, 
    paddingBottom: 100 
  },
  header: {
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.brand.ink,
  },
  loadingContainer: { 
    height: 200, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  errorCard: { 
    backgroundColor: '#fef2f2', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 16,
    gap: 12,
  },
  errorText: { 
    fontSize: 14, 
    color: '#dc2626' 
  },
  
  // Empty state
  emptyCard: { 
    alignItems: 'center', 
    backgroundColor: Colors.brand.surface, 
    borderRadius: 20, 
    padding: 40, 
    marginTop: 60,
    gap: 16,
  },
  emptyTitle: { 
    fontSize: 24, 
    fontWeight: '900', 
    color: Colors.brand.ink,
  },
  emptyText: { 
    fontSize: 16, 
    color: Colors.brand.inkMuted, 
    textAlign: 'center',
    lineHeight: 24,
  },
  createButton: {
    marginTop: 8,
    width: '100%',
  },
  
  // Card badge
  cardBadgeRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 12,
  },
  badge: { 
    paddingHorizontal: 12, 
    paddingVertical: 4, 
    borderRadius: 8,
    backgroundColor: Colors.brand.cherryRed,
  },
  badgeText: { 
    fontSize: 11, 
    fontWeight: '700', 
    color: '#fff', 
    letterSpacing: 1 
  },
  
  // Card container
  cardContainer: {
    marginBottom: 16,
  },
  
  // Card selector
  cardSelector: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginBottom: 16,
    gap: 8,
  },
  selectorDot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    backgroundColor: '#e5e5e5',
  },
  selectorDotActive: { 
    backgroundColor: Colors.brand.cherryRed, 
    width: 20,
  },
  
  // Show details button
  showDetailsButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 12, 
    gap: 8,
    backgroundColor: Colors.brand.surface, 
    borderRadius: 12,
    marginBottom: 16,
  },
  showDetailsText: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: Colors.brand.ink 
  },
  
  // Card data section
  cardDataSection: { 
    backgroundColor: Colors.brand.surface, 
    borderRadius: 12, 
    padding: 4, 
    marginBottom: 16,
  },
  dataRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingVertical: 14, 
    paddingHorizontal: 12,
    borderBottomWidth: 1, 
    borderBottomColor: '#e5e5e5',
  },
  dataLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    flex: 1 
  },
  dataLabel: { 
    fontSize: 11, 
    color: Colors.brand.inkMuted 
  },
  dataValue: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: Colors.brand.ink 
  },
  
  // Controls
  controlsCard: { 
    backgroundColor: Colors.brand.surface, 
    borderRadius: 12, 
    padding: 4, 
    marginBottom: 16,
  },
  controlRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingVertical: 14, 
    paddingHorizontal: 12,
    borderBottomWidth: 1, 
    borderBottomColor: '#e5e5e5',
  },
  controlLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    flex: 1 
  },
  controlLabel: { 
    fontSize: 15, 
    fontWeight: '500', 
    color: Colors.brand.ink 
  },
  
  // Limits
  limitsCard: { 
    backgroundColor: Colors.brand.surface, 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 16,
  },
  limitsTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: Colors.brand.ink, 
    marginBottom: 12 
  },
  limitRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 8 
  },
  limitLabel: { 
    fontSize: 15, 
    color: Colors.brand.inkMuted 
  },
  limitValue: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: Colors.brand.ink 
  },
  
  // Add card
  addCardBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 16, 
    gap: 8 
  },
  addCardText: { 
    fontSize: 15, 
    fontWeight: '500', 
    color: Colors.brand.inkMuted 
  },
});
