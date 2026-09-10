import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts } from "../../theme";
import type { OnboardingStackParamList } from "../../navigation/AppStack";

type Props = NativeStackScreenProps<OnboardingStackParamList, "RoleSelection">;

export function RoleSelectionScreen({ navigation }: Props) {
  function comingSoon(role: string) {
    Alert.alert("Coming soon", `${role} registration will be available in a later update.`);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Simhastha 360</Text>
        <Text style={styles.subtitle}>Tell us who you are so we can set you up correctly.</Text>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("AccountCheck", { role: "pilgrim" })}>
          <Ionicons name="walk-outline" size={28} color={colors.saffronDeep} />
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>I am a Pilgrim</Text>
            <Text style={styles.cardSubtitle}>Register yourself, with a guardian's contact for safety.</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("AccountCheck", { role: "guardian" })}>
          <Ionicons name="people-outline" size={28} color={colors.teal} />
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>I am a Guardian</Text>
            <Text style={styles.cardSubtitle}>Register on behalf of a pilgrim (elderly parent, child, etc.)</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("VolunteerEntry")}>
          <Ionicons name="hand-left-outline" size={28} color={colors.teal} />
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Volunteer</Text>
            <Text style={styles.cardSubtitle}>Already registered, or joining as a Simhastha volunteer for the first time.</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, styles.cardDisabled]} onPress={() => comingSoon("Foreign guest")}>
          <Ionicons name="airplane-outline" size={28} color={colors.faint} />
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitleDisabled}>Are you a guest to India?</Text>
            <Text style={styles.cardSubtitle}>Coming soon.</Text>
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
  cardDisabled: { opacity: 0.6 },
  cardTitle: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  cardTitleDisabled: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.muted },
  cardSubtitle: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 },
});
