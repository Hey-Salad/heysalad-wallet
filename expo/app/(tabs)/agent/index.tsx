/**
 * Web3 Agent Chat Screen
 * AI-powered chat interface for shopping, payments, and blockchain queries
 * Requirements: 6.2
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Send, ShoppingCart, CreditCard, Bot, Sparkles, RefreshCw } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useWallet } from '@/providers/WalletProvider';
import {
  web3AgentApi,
  ChatResponse,
  Intent,
  ShoppingSession,
  PaymentRequest,
} from '@/services/web3AgentApi';

// =============================================================================
// Types
// =============================================================================

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  intent?: Intent;
  action?: {
    type: 'payment' | 'shopping' | 'info';
    data: unknown;
  };
  isLoading?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export default function AgentChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { wallet } = useWallet();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm your Web3 shopping assistant. I can help you with:\n\n🛒 Autonomous grocery shopping\n💳 USDC payments on BNB Chain\n🔗 Blockchain queries\n📝 Smart contract generation\n\nWhat would you like to do today?",
      timestamp: Date.now(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeSession, setActiveSession] = useState<ShoppingSession | null>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Send message to agent
  const sendMessage = useCallback(async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputText.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Add loading message
    const loadingId = `loading-${Date.now()}`;
    setMessages(prev => [
      ...prev,
      {
        id: loadingId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isLoading: true,
      },
    ]);

    try {
      const response = await web3AgentApi.sendChatMessage({
        message: userMessage.content,
        userId: wallet.address,
      });

      // Remove loading message
      setMessages(prev => prev.filter(m => m.id !== loadingId));

      if (response.success && response.data) {
        const data = response.data;
        
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.message,
          timestamp: Date.now(),
          intent: data.intent,
          action: data.action,
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Handle clarification requests
        if (data.needsClarification && data.clarification) {
          const clarificationMsg: ChatMessage = {
            id: `clarification-${Date.now()}`,
            role: 'assistant',
            content: `I'm not quite sure what you mean. ${data.clarification.questions.join(' ')}`,
            timestamp: Date.now(),
          };
          setMessages(prev => [...prev, clarificationMsg]);
        }
      } else {
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: response.error || 'Sorry, I encountered an error. Please try again.',
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      // Remove loading message
      setMessages(prev => prev.filter(m => m.id !== loadingId));

      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I couldn\'t connect to the server. Please check your connection and try again.',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading, wallet.address]);

  // Handle action buttons in messages
  const handleAction = useCallback(async (action: ChatMessage['action']) => {
    if (!action) return;

    switch (action.type) {
      case 'shopping': {
        const data = action.data as { 
          items?: { name: string; quantity: number }[]; 
          store?: string; 
          ready?: boolean 
        };
        if (data.ready && data.items && data.items.length > 0) {
          Alert.alert(
            'Start Shopping',
            `Ready to shop at ${data.store || 'Tesco'}?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Start',
                onPress: async () => {
                  try {
                    // Start shopping session first
                    const response = await web3AgentApi.startShopping({
                      userId: wallet.address || 'anonymous',
                      store: (data.store as 'tesco' | 'sainsburys' | 'asda' | 'ocado') || 'tesco',
                      items: data.items!.map(item => ({
                        name: item.name,
                        quantity: item.quantity,
                      })),
                      deliveryAddress: {
                        line1: 'TBD',
                        city: 'London',
                        postcode: 'SW1A 1AA',
                        country: 'UK',
                      },
                      allowSubstitutes: true,
                    });

                    if (response.success && response.data) {
                      // Navigate to shopping session screen with sessionId
                      router.push({
                        pathname: '/(tabs)/agent/shopping-session',
                        params: { sessionId: response.data.sessionId },
                      });
                    } else {
                      Alert.alert('Error', response.error || 'Failed to start shopping session');
                    }
                  } catch (error) {
                    Alert.alert('Error', 'Failed to connect to server');
                  }
                },
              },
            ]
          );
        } else {
          Alert.alert('Missing Items', 'Please specify what items you want to buy.');
        }
        break;
      }
      case 'payment': {
        const data = action.data as { amount?: number; recipient?: string; chain?: string; ready?: boolean };
        if (data.ready && data.amount && data.recipient) {
          Alert.alert(
            'Create Payment',
            `Send ${data.amount} USDC to ${data.recipient.slice(0, 10)}...?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Create',
                onPress: async () => {
                  try {
                    const response = await web3AgentApi.createPayment({
                      amount: data.amount!,
                      description: 'Payment via Web3 Agent',
                      chain: (data.chain as 'bnb' | 'avalanche') || 'bnb',
                    });
                    if (response.success && response.data) {
                      const payment = response.data;
                      // Open payment deep link
                      await web3AgentApi.openPaymentDeepLink(payment.qrCode.deepLink);
                    }
                  } catch (error) {
                    Alert.alert('Error', 'Failed to create payment');
                  }
                },
              },
            ]
          );
        }
        break;
      }
    }
  }, [router]);

  // Render message bubble
  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';

    if (item.isLoading) {
      return (
        <View style={[styles.messageBubble, styles.assistantBubble]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors.brand.cherryRed} />
            <Text style={styles.loadingText}>Thinking...</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.messageContainer, isUser && styles.userMessageContainer]}>
        {!isUser && (
          <View style={styles.avatarContainer}>
            <Bot size={20} color={Colors.brand.cherryRed} />
          </View>
        )}
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.messageText, isUser && styles.userMessageText]}>
            {item.content}
          </Text>
          
          {/* Action buttons */}
          {item.action && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleAction(item.action)}
            >
              {item.action.type === 'shopping' && (
                <>
                  <ShoppingCart size={16} color={Colors.brand.white} />
                  <Text style={styles.actionButtonText}>Start Shopping</Text>
                </>
              )}
              {item.action.type === 'payment' && (
                <>
                  <CreditCard size={16} color={Colors.brand.white} />
                  <Text style={styles.actionButtonText}>Create Payment</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Quick action buttons
  const quickActions = [
    { label: 'Shop groceries', icon: ShoppingCart, message: 'I want to buy groceries from Tesco' },
    { label: 'Send payment', icon: CreditCard, message: 'I want to send a USDC payment' },
    { label: 'Blockchain info', icon: Sparkles, message: 'Tell me about BNB Chain' },
  ];

  const handleQuickAction = (message: string) => {
    setInputText(message);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Bot size={24} color={Colors.brand.cherryRed} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Web3 Agent</Text>
            <Text style={styles.headerSubtitle}>AI Shopping & Payments</Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
      />

      {/* Quick Actions */}
      {messages.length <= 1 && (
        <View style={styles.quickActions}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickActionButton}
              onPress={() => handleQuickAction(action.message)}
            >
              <action.icon size={16} color={Colors.brand.cherryRed} />
              <Text style={styles.quickActionText}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Input */}
      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 10 }]}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask me anything..."
          placeholderTextColor={Colors.brand.inkMuted}
          multiline
          maxLength={500}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.brand.white} />
          ) : (
            <Send size={20} color={Colors.brand.white} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  header: {
    backgroundColor: Colors.brand.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.brand.border,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.brand.lightPeach,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.brand.ink,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.brand.inkMuted,
    marginTop: 2,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 100,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.brand.lightPeach,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 14,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: Colors.brand.cherryRed,
    borderBottomRightRadius: 4,
    marginLeft: 'auto',
  },
  assistantBubble: {
    backgroundColor: '#F5F5F5',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.brand.ink,
  },
  userMessageText: {
    color: Colors.brand.white,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.brand.inkMuted,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.brand.cherryRed,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.brand.white,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.brand.lightPeach,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.brand.cherryRed,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Colors.brand.white,
    borderTopWidth: 1,
    borderTopColor: Colors.brand.border,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 15,
    maxHeight: 100,
    color: Colors.brand.ink,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.brand.cherryRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.brand.inkMuted,
  },
});
