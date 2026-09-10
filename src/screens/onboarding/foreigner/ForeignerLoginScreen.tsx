import { useState } from "react";
import { ActivityIndicator, Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { colors, fonts } from "../../../theme";
import { loginForeigner } from "../../../api/pilgrims";
import { usePilgrim } from "../../../pilgrim/PilgrimContext";
import type { OnboardingStackParamList } from "../../../navigation/AppStack";

type Props = NativeStackScreenProps<OnboardingStackParamList, "ForeignerLogin">;

export function ForeignerLoginScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { setProfile } = usePilgrim();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!phone.trim() || !password) return;
    setLoading(true);
    try {
      const profile = await loginForeigner(phone.trim(), password);
      await setProfile(profile);
      navigation.replace("ForeignerWelcome");
    } catch (err: any) {
      Alert.alert(t("foreignerLogin.failedTitle"), err.response?.data?.detail ?? t("guardianLogin.checkCredentials"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={styles.title}>{t("foreignerLogin.title")}</Text>
        <Text style={styles.subtitle}>{t("foreignerLogin.subtitle")}</Text>

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

        <TouchableOpacity style={styles.primaryButton} onPress={submit} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.primaryButtonText}>{t("common.signIn")}</Text>}
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
  subtitle: { fontFamily: fonts.body, fontSize: 13.5, color: colors.muted, textAlign: "center", marginBottom: 10 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 13, backgroundColor: colors.surface, fontFamily: fonts.body, fontSize: 14.5, color: colors.ink },
  primaryButton: { backgroundColor: colors.ink, borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 8 },
  primaryButtonText: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: colors.surface },
  backLink: { alignItems: "center", marginTop: 18 },
  backLinkText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.muted },
});
