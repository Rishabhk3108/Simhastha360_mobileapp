import { useState } from "react";
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { PilgrimFieldsSection } from "./PilgrimFieldsSection";
import { emptyPilgrimFields } from "./types";
import { registerPilgrim } from "../../api/pilgrims";
import { usePilgrim } from "../../pilgrim/PilgrimContext";
import { colors, fonts } from "../../theme";
import type { OnboardingStackParamList } from "../../navigation/AppStack";

type Props = NativeStackScreenProps<OnboardingStackParamList, "PilgrimRegister">;

export function PilgrimRegisterScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [pilgrim, setPilgrim] = useState(emptyPilgrimFields);
  const [passwordValid, setPasswordValid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { setProfile } = usePilgrim();

  async function submit() {
    if (!pilgrim.name || !pilgrim.phone || !pilgrim.aadharNumber || !pilgrim.age || !pilgrim.addressLine1 || !pilgrim.city || !pilgrim.state || !pilgrim.pincode) {
      Alert.alert(t("pilgrimRegister.missingTitle"), t("pilgrimRegister.missingBody"));
      return;
    }
    if (!passwordValid) {
      Alert.alert(t("pilgrimRegister.passwordRequiredTitle"), t("pilgrimRegister.passwordRequiredBody"));
      return;
    }
    setSubmitting(true);
    try {
      const result = await registerPilgrim(pilgrim);
      await setProfile({ pilgrimId: result.pilgrim_id, pilgrim });
      navigation.replace("Main");
    } catch (err: any) {
      if (err.code === "ECONNABORTED") {
        Alert.alert(t("pilgrimRegister.timeoutTitle"), t("pilgrimRegister.timeoutBody"));
      } else if (err.response?.status === 409) {
        Alert.alert(t("pilgrimRegister.existsTitle"), t("pilgrimRegister.existsBody"));
      } else if (err.response?.status === 422) {
        Alert.alert(t("pilgrimRegister.invalidTitle"), t("pilgrimRegister.invalidBody"));
      } else if (!err.response) {
        Alert.alert(t("common.noConnectionTitle"), t("common.noConnectionBody"));
      } else {
        Alert.alert(t("pilgrimRegister.errorTitle"), t("common.tryAgain"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t("pilgrimRegister.title")}</Text>
        <Text style={styles.subtitle}>{t("pilgrimRegister.subtitle")}</Text>

        <PilgrimFieldsSection values={pilgrim} onChange={setPilgrim} onPasswordValidityChange={setPasswordValid} title={t("pilgrimRegister.sectionTitle")} />

        <TouchableOpacity style={styles.submitButton} onPress={submit} disabled={submitting}>
          <Text style={styles.submitButtonText}>{submitting ? t("pilgrimRegister.submitting") : t("pilgrimRegister.submit")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.ink },
  subtitle: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: -8, marginBottom: 6 },
  submitButton: { backgroundColor: colors.ink, borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 10 },
  submitButtonText: { fontFamily: fonts.bodyBold, color: colors.surface, fontSize: 15 },
});
