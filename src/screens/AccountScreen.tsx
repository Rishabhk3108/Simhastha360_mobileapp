import { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { QrCode, UsersThree, WarningCircle } from "../components/icons";
import { Screen } from "../components/Screen";
import { Card } from "../components/Card";
import { PilgrimProfileCard } from "../components/PilgrimProfileCard";
import { TextInput } from "../components/AppTextInput";
import { ReportIssueModal } from "../components/ReportIssueModal";
import { api } from "../api/client";
import { getDeviceId } from "../device/deviceId";
import { colors, fonts } from "../theme";

function ReportIssueSection() {
  const [visible, setVisible] = useState(false);

  return (
    <Card>
      <View style={styles.titleRow}>
        <WarningCircle size={16} color={colors.redDeep} weight="fill" />
        <Text style={styles.cardTitle}>Report an issue</Text>
      </View>
      <Text style={styles.muted}>
        See a hazard, a broken facility, or anything that needs attention? Report it with a photo and we'll act on it.
      </Text>
      <TouchableOpacity style={styles.primaryButton} onPress={() => setVisible(true)}>
        <Text style={styles.primaryButtonText}>Report an issue</Text>
      </TouchableOpacity>
      <ReportIssueModal visible={visible} onClose={() => setVisible(false)} />
    </Card>
  );
}

function HealthCardSection() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [qrToken, setQrToken] = useState<string | null>(null);

  async function save() {
    try {
      const deviceId = await getDeviceId();
      const { data } = await api.post("/health-card", { device_id: deviceId, name, emergency_contact: contact, blood_group: bloodGroup || undefined });
      setQrToken(data.qr_token);
    } catch {
      Alert.alert("Could not save", "Please try again.");
    }
  }

  return (
    <Card>
      <View style={styles.titleRow}>
        <QrCode size={16} color={colors.saffronDeep} weight="fill" />
        <Text style={styles.cardTitle}>Digital Health Card · opt-in</Text>
      </View>
      <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Emergency contact" value={contact} onChangeText={setContact} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="Blood group" value={bloodGroup} onChangeText={setBloodGroup} />
      <TouchableOpacity style={styles.primaryButton} onPress={save}>
        <Text style={styles.primaryButtonText}>Save health card</Text>
      </TouchableOpacity>
      {qrToken && <Text style={styles.muted}>Saved. A medical responder can scan your code (token: {qrToken.slice(0, 10)}...) to see this summary.</Text>}
    </Card>
  );
}

function FamilyGroupSection() {
  const [memberName, setMemberName] = useState("");
  const [groupId, setGroupId] = useState<number | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);

  async function createGroup() {
    try {
      const deviceId = await getDeviceId();
      const { data } = await api.post("/family/groups", { created_by_device_id: deviceId, member_name: memberName });
      setGroupId(data.group_id);
    } catch {
      Alert.alert("Could not create group", "Please try again.");
    }
  }

  async function createShareLink() {
    try {
      const deviceId = await getDeviceId();
      const { data } = await api.post("/family/share-link", { device_id: deviceId });
      setShareToken(data.token);
    } catch {
      Alert.alert("Could not create link", "Please try again.");
    }
  }

  return (
    <Card>
      <View style={styles.titleRow}>
        <UsersThree size={16} color={colors.teal} weight="fill" />
        <Text style={styles.cardTitle}>Temporary Family Group</Text>
      </View>
      {!groupId ? (
        <>
          <TextInput style={styles.input} placeholder="Your name" value={memberName} onChangeText={setMemberName} />
          <TouchableOpacity style={styles.primaryButton} onPress={createGroup}>
            <Text style={styles.primaryButtonText}>Create group</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.muted}>Group #{groupId} created. Share this ID with family members to join.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={createShareLink}>
            <Text style={styles.primaryButtonText}>Generate "Peace of Mind" link</Text>
          </TouchableOpacity>
          {shareToken && <Text style={styles.muted}>Share link token: {shareToken}</Text>}
        </>
      )}
    </Card>
  );
}

export function AccountScreen() {
  return (
    <Screen title="Account">
      <PilgrimProfileCard />
      <ReportIssueSection />
      <HealthCardSection />
      <FamilyGroupSection />
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardTitle: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  muted: { fontFamily: fonts.body, color: colors.muted, marginTop: 6 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 11, marginTop: 10, backgroundColor: colors.surface, fontFamily: fonts.body },
  primaryButton: { backgroundColor: colors.ink, borderRadius: 10, paddingVertical: 13, alignItems: "center", marginTop: 12 },
  primaryButtonText: { fontFamily: fonts.bodyBold, color: colors.surface },
});
