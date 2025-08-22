// components/WalletSetup.tsx
// Enhanced wallet setup with proper flow

import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Alert, Image, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import HSButton from "@/components/HSButton";
import Colors from "@/constants/colors";
import { useWallet } from "@/providers/WalletProvider";
import { Plus, Download, AlertCircle, CheckCircle } from "lucide-react-native";

type SetupStep = "welcome" | "method" | "create" | "import" | "backup" | "complete";

const WalletSetup: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { createWallet, importWallet, setupWallet } = useWallet();
  const [step, setStep] = useState<SetupStep>("welcome");
  const [privateKey, setPrivateKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [newWallet, setNewWallet] = useState<{ address: string; privateKey: string } | null>(null);

  const handleCreateWallet = async () => {
    setLoading(true);
    try {
      const wallet = await createWallet();
      setNewWallet(wallet);
      setStep("backup");
    } catch (error) {
      console.error('Failed to create wallet:', error);
      Alert.alert("Error", "Failed to create wallet. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleImportWallet = async () => {
    if (!privateKey.trim()) {
      Alert.alert("Error", "Please enter your private key");
      return;
    }

    setLoading(true);
    try {
      const address = await importWallet(privateKey.trim());
      await setupWallet(address, privateKey.trim());
      setStep("complete");
    } catch (error) {
      console.error('Failed to import wallet:', error);
      Alert.alert("Error", "Invalid private key. Please check and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteBackup = async () => {
    if (!newWallet) return;
    
    try {
      await setupWallet(newWallet.address, newWallet.privateKey);
      setStep("complete");
    } catch (error) {
      console.error('Failed to setup wallet:', error);
      Alert.alert("Error", "Failed to setup wallet. Please try again.");
    }
  };

  const renderWelcome = () => (
    <View style={styles.stepContainer}>
      <View style={styles.welcomeContent}>
        <Image 
          source={require("@/assets/images/HSK-SPEEDY.png")} 
          style={styles.mascotLarge} 
          resizeMode="contain" 
        />
        <Text style={styles.welcomeTitle}>Welcome to HeySalad Wallet!</Text>
        <Text style={styles.welcomeSubtitle}>
          Your secure TRON wallet for fast payments and social splits
        </Text>
        
        <View style={styles.featuresContainer}>
          <View style={styles.feature}>
            <CheckCircle color={Colors.brand.cherryRed} size={20} />
            <Text style={styles.featureText}>Send & receive TRX instantly</Text>
          </View>
          <View style={styles.feature}>
            <CheckCircle color={Colors.brand.cherryRed} size={20} />
            <Text style={styles.featureText}>Split bills with friends</Text>
          </View>
          <View style={styles.feature}>
            <CheckCircle color={Colors.brand.cherryRed} size={20} />
            <Text style={styles.featureText}>Voice-powered payments</Text>
          </View>
          <View style={styles.feature}>
            <CheckCircle color={Colors.brand.cherryRed} size={20} />
            <Text style={styles.featureText}>QR code scanning</Text>
          </View>
        </View>
      </View>
      
      <HSButton
        title="Get Started"
        onPress={() => setStep("method")}
        variant="primary"
        style={styles.primaryButton}
      />
    </View>
  );

  const renderMethod = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Set Up Your Wallet</Text>
      <Text style={styles.stepSubtitle}>Choose how you'd like to get started</Text>
      
      <View style={styles.methodContainer}>
        <View style={styles.methodCard}>
          <Plus color={Colors.brand.cherryRed} size={32} />
          <Text style={styles.methodTitle}>Create New Wallet</Text>
          <Text style={styles.methodDescription}>
            Generate a new wallet with a fresh private key. Recommended for new users.
          </Text>
          <HSButton
            title="Create New"
            onPress={() => setStep("create")}
            variant="primary"
            style={styles.methodButton}
          />
        </View>
        
        <View style={styles.methodCard}>
          <Download color={Colors.brand.cherryRed} size={32} />
          <Text style={styles.methodTitle}>Import Existing</Text>
          <Text style={styles.methodDescription}>
            Already have a wallet? Import it using your private key.
          </Text>
          <HSButton
            title="Import Wallet"
            onPress={() => setStep("import")}
            variant="secondary"
            style={styles.methodButton}
          />
        </View>
      </View>
    </View>
  );

  const renderCreate = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Create New Wallet</Text>
      <Text style={styles.stepSubtitle}>
        We'll generate a secure wallet for you on the TRON network
      </Text>
      
      <View style={styles.createContent}>
        <View style={styles.securityNotice}>
          <AlertCircle color={Colors.brand.orange} size={24} />
          <Text style={styles.securityText}>
            Your private key will be generated locally and stored securely on your device.
          </Text>
        </View>
        
        <HSButton
          title={loading ? "Creating Wallet..." : "Create Wallet"}
          onPress={handleCreateWallet}
          loading={loading}
          variant="primary"
          style={styles.primaryButton}
        />
      </View>
    </View>
  );

  const renderImport = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Import Wallet</Text>
      <Text style={styles.stepSubtitle}>
        Enter your existing private key to import your wallet
      </Text>
      
      <View style={styles.importContent}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Private Key</Text>
          <TextInput
            value={privateKey}
            onChangeText={setPrivateKey}
            placeholder="Enter your 64-character private key"
            style={styles.privateKeyInput}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        
        <View style={styles.securityNotice}>
          <AlertCircle color={Colors.brand.cherryRed} size={24} />
          <Text style={styles.securityText}>
            Never share your private key with anyone. HeySalad will never ask for it.
          </Text>
        </View>
        
        <HSButton
          title={loading ? "Importing..." : "Import Wallet"}
          onPress={handleImportWallet}
          loading={loading}
          variant="primary"
          style={styles.primaryButton}
        />
      </View>
    </View>
  );

  const renderBackup = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Backup Your Wallet</Text>
      <Text style={styles.stepSubtitle}>
        Save your private key safely - you'll need it to restore your wallet
      </Text>
      
      <View style={styles.backupContent}>
        <View style={styles.walletInfo}>
          <Text style={styles.walletLabel}>Your TRON Address:</Text>
          <Text style={styles.walletAddress}>{newWallet?.address}</Text>
          
          <Text style={styles.walletLabel}>Your Private Key:</Text>
          <Text style={styles.privateKeyText}>{newWallet?.privateKey}</Text>
        </View>
        
        <View style={styles.securityNotice}>
          <AlertCircle color={Colors.brand.cherryRed} size={24} />
          <Text style={styles.securityText}>
            Write down your private key and store it safely. If you lose it, you'll lose access to your wallet forever.
          </Text>
        </View>
        
        <HSButton
          title="I've Saved My Private Key"
          onPress={handleCompleteBackup}
          variant="primary"
          style={styles.primaryButton}
        />
      </View>
    </View>
  );

  const renderComplete = () => (
    <View style={styles.stepContainer}>
      <View style={styles.completeContent}>
        <CheckCircle color={Colors.brand.green} size={64} />
        <Text style={styles.completeTitle}>Wallet Setup Complete!</Text>
        <Text style={styles.completeSubtitle}>
          Your HeySalad wallet is ready to use. You can now send, receive, and split payments with friends.
        </Text>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case "welcome": return renderWelcome();
      case "method": return renderMethod();
      case "create": return renderCreate();
      case "import": return renderImport();
      case "backup": return renderBackup();
      case "complete": return renderComplete();
      default: return renderWelcome();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderCurrentStep()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.brand.white,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  stepContainer: {
    flex: 1,
    justifyContent: "center",
  },
  welcomeContent: {
    alignItems: "center",
    marginBottom: 40,
  },
  mascotLarge: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "900" as const,
    color: Colors.brand.ink,
    textAlign: "center",
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: Colors.brand.inkMuted,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  featuresContainer: {
    gap: 16,
    width: "100%",
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    color: Colors.brand.ink,
    fontWeight: "500" as const,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "900" as const,
    color: Colors.brand.ink,
    textAlign: "center",
    marginBottom: 12,
  },
  stepSubtitle: {
    fontSize: 16,
    color: Colors.brand.inkMuted,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  methodContainer: {
    gap: 20,
    marginBottom: 32,
  },
  methodCard: {
    backgroundColor: Colors.brand.white,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.brand.border,
    gap: 16,
  },
  methodTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.brand.ink,
  },
  methodDescription: {
    fontSize: 14,
    color: Colors.brand.inkMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  methodButton: {
    width: "100%",
  },
  createContent: {
    gap: 24,
  },
  importContent: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.brand.ink,
  },
  privateKeyInput: {
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.brand.border,
    paddingHorizontal: 16,
    fontSize: 14,
    backgroundColor: Colors.brand.white,
    color: Colors.brand.ink,
    fontFamily: "monospace",
  },
  backupContent: {
    gap: 24,
  },
  walletInfo: {
    backgroundColor: Colors.brand.surface,
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  walletLabel: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.brand.inkMuted,
  },
  walletAddress: {
    fontSize: 16,
    color: Colors.brand.ink,
    fontWeight: "600" as const,
    fontFamily: "monospace",
  },
  privateKeyText: {
    fontSize: 12,
    color: Colors.brand.ink,
    fontFamily: "monospace",
    backgroundColor: Colors.brand.white,
    padding: 12,
    borderRadius: 8,
    overflow: "hidden",
  },
  securityNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: Colors.brand.lightPeach,
    padding: 16,
    borderRadius: 12,
  },
  securityText: {
    flex: 1,
    fontSize: 14,
    color: Colors.brand.ink,
    lineHeight: 20,
  },
  completeContent: {
    alignItems: "center",
    gap: 24,
  },
  completeTitle: {
    fontSize: 24,
    fontWeight: "900" as const,
    color: Colors.brand.ink,
    textAlign: "center",
  },
  completeSubtitle: {
    fontSize: 16,
    color: Colors.brand.inkMuted,
    textAlign: "center",
    lineHeight: 24,
  },
  primaryButton: {
    backgroundColor: Colors.brand.cherryRed,
    marginTop: 16,
  },
});

export default WalletSetup;