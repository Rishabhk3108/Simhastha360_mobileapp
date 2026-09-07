import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { StyleSheet, Text, View } from "react-native";
import { api } from "../api/client";
import { Screen } from "../components/Screen";
import { Card } from "../components/Card";
import { CrowdBadge } from "../components/CrowdBadge";
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
    <Screen title="Live Crowd Status" refreshing={refreshing} onRefresh={onRefresh}>
      <View style={{ gap: 10 }}>
        {zones.map((z) => (
          <Card key={z.id}>
            <View style={styles.row}>
              <Text style={styles.zoneName}>{z.name}</Text>
              <CrowdBadge level={z.crowd_level} />
            </View>
          </Card>
        ))}
        {zones.length === 0 && <Text style={styles.muted}>No zone data available yet.</Text>}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  zoneName: { fontSize: 16, fontWeight: "600", color: "#1c2733" },
  muted: { color: "#667080" },
});
