import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { api } from "../api/client";
import { Screen } from "../components/Screen";
import { Card } from "../components/Card";
import { useLocation } from "../location/useLocation";
import { haversineKm } from "../location/geo";
import type { Facility, FacilityType } from "../api/types";

const FILTERS: { label: string; value: FacilityType | null }[] = [
  { label: "All", value: null },
  { label: "Medical", value: "medical" },
  { label: "Toilets", value: "toilet" },
  { label: "Water", value: "water" },
  { label: "Help Desk", value: "help_desk" },
];

export function FindHelpScreen() {
  const { coords, error: locationError } = useLocation();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [filter, setFilter] = useState<FacilityType | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await api.get<Facility[]>("/facilities", { params: filter ? { type: filter } : {} });
    setFacilities(data);
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const sorted = coords
    ? [...facilities].sort(
        (a, b) => haversineKm(coords.lat, coords.lng, a.lat, a.lng) - haversineKm(coords.lat, coords.lng, b.lat, b.lng),
      )
    : facilities;

  return (
    <Screen title="Find Help" refreshing={refreshing} onRefresh={onRefresh}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.label}
            onPress={() => setFilter(f.value)}
            style={[styles.chip, filter === f.value && styles.chipActive]}
          >
            <Text style={[styles.chipText, filter === f.value && styles.chipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {locationError && <Text style={styles.muted}>{locationError}</Text>}

      <View style={{ gap: 10 }}>
        {sorted.map((f) => (
          <Card key={f.id}>
            <Text style={styles.name}>{f.name}</Text>
            <Text style={styles.muted}>{f.type.replace("_", " ")}</Text>
            {coords && <Text style={styles.muted}>{haversineKm(coords.lat, coords.lng, f.lat, f.lng).toFixed(1)} km away</Text>}
          </Card>
        ))}
        {sorted.length === 0 && <Text style={styles.muted}>No facilities found for this filter.</Text>}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterRow: { marginBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: "white", borderWidth: 1, borderColor: "#dde2e7", marginRight: 8 },
  chipActive: { backgroundColor: "#1d5fbf", borderColor: "#1d5fbf" },
  chipText: { color: "#1c2733", fontSize: 13 },
  chipTextActive: { color: "white" },
  name: { fontSize: 16, fontWeight: "600", color: "#1c2733" },
  muted: { color: "#667080", marginTop: 2 },
});
