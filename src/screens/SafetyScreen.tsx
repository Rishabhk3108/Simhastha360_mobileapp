import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Siren, UsersThree, Toilet, DropHalf, UserFocus } from "../components/icons";
import { api } from "../api/client";
import { Screen } from "../components/Screen";
import { Card } from "../components/Card";
import { useLocation } from "../location/useLocation";
import { getDeviceId } from "../device/deviceId";
import { colors, fonts } from "../theme";

const REPORT_TYPES: { label: string; value: string; Icon: typeof UsersThree; color: string }[] = [
  { label: "Too crowded here", value: "crowded", Icon: UsersThree, color: colors.brass },
  { label: "Toilet not working", value: "toilet_not_working", Icon: Toilet, color: colors.saffronDeep },
  { label: "Water point empty", value: "water_empty", Icon: DropHalf, color: colors.teal },
];

export function SafetyScreen() {
  const { coords, error: locationError } = useLocation();
  const [sending, setSending] = useState(false);
  const [zoneId, setZoneId] = useState("1");
  const [lostName, setLostName] = useState("");

  async function sendSOS() {
    if (!coords) {
      Alert.alert("Location needed", "We need your location to route a responder to you.");
      return;
    }
    setSending(true);
    try {
      const deviceId = await getDeviceId();
      await api.post("/sos", { device_id: deviceId, lat: coords.lat, lng: coords.lng });
      Alert.alert("SOS sent", "Help is being routed to your location.");
    } catch {
      Alert.alert("Could not send SOS", "Please try again or find the nearest help desk.");
    } finally {
      setSending(false);
    }
  }

  async function sendReport(type: string) {
    try {
      const deviceId = await getDeviceId();
      await api.post("/reports", { zone_id: parseInt(zoneId, 10), type, device_id: deviceId, lat: coords?.lat, lng: coords?.lng });
      Alert.alert("Thanks", "Your report has been submitted.");
    } catch {
      Alert.alert("Could not submit report", "Please try again.");
    }
  }

  async function submitLostPerson() {
    if (!lostName.trim()) {
      Alert.alert("Name required", "Enter the name of the person you're reporting.");
      return;
    }
    try {
      const deviceId = await getDeviceId();
      await api.post("/lost-person", { reporter_device_id: deviceId, subject_name: lostName, last_seen_lat: coords?.lat, last_seen_lng: coords?.lng });
      setLostName("");
      Alert.alert("Report received", "Help desk staff have been notified.");
    } catch {
      Alert.alert("Could not submit report", "Please try again.");
    }
  }

  return (
    <Screen title="Safety">
      {locationError && <Text style={styles.muted}>{locationError}</Text>}

      <TouchableOpacity style={styles.sosButton} onPress={sendSOS} disabled={sending} activeOpacity={0.85}>
        <View style={styles.sosRing}>
          <View style={styles.sosCore}>
            <Siren size={40} color={colors.surface} weight="fill" />
          </View>
        </View>
        <Text style={styles.sosText}>{sending ? "Sending..." : "SOS — Send Help"}</Text>
      </TouchableOpacity>

      <Card>
        <Text style={styles.cardTitle}>Report what you see</Text>
        <Text style={styles.muted}>Zone ID (demo — real app resolves this from your location)</Text>
        <TextInput style={styles.input} value={zoneId} onChangeText={setZoneId} keyboardType="number-pad" />
        <View style={{ gap: 8 }}>
          {REPORT_TYPES.map((r) => (
            <TouchableOpacity key={r.value} style={styles.reportButton} onPress={() => sendReport(r.value)}>
              <r.Icon size={22} color={r.color} weight="fill" />
              <Text style={styles.reportButtonText}>{r.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.fineprint}>One report never changes a zone — corroboration does.</Text>
      </Card>

      <Card>
        <View style={styles.titleRow}>
          <UserFocus size={16} color={colors.red} weight="fill" />
          <Text style={styles.cardTitle}>Report a lost person</Text>
        </View>
        <TextInput style={styles.input} placeholder="Name" value={lostName} onChangeText={setLostName} />
        <TouchableOpacity style={styles.primaryButton} onPress={submitLostPerson}>
          <Text style={styles.primaryButtonText}>Submit</Text>
        </TouchableOpacity>
        <Text style={styles.fineprint}>Photo optional · help desk staff confirm any match.</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  muted: { fontFamily: fonts.body, color: colors.muted, marginBottom: 8 },
  cardTitle: { fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.ink },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  sosButton: { alignItems: "center", gap: 10, paddingVertical: 8 },
  sosRing: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: "rgba(194,80,70,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  sosCore: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.red,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.red,
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  sosText: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.redDeep },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 11, marginBottom: 10, backgroundColor: colors.surface, fontFamily: fonts.body },
  reportButton: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surfaceTint, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 14 },
  reportButtonText: { fontFamily: fonts.bodyMedium, color: colors.ink, fontSize: 15 },
  primaryButton: { backgroundColor: colors.ink, borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  primaryButtonText: { fontFamily: fonts.bodyBold, color: colors.surface },
  fineprint: { fontFamily: fonts.body, fontSize: 12, color: colors.muted2, marginTop: 10 },
});
