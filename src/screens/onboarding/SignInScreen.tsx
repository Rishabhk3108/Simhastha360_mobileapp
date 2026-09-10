import { useState } from "react";
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { loginPilgrim } from "../../api/pilgrims";
import { usePilgrim } from "../../pilgrim/PilgrimContext";
import { colors, fonts } from "../../theme";
import { TextInput } from "../../components/AppTextInput";
import type { OnboardingStackParamList } from "../../navigation/AppStack";

type Props = NativeStackScreenProps<OnboardingStackParamList, "SignIn">;

export function SignInScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [aadharNumber, setAadharNumber] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { setProfile } = usePilgrim();

  async function submit() {
    if (!aadharNumber || !password) {
      Alert.alert(t("signIn.missingTitle"), t("signIn.missingBody"));
      return;
    }
    setSubmitting(true);
    try {
      const profile = await loginPilgrim(aadharNumber, password);
      await setProfile(profile);
      navigation.replace("Main");
    } catch (err: any) {
      if (err.response?.status === 401) {
        Alert.alert(t("signIn.failedTitle"), t("signIn.failedBody"));
      } else if (!err.response) {
        Alert.alert(t("common.noConnectionTitle"), t("common.noConnectionBody"));
      } else {
        Alert.alert(t("signIn.errorTitle"), t("common.tryAgain"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>{t("signIn.title")}</Text>
      <Text style={styles.subtitle}>{t("signIn.subtitle")}</Text>

      <TextInput style={styles.input} placeholder={t("signIn.aadharPlaceholder")} value={aadharNumber} onChangeText={setAadharNumber} keyboardType="number-pad" maxLength={12} />
      <TextInput style={styles.input} placeholder={t("common.passwordPlaceholder")} value={password} onChangeText={setPassword} secureTextEntry />

      <TouchableOpacity style={styles.primaryButton} onPress={submit} disabled={submitting}>
        <Text style={styles.primaryButtonText}>{submitting ? t("signIn.submitting") : t("signIn.submit")}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg, padding: 24, justifyContent: "center", gap: 12 },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.ink },
  subtitle: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 13, backgroundColor: colors.surface, fontFamily: fonts.body },
  primaryButton: { backgroundColor: colors.ink, borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 8 },
  primaryButtonText: { fontFamily: fonts.bodyBold, color: colors.surface, fontSize: 15 },
});
