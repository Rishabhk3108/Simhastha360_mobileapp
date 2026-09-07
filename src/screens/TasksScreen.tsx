import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Alert, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { Screen } from "../components/Screen";
import { Card } from "../components/Card";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useLocation } from "../location/useLocation";
import type { Task, VolunteerMe } from "../api/types";

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
    <Screen title="Tasks" refreshing={refreshing} onRefresh={onRefresh}>
      {role === "volunteer" && volunteerMe && (
        <Card>
          <View style={styles.dutyRow}>
            <Text style={styles.dutyLabel}>{volunteerMe.on_duty ? "Available" : "Off duty"}</Text>
            <Switch value={volunteerMe.on_duty} onValueChange={toggleOnDuty} />
          </View>
          <Text style={styles.muted}>Admin only assigns tasks to volunteers marked available.</Text>
        </Card>
      )}

      {tasks.map((t) => (
        <Card key={t.id}>
          <Text style={styles.description}>{t.description}</Text>
          <Text style={styles.muted}>Priority: {t.priority} • Acknowledge within {t.ack_deadline_minutes} min</Text>
          <Text style={styles.status}>{t.status.replace("_", " ")}</Text>
          <View style={styles.actionRow}>
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
          </View>
        </Card>
      ))}
      {tasks.length === 0 && <Text style={styles.muted}>No tasks assigned right now.</Text>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  dutyRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dutyLabel: { fontSize: 16, fontWeight: "700", color: "#1c2733" },
  description: { fontSize: 15, fontWeight: "600", color: "#1c2733", marginBottom: 4 },
  status: { color: "#1d5fbf", fontWeight: "700", marginTop: 4, textTransform: "capitalize" },
  muted: { color: "#667080" },
  actionRow: { marginTop: 10 },
  primaryButton: { backgroundColor: "#1d5fbf", borderRadius: 8, paddingVertical: 10, alignItems: "center" },
  primaryButtonText: { color: "white", fontWeight: "700" },
});
