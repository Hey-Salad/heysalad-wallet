import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, Image, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import HSButton from "./HSButton";
import Colors from "@/constants/colors";
import TomatoMascot from "./TomatoMascot";

const { width } = Dimensions.get("window");

type OnboardingStep = "welcome" | "features" | "security" | "ready";

type Props = {
  onComplete: () => void;
};

const OnboardingFlow: React.FC<Props> = ({ onComplete }) => {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [isCompleting, setIsCompleting] = useState(false);
  const completionRef = useRef(false);

  // Debounced completion to prevent multiple calls
  const handleComplete = async () => {
    if (completionRef.current || isCompleting) {
      console.log('[OnboardingFlow] Already completing, ignoring duplicate call');
      return;
    }

    console.log('[OnboardingFlow] Start Using Wallet pressed - beginning completion');
    completionRef.current = true;
    setIsCompleting(true);

    try {
      await onComplete();
      console.log('[OnboardingFlow] Completion successful');
    } catch (error) {
      console.error('[OnboardingFlow] Completion failed:', error);
      // Reset on error
      completionRef.current = false;
      setIsCompleting(false);
    }
  };

  const renderWelcome = () => (
    <View style={styles.stepContainer}>
      <View style={styles.mascotContainer}>
        <TomatoMascot size={120} mood="standard" animated />
      </View>
      <Text style={styles.title}>Welcome to HeySalad® Wallet!</Text>
      <Text style={styles.subtitle}>
        Your friendly companion for food payments and sustainable choices
      </Text>
      <HSButton
        title="Get Started"
        onPress={() => setStep("features")}
        variant="primary"
        style={styles.button}
      />
    </View>
  );

  const renderFeatures = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Amazing Features</Text>
      <View style={styles.featuresList}>
        <View style={styles.feature}>
          <Text style={styles.featureIcon}>🎤</Text>
          <Text style={styles.featureText}>Voice payments - just speak naturally</Text>
        </View>
        <View style={styles.feature}>
          <Text style={styles.featureIcon}>🥗</Text>
          <Text style={styles.featureText}>Earn SALAD tokens for sustainable choices</Text>
        </View>
        <View style={styles.feature}>
          <Text style={styles.featureIcon}>👥</Text>
          <Text style={styles.featureText}>Split bills easily with friends</Text>
        </View>
      </View>
      <HSButton
        title="Continue"
        onPress={() => setStep("security")}
        variant="primary"
        style={styles.button}
      />
    </View>
  );

  const renderSecurity = () => (
    <View style={styles.stepContainer}>
      <View style={styles.mascotContainer}>
        <TomatoMascot size={100} mood="speedy" animated />
      </View>
      <Text style={styles.title}>Your Security</Text>
      <Text style={styles.subtitle}>
        Your wallet is protected with the latest security features. We'll help you set up Face ID or Touch ID for quick access.
      </Text>
      <HSButton
        title="Set Up Security"
        onPress={() => {
          console.log('[OnboardingFlow] Set Up Security pressed - completing onboarding');
          handleComplete();
        }}
        variant="primary"
        style={styles.button}
        loading={isCompleting}
        disabled={isCompleting}
      />
      <HSButton
        title="Skip for Now"
        onPress={() => setStep("ready")}
        variant="ghost"
        style={styles.button}
        disabled={isCompleting}
      />
    </View>
  );

  const renderReady = () => (
    <View style={styles.stepContainer}>
      <View style={styles.mascotContainer}>
        <TomatoMascot size={120} mood="speedy" animated />
      </View>
      <Text style={styles.title}>You're All Set! 🎉</Text>
      <Text style={styles.subtitle}>
        Ready to start making delicious payments? Let's go!
      </Text>
      <HSButton
        title={isCompleting ? "Starting..." : "Start Using Wallet"}
        onPress={() => {
          console.log('[OnboardingFlow] Start Using Wallet pressed');
          handleComplete();
        }}
        variant="primary"
        style={styles.button}
        loading={isCompleting}
        disabled={isCompleting}
      />
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {step === "welcome" && renderWelcome()}
      {step === "features" && renderFeatures()}
      {step === "security" && renderSecurity()}
      {step === "ready" && renderReady()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.brand.white,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  stepContainer: {
    alignItems: "center",
    gap: 24,
  },
  mascotContainer: {
    backgroundColor: Colors.brand.surface,
    borderRadius: 60,
    padding: 20,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "900" as const,
    color: Colors.brand.ink,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: Colors.brand.inkMuted,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  button: {
    width: width - 48,
    marginTop: 8,
    backgroundColor: Colors.brand.cherryRed,
  },
  featuresList: {
    gap: 20,
    width: "100%",
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: Colors.brand.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.brand.border,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureText: {
    fontSize: 16,
    color: Colors.brand.ink,
    flex: 1,
  },
});

export default OnboardingFlow;