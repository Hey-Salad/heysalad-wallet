import React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import Colors from "@/constants/colors";

type HSTagProps = {
  label: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  tone?: "success" | "warning" | "info";
};

const HSTag: React.FC<HSTagProps> = ({ label, style, textStyle, tone = "info" }) => {
  const backgroundColor =
    tone === "success" ? "#e8f9f0" : tone === "warning" ? "#fff4e5" : "#f0f6ff";
  const textColor =
    tone === "success" ? Colors.brand.green : tone === "warning" ? Colors.brand.orange : Colors.brand.red;

  return (
    <View style={[styles.tag, { backgroundColor }, style]} testID="hs-tag">
      <Text style={[styles.text, { color: textColor }, textStyle]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  text: {
    fontSize: 12,
    fontWeight: "700",
  },
});

export default React.memo(HSTag);