import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, fonts } from "../../../theme";
import { useAuth } from "../../../auth/AuthContext";
import type { OnboardingStackParamList } from "../../../navigation/AppStack";

type Props = NativeStackScreenProps<OnboardingStackParamList, "VolunteerStatus">;

export function VolunteerStatusScreen({ navigation, route }: Props) {
  const { status, reviewNote, justSubmitted } = route.params;
  const { logout } = useAuth();

  async function backToStart() {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: "RoleSelection" }] });
  }

  const isRejected = status === "rejected";

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={[styles.iconWrap, isRejected ? styles.iconWrapRed : styles.iconWrapYellow]}>
          <Ionicons name={isRejected ? "close-circle-outline" : "time-outline"} size={40} color={colors.surface} />
        </View>

        <Text style={styles.title}>
          {isRejected ? "Application not approved" : justSubmitted ? "Application submitted" : "Application pending"}
        </Text>

        <Text style={styles.body}>
          {isRejected
            ? reviewNote || "Your volunteer application was not approved this time."
            : "Your volunteer application is under review. An admin will approve you before you can access volunteer tasks - check back and log in again later."}
        </Text>

        <TouchableOpacity style={styles.primaryButton} onPress={backToStart}>
          <Text style={styles.primaryButtonText}>Back to start</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, padding: 28, alignItems: "center", justifyContent: "center" },
  iconWrap: { width: 84, height: 84, borderRadius: 42, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  iconWrapYellow: { backgroundColor: colors.yellowDeep },
  iconWrapRed: { backgroundColor: colors.redDeep },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.ink, textAlign: "center" },
  body: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, textAlign: "center", marginTop: 12, lineHeight: 20 },
  primaryButton: { backgroundColor: colors.ink, borderRadius: 14, paddingVertical: 15, paddingHorizontal: 32, alignItems: "center", marginTop: 28 },
  primaryButtonText: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: colors.surface },
});
