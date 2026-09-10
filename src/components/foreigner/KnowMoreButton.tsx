import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { SimhasthaInfoModal } from "./SimhasthaInfoModal";
import { colors, fonts } from "../../theme";

export function KnowMoreButton() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1100, useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 1100, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [glow]);

  const shadowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.9] });
  const shadowRadius = glow.interpolate({ inputRange: [0, 1], outputRange: [6, 16] });

  return (
    <>
      <Animated.View style={[styles.wrap, { shadowOpacity, shadowRadius }]}>
        <TouchableOpacity style={styles.button} onPress={() => setVisible(true)} activeOpacity={0.85}>
          <Ionicons name="sparkles" size={16} color={colors.ink} />
          <Text style={styles.text}>{t("foreignerHome.knowMore")}</Text>
        </TouchableOpacity>
      </Animated.View>

      <SimhasthaInfoModal visible={visible} onClose={() => setVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: "42%",
    right: 16,
    borderRadius: 999,
    shadowColor: colors.brass,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: colors.brass,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  text: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: colors.ink },
});
