import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { X } from "./icons";
import { MapplsMapView, type MapplsMapHandle } from "./MapplsMapView";
import { getDirections, type RouteResult } from "../api/mappls";
import { api } from "../api/client";
import { useLocation } from "../location/useLocation";
import { advanceStep, formatDistance } from "../navigation/turnByTurn";
import { colors, fonts } from "../theme";
import type { Zone } from "../api/types";

const UJJAIN_FALLBACK = { lat: 23.1815, lng: 75.7684 };

interface Props {
  visible: boolean;
  destination: { lat: number; lng: number } | null;
  onClose: () => void;
  onResolve: () => void;
  resolving: boolean;
}

export function SOSDirectionsModal({ visible, destination, onClose, onResolve, resolving }: Props) {
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
    if (!visible || !destination) return;
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
        const result = await getDirections(origin, destination, zoneRes.data);
        if (cancelled) return;
        setRoute(result);
        mapRef.current?.setDestination(result.destination.lat, result.destination.lng, "Emergency location");
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
  }, [visible, destination?.lat, destination?.lng]);

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
        {!destination ? (
          <View style={styles.center}>
            <Text style={styles.noLocationText}>No location available for this emergency.</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.emergencyBanner}>
              <Text style={styles.emergencyBannerText}>🚨 EMERGENCY RESPONSE</Text>
              <TouchableOpacity style={styles.minimizeButton} onPress={onClose}>
                <Text style={styles.minimizeButtonText}>Minimize</Text>
              </TouchableOpacity>
            </View>

            <MapplsMapView
              ref={mapRef}
              initialLat={coords?.lat ?? UJJAIN_FALLBACK.lat}
              initialLng={coords?.lng ?? UJJAIN_FALLBACK.lng}
              navigating
              zones={zones}
              onUserLocationUpdate={(location) => setLiveCoords({ lat: location.lat, lng: location.lng })}
            />

            {loading && (
              <View style={styles.loadingBanner}>
                <ActivityIndicator color={colors.surface} />
                <Text style={styles.loadingText}>Getting directions…</Text>
              </View>
            )}

            {!loading && currentStep && (
              <View style={styles.navCard}>
                {arrived ? (
                  <Text style={styles.navInstruction}>You've arrived at the emergency location</Text>
                ) : (
                  <>
                    <Text style={styles.navDistance}>{formatDistance(distanceToManeuverM)}</Text>
                    <Text style={styles.navInstruction}>{currentStep.instruction}</Text>
                    {nextStep && <Text style={styles.navNext}>Then {nextStep.instruction.toLowerCase()}</Text>}
                  </>
                )}
              </View>
            )}

            {!loading && route && (
              <View style={styles.bottomCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeDuration}>{Math.round(route.durationMin)} min</Text>
                  <Text style={styles.routeDistance}>{route.distanceKm.toFixed(1)} km to the pilgrim</Text>
                </View>
                <TouchableOpacity style={styles.resolveButton} onPress={onResolve} disabled={resolving}>
                  {resolving ? (
                    <ActivityIndicator color={colors.surface} size="small" />
                  ) : (
                    <Text style={styles.resolveButtonText}>Mark resolved</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {!loading && !route && (
              <View style={styles.bottomCard}>
                <Text style={styles.routeDistance}>Couldn't load directions. Please try again.</Text>
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
  emergencyBanner: {
    position: "absolute",
    top: 54,
    left: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: colors.redDeep,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 6,
  },
  emergencyBannerText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.surface, letterSpacing: 0.5 },
  minimizeButton: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  minimizeButtonText: { fontFamily: fonts.bodyMedium, fontSize: 11.5, color: colors.surface },
  loadingBanner: {
    position: "absolute",
    top: 104,
    left: 16,
    right: 16,
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
    top: 104,
    left: 16,
    right: 16,
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
  resolveButton: { backgroundColor: colors.teal, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, minWidth: 110, alignItems: "center" },
  resolveButtonText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.surface },
});
