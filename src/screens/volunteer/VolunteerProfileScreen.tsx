import { useCallback, useState } from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Star, Coins, LogOut } from "../../components/icons";
import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { PointsPill } from "../../components/PointsPill";
import { getMyVolunteerStatus, type VolunteerProfile } from "../../api/volunteers";
import { getMyPoints } from "../../api/tasks";
import { useAuth } from "../../auth/AuthContext";
import { colors, fonts } from "../../theme";
import type { PointsSummary } from "../../api/types";

export function VolunteerProfileScreen() {
  const { t } = useTranslation();
  const { name, logout } = useAuth();
  const navigation = useNavigation<any>();
  const [profile, setProfile] = useState<VolunteerProfile | null>(null);
  const [points, setPoints] = useState<PointsSummary | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function handleLogout() {
    await logout();
    navigation.getParent()?.reset({ index: 0, routes: [{ name: "RoleSelection" }] });
  }

  const load = useCallback(async () => {
    const [profileRes, pointsRes] = await Promise.all([getMyVolunteerStatus(), getMyPoints()]);
    setProfile(profileRes);
    setPoints(pointsRes);
    setInitialLoading(false);
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
    <Screen title={t("volunteerProfile.title")} refreshing={refreshing} onRefresh={onRefresh}>
      <PointsPill />

      {initialLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.ink} />
          <Text style={styles.value}>{t("volunteerProfile.loading")}</Text>
        </View>
      ) : (
        <>
          <Card>
            <View style={styles.avatarRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(name ?? "?").slice(0, 2).toUpperCase()}</Text>
              </View>
              <View>
                <Text style={styles.name}>{name}</Text>
                <Text style={styles.phone}>{profile?.phone}</Text>
              </View>
            </View>
          </Card>

          <View style={styles.statRow}>
            <Card style={styles.statCard}>
              <Star size={20} color={colors.brass} weight="fill" />
              <Text style={styles.statValue}>{profile?.rating != null ? profile.rating.toFixed(1) : "—"}</Text>
              <Text style={styles.statLabel}>{t("volunteerProfile.rating")}</Text>
            </Card>
            <Card style={styles.statCard}>
              <Coins size={20} color={colors.brass} />
              <Text style={styles.statValue}>{points?.total ?? 0}</Text>
              <Text style={styles.statLabel}>{t("volunteerProfile.totalPoints")}</Text>
            </Card>
          </View>

          <Card>
            <Text style={styles.sectionTitle}>{t("volunteerProfile.skills")}</Text>
            <Text style={styles.value}>{profile?.skills || "—"}</Text>
            <Text style={[styles.sectionTitle, { marginTop: 12 }]}>{t("volunteerProfile.languages")}</Text>
            <Text style={styles.value}>{profile?.languages || "—"}</Text>
          </Card>
        </>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut size={16} color={colors.redDeep} />
        <Text style={styles.logoutText}>{t("common.logOut")}</Text>
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { alignItems: "center", gap: 8, paddingVertical: 24 },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.tealTint,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.teal },
  name: { fontFamily: fonts.bodyBold, fontSize: 17, color: colors.ink },
  phone: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 2 },
  statRow: { flexDirection: "row", gap: 12 },
  statCard: { flex: 1, alignItems: "center", gap: 6, paddingVertical: 18 },
  statValue: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  statLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  sectionTitle: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  value: { fontFamily: fonts.body, fontSize: 14.5, color: colors.ink, marginTop: 4 },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    marginTop: 8,
  },
  logoutText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.redDeep },
});
