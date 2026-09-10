import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { X } from "./icons";
import { MapplsMapView, type MapplsMapHandle } from "./MapplsMapView";
import { getDirections, type RouteResult } from "../api/mappls";
import { api } from "../api/client";
import { useLocation } from "../location/useLocation";
import { advanceStep, formatDistance } from "../navigation/turnByTurn";
import { colors, fonts } from "../theme";
import type { Task, Zone } from "../api/types";

const UJJAIN_FALLBACK = { lat: 23.1815, lng: 75.7684 };

interface Props {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
  onCompleteTask: () => void;
}

export function TaskDirectionsModal({ visible, task, onClose, onCompleteTask }: Props) {
  const { t } = useTranslation();
  const { coords } = useLocation();
  const mapRef = useRef<MapplsMapHandle>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [liveCoords, setLiveCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [distanceToManeuverM, setDistanceToManeuverM] = useState(0);
  const [arrived, setArrived] = useState(false);

  useEffect(() => {
    if (!visible || !task?.lat || !task?.lng) return;
    let cancelled = false;
    setLoading(true);
    setRoute(null);
    setStepIndex(0);
    setArrived(false);
    (async () => {
      try {
        const zoneRes = await api.get<Zone[]>("/zones");
        if (cancelled) return;
        setZones(zoneRes.data);
        const origin = coords ?? UJJAIN_FALLBACK;
        const result = await getDirections(origin, { lat: task.lat!, lng: task.lng! }, zoneRes.data);
        if (cancelled) return;
        setRoute(result);
        mapRef.current?.setDestination(result.destination.lat, result.destination.lng, t("taskDirectionsModal.taskLocation"));
        mapRef.current?.drawRoute(result.coordinates);
      } catch {
        // route stays null; UI shows a "couldn't load" state below
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, task?.id]);

  useEffect(() => {
    if (!route || !liveCoords) return;
    const progress = advanceStep(route.steps, stepIndex, liveCoords);
    if (progress.stepIndex !== stepIndex) setStepIndex(progress.stepIndex);
    setDistanceToManeuverM(progress.distanceToManeuverM);
    if (progress.arrived) setArrived(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveCoords, route]);

  const currentStep = route?.steps[stepIndex];
  const nextStep = route && stepIndex + 1 < route.steps.length ? route.steps[stepIndex + 1] : null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        {!task?.lat || !task?.lng ? (
          <View style={styles.center}>
            <Text style={styles.noLocationText}>{t("taskDirectionsModal.noLocation")}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>{t("taskDirectionsModal.close")}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <MapplsMapView
              ref={mapRef}
              initialLat={coords?.lat ?? UJJAIN_FALLBACK.lat}
              initialLng={coords?.lng ?? UJJAIN_FALLBACK.lng}
              navigating
              zones={zones}
              onUserLocationUpdate={(location) => setLiveCoords({ lat: location.lat, lng: location.lng })}
            />

            <View style={styles.topBar}>
              <TouchableOpacity style={styles.exitButton} onPress={onClose}>
                <X size={18} color={colors.surface} weight="bold" />
              </TouchableOpacity>
            </View>

            {loading && (
              <View style={styles.loadingBanner}>
                <ActivityIndicator color={colors.surface} />
                <Text style={styles.loadingText}>{t("taskDirectionsModal.loading")}</Text>
              </View>
            )}

            {!loading && currentStep && (
              <View style={styles.navCard}>
                {arrived ? (
                  <Text style={styles.navInstruction}>{t("taskDirectionsModal.arrived")}</Text>
                ) : (
                  <>
                    <Text style={styles.navDistance}>{formatDistance(distanceToManeuverM)}</Text>
                    <Text style={styles.navInstruction}>{currentStep.instruction}</Text>
                    {nextStep && <Text style={styles.navNext}>{t("home.then", { instruction: nextStep.instruction.toLowerCase() })}</Text>}
                  </>
                )}
              </View>
            )}

            {!loading && route && (
              <View style={styles.bottomCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeDuration}>{t("home.minutes", { count: Math.round(route.durationMin) })}</Text>
                  <Text style={styles.routeDistance}>{t("taskDirectionsModal.distanceToTask", { distance: route.distanceKm.toFixed(1) })}</Text>
                </View>
                <TouchableOpacity style={styles.completeButton} onPress={onCompleteTask}>
                  <Text style={styles.completeButtonText}>{t("taskDirectionsModal.completeTask")}</Text>
                </TouchableOpacity>
              </View>
            )}

            {!loading && !route && (
              <View style={styles.bottomCard}>
                <Text style={styles.routeDistance}>{t("taskDirectionsModal.loadFailed")}</Text>
              </View>
            )}
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30, gap: 20 },
  noLocationText: { fontFamily: fonts.body, fontSize: 15, color: colors.muted, textAlign: "center", lineHeight: 21 },
  closeButton: { backgroundColor: colors.ink, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 13 },
  closeButtonText: { fontFamily: fonts.bodyBold, color: colors.surface },
  topBar: { position: "absolute", top: 54, right: 16 },
  exitButton: {
    backgroundColor: colors.redDeep,
    borderRadius: 999,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
  loadingBanner: {
    position: "absolute",
    top: 54,
    left: 16,
    right: 70,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.ink,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  loadingText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.surface },
  navCard: {
    position: "absolute",
    top: 54,
    left: 16,
    right: 70,
    backgroundColor: colors.ink,
    borderRadius: 20,
    padding: 18,
    elevation: 6,
  },
  navDistance: { fontFamily: fonts.display, fontSize: 24, color: colors.brass },
  navInstruction: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.surface, marginTop: 4 },
  navNext: { fontFamily: fonts.body, fontSize: 12, color: "rgba(255,253,248,0.65)", marginTop: 8 },
  bottomCard: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 30,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    elevation: 6,
  },
  routeDuration: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  routeDistance: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted, marginTop: 2 },
  completeButton: { backgroundColor: colors.teal, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  completeButtonText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.surface },
});
