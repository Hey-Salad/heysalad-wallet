import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Colors from "@/constants/colors";

export default function ModalScreen() {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={true}
      onRequestClose={() => router.back()}
    >
      <Pressable style={styles.overlay} onPress={() => router.back()}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>HeySalad® Wallet</Text>
          <Text style={styles.description}>
            Friendly, supportive payments for food lovers. Voice commands, smart categories,
            and tokens for sustainable choices.
          </Text>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
            testID="modal-close"
          >
            <Text style={styles.closeButtonText}>Sounds tasty!</Text>
          </TouchableOpacity>
        </View>
      </Pressable>

      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    margin: 20,
    alignItems: "center",
    minWidth: 300,
    borderWidth: 1,
    borderColor: Colors.brand.border,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold" as const,
    marginBottom: 16,
    color: Colors.brand.red,
  },
  description: {
    textAlign: "center",
    marginBottom: 24,
    color: Colors.brand.inkMuted,
    lineHeight: 20,
  },
  closeButton: {
    backgroundColor: Colors.brand.red,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 180,
  },
  closeButtonText: {
    color: "white",
    fontWeight: "700" as const,
    textAlign: "center",
  },
});