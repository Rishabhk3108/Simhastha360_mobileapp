import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Siren, UsersThree, Toilet, DropHalf, UserFocus } from "../components/icons";
import { api } from "../api/client";
import { Screen } from "../components/Screen";
import { Card } from "../components/Card";
import { TextInput } from "../components/AppTextInput";
import { useLocation } from "../location/useLocation";
import { getDeviceId } from "../device/deviceId";
import { createSOS, getSOSStatus, cancelSOS, type SOSStatusOut } from "../api/sos";
import { colors, fonts } from "../theme";

const SOS_POLL_INTERVAL_MS = 5000;

const SOS_STATUS_TEXT: Record<SOSStatusOut["status"], string> = {
  pending: "Looking for the nearest responder…",
  assigned: "A responder has been notified and should acknowledge shortly.",
  responding: "Help is on the way.",
  resolved: "This alert has been resolved.",
};

const REPORT_TYPES: { label: string; value: string; Icon: typeof UsersThree; color: string }[] = [
  { label: "Too crowded here", value: "crowded", Icon: UsersThree, color: colors.brass },
  { label: "Toilet not working", value: "toilet_not_working", Icon: Toilet, color: colors.saffronDeep },
  { label: "Water point empty", value: "water_empty", Icon: DropHalf, color: colors.teal },
];

