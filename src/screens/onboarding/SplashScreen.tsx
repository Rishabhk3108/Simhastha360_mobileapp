import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, fonts } from "../../theme";
import { usePilgrim } from "../../pilgrim/PilgrimContext";
import type { OnboardingStackParamList } from "../../navigation/AppStack";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Splash">;

export function SplashScreen({ navigation }: Props) {
  const { pilgrimId } = usePilgrim();
  const sealScale = useRef(new Animated.Value(0.6)).current;
  const sealOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(sealScale, { toValue: 1, useNativeDriver: true, friction: 5 }),
        Animated.timing(sealOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.timing(textOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      navigation.replace(pilgrimId ? "Main" : "RoleSelection");
    }, 2600);

    return () => clearTimeout(timer);
  }, [navigation, pilgrimId, sealScale, sealOpacity, textOpacity]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.seal, { opacity: sealOpacity, transform: [{ scale: sealScale }] }]}>
        <View style={styles.sun} />
        <View style={[styles.wave, { width: 62, left: 34, top: 78, backgroundColor: colors.surface }]} />
        <View style={[styles.wave, { width: 46, left: 42, top: 92, backgroundColor: "#7ED2C8" }]} />
        <View style={[styles.wave, { width: 30, left: 50, top: 106, backgroundColor: "rgba(126,210,200,0.55)" }]} />
      </Animated.View>

      <Animated.View style={{ opacity: textOpacity, alignItems: "center" }}>
        <Text style={styles.wordmark}>सिंहस्थ ३६०</Text>
        <Text style={styles.subtitle}>SIMHASTHA 360 · UJJAIN 2028</Text>
        <Text style={styles.hindi}>सिंहस्थ २०२८, उज्जैन आपका स्वागत करता है</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center", gap: 28, padding: 24 },
  seal: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  sun: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.brass, position: "absolute", top: 22, left: 42 },
  wave: { height: 6, borderRadius: 999, position: "absolute" },
  wordmark: { fontFamily: fonts.wordmark, fontSize: 40, color: colors.surface },
  subtitle: { fontFamily: fonts.bodyMedium, fontSize: 12, letterSpacing: 3, color: colors.brass, marginTop: 8 },
  hindi: { fontFamily: fonts.display, fontSize: 16, color: colors.surface, marginTop: 20, textAlign: "center" },
});
