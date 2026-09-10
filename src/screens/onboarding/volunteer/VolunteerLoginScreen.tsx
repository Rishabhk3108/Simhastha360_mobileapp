import { useState } from "react";
import { ActivityIndicator, Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, fonts } from "../../../theme";
import { useAuth } from "../../../auth/AuthContext";
import { getMyVolunteerStatus } from "../../../api/volunteers";
import type { OnboardingStackParamList } from "../../../navigation/AppStack";

type Props = NativeStackScreenProps<OnboardingStackParamList, "VolunteerLogin">;

export function VolunteerLoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!phone.trim() || !password) return;
    setLoading(true);
    try {
      await login(phone.trim(), password);
      // The same status check that gates a fresh submission also gates every
      // subsequent login - a still-pending or rejected volunteer sees the
      // same screen again instead of slipping into the main app.
      const profile = await getMyVolunteerStatus();
      if (profile.status === "approved") {
        navigation.replace("Main");
      } else {
        navigation.replace("VolunteerStatus", {
          status: profile.status as "pending" | "rejected",
          reviewNote: profile.review_note,
          justSubmitted: false,
        });
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      Alert.alert(
        "Could not sign in",
        err.response?.status === 403
          ? "This account isn't registered as a volunteer."
          : detail ?? "Check your phone and password.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={styles.title}>Volunteer sign in</Text>
        <Text style={styles.subtitle}>Use the phone number and password from your volunteer application.</Text>

        <TextInput
          style={styles.input}
          placeholder="Phone number"
          placeholderTextColor={colors.muted2}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.muted2}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.primaryButton} onPress={submit} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.primaryButtonText}>Sign in</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
          <Text style={styles.backLinkText}>Back</Text>
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
