import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MagnifyingGlass, CloudSlash, X, Crosshair, WarningCircle, Info, Car } from "../components/icons";
import { MapplsMapView, type MapplsMapHandle } from "../components/MapplsMapView";
import { searchPlaces, getDirections, findClearRoute, getWalkingRoute, type PlaceResult, type RouteResult } from "../api/mappls";
import { getParkingZones, createParkingBooking, findNearestAvailable } from "../api/parking";
import { api } from "../api/client";
import { useLocation } from "../location/useLocation";
import { haversineKm } from "../location/geo";
import { CrowdBadge } from "../components/CrowdBadge";
import { colors, fonts } from "../theme";
import { advanceStep, distanceToRouteM, formatDistance, OFF_ROUTE_THRESHOLD_M } from "../navigation/turnByTurn";
import { zonesContainingPoint, worstZone } from "../utils/zoneAlerts";
import type { CrowdLevel, Facility, FacilityType, ParkingZone, VehicleType, Zone } from "../api/types";

const VEHICLE_OPTIONS: { type: VehicleType; label: string }[] = [
  { type: "two_wheeler", label: "Two-wheeler" },
  { type: "three_wheeler", label: "Three-wheeler" },
  { type: "four_wheeler", label: "Four-wheeler" },
  { type: "six_wheeler", label: "Six-wheeler" },
];

const UJJAIN_FALLBACK = { lat: 23.1815, lng: 75.7684 };
const REROUTE_COOLDOWN_MS = 8000;

// A marked zone or facility matched by name is routed to directly by its
// stored coordinates - neither is a real Mappls place, so they carry no eLoc.
type SearchResult = PlaceResult & {
  localCoords?: { lat: number; lng: number };
  zoneCrowdLevel?: CrowdLevel;
  facilityType?: FacilityType;
  distanceKm?: number;
};

type ZoneModalState =
  | { stage: "warning"; severity: CrowdLevel; title: string; message: string }
  | { stage: "searching" }
  | { stage: "result"; cleared: boolean; message: string };

