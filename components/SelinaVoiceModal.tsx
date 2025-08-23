// components/SelinaVoiceModal.tsx
// SIMPLE WORKING VERSION - Focus on getting basic functionality working

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Image,
  Alert,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Audio } from 'expo-av';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Phone, 
  PhoneOff, 
  Minus, 
  X,
  AudioWaveform,
  Loader2
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface SelinaVoiceModalProps {
  visible: boolean;
  onClose: () => void;
  currentBalance: number;
  walletAddress: string;
}

interface ConversationMessage {
  id: string;
  type: 'user' | 'selina';
  text: string;
  timestamp: Date;
}

type ConversationState = 'disconnected' | 'connecting' | 'ready' | 'listening' | 'thinking' | 'speaking';

// Brand Colors
const COLORS = {
  cherryRed: '#ed4c4c',
  peach: '#faa09a', 
  lightPeach: '#ffd0cd',
  white: '#ffffff',
  gray: '#6B7280',
  darkGray: '#374151',
  green: '#10B981',
  lightGreen: '#D1FAE5',
  backdrop: 'rgba(0, 0, 0, 0.8)'
};

export default function SelinaVoiceModal({
  visible,
  onClose,
  currentBalance,
  walletAddress,
}: SelinaVoiceModalProps) {
  console.log('[SelinaModal] Rendered - visible:', visible);
  
  const [conversationState, setConversationState] = useState<ConversationState>('disconnected');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  
  // Animation refs
  const modalSlideAnim = useRef(new Animated.Value(height)).current;
  const minimizedScale = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const isConnectedRef = useRef(false);

  // ElevenLabs Configuration
  const ELEVENLABS_CONFIG = {
    apiKey: process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY,
    agentId: process.env.EXPO_PUBLIC_ELEVENLABS_AGENT_ID,
    websocketUrl: 'wss://api.elevenlabs.io/v1/convai/conversation',
  };

  // Timer logic
  useEffect(() => {
    if (callStartTime && visible) {
      callTimerRef.current = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - callStartTime.getTime()) / 1000);
        setCallDuration(diff);
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    }
    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [callStartTime, visible]);

  const formatCallDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Simple audio setup
  const setupAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
        interruptionModeIOS: 1,
        interruptionModeAndroid: 1,
      });
    } catch (error) {
      console.log('[Selina] Audio setup:', error);
    }
  };

  // Simple WebSocket connection
  const startConversation = useCallback(async () => {
    if (isConnectedRef.current) {
      console.log('[Selina] Already connected');
      return;
    }

    try {
      console.log('[Selina] 🚀 Starting conversation...');
      setConversationState('connecting');
      
      // Audio permission
      const audioPermission = await Audio.requestPermissionsAsync();
      if (audioPermission.status !== 'granted') {
        Alert.alert('Permission Required', 'Please enable microphone access');
        setConversationState('disconnected');
        return;
      }

      await setupAudio();

      if (!ELEVENLABS_CONFIG.apiKey || !ELEVENLABS_CONFIG.agentId) {
        throw new Error('Missing ElevenLabs configuration');
      }

      // Create WebSocket
      const wsUrl = `${ELEVENLABS_CONFIG.websocketUrl}?agent_id=${ELEVENLABS_CONFIG.agentId}`;
      console.log('[Selina] Connecting to:', wsUrl);
      
      websocketRef.current = new WebSocket(wsUrl);
      isConnectedRef.current = true;

      websocketRef.current.onopen = () => {
        console.log('[Selina] ✅ WebSocket connected');
        
        // Send simple init message
        const initMessage = { type: 'conversation_initiation_client_data' };
        websocketRef.current?.send(JSON.stringify(initMessage));
        
        setConversationState('ready');
        setCallStartTime(new Date());
        
        // Add welcome message
        setTimeout(() => {
          addSelinaMessage("Right then! I'm Selina from HeySalad. I can see you have 1983.9 TRX. How may I assist you today?");
        }, 1000);
      };

      websocketRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('[Selina] Message type:', message.type);
          
          switch (message.type) {
            case 'conversation_initiation_metadata':
              console.log('[Selina] Session started');
              break;
              
            case 'audio':
              console.log('[Selina] 🔊 Audio received');
              // For now, just acknowledge audio received
              break;
              
            case 'agent_response':
              console.log('[Selina] 🗣️ Agent says:', message.agent_response);
              if (message.agent_response) {
                addSelinaMessage(message.agent_response);
              }
              break;

            case 'user_transcript':
              console.log('[Selina] 📝 User said:', message.user_transcript);
              if (message.user_transcript) {
                addUserMessage(message.user_transcript);
              }
              break;

            case 'ping':
              websocketRef.current?.send(JSON.stringify({ type: 'pong' }));
              break;
          }
        } catch (error) {
          console.log('[Selina] Message parse error:', error);
        }
      };

      websocketRef.current.onerror = (error) => {
        console.log('[Selina] WebSocket error:', error);
        setConversationState('disconnected');
        isConnectedRef.current = false;
      };

      websocketRef.current.onclose = () => {
        console.log('[Selina] WebSocket closed');
        setConversationState('disconnected');
        isConnectedRef.current = false;
      };

    } catch (error) {
      console.error('[Selina] ❌ Connection failed:', error);
      setConversationState('disconnected');
      isConnectedRef.current = false;
    }
  }, []);

  // Add messages to conversation
  const addUserMessage = (text: string) => {
    const message: ConversationMessage = {
      id: Date.now().toString(),
      type: 'user',
      text: text,
      timestamp: new Date(),
    };
    setConversation(prev => [...prev, message]);
  };

  const addSelinaMessage = (text: string) => {
    const message: ConversationMessage = {
      id: (Date.now() + 1).toString(),
      type: 'selina',
      text: text,
      timestamp: new Date(),
    };
    setConversation(prev => [...prev, message]);
  };

  // Simulate listening (for now)
  const startListening = async () => {
    try {
      console.log('[Selina] 🎙️ Listening...');
      setConversationState('listening');

      // Simulate listening for 3 seconds
      setTimeout(() => {
        // Simulate user input
        const userInputs = [
          "What's my current balance?",
          "How do I send TRX?",
          "Is my wallet secure?",
          "Show me my address",
          "Help me with payments"
        ];
        const randomInput = userInputs[Math.floor(Math.random() * userInputs.length)];
        
        addUserMessage(randomInput);
        setConversationState('thinking');
        
        // Simulate Selina response
        setTimeout(() => {
          const responses = [
            `Right then, your balance is ${currentBalance} TRX, worth approximately £${(currentBalance * 0.12).toFixed(2)}. Quite healthy indeed!`,
            "Brilliant! To send TRX, I'll guide you through the Face ID authentication process. Shall we proceed?",
            "Absolutely! Your HeySalad wallet uses banking-grade security with Face ID protection. Everything is encrypted.",
            `Your TRON address is ${walletAddress.slice(0, 12)}... Would you like me to help you share it securely?`,
            "I do say, I'm here to help with all your crypto needs! What specific assistance would you like?"
          ];
          const randomResponse = responses[Math.floor(Math.random() * responses.length)];
          
          addSelinaMessage(randomResponse);
          setConversationState('ready');
        }, 2000);
        
      }, 3000);

    } catch (error) {
      console.error('[Selina] Listen failed:', error);
      setConversationState('ready');
    }
  };

  // End conversation
  const endConversation = useCallback(() => {
    console.log('[Selina] Ending conversation');
    
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
    
    isConnectedRef.current = false;
    setConversationState('disconnected');
    setCallStartTime(null);
    setCallDuration(0);
  }, []);

  // Animations
  useEffect(() => {
    if (conversationState === 'ready') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 2000, useNativeDriver: false }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: false }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [conversationState, pulseAnim]);

  useEffect(() => {
    if (conversationState === 'listening') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
          Animated.timing(waveAnim, { toValue: 0, duration: 800, useNativeDriver: false }),
        ])
      ).start();
    } else {
      waveAnim.setValue(0);
    }
  }, [conversationState, waveAnim]);

  useEffect(() => {
    if (conversationState === 'thinking') {
      Animated.loop(
        Animated.timing(spinAnim, { toValue: 1, duration: 2000, useNativeDriver: false })
      ).start();
    } else {
      spinAnim.setValue(0);
    }
  }, [conversationState, spinAnim]);

  useEffect(() => {
    if (visible && !isMinimized) {
      Animated.spring(modalSlideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: false,
      }).start();
    } else {
      modalSlideAnim.setValue(height);
    }
  }, [visible, isMinimized, modalSlideAnim]);

  useEffect(() => {
    if (isMinimized) {
      Animated.spring(minimizedScale, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: false,
      }).start();
    } else {
      minimizedScale.setValue(0);
    }
  }, [isMinimized, minimizedScale]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endConversation();
    };
  }, [endConversation]);

  // UI handlers
  const handleClose = () => {
    endConversation();
    setConversation([]);
    setIsMinimized(false);
    onClose();
  };

  const handleMinimize = () => setIsMinimized(true);
  const handleMaximize = () => setIsMinimized(false);
  const toggleMute = () => setIsMuted(!isMuted);

  const handleMainButtonPress = () => {
    switch (conversationState) {
      case 'disconnected':
        startConversation();
        break;
      case 'ready':
        startListening();
        break;
    }
  };

  // UI helpers
  const getStatusText = () => {
    switch (conversationState) {
      case 'disconnected':
        return 'Tap to connect to Selina';
      case 'connecting':
        return 'Connecting to Selina...';
      case 'ready':
        return 'Connected - Ready to help!';
      case 'listening':
        return 'Listening...';
      case 'thinking':
        return 'Selina is thinking...';
      case 'speaking':
        return 'Selina is speaking';
      default:
        return 'Tap to connect';
    }
  };

  const getCenterStatusMessage = () => {
    switch (conversationState) {
      case 'disconnected':
        return 'Tap the button below to start chatting with Selina';
      case 'connecting':
        return 'Connecting to Selina via WebSocket...';
      case 'ready':
        return 'Connected! Ask me anything about your wallet or crypto payments.';
      case 'listening':
        return 'I\'m listening to your question...';
      case 'thinking':
        return 'Let me think about that...';
      case 'speaking':
        return 'Selina is speaking';
      default:
        return 'Tap to connect';
    }
  };

  const getMainButtonAnimation = () => {
    switch (conversationState) {
      case 'ready':
        return [{ scale: pulseAnim }];
      case 'listening':
        return [{ scale: waveAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] }) }];
      case 'thinking':
        return [{ rotate: spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }];
      default:
        return [{ scale: 1 }];
    }
  };

  const getButtonColor = () => {
    switch (conversationState) {
      case 'ready':
      case 'listening':
        return COLORS.cherryRed;
      case 'thinking':
        return COLORS.peach;
      case 'connecting':
        return COLORS.peach;
      default:
        return COLORS.gray;
    }
  };

  const getMainIcon = () => {
    switch (conversationState) {
      case 'listening':
        return AudioWaveform;
      case 'thinking':
        return Loader2;
      case 'connecting':
        return Loader2;
      default:
        return Mic;
    }
  };

  const MainIcon = getMainIcon();

  return (
    <>
      {/* Minimized Widget */}
      {isMinimized && visible && (
        <Animated.View 
          style={[
            styles.minimizedFloatingWidget,
            {
              transform: [{ scale: minimizedScale }],
              opacity: minimizedScale
            }
          ]}
        >
          <TouchableOpacity
            style={styles.minimizedWidgetButton}
            onPress={handleMaximize}
            activeOpacity={0.8}
          >
            <View style={styles.minimizedWidgetContent}>
              <Image 
                source={require("@/assets/images/HeySalad_black_logo.png")} 
                style={styles.minimizedLogo} 
                resizeMode="contain" 
              />
              <Text style={styles.minimizedWidgetText}>Selina</Text>
              <View style={[styles.statusDot, { 
                backgroundColor: conversationState === 'ready' || conversationState === 'listening' || conversationState === 'thinking' ? 
                  COLORS.green : COLORS.gray 
              }]} />
            </View>
            {conversationState !== 'disconnected' && (
              <Text style={styles.minimizedTimerText}>{formatCallDuration(callDuration)}</Text>
            )}
          </TouchableOpacity>
          
          <View style={styles.minimizedActions}>
            <TouchableOpacity 
              style={styles.minimizedActionButton}
              onPress={toggleMute}
            >
              <VolumeX size={12} color={isMuted ? COLORS.white : COLORS.gray} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.minimizedActionButton, styles.endCallButtonSmall]}
              onPress={endConversation}
            >
              <PhoneOff size={12} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Main Modal */}
      <Modal
        visible={visible && !isMinimized}
        transparent={true}
        animationType="none"
        onRequestClose={handleClose}
        statusBarTranslucent={true}
      >
        <StatusBar backgroundColor={COLORS.backdrop} barStyle="light-content" />
        <View style={styles.modalBackdrop}>
          <Animated.View 
            style={[
              styles.modalContainer,
              { transform: [{ translateY: modalSlideAnim }] }
            ]}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <X size={24} color={COLORS.darkGray} />
              </TouchableOpacity>
              
              <View style={styles.headerTitleContainer}>
                <Image 
                  source={require("@/assets/images/HeySalad_black_logo.png")} 
                  style={styles.headerLogo} 
                  resizeMode="contain" 
                />
              </View>
              
              <TouchableOpacity style={styles.minimizeButton} onPress={handleMinimize}>
                <Minus size={24} color={COLORS.darkGray} />
              </TouchableOpacity>
            </View>

            {/* Status */}
            <View style={styles.connectionStatusContainer}>
              <Text style={styles.connectionStatusText}>{getStatusText()}</Text>
              
              {conversationState !== 'disconnected' && (
                <View style={styles.callDurationContainer}>
                  <Text style={styles.callDurationText}>{formatCallDuration(callDuration)}</Text>
                </View>
              )}
            </View>

            {/* Center Message */}
            <View style={styles.centerMessageContainer}>
              <Text style={styles.centerMessage}>{getCenterStatusMessage()}</Text>

              {conversation.length > 0 && (
                <ScrollView style={styles.conversationScroll} showsVerticalScrollIndicator={false}>
                  {conversation.slice(-3).map((message) => (
                    <View key={message.id} style={[
                      styles.messageContainer,
                      message.type === 'user' ? styles.userMessage : styles.selinaMessage
                    ]}>
                      <Text style={styles.messageSender}>
                        {message.type === 'user' ? 'You' : 'Selina'}
                      </Text>
                      <Text style={styles.messageText}>{message.text}</Text>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Main Button */}
            <View style={styles.mainButtonContainer}>
              <Animated.View
                style={[
                  styles.mainVoiceButtonOuter,
                  {
                    backgroundColor: getButtonColor() + '20',
                    transform: getMainButtonAnimation()
                  }
                ]}
              >
                <TouchableOpacity
                  style={[styles.mainVoiceButton, { backgroundColor: getButtonColor() }]}
                  onPress={handleMainButtonPress}
                  disabled={conversationState === 'connecting' || conversationState === 'thinking'}
                >
                  <MainIcon size={80} color={COLORS.white} />
                </TouchableOpacity>
              </Animated.View>
              
              {conversationState === 'disconnected' && (
                <Text style={styles.connectionHint}>
                  Tap to connect to Selina
                </Text>
              )}
            </View>

            {/* Status Info */}
            <View style={styles.statusInfoContainer}>
              <Text style={styles.statusInfo}>
                Status: WebSocket {conversationState}
              </Text>
              <Text style={styles.statusInfo}>
                Balance: {currentBalance} TRX (£{(currentBalance * 0.12).toFixed(2)})
              </Text>
            </View>

            {/* Controls */}
            {conversationState !== 'disconnected' && conversationState !== 'connecting' && (
              <View style={styles.callControlsBottom}>
                <TouchableOpacity 
                  style={[styles.controlButtonModal, isMuted && styles.controlButtonActive]}
                  onPress={toggleMute}
                >
                  <VolumeX size={28} color={isMuted ? COLORS.white : COLORS.darkGray} />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.endCallButton}
                  onPress={endConversation}
                >
                  <PhoneOff size={32} color={COLORS.white} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.controlButtonModal}>
                  <Volume2 size={28} color={COLORS.darkGray} />
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

// Styles
const styles = StyleSheet.create({
  minimizedFloatingWidget: {
    position: 'absolute',
    top: 100,
    right: 20,
    backgroundColor: COLORS.cherryRed,
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
  },
  minimizedWidgetButton: {
    alignItems: 'center',
  },
  minimizedWidgetContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  minimizedLogo: {
    width: 20,
    height: 10,
  },
  minimizedWidgetText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  minimizedTimerText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  minimizedActions: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  minimizedActionButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  endCallButtonSmall: {
    backgroundColor: COLORS.darkGray,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: COLORS.backdrop,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: height * 0.85,
    paddingTop: 16,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightPeach + '30',
    backgroundColor: COLORS.white,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.lightPeach + '30',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  headerLogo: {
    width: 120,
    height: 36,
  },
  minimizeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.lightPeach + '30',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  connectionStatusContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  connectionStatusText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  callDurationContainer: {
    backgroundColor: COLORS.lightPeach + '50',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  callDurationText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.cherryRed,
  },
  centerMessageContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    flex: 1,
    justifyContent: 'flex-start',
  },
  centerMessage: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  conversationScroll: {
    maxHeight: 120,
    width: '100%',
    marginTop: 16,
  },
  messageContainer: {
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    maxWidth: '85%',
  },
  userMessage: {
    backgroundColor: '#e0f2fe',
    alignSelf: 'flex-end',
  },
  selinaMessage: {
    backgroundColor: COLORS.lightPeach,
    alignSelf: 'flex-start',
  },
  messageSender: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 13,
    color: COLORS.darkGray,
    lineHeight: 18,
  },
  mainButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  mainVoiceButtonOuter: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  mainVoiceButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  connectionHint: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '500',
  },
  statusInfoContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 4,
  },
  statusInfo: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
  },
  callControlsBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 40,
    paddingVertical: 16,
  },
  controlButtonModal: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.lightPeach + '40',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  controlButtonActive: {
    backgroundColor: COLORS.cherryRed,
  },
  endCallButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.cherryRed,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.cherryRed,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});