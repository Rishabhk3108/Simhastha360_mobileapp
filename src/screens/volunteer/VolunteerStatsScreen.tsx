import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { CheckCircle, Coins } from "../../components/icons";
import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { PointsPill } from "../../components/PointsPill";
import { getMyPoints, getMyTasks } from "../../api/tasks";
import { colors, fonts } from "../../theme";
import type { PointsSummary, Task } from "../../api/types";

export function VolunteerStatsScreen() {
  const [completed, setCompleted] = useState<Task[]>([]);
  const [points, setPoints] = useState<PointsSummary | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [tasks, summary] = await Promise.all([getMyTasks(), getMyPoints()]);
    setCompleted(tasks.filter((t) => t.status === "complete").sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? "")));
    setPoints(summary);
    setInitialLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <Screen title="My stats" refreshing={refreshing} onRefresh={onRefresh}>
      <PointsPill />

      {initialLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.ink} />
          <Text style={styles.muted}>Loading stats…</Text>
        </View>
      ) : (
        <>
          <View style={styles.statRow}>
            <Card style={styles.statCard}>
              <CheckCircle size={22} color={colors.teal} weight="fill" />
              <Text style={styles.statValue}>{completed.length}</Text>
              <Text style={styles.statLabel}>Tasks completed</Text>
            </Card>
            <Card style={styles.statCard}>
              <Coins size={22} color={colors.brass} />
              <Text style={styles.statValue}>{points?.total ?? 0}</Text>
              <Text style={styles.statLabel}>Total points</Text>
            </Card>
          </View>

          <Text style={styles.sectionTitle}>Completed tasks</Text>
          {completed.map((t) => (
            <Card key={t.id}>
              <Text style={styles.description}>{t.description}</Text>
              <Text style={styles.meta}>
                +{t.points} pts · {t.completed_at ? new Date(t.completed_at).toLocaleDateString() : ""}
              </Text>
            </Card>
          ))}
          {completed.length === 0 && <Text style={styles.muted}>No completed tasks yet.</Text>}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { alignItems: "center", gap: 8, paddingVertical: 24 },
  statRow: { flexDirection: "row", gap: 12 },
  statCard: { flex: 1, alignItems: "center", gap: 6, paddingVertical: 20 },
  statValue: { fontFamily: fonts.display, fontSize: 26, color: colors.ink },
  statLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  sectionTitle: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink, marginTop: 8 },
  description: { fontFamily: fonts.bodyMedium, fontSize: 14.5, color: colors.ink },
  meta: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 6 },
  muted: { fontFamily: fonts.body, color: colors.muted },
});
