import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import {
  MapView,
  Camera,
  UserLocation,
  PointAnnotation,
  ShapeSource,
  LineLayer,
  FillLayer,
  UserTrackingMode,
  type CameraRef,
} from "mappls-map-react-native";
import { colors, fonts } from "../theme";
import { circlePolygonLngLat } from "../utils/geoCircle";
import type { ParkingZone, Zone } from "../api/types";

function isParkingFull(z: ParkingZone): boolean {
  const capacity = z.capacity_two_wheeler + z.capacity_three_wheeler + z.capacity_four_wheeler + z.capacity_six_wheeler;
  const occupied = z.occupied_two_wheeler + z.occupied_three_wheeler + z.occupied_four_wheeler + z.occupied_six_wheeler;
  return capacity > 0 && occupied >= capacity;
}

// This package's coordinate arrays are always [lng, lat] (confirmed via the
// package's own Camera/MapView/GettingStarted docs) - the rest of the app
// works in {lat, lng} objects, so every boundary here converts explicitly.
type LngLat = [number, number];
const toLngLat = (lat: number, lng: number): LngLat => [lng, lat];

export interface MapplsMapHandle {
  setUserLocation: (lat: number, lng: number, recenter?: boolean) => void;
  setDestination: (lat: number, lng: number, label?: string) => void;
  drawRoute: (coordinates: { lat: number; lng: number }[]) => void;
  drawWalkRoute: (coordinates: { lat: number; lng: number }[]) => void;
  clearRoute: () => void;
  recenterOnUser: () => void;
}

interface Props {
  initialLat: number;
  initialLng: number;
  navigating?: boolean;
  zones?: Zone[];
  parkingZones?: ParkingZone[];
  onReady?: () => void;
  onUserLocationUpdate?: (location: { lat: number; lng: number; heading?: number }) => void;
}

const ZONE_COLORS = { red: colors.red, yellow: colors.yellow, green: colors.green } as const;