export function HomeScreen() {
  const { coords, error: locationError } = useLocation();
  const [liveCoords, setLiveCoords] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<MapplsMapHandle>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [destination, setDestination] = useState<PlaceResult | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [routing, setRouting] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [distanceToManeuverM, setDistanceToManeuverM] = useState(0);
  const [arrived, setArrived] = useState(false);
  const [zoneModal, setZoneModal] = useState<ZoneModalState | null>(null);
  const [parkingZones, setParkingZones] = useState<ParkingZone[]>([]);
  const [saarthiVisible, setSaarthiVisible] = useState(false);
  const [saarthiVehicleType, setSaarthiVehicleType] = useState<VehicleType | null>(null);
  const [saarthiVehicleNumber, setSaarthiVehicleNumber] = useState("");
  const [saarthiSearching, setSaarthiSearching] = useState(false);
  const lastRerouteAt = useRef(0);
  const searchInputRef = useRef<TextInput>(null);
  // Guards the search effect below from re-searching when we set `query`
  // programmatically (e.g. to the picked place's own name) rather than from
  // the user typing - without this, selecting a result reopened the dropdown
  // a moment later with that place's own name as the search term.
  const skipNextSearchRef = useRef(false);

  const loadZones = useCallback(async () => {
    try {
      const { data } = await api.get<Zone[]>("/zones");
      setZones(data);
    } catch {
      // non-critical for the map itself
    }
  }, []);

  const loadParkingZones = useCallback(async () => {
    try {
      setParkingZones(await getParkingZones());
    } catch {
      // non-critical for the map itself
    }
  }, []);

  const loadFacilities = useCallback(async () => {
    try {
      const { data } = await api.get<Facility[]>("/facilities");
      setFacilities(data);
    } catch {
      // non-critical for the map itself
    }
  }, []);

  // Polls while the map screen is focused so an admin-marked zone (e.g. a
  // new red zone) shows up live, matching the 15s refresh the admin web
  // dashboard already uses - stops polling when the user navigates away.
  useFocusEffect(
    useCallback(() => {
      loadZones();
      loadParkingZones();
      loadFacilities();
      const interval = setInterval(() => {
        loadZones();
        loadParkingZones();
        loadFacilities();
      }, 15000);
      return () => clearInterval(interval);
    }, [loadZones, loadParkingZones, loadFacilities]),
  );

  useEffect(() => {
    if (coords) mapRef.current?.setUserLocation(coords.lat, coords.lng, !destination);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords]);

  useEffect(() => {
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearching(true);
      const needle = query.trim().toLowerCase();
      const from = liveCoords ?? coords ?? null;
      const distanceTo = (lat: number, lng: number) => (from ? haversineKm(from.lat, from.lng, lat, lng) : undefined);

      const zoneMatches: SearchResult[] = zones
        .filter((z) => z.name.toLowerCase().includes(needle))
        .map((z) => ({
          eLoc: `zone-${z.id}`,
          placeName: z.name,
          placeAddress: "Marked zone",
          localCoords: { lat: z.center_lat, lng: z.center_lng },
          zoneCrowdLevel: z.crowd_level,
          distanceKm: distanceTo(z.center_lat, z.center_lng),
        }));
      const facilityMatches: SearchResult[] = facilities
        .filter((f) => f.name.toLowerCase().includes(needle))
        .map((f) => ({
          eLoc: `facility-${f.id}`,
          placeName: f.name,
          placeAddress: f.type.replace("_", " "),
          localCoords: { lat: f.lat, lng: f.lng },
          facilityType: f.type,
          distanceKm: distanceTo(f.lat, f.lng),
        }));
      // Nearest first - with 10 facilities all named "Toilet", the closest
      // one belongs at the top, not wherever it happened to be created.
      const localMatches = [...zoneMatches, ...facilityMatches].sort(
        (a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity),
      );
      try {
        const found = await searchPlaces(query, liveCoords ?? coords ?? undefined);
        setResults([...localMatches, ...found]);
      } catch {
        setResults(localMatches);
      } finally {
        setSearching(false);
      }
    }, 450);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, zones, facilities]);

  // Live turn-by-turn progress: advance through steps and watch for the
  // traveler drifting off the planned route, using the map's own native GPS
  // feed (the same one driving the on-screen blue dot).
  useEffect(() => {
    if (!navigating || !route || !liveCoords) return;

    const progress = advanceStep(route.steps, stepIndex, liveCoords);
    if (progress.stepIndex !== stepIndex) setStepIndex(progress.stepIndex);
    setDistanceToManeuverM(progress.distanceToManeuverM);

    if (progress.arrived && !arrived) {
      setArrived(true);
      return;
    }

    const now = Date.now();
    if (
      !progress.arrived &&
      now - lastRerouteAt.current > REROUTE_COOLDOWN_MS &&
      distanceToRouteM(liveCoords, route.coordinates) > OFF_ROUTE_THRESHOLD_M
    ) {
      lastRerouteAt.current = now;
      recalculateRoute(liveCoords);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveCoords, navigating]);

  useEffect(() => {
    if (!arrived) return;
    const timeout = setTimeout(() => stopNavigation(), 3500);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrived]);

  async function recalculateRoute(from: { lat: number; lng: number }) {
    if (!route) return;
    try {
      // Reuses the already-resolved destination coordinate rather than the
      // original eLoc/parking id, so this works identically whichever kind
      // of destination is active.
      const result = await getDirections(from, route.destination, zones);
      setRoute(result);
      setStepIndex(0);
      mapRef.current?.drawRoute(result.coordinates);
    } catch {
      // keep guiding on the last known route if a reroute attempt fails
    }
  }

  function buildZoneWarning(result: RouteResult, placeName: string): ZoneModalState | null {
    const destWorst = worstZone(zonesContainingPoint(result.destination, zones));
    if (destWorst) {
      const isRed = destWorst.crowd_level === "red";
      return {
        stage: "warning",
        severity: destWorst.crowd_level,
        title: isRed ? "Heavy crowd ahead" : "Moderate crowd ahead",
        message: isRed
          ? `${destWorst.name} currently has very high crowd density. We recommend postponing your visit to ${placeName} until it normalizes.`
          : `${destWorst.name} currently has moderate crowd density. Please proceed with caution.`,
      };
    }
    const routeWorst = worstZone(result.crossedZones);
    if (routeWorst) {
      const isRed = routeWorst.crowd_level === "red";
      return {
        stage: "warning",
        severity: routeWorst.crowd_level,
        title: isRed ? "Route passes through a red zone" : "Route passes through a yellow zone",
        message: `${result.rerouted ? "We already picked a route that reduces crowd exposure, but it still " : "Your route "}passes through ${routeWorst.name} (${routeWorst.crowd_level} zone). ${isRed ? "We recommend postponing your plans until it normalizes." : "Expect delays."}`,
      };
    }
    return null;
  }

  // Shared by both search-picked destinations and Sinhastha Saarthi parking
  // targets - the only difference between them is how the destination point
  // is looked up (eLoc vs a raw coordinate), everything downstream (routing,
  // zone warnings, map pin) is identical.
  async function routeTo(target: { lat: number; lng: number } | { eLoc: string }, placeInfo: PlaceResult) {
    setDestination(placeInfo);
    const origin = liveCoords ?? coords ?? UJJAIN_FALLBACK;
    setRouting(true);
    try {
      const result = await getDirections(origin, target, zones);
      setRoute(result);
      mapRef.current?.setDestination(result.destination.lat, result.destination.lng, placeInfo.placeName);
      mapRef.current?.drawRoute(result.coordinates);
      setZoneModal(buildZoneWarning(result, placeInfo.placeName));
    } catch {
      Alert.alert("Could not get directions", "Please try again.");
    } finally {
      setRouting(false);
    }
  }

  async function selectDestination(place: SearchResult) {
    skipNextSearchRef.current = true;
    setQuery(place.placeName);
    setResults([]);
    await routeTo(place.localCoords ?? { eLoc: place.eLoc }, place);
  }

  async function routeToParkingZone(zone: ParkingZone) {
    skipNextSearchRef.current = true;
    setQuery(zone.name);
    setResults([]);
    await routeTo(
      { lat: zone.center_lat, lng: zone.center_lng },
      { eLoc: `parking-${zone.id}`, placeName: zone.name, placeAddress: "Parking" },
    );
  }

  // Sinhastha Saarthi: routes the traveler to the nearest parking spot with
  // room for their vehicle type, measured from their already-chosen
  // destination (not their current location) - the point being to park near
  // where they're actually headed, then reuse the same zone-aware routing
  // and turn-by-turn flow already built for a normal destination.
  async function submitSaarthi() {
    if (!saarthiVehicleType || !saarthiVehicleNumber.trim()) return;
    if (!route) {
      setSaarthiVisible(false);
      Alert.alert(
        "Pick a destination first",
        "Search and select where you're headed, then use Sinhastha Saarthi to find parking near it.",
        [{ text: "OK", onPress: () => searchInputRef.current?.focus() }],
      );
      return;
    }
    setSaarthiSearching(true);
    try {
      const fresh = await getParkingZones();
      setParkingZones(fresh);
      // Captured before routeToParkingZone overwrites `route`/`destination`
      // with the parking leg - this is the pilgrim's actual destination, for
      // the last-mile walking leg drawn after parking.
      const finalDestinationCoord = route.destination;

      const nearest = findNearestAvailable(fresh, finalDestinationCoord, saarthiVehicleType);
      if (!nearest) {
        Alert.alert("No parking available", "We couldn't find an available parking spot for this vehicle type near your destination right now.");
        return;
      }
      await createParkingBooking(nearest.id, saarthiVehicleType, saarthiVehicleNumber.trim());
      setSaarthiVisible(false);
      setSaarthiVehicleNumber("");
      await routeToParkingZone(nearest);
      loadParkingZones();

      try {
        const walk = await getWalkingRoute({ lat: nearest.center_lat, lng: nearest.center_lng }, finalDestinationCoord);
        mapRef.current?.drawWalkRoute(walk.coordinates);
      } catch {
        // the drive-to-parking leg still succeeded; the last-mile walk overlay is a bonus, not critical
      }
    } catch {
      Alert.alert("Could not book parking", "Please try again.");
    } finally {
      setSaarthiSearching(false);
    }
  }

  // Triggered by the "Explore alternative routes" button - runs the heavier
  // via-point detour search (findClearRoute) only when the traveler actually
  // asks for it, keeping the initial route lookup fast in the common case.
  // If the best detour still crosses a zone, it's shown honestly rather than
  // claimed as fully avoided.
  async function exploreAlternativeRoutes() {
    if (!route || !destination) return;
    setZoneModal({ stage: "searching" });
    try {
      const origin = liveCoords ?? coords ?? UJJAIN_FALLBACK;
      const better = await findClearRoute(origin, route.destination, zones);
      setRoute(better);
      mapRef.current?.setDestination(better.destination.lat, better.destination.lng, destination.placeName);
      mapRef.current?.drawRoute(better.coordinates);
      const stillWorst = worstZone(better.crossedZones);
      setZoneModal({
        stage: "result",
        cleared: !stillWorst,
        message: stillWorst
          ? `We searched nearby roads but couldn't find one that fully avoids ${stillWorst.name} (${stillWorst.crowd_level} zone). Showing the best available option.`
          : "Found a route that avoids the marked crowd zones.",
      });
    } catch {
      setZoneModal({ stage: "result", cleared: false, message: "Couldn't search for an alternative route right now. Please try again." });
    }
  }

  function startNavigation() {
    if (!route || route.steps.length === 0) return;
    mapRef.current?.recenterOnUser();
    setStepIndex(0);
    setArrived(false);
    setNavigating(true);
  }

  function recenter() {
    mapRef.current?.recenterOnUser();
  }

  function clearSearch() {
    setQuery("");
    setResults([]);
  }

  function stopNavigation() {
    setNavigating(false);
    setArrived(false);
  }

  function clearRoute() {
    stopNavigation();
    setDestination(null);
    setRoute(null);
    setQuery("");
    mapRef.current?.clearRoute();
  }

  const currentStep = route?.steps[stepIndex];
  const nextStep = route && stepIndex + 1 < route.steps.length ? route.steps[stepIndex + 1] : null;

  // Ambient "you are currently inside a crowd zone" state - only evaluated
  // against a real GPS fix, never the Ujjain fallback, so it can't falsely
  // warn before location resolves.
  const currentZoneWarning = useMemo(() => {
    const point = liveCoords ?? coords;
    return point ? worstZone(zonesContainingPoint(point, zones)) : null;
  }, [liveCoords, coords, zones]);

  return (
    <View style={styles.root}>
      <MapplsMapView
        ref={mapRef}
        initialLat={coords?.lat ?? UJJAIN_FALLBACK.lat}
        initialLng={coords?.lng ?? UJJAIN_FALLBACK.lng}
        navigating={navigating}
        zones={zones}
        parkingZones={parkingZones}
        facilities={facilities}
        onUserLocationUpdate={(location) => setLiveCoords({ lat: location.lat, lng: location.lng })}
      />

      {!navigating && (
        <SafeAreaView style={styles.topOverlay} pointerEvents="box-none">
          {currentZoneWarning && (
            <View
              style={[
                styles.zoneWarningBanner,
                currentZoneWarning.crowd_level === "red" ? styles.zoneWarningRed : styles.zoneWarningYellow,
              ]}
            >
              <WarningCircle size={16} color={colors.surface} weight="fill" />
              <Text style={styles.zoneWarningText}>
                {currentZoneWarning.crowd_level === "red"
                  ? `You're in a high-crowd zone (${currentZoneWarning.name}). Consider moving to a safer area.`
                  : `You're in a moderate-crowd zone (${currentZoneWarning.name}). Stay alert.`}
              </Text>
            </View>
          )}

          <View style={styles.searchBar}>
            <MagnifyingGlass size={19} color={colors.saffronDeep} />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search ghats, camps, help desks"
              placeholderTextColor={colors.muted2}
              value={query}
              onChangeText={setQuery}
            />
            {searching && <ActivityIndicator size="small" color={colors.saffronDeep} />}
            {!!query && (
              <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={16} color={colors.muted} weight="bold" />
              </TouchableOpacity>
            )}
          </View>

          {results.length > 0 && (
            <View style={styles.resultsCard}>
              {results.map((r) => (
                <TouchableOpacity key={r.eLoc} style={styles.resultRow} onPress={() => selectDestination(r)}>
                  <View style={styles.resultRowMain}>
                    <Text style={styles.resultName}>{r.placeName}</Text>
                    <Text style={styles.resultAddress} numberOfLines={1}>
                      {r.placeAddress}
                    </Text>
                  </View>
                  {(r.zoneCrowdLevel || r.distanceKm != null) && (
                    <View style={styles.resultRowSide}>
                      {r.zoneCrowdLevel && <CrowdBadge level={r.zoneCrowdLevel} />}
                      {r.distanceKm != null && <Text style={styles.resultDistance}>{formatDistance(r.distanceKm * 1000)}</Text>}
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {!query && (
            <View style={styles.badgeRow}>
              <View style={styles.miniBadge}>
                <CloudSlash size={14} color={colors.saffronDeep} weight="fill" />
                <Text style={styles.miniBadgeText}>Offline map ready</Text>
              </View>
              {locationError && (
                <View style={styles.miniBadge}>
                  <Text style={styles.miniBadgeText}>{locationError}</Text>
                </View>
              )}
            </View>
          )}

          {!query && zones.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.zoneStrip}>
              {zones.map((z) => (
                <View key={z.id} style={styles.zoneChip}>
                  <Text style={styles.zoneChipName}>{z.name}</Text>
                  <CrowdBadge level={z.crowd_level} />
                </View>
              ))}
            </ScrollView>
          )}
        </SafeAreaView>
      )}

      {navigating && currentStep && (
        <SafeAreaView style={styles.navBanner} pointerEvents="box-none">
          {currentZoneWarning && (
            <View
              style={[
                styles.zoneWarningBanner,
                styles.zoneWarningBannerNav,
                currentZoneWarning.crowd_level === "red" ? styles.zoneWarningRed : styles.zoneWarningYellow,
              ]}
            >
              <WarningCircle size={16} color={colors.surface} weight="fill" />
              <Text style={styles.zoneWarningText}>
                {currentZoneWarning.crowd_level === "red"
                  ? `High-crowd zone (${currentZoneWarning.name}). Consider an alternate stop.`
                  : `Moderate-crowd zone (${currentZoneWarning.name}). Stay alert.`}
              </Text>
            </View>
          )}
          <View style={styles.navRow}>
            <View style={styles.navCard}>
              {arrived ? (
                <Text style={styles.navInstruction}>You have arrived at {destination?.placeName}</Text>
              ) : (
                <>
                  <Text style={styles.navDistance}>{formatDistance(distanceToManeuverM)}</Text>
                  <Text style={styles.navInstruction}>{currentStep.instruction}</Text>
                  {nextStep && <Text style={styles.navNext}>Then {nextStep.instruction.toLowerCase()}</Text>}
                </>
              )}
            </View>
            <TouchableOpacity style={styles.exitButton} onPress={stopNavigation}>
              <X size={18} color={colors.surface} weight="bold" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}

      {!navigating && (route || routing) && (
        <View style={styles.bottomCard}>
          {routing ? (
            <ActivityIndicator color={colors.ink} />
          ) : (
            route && (
              <>
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeDuration}>{Math.round(route.durationMin)} min</Text>
                  <Text style={styles.routeDistance}>
                    {route.distanceKm.toFixed(1)} km · to {destination?.placeName}
                  </Text>
                </View>
                <TouchableOpacity style={styles.clearButton} onPress={clearRoute}>
                  <Text style={styles.clearButtonText}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navigateButton} onPress={startNavigation}>
                  <Text style={styles.navigateButtonText}>Start</Text>
                </TouchableOpacity>
              </>
            )
          )}
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.recenterButton,
          navigating
            ? styles.recenterButtonNavigating
            : route || routing
              ? styles.recenterButtonAboveCard
              : styles.recenterButtonDefault,
        ]}
        onPress={recenter}
      >
        <Crosshair size={22} color={colors.ink} weight="bold" />
      </TouchableOpacity>

      {!navigating && (
        <TouchableOpacity style={styles.saarthiButton} onPress={() => setSaarthiVisible(true)}>
          <Car size={18} color={colors.surface} weight="fill" />
          <Text style={styles.saarthiButtonText}>Saarthi</Text>
        </TouchableOpacity>
      )}

      <Modal visible={saarthiVisible} transparent animationType="slide" onRequestClose={() => setSaarthiVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={[styles.modalIconWrap, styles.modalIconTeal]}>
              <Car size={28} color={colors.surface} weight="fill" />
            </View>
            <Text style={styles.modalTitle}>Sinhastha Saarthi</Text>
            <Text style={styles.modalBody}>
              Tell us your vehicle and we&apos;ll guide you to the nearest available parking near your destination.
            </Text>

            <View style={styles.vehicleTypeGrid}>
              {VEHICLE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.type}
                  style={[styles.vehicleTypeChip, saarthiVehicleType === opt.type && styles.vehicleTypeChipActive]}
                  onPress={() => setSaarthiVehicleType(opt.type)}
                >
                  <Text
                    style={[styles.vehicleTypeChipText, saarthiVehicleType === opt.type && styles.vehicleTypeChipTextActive]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.vehicleNumberInput}
              placeholder="Vehicle number (e.g. MP09AB1234)"
              placeholderTextColor={colors.muted2}
              autoCapitalize="characters"
              value={saarthiVehicleNumber}
              onChangeText={setSaarthiVehicleNumber}
            />

            {saarthiSearching ? (
              <ActivityIndicator color={colors.pink} style={{ marginTop: 16 }} />
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.modalPrimaryButton, (!saarthiVehicleType || !saarthiVehicleNumber.trim()) && styles.modalPrimaryButtonDisabled]}
                  onPress={submitSaarthi}
                  disabled={!saarthiVehicleType || !saarthiVehicleNumber.trim()}
                >
                  <Text style={styles.modalPrimaryButtonText}>Find parking</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSecondaryButton} onPress={() => setSaarthiVisible(false)}>
                  <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={!!zoneModal} transparent animationType="fade" onRequestClose={() => setZoneModal(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {zoneModal?.stage === "warning" && (
              <>
                <View
                  style={[
                    styles.modalIconWrap,
                    zoneModal.severity === "red" ? styles.modalIconRed : styles.modalIconYellow,
                  ]}
                >
                  <WarningCircle size={30} color={colors.surface} weight="fill" />
                </View>
                <Text style={styles.modalTitle}>{zoneModal.title}</Text>
                <Text style={styles.modalBody}>{zoneModal.message}</Text>
                <TouchableOpacity style={styles.modalPrimaryButton} onPress={exploreAlternativeRoutes}>
                  <Text style={styles.modalPrimaryButtonText}>Explore alternative routes</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSecondaryButton} onPress={() => setZoneModal(null)}>
                  <Text style={styles.modalSecondaryButtonText}>Continue with this route</Text>
                </TouchableOpacity>
              </>
            )}

            {zoneModal?.stage === "searching" && (
              <>
                <ActivityIndicator color={colors.saffronDeep} size="large" style={{ marginBottom: 14 }} />
                <Text style={styles.modalTitle}>Looking for a clearer route…</Text>
              </>
            )}

            {zoneModal?.stage === "result" && (
              <>
                <View style={[styles.modalIconWrap, zoneModal.cleared ? styles.modalIconGreen : styles.modalIconYellow]}>
                  {zoneModal.cleared ? (
                    <Info size={30} color={colors.surface} weight="fill" />
                  ) : (
                    <WarningCircle size={30} color={colors.surface} weight="fill" />
                  )}
                </View>
                <Text style={styles.modalTitle}>{zoneModal.cleared ? "Route updated" : "No fully clear route found"}</Text>
                <Text style={styles.modalBody}>{zoneModal.message}</Text>
                <TouchableOpacity style={styles.modalPrimaryButton} onPress={() => setZoneModal(null)}>
                  <Text style={styles.modalPrimaryButtonText}>OK</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topOverlay: { position: "absolute", top: 0, left: 0, right: 0, padding: 16, gap: 10 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 999,
    shadowColor: colors.ink,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: 14.5, color: colors.ink, padding: 0 },
  resultsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: colors.ink,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultRowMain: { flex: 1, minWidth: 0 },
  resultRowSide: { alignItems: "flex-end", gap: 4 },
  resultDistance: { fontFamily: fonts.bodyMedium, fontSize: 11.5, color: colors.muted },
  resultName: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink },
  resultAddress: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 },
  badgeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  miniBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    elevation: 2,
  },
  miniBadgeText: { fontFamily: fonts.body, fontSize: 12, color: colors.ink },
  zoneWarningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    shadowColor: colors.ink,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  zoneWarningBannerNav: { marginBottom: 0 },
  zoneWarningRed: { backgroundColor: colors.redDeep },
  zoneWarningYellow: { backgroundColor: colors.yellowDeep },
  zoneWarningText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.surface },
  zoneStrip: { flexGrow: 0 },
  zoneChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    elevation: 2,
  },
  zoneChipName: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.ink },
  bottomCard: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 20,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: colors.ink,
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 6,
  },
  routeDuration: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  routeDistance: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted, marginTop: 2 },
  clearButton: { backgroundColor: colors.surfaceTint, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  clearButtonText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink },
  navigateButton: { backgroundColor: colors.saffron, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10 },
  navigateButtonText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.surface },
  navBanner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    padding: 16,
    gap: 10,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  navCard: {
    flex: 1,
    backgroundColor: colors.ink,
    borderRadius: 20,
    padding: 18,
    shadowColor: colors.ink,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  navDistance: { fontFamily: fonts.display, fontSize: 26, color: colors.brass },
  navInstruction: { fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.surface, marginTop: 4 },
  navNext: { fontFamily: fonts.body, fontSize: 12.5, color: "rgba(255,253,248,0.65)", marginTop: 8 },
  exitButton: {
    backgroundColor: colors.redDeep,
    borderRadius: 999,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
  recenterButton: {
    position: "absolute",
    right: 16,
    width: 46,
    height: 46,
    borderRadius: 999,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.ink,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  recenterButtonDefault: { bottom: 28 },
  recenterButtonAboveCard: { bottom: 108 },
  recenterButtonNavigating: { bottom: 28 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(27,33,64,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 26,
    alignItems: "center",
    shadowColor: colors.ink,
    shadowOpacity: 0.3,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  modalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalIconRed: { backgroundColor: colors.redDeep },
  modalIconYellow: { backgroundColor: colors.yellowDeep },
  modalIconGreen: { backgroundColor: colors.green },
  modalTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.ink, textAlign: "center" },
  modalBody: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 20,
  },
  modalPrimaryButton: {
    backgroundColor: colors.saffron,
    borderRadius: 14,
    paddingVertical: 13,
    width: "100%",
    alignItems: "center",
    marginTop: 20,
  },
  modalPrimaryButtonText: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: colors.surface },
  modalPrimaryButtonDisabled: { opacity: 0.45 },
  modalSecondaryButton: { paddingVertical: 13, width: "100%", alignItems: "center" },
  modalSecondaryButtonText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.muted },
  modalIconTeal: { backgroundColor: colors.pink },
  saarthiButton: {
    position: "absolute",
    left: 16,
    bottom: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.pink,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: colors.ink,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  saarthiButtonText: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.surface },
  vehicleTypeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    marginTop: 18,
  },
  vehicleTypeChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: colors.surfaceTint,
    borderWidth: 1,
    borderColor: colors.border,
  },
  vehicleTypeChipActive: { backgroundColor: colors.pink, borderColor: colors.pink },
  vehicleTypeChipText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink },
  vehicleTypeChipTextActive: { color: colors.surface },
  vehicleNumberInput: {
    width: "100%",
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
  },
});
