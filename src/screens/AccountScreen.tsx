import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { QrCode, UsersThree } from "../components/icons";
import { Screen } from "../components/Screen";
import { Card } from "../components/Card";
import { useAuth } from "../auth/AuthContext";
import { usePilgrim } from "../pilgrim/PilgrimContext";
import { api } from "../api/client";
import { getDeviceId } from "../device/deviceId";
import { colors, fonts } from "../theme";

function PilgrimIdentityCard() {
  const { name, registeredVia, clearIdentity } = usePilgrim();
  const navigation = useNavigation<any>();

  async function resetRegistration() {
    Alert.alert("Reset registration?", "This clears your registered pilgrim details on this device.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: async () => {
          await clearIdentity();
          navigation.getParent()?.reset({ index: 0, routes: [{ name: "RoleSelection" }] });
        },
      },
    ]);
  }

  if (!name) return null;

  return (
    <Card>
      <View style={styles.titleRow}>
        <View style={styles.registeredDot} />
        <Text style={styles.cardTitle}>Registered as {name}</Text>
      </View>
      <Text style={styles.muted}>{registeredVia === "guardian" ? "Registered by a guardian" : "Registered as pilgrim"}</Text>
      <TouchableOpacity style={styles.secondaryButton} onPress={resetRegistration}>
        <Text style={styles.secondaryButtonText}>Not you? Reset registration</Text>
      </TouchableOpacity>
    </Card>
  );
}

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
      <Text style={styles.cardTitle}>Volunteer / Field Team sign in</Text>
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
      <Text style={styles.cardTitle}>Register as a volunteer</Text>
      <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <View style={styles.skillRow}>
        {SKILLS.map((skill) => (
          <TouchableOpacity key={skill} style={[styles.chip, skills.includes(skill) && styles.chipActive]} onPress={() => toggleSkill(skill)}>
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
  const { token, role, name, logout } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <Screen title="Account">
      <PilgrimIdentityCard />

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
  cardTitle: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  registeredDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.green },
  muted: { fontFamily: fonts.body, color: colors.muted, marginTop: 6 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 11, marginTop: 10, backgroundColor: colors.surface, fontFamily: fonts.body },
  primaryButton: { backgroundColor: colors.ink, borderRadius: 10, paddingVertical: 13, alignItems: "center", marginTop: 12 },
  primaryButtonText: { fontFamily: fonts.bodyBold, color: colors.surface },
  secondaryButton: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 13, alignItems: "center", marginTop: 12 },
  secondaryButtonText: { fontFamily: fonts.bodyMedium, color: colors.ink },
  skillRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  chip: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontFamily: fonts.body, fontSize: 12, color: colors.ink },
  chipTextActive: { color: colors.surface },
  tabRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  tabButton: { flex: 1, paddingVertical: 11, borderRadius: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
  tabButtonActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  tabText: { fontFamily: fonts.bodyMedium, color: colors.ink },
  tabTextActive: { fontFamily: fonts.bodyBold, color: colors.surface },
});
