import { useState } from "react";
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "./Card";
import { AddGuardianModal } from "./AddGuardianModal";
import { usePilgrim } from "../pilgrim/PilgrimContext";
import { colors, fonts } from "../theme";

function maskAadhar(aadhar: string) {
  if (aadhar.length < 4) return aadhar;
  return `XXXX XXXX ${aadhar.slice(-4)}`;
}

function DetailRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIconWrap}>
        <Ionicons name={icon} size={16} color={colors.saffronDeep} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

export function PilgrimProfileCard() {
  const { profile, clearProfile } = usePilgrim();
  const [expanded, setExpanded] = useState(false);
  const [addGuardianVisible, setAddGuardianVisible] = useState(false);
  const navigation = useNavigation<any>();

  if (!profile) return null;
  const { pilgrim } = profile;

  const address = [pilgrim.addressLine1, pilgrim.addressLine2, pilgrim.city, pilgrim.state, pilgrim.pincode, pilgrim.country]
    .filter(Boolean)
    .join(", ");

  function confirmLogout() {
    Alert.alert("Log out?", "You can sign back in anytime with your Aadhar number and password.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          await clearProfile();
          navigation.getParent()?.reset({ index: 0, routes: [{ name: "RoleSelection" }] });
        },
      },
    ]);
  }

  return (
    <Card style={styles.card}>
      <TouchableOpacity style={styles.header} onPress={() => setExpanded((e) => !e)} activeOpacity={0.8}>
        {pilgrim.photoBase64 ? (
          <Image source={{ uri: pilgrim.photoBase64 }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={26} color={colors.surface} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{pilgrim.name}</Text>
          <Text style={styles.subtitle}>Pilgrim · Age {pilgrim.age}</Text>
        </View>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color={colors.muted} />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.details}>
          <DetailRow icon="call-outline" label="Phone" value={pilgrim.phone} />
          <DetailRow icon="card-outline" label="Aadhar" value={maskAadhar(pilgrim.aadharNumber)} />
          {!!pilgrim.samagraId && <DetailRow icon="document-text-outline" label="Samagra ID" value={pilgrim.samagraId} />}
          <DetailRow icon="location-outline" label="Address" value={address} />
          {!!pilgrim.medicalHistory && <DetailRow icon="medkit-outline" label="Medical history" value={pilgrim.medicalHistory} />}

          <View style={styles.divider} />
          <TouchableOpacity style={styles.addGuardianButton} onPress={() => setAddGuardianVisible(true)}>
            <Ionicons name="qr-code-outline" size={16} color={colors.teal} />
            <Text style={styles.addGuardianButtonText}>Add guardian</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout}>
            <Ionicons name="log-out-outline" size={16} color={colors.redDeep} />
            <Text style={styles.logoutButtonText}>Log out</Text>
          </TouchableOpacity>
        </View>
      )}

      <AddGuardianModal visible={addGuardianVisible} pilgrimId={profile.pilgrimId} onClose={() => setAddGuardianVisible(false)} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 14 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarPlaceholder: { backgroundColor: colors.saffron, alignItems: "center", justifyContent: "center" },
  name: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  subtitle: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted, marginTop: 2 },
  details: { marginTop: 14, gap: 10 },
  detailRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  detailIconWrap: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.surfaceTint, alignItems: "center", justifyContent: "center", marginTop: 1 },
  detailLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.4 },
  detailValue: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink, marginTop: 1 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 6 },
  sectionLabel: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 2 },
  addGuardianButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.tealTint,
    borderRadius: 10,
    paddingVertical: 11,
  },
  addGuardianButtonText: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.teal },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(194,80,70,0.3)",
    borderRadius: 10,
    paddingVertical: 11,
    marginTop: 8,
  },
  logoutButtonText: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.redDeep },
});