export const MapplsMapView = forwardRef<MapplsMapHandle, Props>(
  ({ initialLat, initialLng, navigating = false, zones = [], parkingZones = [], onReady, onUserLocationUpdate }, ref) => {
  const cameraRef = useRef<CameraRef>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followUser, setFollowUser] = useState(true);
  const [cameraEngaged, setCameraEngaged] = useState(true);
  const [destination, setDestinationState] = useState<{ coord: LngLat; label?: string } | null>(null);
  const [routeGeoJSON, setRouteGeoJSON] = useState<GeoJSON.Feature<GeoJSON.LineString> | null>(null);
  const [walkRouteGeoJSON, setWalkRouteGeoJSON] = useState<GeoJSON.Feature<GeoJSON.LineString> | null>(null);
  const lastRouteCoordsRef = useRef<{ lat: number; lng: number }[]>([]);

  const zonesGeoJSON = useMemo<GeoJSON.FeatureCollection<GeoJSON.Polygon>>(
    () => ({
      type: "FeatureCollection",
      features: zones.map((z) => ({
        type: "Feature",
        properties: { crowd_level: z.crowd_level, name: z.name },
        geometry: {
          type: "Polygon",
          coordinates: [circlePolygonLngLat({ lat: z.center_lat, lng: z.center_lng }, z.radius_m)],
        },
      })),
    }),
    [zones],
  );

  function fitBoundsTo(coordinates: { lat: number; lng: number }[]) {
    const lats = coordinates.map((c) => c.lat);
    const lngs = coordinates.map((c) => c.lng);
    const ne: LngLat = [Math.max(...lngs), Math.max(...lats)];
    const sw: LngLat = [Math.min(...lngs), Math.min(...lats)];
    cameraRef.current?.fitBounds(ne, sw, 80, 1000);
  }

  useImperativeHandle(ref, () => ({
    setUserLocation: (lat, lng, recenter = false) => {
      if (recenter && followUser) {
        cameraRef.current?.setCamera({
          centerCoordinate: toLngLat(lat, lng),
          zoomLevel: 15,
          animationDuration: 800,
        });
      }
    },
    setDestination: (lat, lng, label) => {
      const coord = toLngLat(lat, lng);
      setDestinationState({ coord, label });
      setFollowUser(false);
      cameraRef.current?.setCamera({ centerCoordinate: coord, zoomLevel: 15, animationDuration: 800 });
    },
    drawRoute: (coordinates) => {
      if (coordinates.length === 0) return;
      lastRouteCoordsRef.current = coordinates;
      setWalkRouteGeoJSON(null);
      const coords = coordinates.map((c) => toLngLat(c.lat, c.lng));
      setRouteGeoJSON({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } });
      fitBoundsTo(coordinates);
    },
    // The "last mile" leg from a parking spot to the traveler's actual
    // destination. Fits the camera over both legs combined (not just the
    // walk segment) so switching to this doesn't zoom away from the drive
    // route already on screen.
    drawWalkRoute: (coordinates) => {
      if (coordinates.length === 0) return;
      const coords = coordinates.map((c) => toLngLat(c.lat, c.lng));
      setWalkRouteGeoJSON({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } });
      fitBoundsTo([...lastRouteCoordsRef.current, ...coordinates]);
    },
    clearRoute: () => {
      setDestinationState(null);
      setRouteGeoJSON(null);
      setWalkRouteGeoJSON(null);
      lastRouteCoordsRef.current = [];
      setFollowUser(true);
    },
    // Deliberately does not take coordinates: relaying a lat/lng through JS
    // can lag behind the native module's own GPS feed (the same feed
    // driving the visible blue dot), landing the camera just off from the
    // pointer. Toggling `followUserLocation` off then back on instead forces
    // the native follow behavior to re-engage and snap to whatever position
    // it already has internally - guaranteed to match the dot exactly. A
    // plain state flip is not enough when followUserLocation was already
    // true (e.g. re-tapping recenter without having panned away), so a
    // separate "engaged" flag is toggled to guarantee a real prop change.
    recenterOnUser: () => {
      setFollowUser(true);
      setCameraEngaged(false);
      requestAnimationFrame(() => setCameraEngaged(true));
    },
  }));

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        zoomEnabled
        scrollEnabled
        pitchEnabled
        rotateEnabled
        onDidFinishLoadingMap={() => {
          setLoading(false);
          onReady?.();
        }}
        onDidFailLoadingMap={() => {
          setLoading(false);
          setError("Could not load the map. Check your connection and try again.");
        }}
        onMapError={(err) => {
          setLoading(false);
          setError(err?.message ?? "Map failed to load.");
        }}
      >
        <Camera
          ref={cameraRef}
          defaultSettings={{ centerCoordinate: toLngLat(initialLat, initialLng), zoomLevel: 14 }}
          followUserLocation={(navigating || followUser) && cameraEngaged}
          followUserMode={navigating ? UserTrackingMode.FollowWithCourse : UserTrackingMode.Follow}
          followZoomLevel={navigating ? 18 : 15}
          followPitch={navigating ? 55 : 0}
        />

        <UserLocation
          visible
          renderMode="native"
          showsUserHeadingIndicator
          androidRenderMode="gps"
          onUpdate={(location) => {
            onUserLocationUpdate?.({
              lat: location.coords.latitude,
              lng: location.coords.longitude,
              heading: location.coords.heading ?? undefined,
            });
          }}
        />

        {zonesGeoJSON.features.length > 0 && (
          <ShapeSource id="zonesSource" shape={zonesGeoJSON}>
            <FillLayer
              id="zonesFill"
              style={{
                fillColor: ["match", ["get", "crowd_level"], "red", ZONE_COLORS.red, "yellow", ZONE_COLORS.yellow, ZONE_COLORS.green],
                fillOpacity: 0.28,
                fillOutlineColor: ["match", ["get", "crowd_level"], "red", ZONE_COLORS.red, "yellow", ZONE_COLORS.yellow, ZONE_COLORS.green],
              }}
            />
          </ShapeSource>
        )}

        {parkingZones.map((z) => (
          <PointAnnotation
            key={`parking-${z.id}`}
            id={`parking-${z.id}`}
            coordinate={toLngLat(z.center_lat, z.center_lng)}
            title={z.name}
          >
            <View style={[styles.parkingBadge, isParkingFull(z) && styles.parkingBadgeFull]}>
              <Text style={styles.parkingBadgeText}>P</Text>
            </View>
          </PointAnnotation>
        ))}

        {destination && (
          <PointAnnotation
            id="destination"
            coordinate={destination.coord}
            title={destination.label}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={styles.pin}>
              <View style={styles.pinHead} />
              <View style={styles.pinTail} />
            </View>
          </PointAnnotation>
        )}

        {routeGeoJSON && (
          <ShapeSource id="routeSource" shape={routeGeoJSON}>
            <LineLayer
              id="routeLine"
              style={{ lineColor: colors.saffron, lineWidth: 5, lineCap: "round", lineJoin: "round" }}
            />
          </ShapeSource>
        )}

        {walkRouteGeoJSON && (
          <ShapeSource id="walkRouteSource" shape={walkRouteGeoJSON}>
            <LineLayer
              id="walkRouteLine"
              style={{
                lineColor: colors.yellow,
                lineWidth: 4,
                lineCap: "round",
                lineJoin: "round",
                lineDasharray: [1, 1.5],
              }}
            />
          </ShapeSource>
        )}
      </MapView>

      {loading && !error && (
        <View style={styles.overlay}>
          <ActivityIndicator color={colors.ink} size="large" />
        </View>
      )}
      {error && (
        <View style={styles.overlay}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, borderRadius: 20, overflow: "hidden" },
  map: { flex: 1, backgroundColor: "#EFE7D6" },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#EFE7D6",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 14,
  },
  errorText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.redDeep, textAlign: "center" },
  pin: { alignItems: "center" },
  pinHead: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.saffron,
    borderWidth: 2.5,
    borderColor: colors.surface,
    elevation: 4,
  },
  pinTail: {
    width: 0,
    height: 0,
    marginTop: -3,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: colors.saffron,
  },
  parkingBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.pink,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  parkingBadgeFull: { backgroundColor: colors.redDeep },
  parkingBadgeText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.surface },
});
