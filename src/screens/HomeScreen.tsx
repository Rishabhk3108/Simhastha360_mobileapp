import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MagnifyingGlass, CloudSlash } from "../components/icons";
import { MapplsMapView, type MapplsMapHandle } from "../components/MapplsMapView";
import { searchPlaces, getDirections, type PlaceResult, type RouteResult } from "../api/mappls";
import { api } from "../api/client";
import { useLocation } from "../location/useLocation";
import { CrowdBadge } from "../components/CrowdBadge";
import { colors, fonts } from "../theme";
import type { Zone } from "../api/types";

const UJJAIN_FALLBACK = { lat: 23.1815, lng: 75.7684 };

export function HomeScreen() {
  const { coords, error: locationError } = useLocation();
  const mapRef = useRef<MapplsMapHandle>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [destination, setDestination] = useState<PlaceResult | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [routing, setRouting] = useState(false);

  const loadZones = useCallback(async () => {
    try {
      const { data } = await api.get<Zone[]>("/zones");
      setZones(data);
    } catch {
      // non-critical for the map itself
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadZones();
    }, [loadZones]),
  );

  useEffect(() => {
    if (coords) mapRef.current?.setUserLocation(coords.lat, coords.lng, !destination);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const found = await searchPlaces(query);
        setResults(found);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 450);
    return () => clearTimeout(timeout);
  }, [query]);

  async function selectDestination(place: PlaceResult) {
    setQuery(place.placeName);
    setResults([]);
    setDestination(place);
    mapRef.current?.setDestination(place.lat, place.lng, place.placeName);

    const origin = coords ?? UJJAIN_FALLBACK;
    setRouting(true);
    try {
      const result = await getDirections(origin, { lat: place.lat, lng: place.lng });
      setRoute(result);
      mapRef.current?.drawRoute(result.coordinates);
    } catch {
      Alert.alert("Could not get directions", "Please try again.");
    } finally {
      setRouting(false);
    }
  }

  function clearRoute() {
    setDestination(null);
    setRoute(null);
    setQuery("");
    mapRef.current?.clearRoute();
  }

  return (
    <View style={styles.root}>
      <MapplsMapView ref={mapRef} initialLat={coords?.lat ?? UJJAIN_FALLBACK.lat} initialLng={coords?.lng ?? UJJAIN_FALLBACK.lng} />

      <SafeAreaView style={styles.topOverlay} pointerEvents="box-none">
        <View style={styles.searchBar}>
          <MagnifyingGlass size={19} color={colors.saffronDeep} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search ghats, camps, help desks"
            placeholderTextColor={colors.muted2}
            value={query}
            onChangeText={setQuery}
          />
          {searching && <ActivityIndicator size="small" color={colors.saffronDeep} />}
        </View>

        {results.length > 0 && (
          <View style={styles.resultsCard}>
            {results.map((r) => (
              <TouchableOpacity key={r.eLoc} style={styles.resultRow} onPress={() => selectDestination(r)}>
                <Text style={styles.resultName}>{r.placeName}</Text>
                <Text style={styles.resultAddress} numberOfLines={1}>
                  {r.placeAddress}
                </Text>
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

      {(route || routing) && (
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
              </>
            )
          )}
        </View>
      )}
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
  resultRow: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
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
});
