import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Coins } from "./icons";
import { getMyPoints } from "../api/tasks";
import { colors, fonts } from "../theme";

export function PointsPill() {
  const { t } = useTranslation();
  const [today, setToday] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getMyPoints()
        .then((summary) => {
          if (!cancelled) setToday(summary.today);
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }, []),
  );

  if (today === null) return null;

  return (
    <View style={styles.pill}>
      <Coins size={14} color={colors.brass} />
      <Text style={styles.text}>{t("pointsPill.today", { count: today })}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    backgroundColor: colors.ink,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
  },
  text: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.brass },
});
