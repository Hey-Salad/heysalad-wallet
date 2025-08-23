// components/AudioPay.tsx
// Audio payment component with voice input and TTS feedback

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import { 
  Mic, 
  Volume2, 
  MicOff, 
  VolumeX, 
  Loader2,
  AudioWaveform,
  CheckCircle
} from 'lucide-react-native';
import { parseVoiceToIntent } from "@/features/voice/intent";

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
};

interface AudioPayProps {
  onTranscript: (text: string) => void;
  currentBalance: number;
  onCancel?: () => void;
}

type AudioState = 'ready' | 'listening' | 'processing' | 'speaking' | 'success' | 'error';

interface PendingIntent {
  rawText: string;
  amountTrx: number;
  toName?: string;
  address?: string;
  note?: string;
  category: "groceries" | "restaurants" | "farmers_market" | "delivery" | "other" | "sustainable";
  sustainable: boolean;
}

export default function AudioPay({ onTranscript, currentBalance, onCancel }: AudioPayProps) {
  const [audioState, setAudioState] = useState<AudioState>('ready');
  const [isMuted, setIsMuted] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [currentMessage, setCurrentMessage] = useState<string>('Ready to listen');
  const [lastError, setLastError] = useState<string | null>(null);
  const [parsedIntent, setParsedIntent] = useState<PendingIntent | null>(null);
  
  // Animation refs
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // ElevenLabs Configuration
  const ELEVENLABS_CONFIG = {
    apiKey: process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY,
    voiceId: process.env.EXPO_PUBLIC_ELEVENLABS_SELINA_VOICE_ID,
    baseUrl: 'https://api.elevenlabs.io/v1',
  };

  // Request microphone permission
  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      console.log('[AudioPay] 🎙️ Requesting microphone permissions...');
      
      const audioPermission = await Audio.requestPermissionsAsync();
      console.log('[AudioPay] Audio permission status:', audioPermission.status);
      
      if (audioPermission.status !== 'granted') {
        console.log('[AudioPay] ❌ Audio permission denied');
        Alert.alert(
          'Microphone Permission Required',
          'Please enable microphone access to use voice payments.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => console.log('[AudioPay] User should open settings') }
          ]
        );
        return false;
      }

      console.log('[AudioPay] ✅ Permissions granted');
      return true;
      
    } catch (error) {
      console.error('[AudioPay] ❌ Permission request error:', error);
      return false;
    }
  };

  // Setup audio session
  const setupAudioSession = async (): Promise<boolean> => {
    try {
      console.log('[AudioPay] 🔧 Setting up audio session...');
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });
      
      console.log('[AudioPay] ✅ Audio session setup complete');
      return true;
      
    } catch (error) {
      console.error('[AudioPay] ⚠️ Audio session setup error:', error);
      return true; // Continue anyway
    }
  };

  // Initialize audio permissions
  useEffect(() => {
    const initializeAudio = async () => {
      const hasPermission = await requestMicrophonePermission();
      setPermissionGranted(hasPermission);
      
      if (hasPermission) {
        await setupAudioSession();
        setCurrentMessage('Ready! Tap Listen to start voice payment');
      } else {
        setCurrentMessage('Microphone permission needed for voice payments');
      }
    };

    initializeAudio();
  }, []);

  // Start listening for voice input
  const startListening = async () => {
    try {
      if (!permissionGranted) {
        const hasPermission = await requestMicrophonePermission();
        setPermissionGranted(hasPermission);
        if (!hasPermission) return;
      }

      console.log('[AudioPay] 🎙️ Starting to listen...');
      setAudioState('listening');
      setCurrentMessage('Listening... Say your payment request');
      setLastError(null);

      // Create recording with iOS-safe settings
      const recording = new Audio.Recording();
      
      const recordingOptions = {
        android: {
          extension: '.mp3',
          outputFormat: 2,
          audioEncoder: 3,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.caf',
          audioQuality: 0x7F,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm;codecs=opus',
          bitsPerSecond: 128000,
        },
      };

      try {
        await recording.prepareToRecordAsync(recordingOptions);
        await recording.startAsync();
        recordingRef.current = recording;

        // Auto-stop recording after 6 seconds
        setTimeout(() => {
          if (recordingRef.current && audioState === 'listening') {
            stopListeningAndProcess();
          }
        }, 6000);

      } catch (prepareError) {
        console.error('[AudioPay] ❌ Recording error:', prepareError);
        // Fallback to simulated voice input for testing
        setCurrentMessage('Simulating voice input...');
        setTimeout(() => {
          simulateVoiceInput();
        }, 2000);
      }

    } catch (error) {
      console.error('[AudioPay] ❌ Failed to start listening:', error);
      setAudioState('error');
      setCurrentMessage('Recording failed. Try again.');
      setLastError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  // Stop listening and process the recording
  const stopListeningAndProcess = async () => {
    try {
      setAudioState('processing');
      setCurrentMessage('Processing your payment request...');

      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }

      // Simulate processing time, then use simulated input
      setTimeout(() => {
        simulateVoiceInput();
      }, 1500);

    } catch (error) {
      console.error('[AudioPay] Failed to process recording:', error);
      setAudioState('error');
      setCurrentMessage('Processing failed. Try again.');
      setLastError('Processing failed');
    }
  };

  // Simulate voice input for testing (replace with actual speech-to-text)
  const simulateVoiceInput = async () => {
    const simulatedInputs = [
      "Send 5 TRX to TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH",
      "Send 10 TRX to Alex for groceries",
      "Send 2.5 TRX to Sarah for coffee",
      "Transfer 15 TRX to Bob for lunch",
      "Pay 7.5 TRX to TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH for shopping"
    ];
    
    const userInput = simulatedInputs[Math.floor(Math.random() * simulatedInputs.length)];
    console.log('[AudioPay] 🎤 Simulated voice input:', userInput);
    
    try {
      const parsed = await parseVoiceToIntent(userInput);
      
      if (!parsed) {
        const errorMsg = "Sorry, I couldn't understand your payment request. Please try again.";
        setCurrentMessage(errorMsg);
        setAudioState('error');
        if (!isMuted) {
          await speakText(errorMsg);
        }
        return;
      }

      const intent: PendingIntent = {
        rawText: userInput,
        amountTrx: parsed.amountTrx,
        toName: parsed.toName,
        address: parsed.address,
        note: parsed.note,
        category: parsed.category ?? "other",
        sustainable: parsed.sustainable ?? false,
      };

      setParsedIntent(intent);
      
      // Check balance
      if (intent.amountTrx > currentBalance) {
        const errorMsg = `Insufficient balance. You only have ${currentBalance} TRX available.`;
        setCurrentMessage(errorMsg);
        setAudioState('error');
        if (!isMuted) {
          await speakText(errorMsg);
        }
        return;
      }

      // Success - payment ready
      setAudioState('success');
      const successMsg = `Payment ready: ${intent.amountTrx} TRX to ${intent.toName || 'recipient'}. Proceeding to confirmation.`;
      setCurrentMessage(successMsg);
      
      if (!isMuted) {
        await speakText(successMsg);
      }

      // Pass the transcript to parent component
      setTimeout(() => {
        onTranscript(userInput);
      }, 1000);

    } catch (error) {
      const errorMsg = "Voice recognition failed. Please try again.";
      setCurrentMessage(errorMsg);
      setAudioState('error');
      setLastError('Voice recognition failed');
      if (!isMuted) {
        await speakText(errorMsg);
      }
    }
  };

  // Text-to-speech function
  const speakText = async (text: string) => {
    if (isMuted) return;
    
    try {
      setAudioState('speaking');
      setCurrentMessage('Speaking...');

      if (!ELEVENLABS_CONFIG.apiKey || !ELEVENLABS_CONFIG.voiceId) {
        console.log('[AudioPay] No TTS API key - using fallback timing');
        const speakingTime = Math.max(2000, text.length * 80);
        setTimeout(() => {
          setAudioState('ready');
          setCurrentMessage('Ready! Tap Listen for voice payment');
        }, speakingTime);
        return;
      }

      const response = await fetch(`${ELEVENLABS_CONFIG.baseUrl}/text-to-speech/${ELEVENLABS_CONFIG.voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': ELEVENLABS_CONFIG.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          model_id: "eleven_multilingual_v1",
          voice_settings: {
            stability: 0.8,
            similarity_boost: 0.8,
            style: 0.4,
            use_speaker_boost: true,
          }
        })
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const fileReader = new FileReader();
        
        fileReader.onload = async () => {
          try {
            const audioUri = fileReader.result as string;
            const { sound } = await Audio.Sound.createAsync(
              { uri: audioUri },
              { shouldPlay: true, volume: 1.0 }
            );
            
            soundRef.current = sound;
            
            sound.setOnPlaybackStatusUpdate((status: any) => {
              if (status.isLoaded && status.didJustFinish) {
                setAudioState('ready');
                setCurrentMessage('Ready! Tap Listen for voice payment');
                sound.unloadAsync();
              }
            });
            
          } catch (playError) {
            console.error('[AudioPay] Audio playback failed:', playError);
            setAudioState('ready');
            setCurrentMessage('Ready! Tap Listen for voice payment');
          }
        };
        
        fileReader.readAsDataURL(audioBlob);
      } else {
        throw new Error(`TTS failed: ${response.status}`);
      }
    } catch (error) {
      console.error('[AudioPay] TTS error:', error);
      setAudioState('ready');
      setCurrentMessage('Ready! Tap Listen for voice payment');
    }
  };

  // Provide audio instructions
  const speakInstructions = async () => {
    const instructions = "To make a voice payment, say something like: Send 5 TRX to T-L-Y-Q-Z-V-G-L-V-1-S-R-K-B-7-D-T-O-T-A-E-Q-G-D-S-F-P-T-X-R-J-Z-Y-H. Or say: Send 10 TRX to Alex for groceries.";
    setCurrentMessage('Playing instructions...');
    await speakText(instructions);
  };

  // Reset to ready state
  const resetAudioPay = () => {
    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync().catch(console.log);
      recordingRef.current = null;
    }
    if (soundRef.current) {
      soundRef.current.stopAsync().catch(console.log);
      soundRef.current = null;
    }
    
    setAudioState('ready');
    setCurrentMessage('Ready! Tap Listen for voice payment');
    setLastError(null);
    setParsedIntent(null);
  };

  // Handle main button press
  const handleMainButtonPress = () => {
    switch (audioState) {
      case 'ready':
      case 'error':
        startListening();
        break;
      case 'listening':
        stopListeningAndProcess();
        break;
      case 'success':
        resetAudioPay();
        break;
      default:
        // Do nothing for processing, speaking states
        break;
    }
  };

  // Animation effects
  useEffect(() => {
    if (audioState === 'ready') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 2000, useNativeDriver: false }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: false }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [audioState, pulseAnim]);

  useEffect(() => {
    if (audioState === 'listening') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
          Animated.timing(waveAnim, { toValue: 0, duration: 800, useNativeDriver: false }),
        ])
      ).start();
    } else {
      waveAnim.setValue(0);
    }
  }, [audioState, waveAnim]);

  useEffect(() => {
    if (audioState === 'processing') {
      Animated.loop(
        Animated.timing(spinAnim, { toValue: 1, duration: 2000, useNativeDriver: false })
      ).start();
    } else {
      spinAnim.setValue(0);
    }
  }, [audioState, spinAnim]);

  useEffect(() => {
    if (audioState === 'speaking') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 500, useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0, duration: 500, useNativeDriver: false }),
        ])
      ).start();
    } else {
      glowAnim.setValue(0);
    }
  }, [audioState, glowAnim]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(console.log);
      }
      if (soundRef.current) {
        soundRef.current.stopAsync().catch(console.log);
      }
    };
  }, []);

  // Helper functions
  const getMainIcon = () => {
    switch (audioState) {
      case 'listening':
        return AudioWaveform;
      case 'processing':
        return Loader2;
      case 'speaking':
        return Volume2;
      case 'success':
        return CheckCircle;
      case 'error':
        return MicOff;
      default:
        return Mic;
    }
  };

  const getButtonColor = () => {
    switch (audioState) {
      case 'ready':
        return COLORS.cherryRed;
      case 'listening':
        return COLORS.cherryRed;
      case 'processing':
        return COLORS.peach;
      case 'speaking':
        return COLORS.green;
      case 'success':
        return COLORS.green;
      case 'error':
        return COLORS.gray;
      default:
        return COLORS.gray;
    }
  };

  const getMainButtonAnimation = () => {
    switch (audioState) {
      case 'ready':
        return [{ scale: pulseAnim }];
      case 'listening':
        return [{ 
          scale: waveAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.1]
          })
        }];
      case 'processing':
        return [{ 
          rotate: spinAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg']
          })
        }];
      case 'speaking':
        return [{ 
          scale: glowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.05]
          })
        }];
      default:
        return [{ scale: 1 }];
    }
  };

  const getButtonText = () => {
    switch (audioState) {
      case 'ready':
        return 'Listen';
      case 'listening':
        return 'Listening...';
      case 'processing':
        return 'Processing...';
      case 'speaking':
        return 'Speaking...';
      case 'success':
        return 'Complete';
      case 'error':
        return 'Try Again';
      default:
        return 'Listen';
    }
  };

  const MainIcon = getMainIcon();

  if (!permissionGranted && permissionGranted !== null) {
    return (
      <View style={styles.container}>
        <Image 
          source={require("@/assets/images/HSK-SPEEDY.png")} 
          style={styles.mascotImage} 
          resizeMode="contain" 
        />
        <Text style={styles.permissionMessage}>
          Microphone permission is required for voice payments
        </Text>
        <TouchableOpacity 
          style={styles.permissionButton} 
          onPress={() => requestMicrophonePermission()}
        >
          <Text style={styles.permissionButtonText}>Enable Microphone</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image 
        source={require("@/assets/images/HSK-SPEEDY.png")} 
        style={styles.mascotImage} 
        resizeMode="contain" 
      />
      
      {/* Audio Controls */}
      <View style={styles.audioControls}>
        <View style={styles.audioButtonContainer}>
          <TouchableOpacity
            style={[styles.audioButton, { backgroundColor: getButtonColor() }]}
            onPress={handleMainButtonPress}
            disabled={audioState === 'processing' || audioState === 'speaking'}
          >
            <Animated.View style={{ transform: getMainButtonAnimation() }}>
              <MainIcon size={20} color={COLORS.white} />
            </Animated.View>
            <Text style={styles.audioButtonText}>{getButtonText()}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.audioButton, { 
              backgroundColor: isMuted ? COLORS.gray : COLORS.peach,
            }]}
            onPress={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <VolumeX size={20} color={COLORS.white} /> : <Volume2 size={20} color={COLORS.white} />}
            <Text style={styles.audioButtonText}>
              {isMuted ? 'Unmute' : 'Speak'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Speak Instructions Button */}
        {!isMuted && audioState === 'ready' && (
          <TouchableOpacity
            style={styles.instructionsButton}
            onPress={speakInstructions}
          >
            <Volume2 size={16} color={COLORS.cherryRed} />
            <Text style={styles.instructionsButtonText}>Hear Instructions</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Status Message */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusMessage}>{currentMessage}</Text>
        
        {/* Show parsed intent if available */}
        {parsedIntent && audioState === 'success' && (
          <View style={styles.intentContainer}>
            <Text style={styles.intentTitle}>Payment Ready:</Text>
            <Text style={styles.intentText}>
              {parsedIntent.amountTrx} TRX → {parsedIntent.toName || 'Recipient'}
            </Text>
            {parsedIntent.note && (
              <Text style={styles.intentNote}>Note: {parsedIntent.note}</Text>
            )}
          </View>
        )}

        {/* Error message */}
        {lastError && audioState === 'error' && (
          <Text style={styles.errorText}>{lastError}</Text>
        )}
      </View>

      {/* Audio Instructions */}
      <View style={styles.audioInstructions}>
        <Text style={styles.audioHelpTitle}>Audio Instructions</Text>
        <Text style={styles.audioHelp}>
          Try saying: "Send 5 TRX to TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH"
        </Text>
        <Text style={styles.audioHelpSecondary}>
          Or: "Send 12 TRX to Alex for groceries"
        </Text>
      </View>

      {/* Cancel Button */}
      {onCancel && (
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 24,
    paddingVertical: 20,
  },
  mascotImage: {
    width: 120,
    height: 120,
  },
  audioControls: {
    width: "100%",
    alignItems: "center",
    gap: 16,
  },
  audioButtonContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  audioButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  audioButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  instructionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.lightPeach,
    borderRadius: 20,
  },
  instructionsButtonText: {
    color: COLORS.cherryRed,
    fontSize: 14,
    fontWeight: '600',
  },
  statusContainer: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  statusMessage: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
    fontWeight: '500',
  },
  intentContainer: {
    backgroundColor: COLORS.lightPeach,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '100%',
  },
  intentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.cherryRed,
    marginBottom: 4,
  },
  intentText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
    textAlign: 'center',
  },
  intentNote: {
    fontSize: 14,
    color: COLORS.gray,
    fontStyle: 'italic',
    marginTop: 4,
  },
  errorText: {
    color: COLORS.cherryRed,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  audioInstructions: {
    backgroundColor: COLORS.lightPeach,
    borderRadius: 16,
    padding: 20,
    width: "100%",
    alignItems: "center",
  },
  audioHelpTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  audioHelp: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 4,
  },
  audioHelpSecondary: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: "center",
    fontStyle: "italic",
  },
  cancelButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  cancelButtonText: {
    color: COLORS.gray,
    fontSize: 14,
    fontWeight: '600',
  },
  permissionMessage: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: COLORS.cherryRed,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
  },
  permissionButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});