export function SafetyScreen() {
  const { coords, error: locationError } = useLocation();
  const [sending, setSending] = useState(false);
  const [zoneId, setZoneId] = useState("1");
  const [lostName, setLostName] = useState("");
  const [activeSOS, setActiveSOS] = useState<{ id: number; deviceId: string } | null>(null);
  const [sosStatus, setSosStatus] = useState<SOSStatusOut | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!activeSOS) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const status = await getSOSStatus(activeSOS.id, activeSOS.deviceId);
        if (cancelled) return;
        setSosStatus(status);
        if (status.status === "resolved") {
          setActiveSOS(null);
        }
      } catch {
        // keep showing the last known status if a poll hiccups
      }
    };
    poll();
    pollRef.current = setInterval(poll, SOS_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeSOS]);

  async function sendSOS() {
    if (!coords) {
      Alert.alert("Location needed", "We need your location to route a responder to you.");
      return;
    }
    setSending(true);
    try {
      const deviceId = await getDeviceId();
      const sos = await createSOS(deviceId, coords.lat, coords.lng);
      setActiveSOS({ id: sos.id, deviceId });
    } catch {
      Alert.alert("Could not send SOS", "Please try again or find the nearest help desk.");
    } finally {
      setSending(false);
    }
  }

  async function handleCancelSOS() {
    if (!activeSOS) return;
    setCancelling(true);
    try {
      await cancelSOS(activeSOS.id, activeSOS.deviceId);
      setActiveSOS(null);
      setSosStatus(null);
    } catch {
      Alert.alert("Could not cancel", "Please try again.");
    } finally {
      setCancelling(false);
    }
  }

  async function sendReport(type: string) {
    try {
      const deviceId = await getDeviceId();
      await api.post("/reports", { zone_id: parseInt(zoneId, 10), type, device_id: deviceId, lat: coords?.lat, lng: coords?.lng });
      Alert.alert("Thanks", "Your report has been submitted.");
    } catch {
      Alert.alert("Could not submit report", "Please try again.");
    }
  }

  async function submitLostPerson() {
    if (!lostName.trim()) {
      Alert.alert("Name required", "Enter the name of the person you're reporting.");
      return;
    }
    try {
      const deviceId = await getDeviceId();
      await api.post("/lost-person", { reporter_device_id: deviceId, subject_name: lostName, last_seen_lat: coords?.lat, last_seen_lng: coords?.lng });
      setLostName("");
      Alert.alert("Report received", "Help desk staff have been notified.");
    } catch {
      Alert.alert("Could not submit report", "Please try again.");
    }
  }

  return (
    <Screen title="Safety">
      {locationError && <Text style={styles.muted}>{locationError}</Text>}

      {!activeSOS ? (
        <TouchableOpacity style={styles.sosButton} onPress={sendSOS} disabled={sending} activeOpacity={0.85}>
          <View style={styles.sosRing}>
            <View style={styles.sosCore}>
              <Siren size={40} color={colors.surface} weight="fill" />
            </View>
          </View>
          <Text style={styles.sosText}>{sending ? "Sending..." : "SOS — Send Help"}</Text>
        </TouchableOpacity>
      ) : (
        <Card style={styles.sosStatusCard}>
          <View style={styles.titleRow}>
            <Siren size={18} color={colors.redDeep} weight="fill" />
            <Text style={styles.sosStatusTitle}>SOS active</Text>
          </View>
          <Text style={styles.sosStatusText}>{sosStatus ? SOS_STATUS_TEXT[sosStatus.status] : "Sending your alert…"}</Text>
          {sosStatus?.responder_name && (
            <Text style={styles.sosStatusText}>
              Responder: <Text style={{ fontFamily: fonts.bodyBold }}>{sosStatus.responder_name}</Text>
            </Text>
          )}
          {sosStatus?.distance_km != null && (
            <Text style={styles.sosStatusEta}>
              {sosStatus.distance_km < 1 ? `${Math.round(sosStatus.distance_km * 1000)} m` : `${sosStatus.distance_km.toFixed(1)} km`} away
              {sosStatus.duration_min != null ? ` · ~${Math.round(sosStatus.duration_min)} min` : ""}
            </Text>
          )}
          <TouchableOpacity style={styles.cancelSosButton} onPress={handleCancelSOS} disabled={cancelling}>
            {cancelling ? <ActivityIndicator color={colors.redDeep} /> : <Text style={styles.cancelSosButtonText}>I'm safe — cancel</Text>}
          </TouchableOpacity>
        </Card>
      )}

      <Card>
        <Text style={styles.cardTitle}>Report what you see</Text>
        <Text style={styles.muted}>Zone ID (demo — real app resolves this from your location)</Text>
        <TextInput style={styles.input} value={zoneId} onChangeText={setZoneId} keyboardType="number-pad" />
        <View style={{ gap: 8 }}>
          {REPORT_TYPES.map((r) => (
            <TouchableOpacity key={r.value} style={styles.reportButton} onPress={() => sendReport(r.value)}>
              <r.Icon size={22} color={r.color} weight="fill" />
              <Text style={styles.reportButtonText}>{r.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.fineprint}>One report never changes a zone — corroboration does.</Text>
      </Card>

      <Card>
        <View style={styles.titleRow}>
          <UserFocus size={16} color={colors.red} weight="fill" />
          <Text style={styles.cardTitle}>Report a lost person</Text>
        </View>
        <TextInput style={styles.input} placeholder="Name" value={lostName} onChangeText={setLostName} />
        <TouchableOpacity style={styles.primaryButton} onPress={submitLostPerson}>
          <Text style={styles.primaryButtonText}>Submit</Text>
        </TouchableOpacity>
        <Text style={styles.fineprint}>Photo optional · help desk staff confirm any match.</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  muted: { fontFamily: fonts.body, color: colors.muted, marginBottom: 8 },
  cardTitle: { fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.ink },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  sosButton: { alignItems: "center", gap: 10, paddingVertical: 8 },
  sosRing: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: "rgba(194,80,70,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  sosCore: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.red,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.red,
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  sosText: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.redDeep },
  sosStatusCard: { borderColor: colors.redDeep, borderWidth: 1.5 },
  sosStatusTitle: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.redDeep },
  sosStatusText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.ink, marginBottom: 6, lineHeight: 19 },
  sosStatusEta: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.redDeep, marginBottom: 10 },
  cancelSosButton: { alignItems: "center", paddingVertical: 12, marginTop: 4 },
  cancelSosButtonText: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.muted, textDecorationLine: "underline" },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 11, marginBottom: 10, backgroundColor: colors.surface, fontFamily: fonts.body },
  reportButton: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surfaceTint, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 14 },
  reportButtonText: { fontFamily: fonts.bodyMedium, color: colors.ink, fontSize: 15 },
  primaryButton: { backgroundColor: colors.ink, borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  primaryButtonText: { fontFamily: fonts.bodyBold, color: colors.surface },
  fineprint: { fontFamily: fonts.body, fontSize: 12, color: colors.muted2, marginTop: 10 },
});
