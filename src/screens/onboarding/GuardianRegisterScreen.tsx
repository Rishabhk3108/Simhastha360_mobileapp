import { useState } from "react";
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { PilgrimFieldsSection } from "./PilgrimFieldsSection";
import { GuardianFieldsSection } from "./GuardianFieldsSection";
import { emptyGuardianFields, emptyPilgrimFields } from "./types";
import { registerPilgrim } from "../../api/pilgrims";
import { usePilgrim } from "../../pilgrim/PilgrimContext";
import { colors, fonts } from "../../theme";
import type { OnboardingStackParamList } from "../../navigation/AppStack";

type Props = NativeStackScreenProps<OnboardingStackParamList, "GuardianRegister">;

export function GuardianRegisterScreen({ navigation }: Props) {
  const [guardian, setGuardian] = useState(emptyGuardianFields);
  const [pilgrim, setPilgrim] = useState(emptyPilgrimFields);
  const [passwordValid, setPasswordValid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { setProfile } = usePilgrim();

  async function submit() {
    if (!guardian.name || !guardian.phone || !guardian.aadharNumber || !guardian.relationToPilgrim) {
      Alert.alert("Missing details", "Please fill in your name, phone, Aadhar number, and relation to the pilgrim.");
      return;
    }
    if (!pilgrim.name || !pilgrim.phone || !pilgrim.aadharNumber || !pilgrim.age || !pilgrim.addressLine1 || !pilgrim.city || !pilgrim.state || !pilgrim.pincode) {
      Alert.alert("Missing pilgrim details", "Please fill in the pilgrim's name, phone, Aadhar number, age, and address.");
      return;
    }
    if (!passwordValid) {
      Alert.alert("Password required", "Choose a password of at least 8 characters for the pilgrim, and confirm it.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await registerPilgrim({ registeredVia: "guardian", pilgrim, guardian });
      await setProfile({ pilgrimId: result.pilgrim_id, registeredVia: "guardian", pilgrim, guardian });
      navigation.replace("Main");
    } catch (err: any) {
      if (err.code === "ECONNABORTED") {
        Alert.alert("Taking too long", "The request timed out — check your connection and try again. A smaller photo helps too.");
      } else if (err.response?.status === 409) {
        Alert.alert("Account already exists", "An account with this Aadhar number already exists. Please sign in instead.");
      } else if (err.response?.status === 422) {
        Alert.alert("Missing or invalid details", "Please check every field is filled in correctly.");
      } else if (!err.response) {
        Alert.alert("No connection", "Couldn't reach the server. Check your internet connection and try again.");
      } else {
        Alert.alert("Could not register", "Something went wrong on the server. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Register as Guardian</Text>
        <Text style={styles.subtitle}>Your details, then the pilgrim you're registering on behalf of.</Text>

        <GuardianFieldsSection values={guardian} onChange={setGuardian} title="Your details" />
        <PilgrimFieldsSection values={pilgrim} onChange={setPilgrim} onPasswordValidityChange={setPasswordValid} title="Pilgrim's details" />

        <TouchableOpacity style={styles.submitButton} onPress={submit} disabled={submitting}>
          <Text style={styles.submitButtonText}>{submitting ? "Registering..." : "Complete registration"}</Text>
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
