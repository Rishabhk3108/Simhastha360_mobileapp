import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { colors, fonts } from "../../theme";
import type { OnboardingStackParamList } from "../../navigation/AppStack";

type Props = NativeStackScreenProps<OnboardingStackParamList, "RoleSelection">;

export function RoleSelectionScreen({ navigation }: Props) {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={styles.title}>{t("roleSelection.title")}</Text>
        <Text style={styles.subtitle}>{t("roleSelection.subtitle")}</Text>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("AccountCheck")}>
          <Ionicons name="walk-outline" size={28} color={colors.saffronDeep} />
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{t("roleSelection.pilgrimTitle")}</Text>
            <Text style={styles.cardSubtitle}>{t("roleSelection.pilgrimSubtitle")}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("GuardianEntry")}>
          <Ionicons name="people-outline" size={28} color={colors.teal} />
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{t("roleSelection.guardianTitle")}</Text>
            <Text style={styles.cardSubtitle}>{t("roleSelection.guardianSubtitle")}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("VolunteerEntry")}>
          <Ionicons name="hand-left-outline" size={28} color={colors.teal} />
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{t("roleSelection.volunteerTitle")}</Text>
            <Text style={styles.cardSubtitle}>{t("roleSelection.volunteerSubtitle")}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("ForeignerEntry")}>
          <Ionicons name="airplane-outline" size={28} color={colors.brass} />
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{t("roleSelection.foreignGuestTitle")}</Text>
            <Text style={styles.cardSubtitle}>{t("roleSelection.foreignGuestSubtitle")}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, padding: 24, justifyContent: "center", gap: 14 },
  title: { fontFamily: fonts.display, fontSize: 26, color: colors.ink, textAlign: "center" },
  subtitle: { fontFamily: fonts.body, fontSize: 13.5, color: colors.muted, textAlign: "center", marginBottom: 14 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  cardSubtitle: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 },
});
