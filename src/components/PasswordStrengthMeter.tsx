import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts } from "../theme";

export interface PasswordCriteria {
  label: string;
  met: boolean;
}

export function scorePassword(password: string): { score: number; criteria: PasswordCriteria[] } {
  const criteria: PasswordCriteria[] = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "An uppercase letter", met: /[A-Z]/.test(password) },
    { label: "A lowercase letter", met: /[a-z]/.test(password) },
    { label: "A number", met: /[0-9]/.test(password) },
    { label: "A special character", met: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = criteria.filter((c) => c.met).length;
  return { score, criteria };
}

const LEVELS = [
  { label: "", color: colors.border },
  { label: "Weak", color: colors.red },
  { label: "Fair", color: colors.yellow },
  { label: "Good", color: colors.brass },
  { label: "Strong", color: colors.green },
  { label: "Strong", color: colors.green },
];

export function PasswordStrengthMeter({ password }: { password: string }) {
  const { score, criteria } = scorePassword(password);
  const level = LEVELS[score];

  if (!password) return null;

  return (
    <View style={styles.container}>
      <View style={styles.barRow}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.segment, { backgroundColor: score > i ? level.color : colors.border }]} />
        ))}
      </View>
      <Text style={[styles.levelLabel, { color: level.color }]}>{level.label}</Text>
      <View style={styles.criteriaList}>
        {criteria.map((c) => (
          <View key={c.label} style={styles.criteriaRow}>
            <Ionicons name={c.met ? "checkmark-circle" : "ellipse-outline"} size={13} color={c.met ? colors.green : colors.faint} />
            <Text style={[styles.criteriaText, c.met && styles.criteriaTextMet]}>{c.label}</Text>
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
