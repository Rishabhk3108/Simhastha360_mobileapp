import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { colors, fonts } from "../../theme";
import type { OnboardingStackParamList } from "../../navigation/AppStack";

type Props = NativeStackScreenProps<OnboardingStackParamList, "AccountCheck">;

export function AccountCheckScreen({ navigation }: Props) {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="person-circle-outline" size={40} color={colors.saffronDeep} />
        </View>
        <Text style={styles.title}>{t("accountCheck.title")}</Text>
        <Text style={styles.subtitle}>{t("accountCheck.subtitle")}</Text>

        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate("SignIn")}>
          <Text style={styles.primaryButtonText}>{t("accountCheck.yes")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate("PilgrimRegister")}>
          <Text style={styles.secondaryButtonText}>{t("accountCheck.no")}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, padding: 24, justifyContent: "center", gap: 12, alignItems: "center" },
  iconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(169,114,44,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.ink, textAlign: "center" },
  subtitle: { fontFamily: fonts.body, fontSize: 13.5, color: colors.muted, textAlign: "center", marginBottom: 14 },
  primaryButton: { backgroundColor: colors.ink, borderRadius: 12, paddingVertical: 15, alignItems: "center", width: "100%" },
  primaryButtonText: { fontFamily: fonts.bodyBold, color: colors.surface, fontSize: 15 },
  secondaryButton: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 15, alignItems: "center", width: "100%" },
  secondaryButtonText: { fontFamily: fonts.bodyMedium, color: colors.ink, fontSize: 15 },
});
