import { useEffect, useRef, useState } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { colors, fonts } from "../../theme";
import type { OnboardingStackParamList } from "../../navigation/AppStack";

type Props = NativeStackScreenProps<OnboardingStackParamList, "ForeignerWelcome">;

const STAGE_DURATIONS_MS = [1900, 1900];

export function ForeignerWelcomeScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [stage, setStage] = useState(0);
  const ringScale = useRef(new Animated.Value(0.7)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(ringScale, { toValue: 1, useNativeDriver: true, friction: 6 }),
      Animated.timing(ringOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [ringScale, ringOpacity]);

  useEffect(() => {
    textOpacity.setValue(0);
    Animated.timing(textOpacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();

    const timer = setTimeout(() => {
      if (stage === 0) {
        Animated.timing(textOpacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => setStage(1));
      } else {
        navigation.replace("Main");
      }
    }, STAGE_DURATIONS_MS[stage]);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  return (
    <View style={styles.container}>
      <Image source={require("../../../assets/welcome-bg-shahisnan.jpg")} style={styles.bgImage} resizeMode="cover" />
      <View style={styles.scrim} />

      <Animated.View style={[styles.ring, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]}>
        <View style={styles.ringInner} />
      </Animated.View>

      <Animated.View style={{ opacity: textOpacity, alignItems: "center", paddingHorizontal: 32 }}>
        <Text style={styles.headline}>{stage === 0 ? t("foreignerWelcome.welcomeIndia") : t("foreignerWelcome.welcomeSimhastha")}</Text>
        <Text style={styles.subtext}>{stage === 0 ? t("foreignerWelcome.subIndia") : t("foreignerWelcome.subSimhastha")}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center", gap: 36 },
  bgImage: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.3 },
  scrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(27,33,64,0.6)" },
  ring: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1.5,
    borderColor: colors.brass,
    alignItems: "center",
    justifyContent: "center",
  },
  ringInner: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: "rgba(233,180,92,0.5)",
  },
  headline: { fontFamily: fonts.display, fontSize: 30, color: colors.surface, textAlign: "center" },
  subtext: { fontFamily: fonts.bodyMedium, fontSize: 13, letterSpacing: 2, color: colors.brass, textAlign: "center", marginTop: 10, textTransform: "uppercase" },
});
