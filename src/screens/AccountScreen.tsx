import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Screen } from "../components/Screen";
import { Card } from "../components/Card";
import { useAuth } from "../auth/AuthContext";
import { api } from "../api/client";
import { getDeviceId } from "../device/deviceId";

const SKILLS = ["first aid", "crowd management", "translation", "sanitation", "general support"];

function LoginForm() {
  const { login } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    try {
      await login(phone, password);
    } catch {
      Alert.alert("Login failed", "Check your phone number and password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <Text style={styles.cardTitle}>Volunteer / Field Team Sign In</Text>
      <TextInput style={styles.input} placeholder="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} disabled={loading}>
        <Text style={styles.primaryButtonText}>{loading ? "Signing in..." : "Sign in"}</Text>
      </TouchableOpacity>
    </Card>
  );
}

function VolunteerRegisterForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  function toggleSkill(skill: string) {
    setSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]));
  }

  async function submit() {
    try {
      await api.post("/volunteers/apply", { name, phone, password, skills });
      setSubmitted(true);
    } catch (err: any) {
      Alert.alert("Could not submit", err.response?.data?.detail ?? "Please try again.");
    }
  }

  if (submitted) {
    return (
      <Card>
        <Text style={styles.cardTitle}>Application received</Text>
        <Text style={styles.muted}>Status: Pending Review. Sign in above once an admin approves you.</Text>
      </Card>
    );
  }

  return (
    <Card>
      <Text style={styles.cardTitle}>Register as a Volunteer</Text>
      <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <View style={styles.skillRow}>
        {SKILLS.map((skill) => (
          <TouchableOpacity
            key={skill}
            style={[styles.chip, skills.includes(skill) && styles.chipActive]}
            onPress={() => toggleSkill(skill)}
          >
            <Text style={[styles.chipText, skills.includes(skill) && styles.chipTextActive]}>{skill}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.primaryButton} onPress={submit}>
        <Text style={styles.primaryButtonText}>Submit application</Text>
      </TouchableOpacity>
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
      const { data } = await api.post("/health-card", {
        device_id: deviceId,
        name,
        emergency_contact: contact,
        blood_group: bloodGroup || undefined,
      });
      setQrToken(data.qr_token);
    } catch {
      Alert.alert("Could not save", "Please try again.");
    }
  }

  return (
    <Card>
      <Text style={styles.cardTitle}>Digital Health Card (opt-in)</Text>
      <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Emergency contact" value={contact} onChangeText={setContact} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="Blood group" value={bloodGroup} onChangeText={setBloodGroup} />
      <TouchableOpacity style={styles.primaryButton} onPress={save}>
        <Text style={styles.primaryButtonText}>Save health card</Text>
      </TouchableOpacity>
      {qrToken && (
        <Text style={styles.muted}>
          Saved. A medical responder can scan your code (token: {qrToken.slice(0, 10)}...) to see this summary.
        </Text>
      )}
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
      <Text style={styles.cardTitle}>Temporary Family Group</Text>
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
  const { token, role, name, logout } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <Screen title="Account">
      {token ? (
        <Card>
          <Text style={styles.cardTitle}>{name}</Text>
          <Text style={styles.muted}>Role: {role}</Text>
          <TouchableOpacity style={styles.secondaryButton} onPress={logout}>
            <Text style={styles.secondaryButtonText}>Log out</Text>
          </TouchableOpacity>
        </Card>
      ) : (
        <>
          <View style={styles.tabRow}>
            <TouchableOpacity style={[styles.tabButton, mode === "login" && styles.tabButtonActive]} onPress={() => setMode("login")}>
              <Text style={mode === "login" ? styles.tabTextActive : styles.tabText}>Sign in</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabButton, mode === "register" && styles.tabButtonActive]} onPress={() => setMode("register")}>
              <Text style={mode === "register" ? styles.tabTextActive : styles.tabText}>Register as Volunteer</Text>
            </TouchableOpacity>
          </View>
          {mode === "login" ? <LoginForm /> : <VolunteerRegisterForm />}
        </>
      )}

      <HealthCardSection />
      <FamilyGroupSection />
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#1c2733", marginBottom: 8 },
  muted: { color: "#667080", marginTop: 4 },
  input: { borderWidth: 1, borderColor: "#dde2e7", borderRadius: 8, padding: 10, marginBottom: 10, backgroundColor: "white" },
  primaryButton: { backgroundColor: "#1d5fbf", borderRadius: 8, paddingVertical: 12, alignItems: "center" },
  primaryButtonText: { color: "white", fontWeight: "700" },
  secondaryButton: { borderWidth: 1, borderColor: "#dde2e7", borderRadius: 8, paddingVertical: 12, alignItems: "center", marginTop: 8 },
  secondaryButtonText: { color: "#1c2733", fontWeight: "600" },
  skillRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: "#dde2e7" },
  chipActive: { backgroundColor: "#1d5fbf", borderColor: "#1d5fbf" },
  chipText: { fontSize: 12, color: "#1c2733" },
  chipTextActive: { color: "white" },
  tabRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  tabButton: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: "white", borderWidth: 1, borderColor: "#dde2e7", alignItems: "center" },
  tabButtonActive: { backgroundColor: "#1d5fbf", borderColor: "#1d5fbf" },
  tabText: { color: "#1c2733", fontWeight: "600" },
  tabTextActive: { color: "white", fontWeight: "700" },
});
