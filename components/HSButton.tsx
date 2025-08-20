import React from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator, View } from "react-native";
import Colors from "@/constants/colors";

type HSButtonProps = {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: "primary" | "secondary" | "ghost";
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  testID?: string;
};

const HSButton: React.FC<HSButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
  variant = "primary",
  leftIcon,
  rightIcon,
  testID,
}) => {
  const backgroundColor =
    variant === "primary" ? Colors.brand.red : variant === "secondary" ? Colors.brand.peach : "transparent";
  const borderColor = variant === "ghost" ? Colors.brand.red : "transparent";
  const textColor = variant === "ghost" ? Colors.brand.red : "#ffffff";
  const opacity = disabled ? 0.6 : 1;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.button, { backgroundColor, borderColor, opacity }, style]}
      activeOpacity={0.8}
      testID={testID ?? "hs-button"}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.content} testID="hs-button-content">
          {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
          <Text style={[styles.text, { color: textColor }, textStyle]}>{title}</Text>
          {rightIcon ? <View style={styles.icon}>{rightIcon}</View> : null}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 20,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: "700",
  },
  icon: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default React.memo(HSButton);