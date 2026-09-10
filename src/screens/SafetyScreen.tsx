import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Siren } from "../components/icons";
import { Screen } from "../components/Screen";
import { Card } from "../components/Card";
import { useLocation } from "../location/useLocation";
import { getDeviceId } from "../device/deviceId";
import { createSOS, getSOSStatus, cancelSOS, type SOSStatusOut } from "../api/sos";
import { colors, fonts } from "../theme";

const SOS_POLL_INTERVAL_MS = 5000;
const { height: SCREEN_H } = Dimensions.get("window");

export function SafetyScreen() {
  const { t } = useTranslation();
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
      Alert.alert(t("safety.locationNeededTitle"), t("safety.locationNeededBody"));
      return;
    }
    setSending(true);
    try {
      const deviceId = await getDeviceId();
      const sos = await createSOS(deviceId, coords.lat, coords.lng);
      setActiveSOS({ id: sos.id, deviceId });
    } catch {
      Alert.alert(t("safety.sendFailedTitle"), t("safety.sendFailedBody"));
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
      Alert.alert(t("safety.cancelFailedTitle"), t("common.tryAgain"));
    } finally {
      setCancelling(false);
    }
  }

  return (
    <Screen title={t("safety.title")}>
      {locationError && <Text style={styles.muted}>{locationError}</Text>}

      {!activeSOS ? (
        <View style={styles.center}>
          <TouchableOpacity style={styles.sosButton} onPress={sendSOS} disabled={sending} activeOpacity={0.85}>
            <View style={styles.sosRing}>
              <View style={styles.sosCore}>
                <Siren size={72} color={colors.surface} weight="fill" />
              </View>
            </View>
            <Text style={styles.sosText}>{sending ? t("safety.sending") : t("safety.sendHelp")}</Text>
          </TouchableOpacity>
          <Text style={styles.helperText}>{t("safety.helperText")}</Text>
        </View>
      ) : (
        <Card style={styles.sosStatusCard}>
          <View style={styles.titleRow}>
            <Siren size={18} color={colors.redDeep} weight="fill" />
            <Text style={styles.sosStatusTitle}>{t("safety.active")}</Text>
          </View>
          <Text style={styles.sosStatusText}>{sosStatus ? t(`safety.status.${sosStatus.status}`) : t("safety.sendingAlert")}</Text>
          {sosStatus?.responder_name && (
            <Text style={styles.sosStatusText}>
              {t("safety.responderLabel")} <Text style={{ fontFamily: fonts.bodyBold }}>{sosStatus.responder_name}</Text>
            </Text>
          )}
          {sosStatus?.distance_km != null && (
            <Text style={styles.sosStatusEta}>
              {t(sosStatus.distance_km < 1 ? "safety.distanceMetersAway" : "safety.distanceKmAway", {
                value: sosStatus.distance_km < 1 ? Math.round(sosStatus.distance_km * 1000) : sosStatus.distance_km.toFixed(1),
              })}
              {sosStatus.duration_min != null ? t("safety.etaSuffix", { minutes: Math.round(sosStatus.duration_min) }) : ""}
            </Text>
          )}
          <TouchableOpacity style={styles.cancelSosButton} onPress={handleCancelSOS} disabled={cancelling}>
            {cancelling ? <ActivityIndicator color={colors.redDeep} /> : <Text style={styles.cancelSosButtonText}>{t("safety.cancel")}</Text>}
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
