import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { StyleSheet, Text, View } from "react-native";
import { MagnifyingGlass, MapTrifold, CloudSlash } from "../components/icons";
import { api } from "../api/client";
import { Screen } from "../components/Screen";
import { Card } from "../components/Card";
import { CrowdBadge } from "../components/CrowdBadge";
import { colors, fonts } from "../theme";
import type { Zone } from "../api/types";

export function HomeScreen() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await api.get<Zone[]>("/zones");
    setZones(data);
  }, []);

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

  return (
    <Screen title="Live crowd status" subtitle="Ujjain Simhastha 2028" refreshing={refreshing} onRefresh={onRefresh}>
      <View style={styles.searchBar}>
        <MagnifyingGlass size={19} color={colors.saffronDeep} />
        <Text style={styles.searchText}>Search ghats, camps, help desks</Text>
      </View>

      <View style={styles.badgeRow}>
        <View style={styles.miniBadge}>
          <CloudSlash size={14} color={colors.saffronDeep} weight="fill" />
          <Text style={styles.miniBadgeText}>Offline map ready</Text>
        </View>
      </View>

      <View style={styles.mapPlaceholder}>
        <View style={styles.mapPlaceholderNote}>
          <MapTrifold size={14} color={colors.muted2} />
          <Text style={styles.mapPlaceholderText}>Map view — Mappls SDK integration point</Text>
        </View>
        <View style={{ gap: 8, marginTop: 10 }}>
          {zones.map((z) => (
            <View key={z.id} style={styles.zonePill}>
              <Text style={styles.zoneName}>{z.name}</Text>
              <CrowdBadge level={z.crowd_level} />
            </View>
          ))}
          {zones.length === 0 && <Text style={styles.muted}>No zone data available yet.</Text>}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 999,
    shadowColor: colors.ink,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  searchText: { fontFamily: fonts.body, fontSize: 14.5, color: colors.muted2 },
  badgeRow: { flexDirection: "row", gap: 8 },
  miniBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  miniBadgeText: { fontFamily: fonts.body, fontSize: 12, color: colors.ink },
  mapPlaceholder: {
    borderRadius: 20,
    backgroundColor: "#EFE7D6",
    padding: 16,
    minHeight: 200,
  },
  mapPlaceholderNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,253,248,0.85)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  mapPlaceholderText: { fontFamily: fonts.body, fontSize: 12, color: colors.muted2 },
  zonePill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  zoneName: { fontFamily: fonts.bodyMedium, fontSize: 14.5, color: colors.ink },
  muted: { fontFamily: fonts.body, color: colors.muted },
});
