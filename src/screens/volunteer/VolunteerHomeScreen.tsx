import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ActivityIndicator, Alert, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { WarningCircle, MapPin, Coins, NavigationArrow, Camera } from "../../components/icons";
import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { PointsPill } from "../../components/PointsPill";
import { TaskDirectionsModal } from "../../components/TaskDirectionsModal";
import { TaskCompletionModal } from "../../components/TaskCompletionModal";
import { getMyTasks, acknowledgeTask } from "../../api/tasks";
import { getMyVolunteerStatus, updateMyAvailability } from "../../api/volunteers";
import { api } from "../../api/client";
import { useLocation } from "../../location/useLocation";
import { colors, fonts } from "../../theme";
import { STATUS_LABELS } from "../../utils/taskStatus";
import type { Task } from "../../api/types";
import type { VolunteerProfile } from "../../api/volunteers";

const PRIORITY_COLOR: Record<Task["priority"], string> = { low: colors.green, medium: colors.yellow, high: colors.red };
const LOCATION_PUSH_INTERVAL_MS = 20000;
const TASK_POLL_INTERVAL_MS = 15000;

export function VolunteerHomeScreen() {
  const { refresh } = useLocation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [me, setMe] = useState<VolunteerProfile | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [directionsTask, setDirectionsTask] = useState<Task | null>(null);
  const [completingTaskId, setCompletingTaskId] = useState<number | null>(null);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    const [taskList, profile] = await Promise.all([getMyTasks(), getMyVolunteerStatus()]);
    setTasks(taskList.filter((t) => t.status !== "complete"));
    setMe(profile);
    setInitialLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      const pollInterval = setInterval(load, TASK_POLL_INTERVAL_MS);
      const pushLocation = async () => {
        const fresh = await refresh();
        if (fresh) {
          api.patch("/field-team/me/location", { lat: fresh.lat, lng: fresh.lng }).catch(() => {});
        }
      };
      pushLocation();
      const locationInterval = setInterval(pushLocation, LOCATION_PUSH_INTERVAL_MS);
      return () => {
        clearInterval(pollInterval);
        clearInterval(locationInterval);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [load]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function toggleOnDuty(value: boolean) {
    try {
      const profile = await updateMyAvailability({ on_duty: value });
      setMe(profile);
    } catch {
      Alert.alert("Could not update availability", "Please try again.");
    }
  }

  async function toggleAcceptsEmergencies(value: boolean) {
    try {
      const profile = await updateMyAvailability({ accepts_emergencies: value });
      setMe(profile);
    } catch {
      Alert.alert("Could not update this setting", "Please try again.");
    }
  }

  async function accept(task: Task) {
    setAcceptingId(task.id);
    try {
      const updated = await acknowledgeTask(task.id);
      setTasks((t) => t.map((x) => (x.id === updated.id ? updated : x)));
      setDirectionsTask(updated);
    } catch {
      Alert.alert("Could not accept task", "Please try again.");
    } finally {
      setAcceptingId(null);
    }
  }

  return (
    <Screen title="My tasks" subtitle="Volunteer" refreshing={refreshing} onRefresh={onRefresh}>
      <PointsPill />

      {me && (
        <Card>
          <View style={styles.dutyRow}>
            <Text style={styles.dutyLabel}>{me.on_duty ? "Available" : "Off duty"}</Text>
            <Switch value={me.on_duty} onValueChange={toggleOnDuty} trackColor={{ true: colors.teal, false: colors.border }} />
          </View>
          <Text style={styles.muted}>Your manager only assigns tasks to volunteers marked available.</Text>

          <View style={[styles.dutyRow, { marginTop: 14 }]}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <View style={styles.emergencyLabelRow}>
                <WarningCircle size={14} color={colors.redDeep} weight="fill" />
                <Text style={styles.dutyLabel}>Ready to accept emergencies</Text>
              </View>
              <Text style={styles.muted}>
                If on, you may be paged for a nearby SOS while on duty. You won't be able to decline once assigned.
              </Text>
            </View>
            <Switch
              value={me.accepts_emergencies}
              onValueChange={toggleAcceptsEmergencies}
              trackColor={{ true: colors.redDeep, false: colors.border }}
            />
          </View>
        </Card>
      )}

      {initialLoading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.ink} />
          <Text style={styles.muted}>Loading your tasks…</Text>
        </View>
      )}

      {!initialLoading && tasks.map((t) => (
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
              <Coins size={12} color={colors.muted} />
              <Text style={styles.metaText}>{t.points} pts</Text>
            </View>
          </View>
          <Text style={styles.status}>{STATUS_LABELS[t.status]}</Text>
          {t.review_note && t.status === "acknowledged" && <Text style={styles.reviewNote}>Manager's note: {t.review_note}</Text>}

          {t.status === "assigned" && (
            <TouchableOpacity style={styles.primaryButton} onPress={() => accept(t)} disabled={acceptingId === t.id}>
              {acceptingId === t.id ? (
                <ActivityIndicator color={colors.surface} size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Accept task</Text>
              )}
            </TouchableOpacity>
          )}
          {t.status === "acknowledged" && (
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setDirectionsTask(t)}>
                <NavigationArrow size={15} color={colors.ink} />
                <Text style={styles.secondaryButtonText}>Directions</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButtonFlex} onPress={() => setCompletingTaskId(t.id)}>
                <Camera size={15} color={colors.surface} />
                <Text style={styles.primaryButtonText}>Complete</Text>
              </TouchableOpacity>
            </View>
          )}
          {t.status === "review" && <Text style={styles.muted}>Submitted — awaiting your manager's review.</Text>}
        </Card>
      ))}
      {!initialLoading && tasks.length === 0 && <Text style={styles.muted}>No tasks assigned right now.</Text>}

      <TaskDirectionsModal
        visible={!!directionsTask}
        task={directionsTask}
        onClose={() => setDirectionsTask(null)}
        onCompleteTask={() => {
          setCompletingTaskId(directionsTask?.id ?? null);
          setDirectionsTask(null);
        }}
      />

      <TaskCompletionModal
        visible={completingTaskId !== null}
        taskId={completingTaskId}
        onClose={() => setCompletingTaskId(null)}
        onSubmitted={() => {
          setCompletingTaskId(null);
          load();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { alignItems: "center", gap: 8, paddingVertical: 24 },
  dutyRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dutyLabel: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  emergencyLabelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  priorityRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  priorityText: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase", color: colors.redDeep },
  description: { fontFamily: fonts.bodyMedium, fontSize: 15.5, color: colors.ink, marginBottom: 8, lineHeight: 22 },
  metaRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 8 },
  metaChip: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.surfaceTint, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  metaText: { fontFamily: fonts.body, fontSize: 11.5, color: colors.muted },
  status: { fontFamily: fonts.bodyBold, color: colors.saffronDeep, marginBottom: 4, textTransform: "capitalize" },
  reviewNote: { fontFamily: fonts.body, fontSize: 12.5, color: colors.redDeep, marginBottom: 6 },
  muted: { fontFamily: fonts.body, color: colors.muted },
  primaryButton: { backgroundColor: colors.ink, borderRadius: 10, paddingVertical: 11, alignItems: "center", marginTop: 4 },
  primaryButtonText: { fontFamily: fonts.bodyBold, color: colors.surface },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.surfaceTint,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  secondaryButtonText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink },
  primaryButtonFlex: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.ink,
    borderRadius: 10,
    paddingVertical: 11,
  },
});
