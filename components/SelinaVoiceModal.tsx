import React, { useState, useRef, useEffect } from 'react';
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
  Platform,
} from 'react-native';
import { 
  Mic, 
  Volume2, 
  VolumeX, 
  PhoneOff, 
  Minus, 
  X,
  AudioWaveform,
  Loader2
} from 'lucide-react-native';

// Import TTS - this will actually work
let Tts: any = null;
try {
  Tts = require('react-native-tts').default;
  // Initialize TTS if available
  if (Tts) {
    Tts.setDefaultLanguage('en-US');
    Tts.setDefaultRate(0.5);
  }
} catch (error) {
  console.log('[Selina] TTS not available:', error);
}

const { width, height } = Dimensions.get('window');

// Brand Colors
const COLORS = {
  cherryRed: '#ed4c4c',
  peach: '#faa09a', 
  lightPeach: '#ffd0cd',
  white: '#ffffff',
  gray: '#6B7280',
  darkGray: '#374151',
  green: '#10B981',
  backdrop: 'rgba(0, 0, 0, 0.8)'
};

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

// WORKING TTS function
const speakText = async (text: string, onFinish?: () => void) => {
  try {
    if (Tts && Tts.speak) {
      console.log('[Selina] 🗣️ Speaking:', text);
      
      // Configure TTS for British female voice with error handling
      if (Platform.OS === 'ios') {
        try {
          await Tts.setDefaultVoice('com.apple.ttsbundle.Moira-compact'); // British female
        } catch (voiceError) {
          console.log('[Selina] Voice setting failed, using default');
        }
      }
      
      try {
        await Tts.setDefaultRate(0.5); // Slower, more elegant
        await Tts.setDefaultPitch(1.0);
      } catch (configError) {
        console.log('[Selina] TTS config failed, using defaults');
      }
      
      // Set up finish listener with error handling
      if (onFinish) {
        try {
          const finishListener = Tts.addEventListener('tts-finish', () => {
            console.log('[Selina] ✅ TTS finished');
            try {
              Tts.removeEventListener('tts-finish', finishListener);
            } catch (removeError) {
              console.log('[Selina] Error removing TTS listener');
            }
            onFinish();
          });
        } catch (listenerError) {
          console.log('[Selina] TTS listener setup failed, using timeout fallback');
          // Fallback to timeout if listener setup fails
          setTimeout(() => {
            if (onFinish) onFinish();
          }, Math.max(2000, text.length * 50));
        }
      }
      
      // Speak the text
      await Tts.speak(text);
      
    } else {
      console.log('[Selina] 🗣️ TTS not available, would speak:', text);
      // Fallback: just simulate speaking time
      setTimeout(() => {
        if (onFinish) onFinish();
      }, Math.max(2000, text.length * 80));
    }
  } catch (error) {
    console.error('[Selina] TTS error:', error);
    // Fallback: simulate speaking time
    setTimeout(() => {
      if (onFinish) onFinish();
    }, Math.max(2000, text.length * 50));
  }
};

