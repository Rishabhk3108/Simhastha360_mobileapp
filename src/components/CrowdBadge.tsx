import { StyleSheet, Text, View } from "react-native";
import type { CrowdLevel } from "../api/types";

const COLORS: Record<CrowdLevel, string> = {
  green: "#2e9e4f",
  yellow: "#d9a11a",
  red: "#d13c3c",
};

export function CrowdBadge({ level }: { level: CrowdLevel }) {
  return (
    <View style={[styles.badge, { backgroundColor: COLORS[level] }]}>
      <Text style={styles.text}>{level.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  text: { color: "white", fontSize: 12, fontWeight: "700" },
});
