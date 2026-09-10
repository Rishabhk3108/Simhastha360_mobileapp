import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { colors, fonts } from "../theme";

export interface PasswordCriteria {
  key: string;
  met: boolean;
}

export function scorePassword(password: string): { score: number; criteria: PasswordCriteria[] } {
  const criteria: PasswordCriteria[] = [
    { key: "length", met: password.length >= 8 },
    { key: "uppercase", met: /[A-Z]/.test(password) },
    { key: "lowercase", met: /[a-z]/.test(password) },
    { key: "number", met: /[0-9]/.test(password) },
    { key: "special", met: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = criteria.filter((c) => c.met).length;
  return { score, criteria };
}

const LEVEL_KEYS = ["", "weak", "fair", "good", "strong", "strong"];
const LEVEL_COLORS = [colors.border, colors.red, colors.yellow, colors.brass, colors.green, colors.green];

export function PasswordStrengthMeter({ password }: { password: string }) {
  const { t } = useTranslation();
  const { score, criteria } = scorePassword(password);
  const levelColor = LEVEL_COLORS[score];
  const levelKey = LEVEL_KEYS[score];

  if (!password) return null;

  return (
    <View style={styles.container}>
      <View style={styles.barRow}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.segment, { backgroundColor: score > i ? levelColor : colors.border }]} />
        ))}
      </View>
      <Text style={[styles.levelLabel, { color: levelColor }]}>{levelKey ? t(`passwordStrengthMeter.level.${levelKey}`) : ""}</Text>
      <View style={styles.criteriaList}>
        {criteria.map((c) => (
          <View key={c.key} style={styles.criteriaRow}>
            <Ionicons name={c.met ? "checkmark-circle" : "ellipse-outline"} size={13} color={c.met ? colors.green : colors.faint} />
            <Text style={[styles.criteriaText, c.met && styles.criteriaTextMet]}>{t(`passwordStrengthMeter.criteria.${c.key}`)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 6, marginBottom: 4 },
  barRow: { flexDirection: "row", gap: 5 },
  segment: { flex: 1, height: 5, borderRadius: 999 },
  levelLabel: { fontFamily: fonts.bodyBold, fontSize: 11.5, marginTop: 5 },
  criteriaList: { marginTop: 8, gap: 4 },
  criteriaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  criteriaText: { fontFamily: fonts.body, fontSize: 11.5, color: colors.muted },
  criteriaTextMet: { color: colors.muted2, textDecorationLine: "line-through" },
});