export default function SelinaVoiceModal({
  visible,
  onClose,
  currentBalance,
  walletAddress,
}: SelinaVoiceModalProps) {
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
  
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const addSelinaMessage = (text: string, shouldSpeak = true) => {
    const message: ConversationMessage = {
      id: (Date.now() + 1).toString(),
      type: 'selina',
      text: text,
      timestamp: new Date(),
    };
    setConversation(prev => [...prev, message]);
    
    if (shouldSpeak && !isMuted) {
      setConversationState('speaking');
      speakText(text, () => {
        setConversationState('ready');
      });
    }
  };

  // Connect to Selina
  const startConversation = () => {
    console.log('[Selina] 🚀 Starting demo conversation...');
    setConversationState('connecting');
    
    setTimeout(() => {
      setConversationState('ready');
      setCallStartTime(new Date());
      
      const welcomeMessage = `Right then! I'm Selina from HeySalad. I can see you have ${currentBalance.toFixed(1)} TRX in your wallet, worth about £${(currentBalance * 0.12).toFixed(2)}. How may I assist you today?`;
      addSelinaMessage(welcomeMessage);
    }, 1500);
  };

  // Simulate conversation
  const simulateConversation = () => {
    console.log('[Selina] 🎭 Starting demo conversation...');
    setConversationState('listening');

    setTimeout(() => {
      const userInputs = [
        "What's my current balance?",
        "How do I send TRX to someone?",
        "Is my wallet secure?",
        "Show me my transaction history",
        "Help me understand crypto payments"
      ];
      const randomInput = userInputs[Math.floor(Math.random() * userInputs.length)];
      
      addUserMessage(randomInput);
      setConversationState('thinking');
      
      setTimeout(() => {
        const responses = [
          `Brilliant! Your current balance is ${currentBalance.toFixed(1)} TRX, which is worth approximately £${(currentBalance * 0.12).toFixed(2)}. Looking quite healthy, I must say!`,
          "Excellent question! To send TRX, simply tap the send button, enter the recipient's address, and I'll guide you through our secure Face ID authentication process. Shall we give it a go?",
          "Absolutely! Your HeySalad wallet uses banking-grade security with military-level encryption and biometric protection. Your crypto is safer than the Crown Jewels, darling!",
          `Your TRON address is ${walletAddress.slice(0, 12)}... and you've had quite a bit of activity lately. Would you like me to walk you through your recent transactions?`,
          "I do say, I'm here to help with all your crypto needs! Whether it's sending payments, checking balances, or understanding blockchain technology, I'm at your service. What would you like to learn about?"
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        addSelinaMessage(randomResponse);
      }, 2000);
    }, 2500);
  };

  // End conversation
  const endConversation = () => {
    console.log('[Selina] Ending conversation');
    setConversationState('disconnected');
    setCallStartTime(null);
    setCallDuration(0);
  };

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
  }, [conversationState]);

  useEffect(() => {
    if (conversationState === 'listening') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
          Animated.timing(waveAnim, { toValue: 0, duration: 800, useNativeDriver: false }),
        ])
      ).start();
    }
  }, [conversationState]);

  useEffect(() => {
    if (conversationState === 'thinking') {
      Animated.loop(
        Animated.timing(spinAnim, { toValue: 1, duration: 2000, useNativeDriver: false })
      ).start();
    }
  }, [conversationState]);

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
  }, [visible, isMinimized]);

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
  }, [isMinimized]);

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
        simulateConversation();
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
        return 'Connecting to Selina...';
      case 'ready':
        return 'Connected! Tap the mic for a demo conversation with Selina.';
      case 'listening':
        return 'Demo conversation in progress...';
      case 'thinking':
        return 'Let me think about that...';
      case 'speaking':
        return 'Selina is responding...';
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
        return COLORS.cherryRed;
      case 'listening':
        return COLORS.green;
      case 'thinking':
      case 'speaking':
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
        </Animated.View>
      )}

      {/* Main Modal */}
      <Modal
        visible={visible && !isMinimized}
        transparent={true}
        animationType="none"
        onRequestClose={handleClose}
      >
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
                  disabled={conversationState === 'connecting' || conversationState === 'thinking' || conversationState === 'speaking'}
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
                Balance: {currentBalance} TRX (£{(currentBalance * 0.12).toFixed(2)})
              </Text>
              <Text style={styles.statusInfo}>
                Voice: TTS Demo Mode
              </Text>
            </View>

            {/* Controls */}
            {conversationState !== 'disconnected' && conversationState !== 'connecting' && (
              <View style={styles.callControlsBottom}>
                <TouchableOpacity 
                  style={[styles.controlButtonModal, isMuted && styles.controlButtonActive]}
                  onPress={toggleMute}
                >
                  {isMuted ? (
                    <VolumeX size={28} color={COLORS.white} />
                  ) : (
                    <Volume2 size={28} color={COLORS.darkGray} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.endCallButton}
                  onPress={endConversation}
                >
                  <PhoneOff size={32} color={COLORS.white} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.controlButtonModal}>
                  <Mic size={28} color={COLORS.darkGray} />
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

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
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.lightPeach + '30',
    alignItems: 'center',
    justifyContent: 'center',
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