/**
 * NFC Card Screen - Create and Manage HeySalad NFC Cards
 * Generate virtual NFC cards linked to wallet for contactless payments
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, CreditCard, Nfc, Plus, Trash2, Lock } from 'lucide-react-native';
import Colors from '@/constants/colors';
import HSButton from '@/components/HSButton';

interface NFCCard {
  id: string;
  name: string;
  lastUsed?: Date;
  balance: string;
  currency: string;
  isActive: boolean;
}

export default function NFCCardScreen() {
  const [cards, setCards] = useState<NFCCard[]>([
    {
      id: '1',
      name: 'My HeySalad Card',
      lastUsed: new Date(),
      balance: '100.00',
      currency: 'TRX',
      isActive: true,
    },
  ]);

  const createNewCard = () => {
    Alert.alert(
      'Create NFC Card',
      'Would you like to create a new HeySalad NFC card?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: () => {
            const newCard: NFCCard = {
              id: Date.now().toString(),
              name: `Card ${cards.length + 1}`,
              balance: '0.00',
              currency: 'TRX',
              isActive: true,
            };
            setCards([...cards, newCard]);
            Alert.alert('Success', 'NFC card created successfully!');
          },
        },
      ]
    );
  };

  const deleteCard = (cardId: string) => {
    Alert.alert(
      'Delete Card',
      'Are you sure you want to delete this card? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setCards(cards.filter((card) => card.id !== cardId));
            Alert.alert('Deleted', 'Card deleted successfully');
          },
        },
      ]
    );
  };

  const toggleCardStatus = (cardId: string) => {
    setCards(
      cards.map((card) =>
        card.id === cardId ? { ...card, isActive: !card.isActive } : card
      )
    );
  };

  const renderCard = (card: NFCCard) => (
    <View
      key={card.id}
      style={[styles.cardItem, !card.isActive && styles.cardItemInactive]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <CreditCard
            color={card.isActive ? Colors.brand.green : Colors.brand.neutral}
            size={24}
          />
          <Text style={styles.cardName}>{card.name}</Text>
        </View>

        <TouchableOpacity
          onPress={() => deleteCard(card.id)}
          style={styles.deleteButton}
        >
          <Trash2 color={Colors.brand.red} size={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.cardBalance}>
          <Text style={styles.balanceLabel}>Balance</Text>
          <Text style={styles.balanceAmount}>
            {card.balance} {card.currency}
          </Text>
        </View>

        {card.lastUsed && (
          <Text style={styles.lastUsed}>
            Last used: {card.lastUsed.toLocaleDateString()}
          </Text>
        )}
      </View>

      <View style={styles.cardActions}>
        <HSButton
          title={card.isActive ? 'Active' : 'Inactive'}
          variant={card.isActive ? 'primary' : 'secondary'}
          onPress={() => toggleCardStatus(card.id)}
          style={styles.statusButton}
          leftIcon={
            card.isActive ? (
              <Lock color={Colors.brand.white} size={16} />
            ) : (
              <Lock color={Colors.brand.ink} size={16} />
            )
          }
        />

        <HSButton
          title="Top Up"
          variant="secondary"
          onPress={() =>
            Alert.alert('Top Up', 'Top up functionality coming soon!')
          }
          style={styles.topUpButton}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={Colors.brand.ink} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NFC Cards</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.nfcIconContainer}>
            <Nfc color={Colors.brand.green} size={48} />
          </View>
          <Text style={styles.heroTitle}>HeySalad NFC Cards</Text>
          <Text style={styles.heroSubtitle}>
            Create virtual NFC cards linked to your wallet for secure contactless
            payments
          </Text>
        </View>

        {/* Create New Card Button */}
        <HSButton
          title="Create New Card"
          variant="primary"
          leftIcon={<Plus color={Colors.brand.white} size={20} />}
          onPress={createNewCard}
          style={styles.createButton}
        />

        {/* Cards List */}
        {cards.length > 0 && (
          <View style={styles.cardsSection}>
            <Text style={styles.sectionTitle}>Your Cards ({cards.length})</Text>
            <View style={styles.cardsList}>{cards.map(renderCard)}</View>
          </View>
        )}

        {/* Empty State */}
        {cards.length === 0 && (
          <View style={styles.emptyState}>
            <CreditCard color={Colors.brand.neutral} size={64} />
            <Text style={styles.emptyStateTitle}>No Cards Yet</Text>
            <Text style={styles.emptyStateSubtitle}>
              Create your first NFC card to start making contactless payments
            </Text>
          </View>
        )}

        {/* How It Works */}
        <View style={styles.howItWorksCard}>
          <Text style={styles.howItWorksTitle}>How It Works</Text>

          <View style={styles.stepsList}>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Create a Card</Text>
                <Text style={styles.stepDescription}>
                  Generate a virtual NFC card linked to your wallet
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Top Up Balance</Text>
                <Text style={styles.stepDescription}>
                  Add funds from your wallet to your card
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Tap to Pay</Text>
                <Text style={styles.stepDescription}>
                  Use your phone's NFC to make contactless payments
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Security Info */}
        <View style={styles.securityCard}>
          <Lock color={Colors.brand.green} size={24} />
          <View style={styles.securityContent}>
            <Text style={styles.securityTitle}>Secure & Private</Text>
            <Text style={styles.securityDescription}>
              Your card data is encrypted and stored securely. You can activate or
              deactivate cards anytime.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.brand.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    backgroundColor: Colors.brand.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.brand.lightGray,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.brand.ink,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  nfcIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.brand.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.brand.ink,
  },
  heroSubtitle: {
    fontSize: 14,
    color: Colors.brand.neutral,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  createButton: {
    width: '100%',
    marginBottom: 32,
  },
  cardsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.brand.ink,
    marginBottom: 16,
  },
  cardsList: {
    gap: 16,
  },
  cardItem: {
    backgroundColor: Colors.brand.white,
    borderWidth: 1,
    borderColor: Colors.brand.lightGray,
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  cardItemInactive: {
    opacity: 0.6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.brand.ink,
  },
  deleteButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDetails: {
    gap: 8,
  },
  cardBalance: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: Colors.brand.neutral,
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.brand.ink,
  },
  lastUsed: {
    fontSize: 12,
    color: Colors.brand.neutral,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  statusButton: {
    flex: 1,
  },
  topUpButton: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.brand.ink,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: Colors.brand.neutral,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  howItWorksCard: {
    backgroundColor: Colors.brand.lightGray,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  howItWorksTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.brand.ink,
    marginBottom: 20,
  },
  stepsList: {
    gap: 20,
  },
  stepItem: {
    flexDirection: 'row',
    gap: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.brand.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.brand.white,
  },
  stepContent: {
    flex: 1,
    gap: 4,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.brand.ink,
  },
  stepDescription: {
    fontSize: 14,
    color: Colors.brand.neutral,
    lineHeight: 20,
  },
  securityCard: {
    flexDirection: 'row',
    backgroundColor: Colors.brand.lightGreen,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  securityContent: {
    flex: 1,
    gap: 4,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.brand.green,
  },
  securityDescription: {
    fontSize: 14,
    color: Colors.brand.green,
    lineHeight: 20,
  },
});
