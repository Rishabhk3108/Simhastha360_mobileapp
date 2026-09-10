import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Siren } from "../components/icons";
import { Screen } from "../components/Screen";
import { Card } from "../components/Card";
import { useLocation } from "../location/useLocation";
import { getDeviceId } from "../device/deviceId";
import { createSOS, getSOSStatus, cancelSOS, type SOSStatusOut } from "../api/sos";
import { colors, fonts } from "../theme";

const SOS_POLL_INTERVAL_MS = 5000;
const { height: SCREEN_H } = Dimensions.get("window");

const SOS_STATUS_TEXT: Record<SOSStatusOut["status"], string> = {
  pending: "Looking for the nearest responder…",
  assigned: "A responder has been notified and should acknowledge shortly.",
  responding: "Help is on the way.",
  resolved: "This alert has been resolved.",
};

export function SafetyScreen() {
  const { coords, error: locationError } = useLocation();
  const [sending, setSending] = useState(false);
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

  return (
    <Screen title="Safety">
      {locationError && <Text style={styles.muted}>{locationError}</Text>}

      {!activeSOS ? (
        <View style={styles.center}>
          <TouchableOpacity style={styles.sosButton} onPress={sendSOS} disabled={sending} activeOpacity={0.85}>
            <View style={styles.sosRing}>
              <View style={styles.sosCore}>
                <Siren size={72} color={colors.surface} weight="fill" />
              </View>
            </View>
            <Text style={styles.sosText}>{sending ? "Sending..." : "SOS — Send Help"}</Text>
          </TouchableOpacity>
          <Text style={styles.helperText}>Tap only in a genuine emergency. Your location is sent to the nearest responder.</Text>
        </View>
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  muted: { fontFamily: fonts.body, color: colors.muted, marginBottom: 8 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  center: {
    minHeight: SCREEN_H * 0.68,
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
  },
  sosButton: { alignItems: "center", gap: 16, paddingVertical: 8 },
  sosRing: {
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(194,80,70,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  sosCore: {
    width: 172,
    height: 172,
    borderRadius: 86,
    backgroundColor: colors.red,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.red,
    shadowOpacity: 0.5,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  sosText: { fontFamily: fonts.bodyBold, fontSize: 21, color: colors.redDeep },
  helperText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.muted, textAlign: "center", paddingHorizontal: 24, lineHeight: 20 },
  sosStatusCard: { borderColor: colors.redDeep, borderWidth: 1.5 },
  sosStatusTitle: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.redDeep },
  sosStatusText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.ink, marginBottom: 6, lineHeight: 19 },
  sosStatusEta: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.redDeep, marginBottom: 10 },
  cancelSosButton: { alignItems: "center", paddingVertical: 12, marginTop: 4 },
  cancelSosButtonText: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.muted, textDecorationLine: "underline" },
});
