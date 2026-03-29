import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Colors from "@/constants/colors";

type ErrorBoundaryState = { hasError: boolean; errorMessage: string | null };

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false, errorMessage: null };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[ErrorBoundary] Derived state from error", message);
    return { hasError: true, errorMessage: message };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    console.error("[ErrorBoundary] Caught error", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container} testID="error-boundary">
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            {this.state.errorMessage ?? "Unexpected error occurred. Please try again."}
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset} testID="error-reset-button">
            <Text style={styles.buttonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children as React.ReactElement;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.brand.surface,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.brand.red,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: Colors.brand.inkMuted,
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 20,
    backgroundColor: Colors.brand.red,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
});