import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, ImageSourcePropType, Platform, StyleSheet, View } from "react-native";

const shocked = require("@/assets/images/_HSK-SHOCKED.png");
const speedy = require("@/assets/images/HSK-SPEEDY.png");
const standard = require("@/assets/images/HSK-STANDARD.png");

export type TomatoMood = "standard" | "speedy" | "shocked" | "cycle";

type Props = {
  size?: number;
  mood?: TomatoMood;
  testID?: string;
};

const TomatoMascot: React.FC<Props> = ({ size = 96, mood = "cycle", testID }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const index = useRef(0);
  const images: ImageSourcePropType[] = useMemo(() => [standard, speedy, shocked], []);

  useEffect(() => {
    const bounce = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.08, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(scale, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.quad), useNativeDriver: Platform.OS !== "web" }),
      ])
    );
    const wiggle = Animated.loop(
      Animated.sequence([
        Animated.timing(rotate, { toValue: 1, duration: 450, easing: Easing.linear, useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(rotate, { toValue: -1, duration: 450, easing: Easing.linear, useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(rotate, { toValue: 0, duration: 300, easing: Easing.linear, useNativeDriver: Platform.OS !== "web" }),
      ])
    );

    bounce.start();
    wiggle.start();
    return () => {
      bounce.stop();
      wiggle.stop();
    };
  }, [rotate, scale]);

  const [current, setCurrent] = React.useState<ImageSourcePropType>(() => {
    if (mood === "standard") return standard;
    if (mood === "speedy") return speedy;
    if (mood === "shocked") return shocked;
    return standard;
  });

  useEffect(() => {
    if (mood !== "cycle") {
      setCurrent(mood === "standard" ? standard : mood === "speedy" ? speedy : shocked);
      return;
    }
    const id = setInterval(() => {
      index.current = (index.current + 1) % images.length;
      setCurrent(images[index.current]);
    }, 1200);
    return () => clearInterval(id);
  }, [images, mood]);

  const rotateDeg = rotate.interpolate({ inputRange: [-1, 1], outputRange: ["-6deg", "6deg"] });

  return (
    <View style={styles.wrapper} testID={testID ?? "tomato-mascot"}>
      <Animated.Image
        source={current}
        style={{ width: size, height: size, transform: [{ scale }, { rotate: rotateDeg }] }}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { alignItems: "center", justifyContent: "center" },
});

export default React.memo(TomatoMascot);
