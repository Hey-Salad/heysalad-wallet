/**
 * Card Store - Zustand store for card management in HeySalad Wallet
 * Manages virtual Visa cards via Stripe Issuing
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Card {
  id: string;
  cardholder_id: string;
  type: 'virtual' | 'physical';
  status: 'active' | 'inactive' | 'canceled';
  last4: string;
  exp_month: number;
  exp_year: number;
  brand: string;
  currency: string;
}

export interface CardStore {
  cards: Card[];
  selectedCard: Card | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCards: () => Promise<void>;
  selectCard: (cardId: string) => void;
  freezeCard: (cardId: string) => Promise<void>;
  unfreezeCard: (cardId: string) => Promise<void>;
  createCard: () => Promise<Card>;
  clearError: () => void;
  reset: () => void;
}

const CARDS_STORAGE_KEY = 'heysalad_wallet_cards';

// Mock API for now - will connect to heysalad-wallet-api
const mockApi = {
  listCards: async (): Promise<Card[]> => {
    const stored = await AsyncStorage.getItem(CARDS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  },
  
  createCard: async (): Promise<Card> => {
    const newCard: Card = {
      id: `card_${Date.now()}`,
      cardholder_id: 'ch_wallet_user',
      type: 'virtual',
      status: 'active',
      last4: String(Math.floor(1000 + Math.random() * 9000)),
      exp_month: 12,
      exp_year: 2028,
      brand: 'Visa',
      currency: 'gbp',
    };
    
    const existing = await mockApi.listCards();
    const updated = [...existing, newCard];
    await AsyncStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(updated));
    return newCard;
  },
  
  freezeCard: async (cardId: string): Promise<Card> => {
    const cards = await mockApi.listCards();
    const updated = cards.map(c => 
      c.id === cardId ? { ...c, status: 'inactive' as const } : c
    );
    await AsyncStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(updated));
    return updated.find(c => c.id === cardId)!;
  },
  
  unfreezeCard: async (cardId: string): Promise<Card> => {
    const cards = await mockApi.listCards();
    const updated = cards.map(c => 
      c.id === cardId ? { ...c, status: 'active' as const } : c
    );
    await AsyncStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(updated));
    return updated.find(c => c.id === cardId)!;
  },
};

const initialState = {
  cards: [] as Card[],
  selectedCard: null as Card | null,
  isLoading: false,
  error: null as string | null,
};

export const useCardStore = create<CardStore>((set, get) => ({
  ...initialState,

  fetchCards: async () => {
    set({ isLoading: true, error: null });
    try {
      const cards = await mockApi.listCards();
      const selectedCard = get().selectedCard;
      const updatedSelectedCard = selectedCard 
        ? cards.find(c => c.id === selectedCard.id) || cards[0] || null
        : cards[0] || null;

      set({ cards, selectedCard: updatedSelectedCard, isLoading: false });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch cards' 
      });
    }
  },

  selectCard: (cardId: string) => {
    const { cards } = get();
    const card = cards.find(c => c.id === cardId);
    if (card) set({ selectedCard: card });
  },

  freezeCard: async (cardId: string) => {
    const { cards, selectedCard } = get();
    const originalCards = [...cards];
    
    // Optimistic update
    const updatedCards = cards.map(c => 
      c.id === cardId ? { ...c, status: 'inactive' as const } : c
    );
    set({ cards: updatedCards, error: null });

    try {
      const frozenCard = await mockApi.freezeCard(cardId);
      const finalCards = get().cards.map(c => c.id === cardId ? frozenCard : c);
      set({ 
        cards: finalCards, 
        selectedCard: selectedCard?.id === cardId ? frozenCard : selectedCard 
      });
    } catch (error) {
      set({ cards: originalCards, error: 'Failed to freeze card' });
    }
  },

  unfreezeCard: async (cardId: string) => {
    const { cards, selectedCard } = get();
    const originalCards = [...cards];
    
    const updatedCards = cards.map(c => 
      c.id === cardId ? { ...c, status: 'active' as const } : c
    );
    set({ cards: updatedCards, error: null });

    try {
      const unfrozenCard = await mockApi.unfreezeCard(cardId);
      const finalCards = get().cards.map(c => c.id === cardId ? unfrozenCard : c);
      set({ 
        cards: finalCards, 
        selectedCard: selectedCard?.id === cardId ? unfrozenCard : selectedCard 
      });
    } catch (error) {
      set({ cards: originalCards, error: 'Failed to unfreeze card' });
    }
  },

  createCard: async () => {
    set({ isLoading: true, error: null });
    try {
      const newCard = await mockApi.createCard();
      const { cards } = get();
      set({ 
        cards: [...cards, newCard], 
        selectedCard: newCard,
        isLoading: false 
      });
      return newCard;
    } catch (error) {
      set({ isLoading: false, error: 'Failed to create card' });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
  reset: () => set(initialState),
}));
