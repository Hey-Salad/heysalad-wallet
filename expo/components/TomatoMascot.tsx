import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, ImageSourcePropType, Platform, StyleSheet, View } from "react-native";
import Colors from "@/constants/colors";

const shocked = require("@/assets/images/_HSK-SHOCKED.png");
const speedy = require("@/assets/images/HSK-SPEEDY.png");
const standard = require("@/assets/images/HSK-STANDARD.png");

export type TomatoMood = "standard" | "speedy" | "shocked" | "cycle";

type Props = {
  size?: number;
  mood?: TomatoMood;
  animated?: boolean;
  testID?: string;
  containerStyle?: object; // Allow custom container styling
};

const TomatoMascot: React.FC<Props> = ({ 
  size = 96, 
  mood = "cycle", 
  animated = false, 
  testID,
  containerStyle 
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const index = useRef(0);
  const images: ImageSourcePropType[] = useMemo(() => [standard, speedy, shocked], []);

  useEffect(() => {
    if (!animated) return;
    const bounce = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { 
          toValue: 1.04, 
          duration: 800, 
          easing: Easing.out(Easing.quad), 
          useNativeDriver: Platform.OS !== "web" 
        }),
        Animated.timing(scale, { 
          toValue: 1, 
          duration: 800, 
          easing: Easing.inOut(Easing.quad), 
          useNativeDriver: Platform.OS !== "web" 
        }),
      ])
    );
    const wiggle = Animated.loop(
      Animated.sequence([
        Animated.timing(rotate, { 
          toValue: 1, 
          duration: 600, 
          easing: Easing.linear, 
          useNativeDriver: Platform.OS !== "web" 
        }),
        Animated.timing(rotate, { 
          toValue: -1, 
          duration: 600, 
          easing: Easing.linear, 
          useNativeDriver: Platform.OS !== "web" 
        }),
        Animated.timing(rotate, { 
          toValue: 0, 
          duration: 400, 
          easing: Easing.linear, 
          useNativeDriver: Platform.OS !== "web" 
        }),
      ])
    );

    bounce.start();
    wiggle.start();
    return () => {
      bounce.stop();
      wiggle.stop();
    };
  }, [rotate, scale, animated]);

  const [current, setCurrent] = React.useState<ImageSourcePropType>(() => {
    if (mood === "standard") return standard;
    if (mood === "speedy") return speedy;
    if (mood === "shocked") return shocked;
    return standard;
  });

  useEffect(() => {
    if (mood !== "cycle" || !animated) {
      setCurrent(mood === "standard" ? standard : mood === "speedy" ? speedy : shocked);
      return;
    }
    const id = setInterval(() => {
      index.current = (index.current + 1) % images.length;
      setCurrent(images[index.current]);
    }, 1400);
    return () => clearInterval(id);
  }, [images, mood, animated]);

  const rotateDeg = rotate.interpolate({ 
    inputRange: [-1, 1], 
    outputRange: ["-3deg", "3deg"] 
  });

  return (
    <View 
      style={[styles.wrapper, containerStyle]} 
      testID={testID ?? "tomato-mascot"}
    >
      <Animated.Image
        source={current}
        style={{ 
          width: size, 
          height: size, 
          transform: animated ? [{ scale }, { rotate: rotateDeg }] : undefined 
        }}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { 
    alignItems: "center", 
    justifyContent: "center", 
    backgroundColor: "transparent", // Changed from white to transparent
    borderRadius: 24, 
    padding: 8 
  },
});

export default React.memo(TomatoMascot);