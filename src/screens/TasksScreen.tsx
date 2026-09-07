import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Alert, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { WarningCircle, MapPin, Clock } from "../components/icons";
import { Screen } from "../components/Screen";
import { Card } from "../components/Card";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useLocation } from "../location/useLocation";
import { colors, fonts } from "../theme";
import type { Task, VolunteerMe } from "../api/types";

const PRIORITY_COLOR: Record<Task["priority"], string> = { low: colors.green, medium: colors.yellow, high: colors.red };

export function TasksScreen() {
  const { role } = useAuth();
  const { coords } = useLocation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [volunteerMe, setVolunteerMe] = useState<VolunteerMe | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const taskRes = await api.get<Task[]>("/tasks/mine");
    setTasks(taskRes.data);
    if (role === "volunteer") {
      const meRes = await api.get<VolunteerMe>("/volunteers/me");
      setVolunteerMe(meRes.data);
    }
  }, [role]);

  useFocusEffect(
    useCallback(() => {
      load();
      if (role === "field_team" && coords) {
        api.patch("/field-team/me/location", { lat: coords.lat, lng: coords.lng }).catch(() => {});
      }
    }, [load, role, coords]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function toggleOnDuty(value: boolean) {
    try {
      const { data } = await api.patch<VolunteerMe>("/volunteers/me/availability", { on_duty: value });
      setVolunteerMe(data);
    } catch {
      Alert.alert("Could not update availability", "Please try again.");
    }
  }

  async function acknowledge(taskId: number) {
    await api.patch(`/tasks/${taskId}/acknowledge`);
    load();
  }

  async function complete(taskId: number) {
    await api.patch(`/tasks/${taskId}/complete`);
    load();
  }

  return (
    <Screen title="My tasks" subtitle={role === "volunteer" ? "Volunteer" : "Field team"} refreshing={refreshing} onRefresh={onRefresh}>
      {role === "volunteer" && volunteerMe && (
        <Card>
          <View style={styles.dutyRow}>
            <Text style={styles.dutyLabel}>{volunteerMe.on_duty ? "Available" : "Off duty"}</Text>
            <Switch value={volunteerMe.on_duty} onValueChange={toggleOnDuty} trackColor={{ true: colors.teal, false: colors.border }} />
          </View>
          <Text style={styles.muted}>Admin only assigns tasks to volunteers marked available.</Text>
        </Card>
      )}

      {tasks.map((t) => (
        <Card key={t.id} style={{ borderLeftWidth: 4, borderLeftColor: PRIORITY_COLOR[t.priority] }}>
          {t.priority === "high" && (
            <View style={styles.priorityRow}>
              <WarningCircle size={14} color={colors.redDeep} weight="fill" />
              <Text style={styles.priorityText}>High priority</Text>
            </View>
          )}
          <Text style={styles.description}>{t.description}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <MapPin size={12} color={colors.muted} />
              <Text style={styles.metaText}>Priority: {t.priority}</Text>
            </View>
            <View style={styles.metaChip}>
              <Clock size={12} color={colors.muted} />
              <Text style={styles.metaText}>Acknowledge within {t.ack_deadline_minutes} min</Text>
            </View>
          </View>
          <Text style={styles.status}>{t.status.replace("_", " ")}</Text>
          {t.status === "unassigned" && (
            <TouchableOpacity style={styles.primaryButton} onPress={() => acknowledge(t.id)}>
              <Text style={styles.primaryButtonText}>Acknowledge</Text>
            </TouchableOpacity>
          )}
          {t.status === "acknowledged" && (
            <TouchableOpacity style={styles.primaryButton} onPress={() => complete(t.id)}>
              <Text style={styles.primaryButtonText}>Mark complete</Text>
            </TouchableOpacity>
          )}
        </Card>
      ))}
      {tasks.length === 0 && <Text style={styles.muted}>No tasks assigned right now.</Text>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  dutyRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dutyLabel: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  priorityRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  priorityText: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase", color: colors.redDeep },
  description: { fontFamily: fonts.bodyMedium, fontSize: 15.5, color: colors.ink, marginBottom: 8, lineHeight: 22 },
  metaRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 8 },
  metaChip: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.surfaceTint, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  metaText: { fontFamily: fonts.body, fontSize: 11.5, color: colors.muted },
  status: { fontFamily: fonts.bodyBold, color: colors.saffronDeep, marginBottom: 4, textTransform: "capitalize" },
  muted: { fontFamily: fonts.body, color: colors.muted },
  primaryButton: { backgroundColor: colors.ink, borderRadius: 10, paddingVertical: 11, alignItems: "center", marginTop: 4 },
  primaryButtonText: { fontFamily: fonts.bodyBold, color: colors.surface },
});
