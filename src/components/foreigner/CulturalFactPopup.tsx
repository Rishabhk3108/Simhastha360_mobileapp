import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { FactRevealModal } from "./FactRevealModal";
import { CULTURAL_FACT_KEYS } from "../../data/culturalFacts";
import { colors, fonts } from "../../theme";

// A new teaser pops up roughly every 5s (visible ~3.5s, a short gap, then
// the next fact) - the cadence the feature was asked for.
const CYCLE_INTERVAL_MS = 5000;
const VISIBLE_DURATION_MS = 3500;

export function CulturalFactPopup() {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    let showTimer: ReturnType<typeof setTimeout>;
    let hideTimer: ReturnType<typeof setTimeout>;

    function cycle() {
      showTimer = setTimeout(() => {
        if (cancelled) return;
        setIndex((i) => (i + 1) % CULTURAL_FACT_KEYS.length);
        setShown(true);
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
        hideTimer = setTimeout(() => {
          if (cancelled) return;
          Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => setShown(false));
          cycle();
        }, VISIBLE_DURATION_MS);
      }, CYCLE_INTERVAL_MS - VISIBLE_DURATION_MS);
    }

    cycle();
    return () => {
      cancelled = true;
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [opacity]);

  const showTeaser = shown && !selected;

  return (
    <>
      {showTeaser && (
        <Animated.View style={[styles.wrap, { opacity }]}>
          <TouchableOpacity style={styles.bubble} activeOpacity={0.85} onPress={() => setSelected(CULTURAL_FACT_KEYS[index])}>
            <Ionicons name="bulb" size={14} color={colors.brass} />
            <Text style={styles.text}>{t("culturalFacts.teaser")}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <FactRevealModal factKey={selected} onClose={() => setSelected(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: "31%",
    right: 16,
    maxWidth: 220,
  },
  bubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: colors.ink,
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 10,
    shadowColor: colors.ink,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  text: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.surface },
});
