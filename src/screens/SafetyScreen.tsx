import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { api } from "../api/client";
import { Screen } from "../components/Screen";
import { Card } from "../components/Card";
import { useLocation } from "../location/useLocation";
import { getDeviceId } from "../device/deviceId";

const REPORT_TYPES: { label: string; value: string }[] = [
  { label: "Crowded here", value: "crowded" },
  { label: "Toilet not working", value: "toilet_not_working" },
  { label: "Water point empty", value: "water_empty" },
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
      await api.post("/reports", {
        zone_id: parseInt(zoneId, 10),
        type,
        device_id: deviceId,
        lat: coords?.lat,
        lng: coords?.lng,
      });
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
      await api.post("/lost-person", {
        reporter_device_id: deviceId,
        subject_name: lostName,
        last_seen_lat: coords?.lat,
        last_seen_lng: coords?.lng,
      });
      setLostName("");
      Alert.alert("Report received", "Help desk staff have been notified.");
    } catch {
      Alert.alert("Could not submit report", "Please try again.");
    }
  }

  return (
    <Screen title="Safety">
      {locationError && <Text style={styles.muted}>{locationError}</Text>}

      <Card>
        <TouchableOpacity style={styles.sosButton} onPress={sendSOS} disabled={sending}>
          <Text style={styles.sosText}>{sending ? "Sending..." : "SOS — Send Help"}</Text>
        </TouchableOpacity>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Report an issue near you</Text>
        <Text style={styles.muted}>Zone ID (demo — real app resolves this from your location)</Text>
        <TextInput style={styles.input} value={zoneId} onChangeText={setZoneId} keyboardType="number-pad" />
        <View style={styles.reportButtons}>
          {REPORT_TYPES.map((r) => (
            <TouchableOpacity key={r.value} style={styles.reportButton} onPress={() => sendReport(r.value)}>
              <Text style={styles.reportButtonText}>{r.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Report a lost person</Text>
        <TextInput style={styles.input} placeholder="Name" value={lostName} onChangeText={setLostName} />
        <TouchableOpacity style={styles.primaryButton} onPress={submitLostPerson}>
          <Text style={styles.primaryButtonText}>Submit</Text>
        </TouchableOpacity>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  muted: { color: "#667080", marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#1c2733", marginBottom: 8 },
  sosButton: { backgroundColor: "#d13c3c", borderRadius: 10, paddingVertical: 18, alignItems: "center" },
  sosText: { color: "white", fontSize: 18, fontWeight: "700" },
  input: { borderWidth: 1, borderColor: "#dde2e7", borderRadius: 8, padding: 10, marginBottom: 10, backgroundColor: "white" },
  reportButtons: { gap: 8 },
  reportButton: { backgroundColor: "#eef2f6", borderRadius: 8, paddingVertical: 10, alignItems: "center" },
  reportButtonText: { color: "#1c2733", fontWeight: "600" },
  primaryButton: { backgroundColor: "#1d5fbf", borderRadius: 8, paddingVertical: 12, alignItems: "center" },
  primaryButtonText: { color: "white", fontWeight: "700" },
});
