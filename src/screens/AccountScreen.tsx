import { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { QrCode, UsersThree } from "../components/icons";
import { Screen } from "../components/Screen";
import { Card } from "../components/Card";
import { PilgrimProfileCard } from "../components/PilgrimProfileCard";
import { TextInput } from "../components/AppTextInput";
import { api } from "../api/client";
import { getDeviceId } from "../device/deviceId";
import { colors, fonts } from "../theme";

function HealthCardSection() {
  const { t } = useTranslation();
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
      Alert.alert(t("account.saveFailedTitle"), t("common.tryAgain"));
    }
  }

  return (
    <Card>
      <View style={styles.titleRow}>
        <QrCode size={16} color={colors.saffronDeep} weight="fill" />
        <Text style={styles.cardTitle}>{t("account.healthCardTitle")}</Text>
      </View>
      <TextInput style={styles.input} placeholder={t("account.namePlaceholder")} value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder={t("account.emergencyContactPlaceholder")} value={contact} onChangeText={setContact} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder={t("account.bloodGroupPlaceholder")} value={bloodGroup} onChangeText={setBloodGroup} />
      <TouchableOpacity style={styles.primaryButton} onPress={save}>
        <Text style={styles.primaryButtonText}>{t("account.saveHealthCard")}</Text>
      </TouchableOpacity>
      {qrToken && <Text style={styles.muted}>{t("account.healthCardSaved", { token: qrToken.slice(0, 10) })}</Text>}
    </Card>
  );
}

function FamilyGroupSection() {
  const { t } = useTranslation();
  const [memberName, setMemberName] = useState("");
  const [groupId, setGroupId] = useState<number | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);

  async function createGroup() {
    try {
      const deviceId = await getDeviceId();
      const { data } = await api.post("/family/groups", { created_by_device_id: deviceId, member_name: memberName });
      setGroupId(data.group_id);
    } catch {
      Alert.alert(t("account.createGroupFailedTitle"), t("common.tryAgain"));
    }
  }

  async function createShareLink() {
    try {
      const deviceId = await getDeviceId();
      const { data } = await api.post("/family/share-link", { device_id: deviceId });
      setShareToken(data.token);
    } catch {
      Alert.alert(t("account.createLinkFailedTitle"), t("common.tryAgain"));
    }
  }

  return (
    <Card>
      <View style={styles.titleRow}>
        <UsersThree size={16} color={colors.teal} weight="fill" />
        <Text style={styles.cardTitle}>{t("account.familyGroupTitle")}</Text>
      </View>
      {!groupId ? (
        <>
          <TextInput style={styles.input} placeholder={t("account.yourNamePlaceholder")} value={memberName} onChangeText={setMemberName} />
          <TouchableOpacity style={styles.primaryButton} onPress={createGroup}>
            <Text style={styles.primaryButtonText}>{t("account.createGroup")}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.muted}>{t("account.groupCreated", { groupId })}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={createShareLink}>
            <Text style={styles.primaryButtonText}>{t("account.generateShareLink")}</Text>
          </TouchableOpacity>
          {shareToken && <Text style={styles.muted}>{t("account.shareLinkToken", { token: shareToken })}</Text>}
        </>
      )}
    </Card>
  );
}

export function AccountScreen() {
  const { t } = useTranslation();
  return (
    <Screen title={t("account.title")}>
      <PilgrimProfileCard />
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
