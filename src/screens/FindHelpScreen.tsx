import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Crosshair, FirstAidKit, Drop, Info, Toilet, NavigationArrow } from "../components/icons";
import { api } from "../api/client";
import { Screen } from "../components/Screen";
import { Card } from "../components/Card";
import { useLocation } from "../location/useLocation";
import { haversineKm } from "../location/geo";
import { colors, fonts } from "../theme";
import type { Facility, FacilityType } from "../api/types";

const FILTERS: { label: string; value: FacilityType | null }[] = [
  { label: "All", value: null },
  { label: "Medical", value: "medical" },
  { label: "Toilets", value: "toilet" },
  { label: "Water", value: "water" },
  { label: "Help Desk", value: "help_desk" },
];

const FACILITY_ICON: Record<FacilityType, { Icon: typeof FirstAidKit; color: string; bg: string }> = {
  medical: { Icon: FirstAidKit, color: colors.teal, bg: colors.tealTint },
  toilet: { Icon: Toilet, color: colors.muted, bg: "rgba(27,33,64,0.07)" },
  water: { Icon: Drop, color: colors.teal, bg: colors.tealTint },
  help_desk: { Icon: Info, color: colors.saffronDeep, bg: "rgba(169,114,44,0.12)" },
  parking: { Icon: Info, color: colors.saffronDeep, bg: "rgba(169,114,44,0.12)" },
};

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
    <Screen title="Find help" refreshing={refreshing} onRefresh={onRefresh}>
      <View style={styles.locationRow}>
        <Crosshair size={14} color={colors.tealDeep} weight="fill" />
        <Text style={styles.locationText}>My location</Text>
      </View>

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
        {sorted.map((f) => {
          const { Icon, color, bg } = FACILITY_ICON[f.type];
          return (
            <Card key={f.id} style={styles.facilityCard}>
              <View style={[styles.iconWrap, { backgroundColor: bg }]}>
                <Icon size={22} color={color} weight="fill" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{f.name}</Text>
                <Text style={styles.muted}>
                  {f.type.replace("_", " ")}
                  {coords ? ` · ${haversineKm(coords.lat, coords.lng, f.lat, f.lng).toFixed(1)} km away` : ""}
                </Text>
              </View>
              <NavigationArrow size={20} color={colors.saffronDeep} />
            </Card>
          );
        })}
        {sorted.length === 0 && <Text style={styles.muted}>No facilities found for this filter.</Text>}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: colors.tealTint,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    marginBottom: 4,
  },
  locationText: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.tealDeep },
  filterRow: { marginBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginRight: 8 },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontFamily: fonts.bodyMedium, color: colors.ink, fontSize: 13 },
  chipTextActive: { color: colors.surface },
  facilityCard: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconWrap: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  name: { fontFamily: fonts.bodyMedium, fontSize: 15.5, color: colors.ink },
  muted: { fontFamily: fonts.body, color: colors.muted, marginTop: 2, fontSize: 12.5 },
});
