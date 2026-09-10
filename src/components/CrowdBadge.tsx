import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { CrowdLevel } from "../api/types";
import { crowdBg, crowdColor, fonts } from "../theme";

export function CrowdBadge({ level }: { level: CrowdLevel }) {
  const { t } = useTranslation();
  return (
    <View style={[styles.badge, { backgroundColor: crowdBg[level] }]}>
      <View style={[styles.dot, { backgroundColor: crowdColor[level] }]} />
      <Text style={[styles.text, { color: crowdColor[level] }]}>{t(`crowdBadge.${level}`)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  text: { fontFamily: fonts.bodyMedium, fontSize: 12 },
});
