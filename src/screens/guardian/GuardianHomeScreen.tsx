import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { WarningCircle, UsersThree } from "../../components/icons";
import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { CrowdBadge } from "../../components/CrowdBadge";
import { ScanPilgrimModal } from "../../components/ScanPilgrimModal";
import { getMyLinkedPilgrims, type LinkedPilgrim } from "../../api/guardians";
import { colors, fonts } from "../../theme";

const POLL_INTERVAL_MS = 20000;

function timeAgo(iso: string | null): string {
  if (!iso) return "No update yet";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.floor(hours / 24)} d ago`;
}

export function GuardianHomeScreen() {
  const [pilgrims, setPilgrims] = useState<LinkedPilgrim[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);

  const load = useCallback(async () => {
    const data = await getMyLinkedPilgrims();
    setPilgrims(data);
    setInitialLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      const interval = setInterval(load, POLL_INTERVAL_MS);
      return () => clearInterval(interval);
    }, [load]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <Screen title="My people" subtitle="Live safety updates for the family members you're tracking" refreshing={refreshing} onRefresh={onRefresh}>
      <TouchableOpacity style={styles.addButton} onPress={() => setScannerVisible(true)}>
        <UsersThree size={18} color={colors.surface} weight="fill" />
        <Text style={styles.addButtonText}>Add member</Text>
      </TouchableOpacity>

      {initialLoading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.ink} />
        </View>
      )}

      {!initialLoading &&
        pilgrims.map((p) => (
          <Card key={p.pilgrim_id} style={p.has_active_sos ? styles.sosCard : undefined}>
            <View style={styles.row}>
              {p.photo_base64 ? (
                <Image source={{ uri: p.photo_base64 }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarInitial}>{p.name.slice(0, 1).toUpperCase()}</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{p.name}</Text>
                <Text style={styles.muted}>
                  {p.age != null ? `Age ${p.age} · ` : ""}
                  {timeAgo(p.location_updated_at)}
                </Text>
              </View>
              {p.crowd_level && <CrowdBadge level={p.crowd_level} />}
            </View>

            {p.has_active_sos && (
              <View style={styles.sosBanner}>
                <WarningCircle size={16} color={colors.surface} weight="fill" />
                <Text style={styles.sosBannerText}>Active SOS alert</Text>
              </View>
            )}

            {p.zone_name && <Text style={styles.zoneText}>Near {p.zone_name}</Text>}
          </Card>
        ))}

      {!initialLoading && pilgrims.length === 0 && (
        <Text style={styles.muted}>
          No one added yet. Tap "Add member" and scan the QR code from the pilgrim's profile screen.
        </Text>
      )}

      <ScanPilgrimModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onLinked={() => {
          setScannerVisible(false);
          load();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { alignItems: "center", paddingVertical: 24 },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.ink,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 4,
  },
  addButtonText: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: colors.surface },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  avatarPlaceholder: { backgroundColor: colors.saffron, alignItems: "center", justifyContent: "center" },
  avatarInitial: { fontFamily: fonts.bodyBold, fontSize: 18, color: colors.surface },
  name: { fontFamily: fonts.bodyBold, fontSize: 15.5, color: colors.ink },
  muted: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted, marginTop: 2 },
  zoneText: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted, marginTop: 8 },
  sosCard: { borderColor: colors.redDeep, borderWidth: 1.5 },
  sosBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.redDeep,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 10,
  },
  sosBannerText: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: colors.surface },
});
