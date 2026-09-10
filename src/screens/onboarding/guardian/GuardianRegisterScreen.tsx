import { useState } from "react";
import { ActivityIndicator, Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { colors, fonts } from "../../../theme";
import { useAuth } from "../../../auth/AuthContext";
import { registerGuardian } from "../../../api/guardians";
import type { OnboardingStackParamList } from "../../../navigation/AppStack";

type Props = NativeStackScreenProps<OnboardingStackParamList, "GuardianRegister">;

export function GuardianRegisterScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!name.trim() || !phone.trim()) {
      Alert.alert(t("guardianRegister.missingTitle"), t("guardianRegister.missingBody"));
      return;
    }
    if (password.length < 8) {
      Alert.alert(t("guardianRegister.shortPasswordTitle"), t("guardianRegister.shortPasswordBody"));
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(t("guardianRegister.mismatchTitle"), t("guardianRegister.mismatchBody"));
      return;
    }
    setSubmitting(true);
    try {
      await registerGuardian(name.trim(), phone.trim(), password);
      await login(phone.trim(), password);
      navigation.replace("Main");
    } catch (err: any) {
      if (err.response?.status === 400) {
        Alert.alert(t("guardianRegister.existsTitle"), t("guardianRegister.existsBody"));
      } else if (!err.response) {
        Alert.alert(t("common.noConnectionTitle"), t("common.noConnectionBody"));
      } else {
        Alert.alert(t("guardianRegister.errorTitle"), t("common.tryAgain"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={styles.title}>{t("guardianRegister.title")}</Text>
        <Text style={styles.subtitle}>{t("guardianRegister.subtitle")}</Text>

        <TextInput
          style={styles.input}
          placeholder={t("guardianRegister.yourName")}
          placeholderTextColor={colors.muted2}
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder={t("common.phonePlaceholder")}
          placeholderTextColor={colors.muted2}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <TextInput
          style={styles.input}
          placeholder={t("common.passwordPlaceholder")}
          placeholderTextColor={colors.muted2}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder={t("common.confirmPasswordPlaceholder")}
          placeholderTextColor={colors.muted2}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.primaryButton} onPress={submit} disabled={submitting}>
          {submitting ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.primaryButtonText}>{t("common.register")}</Text>}
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
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.ink, textAlign: "center" },
  subtitle: { fontFamily: fonts.body, fontSize: 13.5, color: colors.muted, textAlign: "center", marginBottom: 10, lineHeight: 19 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 13, backgroundColor: colors.surface, fontFamily: fonts.body, fontSize: 14.5, color: colors.ink },
  primaryButton: { backgroundColor: colors.ink, borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 8 },
  primaryButtonText: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: colors.surface },
  backLink: { alignItems: "center", marginTop: 18 },
  backLinkText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.muted },
});
