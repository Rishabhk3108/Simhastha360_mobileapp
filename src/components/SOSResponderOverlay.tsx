import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { WarningCircle } from "./icons";
import { SOSDirectionsModal } from "./SOSDirectionsModal";
import { getAssignedSOS, acknowledgeSOS, resolveSOS, type SOSAlertOut } from "../api/sos";
import { colors, fonts } from "../theme";

const POLL_INTERVAL_MS = 8000;

// Mounted once at the root for volunteer/field-team roles, regardless of
// which tab is focused - an emergency assignment can't wait for the
// responder to happen to be on the right screen. There is deliberately no
// way to decline; only acknowledge (or silently time out and get
// reassigned by the backend).
export function SOSResponderOverlay() {
  const [assigned, setAssigned] = useState<SOSAlertOut | null>(null);
  const [minimized, setMinimized] = useState(false);
  const [acknowledging, setAcknowledging] = useState(false);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const sos = await getAssignedSOS();
        if (cancelled) return;
        setAssigned(sos);
        if (!sos) setMinimized(false);
      } catch {
        // transient network hiccup - next poll tries again
      }
    };
    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  async function handleAcknowledge() {
    if (!assigned) return;
    setAcknowledging(true);
    try {
      const updated = await acknowledgeSOS(assigned.id);
      setAssigned(updated);
    } catch {
      Alert.alert("Could not acknowledge", "Please try again.");
    } finally {
      setAcknowledging(false);
    }
  }

  async function handleResolve() {
    if (!assigned) return;
    setResolving(true);
    try {
      await resolveSOS(assigned.id);
      setAssigned(null);
      setMinimized(false);
    } catch {
      Alert.alert("Could not mark resolved", "Please try again.");
    } finally {
      setResolving(false);
    }
  }

  if (!assigned) return null;

  if (assigned.status === "assigned") {
    return (
      <Modal visible animationType="fade" onRequestClose={() => {}}>
        <View style={styles.urgentRoot}>
          <Text style={styles.urgentEmoji}>🚨</Text>
          <Text style={styles.urgentTitle}>Emergency Nearby</Text>
          <Text style={styles.urgentBody}>
            A pilgrim needs help and you're the nearest available responder. Please acknowledge to get directions.
          </Text>
          <TouchableOpacity style={styles.urgentButton} onPress={handleAcknowledge} disabled={acknowledging}>
            {acknowledging ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.urgentButtonText}>I'm Responding</Text>
            )}
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <>
      <SOSDirectionsModal
        visible={!minimized}
        destination={{ lat: assigned.lat, lng: assigned.lng }}
        onClose={() => setMinimized(true)}
        onResolve={handleResolve}
        resolving={resolving}
      />
      {minimized && (
        <TouchableOpacity style={styles.reopenBanner} onPress={() => setMinimized(false)}>
          <WarningCircle size={16} color={colors.surface} weight="fill" />
          <Text style={styles.reopenBannerText}>Active emergency response — tap to reopen</Text>
        </TouchableOpacity>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  urgentRoot: {
    flex: 1,
    backgroundColor: colors.redDeep,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 14,
  },
  urgentEmoji: { fontSize: 56 },
  urgentTitle: { fontFamily: fonts.display, fontSize: 28, color: colors.surface, textAlign: "center" },
  urgentBody: { fontFamily: fonts.body, fontSize: 15, color: "rgba(255,253,248,0.9)", textAlign: "center", lineHeight: 22 },
  urgentButton: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 40,
    minWidth: 220,
    alignItems: "center",
  },
  urgentButtonText: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.redDeep },
  reopenBanner: {
    position: "absolute",
    bottom: 74,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.redDeep,
    borderRadius: 14,
    paddingVertical: 12,
    elevation: 8,
  },
  reopenBannerText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.surface },
});
