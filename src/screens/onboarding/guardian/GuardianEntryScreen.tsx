import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { colors, fonts } from "../../../theme";
import type { OnboardingStackParamList } from "../../../navigation/AppStack";

type Props = NativeStackScreenProps<OnboardingStackParamList, "GuardianEntry">;

export function GuardianEntryScreen({ navigation }: Props) {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="people-outline" size={36} color={colors.surface} />
        </View>
        <Text style={styles.title}>{t("guardianEntry.title")}</Text>
        <Text style={styles.subtitle}>{t("guardianEntry.subtitle")}</Text>

        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate("GuardianLogin")}>
          <Text style={styles.primaryButtonText}>{t("guardianEntry.login")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate("GuardianRegister")}>
          <Text style={styles.secondaryButtonText}>{t("guardianEntry.register")}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
          <Text style={styles.backLinkText}>{t("common.back")}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, padding: 24, justifyContent: "center", gap: 12 },
  iconWrap: {
    alignSelf: "center",
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.teal,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.ink, textAlign: "center" },
  subtitle: { fontFamily: fonts.body, fontSize: 13.5, color: colors.muted, textAlign: "center", marginBottom: 16 },
  primaryButton: { backgroundColor: colors.ink, borderRadius: 14, paddingVertical: 15, alignItems: "center" },
  primaryButtonText: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: colors.surface },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 10,
    backgroundColor: colors.surface,
  },
  secondaryButtonText: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: colors.ink },
  backLink: { alignItems: "center", marginTop: 20 },
  backLinkText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.muted },
});
