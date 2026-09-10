import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Bell } from "../../components/icons";
import { Screen } from "../../components/Screen";
import { Card } from "../../components/Card";
import { PointsPill } from "../../components/PointsPill";
import { getMyNotifications, markNotificationRead } from "../../api/notifications";
import { colors, fonts } from "../../theme";
import type { AppNotification } from "../../api/types";

export function VolunteerNotificationsScreen() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setNotifications(await getMyNotifications());
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

  async function onOpen(n: AppNotification) {
    if (n.read) return;
    const updated = await markNotificationRead(n.id);
    setNotifications((list) => list.map((x) => (x.id === updated.id ? updated : x)));
  }

  return (
    <Screen title={t("volunteerNotifications.title")} refreshing={refreshing} onRefresh={onRefresh}>
      <PointsPill />
      {initialLoading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.ink} />
          <Text style={styles.muted}>{t("common.loading")}</Text>
        </View>
      )}
      {!initialLoading && notifications.map((n) => (
        <TouchableOpacity key={n.id} onPress={() => onOpen(n)} activeOpacity={0.7}>
          <Card style={n.read ? undefined : styles.unreadCard}>
            <View style={styles.row}>
              <Bell size={16} color={n.read ? colors.muted : colors.saffronDeep} weight={n.read ? undefined : "fill"} />
              <Text style={[styles.title, !n.read && styles.unreadTitle]}>{n.title}</Text>
              {!n.read && <View style={styles.dot} />}
            </View>
            <Text style={styles.body}>{n.body}</Text>
            <Text style={styles.time}>{new Date(n.created_at).toLocaleString()}</Text>
          </Card>
        </TouchableOpacity>
      ))}
      {!initialLoading && notifications.length === 0 && <Text style={styles.muted}>{t("volunteerNotifications.empty")}</Text>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { alignItems: "center", gap: 8, paddingVertical: 24 },
  unreadCard: { borderColor: colors.saffron, borderWidth: 1.5 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontFamily: fonts.bodyMedium, fontSize: 14.5, color: colors.ink, flex: 1 },
  unreadTitle: { fontFamily: fonts.bodyBold },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.saffron },
  body: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 6, lineHeight: 18 },
  time: { fontFamily: fonts.body, fontSize: 11, color: colors.faint, marginTop: 8 },
  muted: { fontFamily: fonts.body, color: colors.muted },
});
