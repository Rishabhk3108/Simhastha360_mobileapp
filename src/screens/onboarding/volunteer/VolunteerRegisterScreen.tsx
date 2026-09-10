import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, fonts } from "../../../theme";
import { MultiSelectField } from "../../../components/MultiSelectField";
import { AvailabilityPicker } from "../../../components/AvailabilityPicker";
import { PasswordStrengthMeter } from "../../../components/PasswordStrengthMeter";
import { TextInput } from "../../../components/AppTextInput";
import { applyAsVolunteer, uploadDocument, type AvailabilitySlot } from "../../../api/volunteers";
import type { OnboardingStackParamList } from "../../../navigation/AppStack";

type Props = NativeStackScreenProps<OnboardingStackParamList, "VolunteerRegister">;

const SKILL_OPTIONS = [
  { value: "first_aid", label: "First Aid / Medical" },
  { value: "crowd_management", label: "Crowd Management" },
  { value: "translation", label: "Translation / Language Help" },
  { value: "it_support", label: "IT / Tech Support" },
  { value: "logistics", label: "Logistics" },
  { value: "security", label: "Security Background" },
  { value: "driving", label: "Driving" },
  { value: "food_service", label: "Food Service" },
  { value: "sanitation", label: "Sanitation" },
  { value: "general_assistance", label: "General Assistance" },
];

const LANGUAGE_OPTIONS = [
  { value: "hindi", label: "Hindi" },
  { value: "english", label: "English" },
  { value: "marathi", label: "Marathi" },
  { value: "gujarati", label: "Gujarati" },
  { value: "rajasthani", label: "Rajasthani" },
  { value: "bengali", label: "Bengali" },
  { value: "tamil", label: "Tamil" },
  { value: "telugu", label: "Telugu" },
  { value: "kannada", label: "Kannada" },
  { value: "punjabi", label: "Punjabi" },
];

const GENDER_OPTIONS = ["Male", "Female", "Other"];
const ID_PROOF_OPTIONS = [
  { value: "aadhaar", label: "Aadhaar" },
  { value: "voter_id", label: "Voter ID" },
  { value: "passport", label: "Passport" },
  { value: "driving_license", label: "Driving License" },
];
const TSHIRT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

interface FormState {
  name: string;
  phone: string;
  password: string;
  confirmPassword: string;
  age: string;
  gender: string | null;
  email: string;
  cityState: string;
  permanentAddress: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  idProofType: string | null;
  idNumber: string;
  skills: string[];
  languages: string[];
  availabilitySlots: AvailabilitySlot[];
  priorExperience: string;
  tshirtSize: string | null;
  organizationAffiliation: string;
  medicalConditions: string;
  noCriminalRecord: boolean;
  codeOfConductAccepted: boolean;
  mediaConsent: boolean;
}

const EMPTY_FORM: FormState = {
  name: "",
  phone: "",
  password: "",
  confirmPassword: "",
  age: "",
  gender: null,
  email: "",
  cityState: "",
  permanentAddress: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  idProofType: null,
  idNumber: "",
  skills: [],
  languages: [],
  availabilitySlots: [],
  priorExperience: "",
  tshirtSize: null,
  organizationAffiliation: "",
  medicalConditions: "",
  noCriminalRecord: false,
  codeOfConductAccepted: false,
  mediaConsent: false,
};

type DocKind = "photo" | "idFront" | "idBack";

export function VolunteerRegisterScreen({ navigation }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [docUris, setDocUris] = useState<Record<DocKind, string | null>>({ photo: null, idFront: null, idBack: null });
  const [docIds, setDocIds] = useState<Record<DocKind, string | null>>({ photo: null, idFront: null, idBack: null });
  const [uploading, setUploading] = useState<Record<DocKind, boolean>>({ photo: false, idFront: false, idBack: false });
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function pickAndUpload(kind: DocKind) {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: kind === "photo",
      aspect: kind === "photo" ? [1, 1] : undefined,
      quality: 0.7,
    });
    if (picked.canceled) return;

    const resized = await ImageManipulator.manipulateAsync(
      picked.assets[0].uri,
      [{ resize: { width: kind === "photo" ? 480 : 1000 } }],
      { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG },
    );

    setUploading((u) => ({ ...u, [kind]: true }));
    try {
      const docId = await uploadDocument(resized.uri, `${kind}.jpg`, "image/jpeg");
      setDocUris((u) => ({ ...u, [kind]: resized.uri }));
      setDocIds((d) => ({ ...d, [kind]: docId }));
    } catch {
      Alert.alert("Upload failed", "Please try again.");
    } finally {
      setUploading((u) => ({ ...u, [kind]: false }));
    }
  }

  function validate(): string | null {
    if (!form.name.trim()) return "Please enter your name.";
    if (!form.phone.trim()) return "Please enter your phone number.";
    if (form.password.length < 8) return "Password must be at least 8 characters.";
    if (form.password !== form.confirmPassword) return "Passwords don't match.";
    if (!form.age.trim()) return "Please enter your age.";
    if (!form.gender) return "Please select a gender.";
    if (!form.emergencyContactName.trim() || !form.emergencyContactPhone.trim()) return "Please add an emergency contact.";
    if (!form.idProofType) return "Please select an ID proof type.";
    if (!form.idNumber.trim()) return "Please enter your ID number.";
    if (!docIds.idFront) return "Please upload the front of your ID proof.";
    if (form.idProofType === "aadhaar" && !docIds.idBack) return "Please upload the back of your Aadhaar.";
    if (!docIds.photo) return "Please upload a photo for your volunteer ID.";
    if (form.skills.length === 0) return "Please select at least one skill.";
    if (form.languages.length === 0) return "Please select at least one language.";
    if (form.availabilitySlots.length === 0) return "Please add at least one availability slot.";
    if (!form.noCriminalRecord) return "Please confirm the criminal record declaration.";
    if (!form.codeOfConductAccepted) return "Please accept the code of conduct.";
    return null;
  }

  async function submit() {
    const error = validate();
    if (error) {
      Alert.alert("Almost there", error);
      return;
    }
    setSubmitting(true);
    try {
      await applyAsVolunteer({
        name: form.name.trim(),
        phone: form.phone.trim(),
        password: form.password,
        age: parseInt(form.age, 10) || undefined,
        gender: form.gender ?? undefined,
        email: form.email.trim() || undefined,
        city_state: form.cityState.trim() || undefined,
        permanent_address: form.permanentAddress.trim() || undefined,
        emergency_contact_name: form.emergencyContactName.trim(),
        emergency_contact_phone: form.emergencyContactPhone.trim(),
        id_proof_type: form.idProofType ?? undefined,
        id_number: form.idNumber.trim(),
        id_proof_front_doc_id: docIds.idFront ?? undefined,
        id_proof_back_doc_id: docIds.idBack ?? undefined,
        photo_doc_id: docIds.photo ?? undefined,
        skills: form.skills,
        languages: form.languages,
        availability_slots: form.availabilitySlots,
        prior_experience: form.priorExperience.trim() || undefined,
        tshirt_size: form.tshirtSize ?? undefined,
        organization_affiliation: form.organizationAffiliation.trim() || undefined,
        medical_conditions: form.medicalConditions.trim() || undefined,
        no_criminal_record: form.noCriminalRecord,
        code_of_conduct_accepted: form.codeOfConductAccepted,
        media_consent: form.mediaConsent,
      });
      navigation.replace("VolunteerStatus", { status: "pending", justSubmitted: true });
    } catch (err: any) {
      Alert.alert("Could not submit", err.response?.data?.detail ?? "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Register as Volunteer</Text>
        <Text style={styles.subtitle}>Fields marked with an asterisk are required for review.</Text>

        <Text style={styles.sectionTitle}>Personal details</Text>
        <TextInput style={styles.input} placeholder="Full name *" value={form.name} onChangeText={(v) => set("name", v)} />
        <TextInput style={styles.input} placeholder="Phone number *" value={form.phone} onChangeText={(v) => set("phone", v)} keyboardType="phone-pad" />
        <TextInput style={styles.input} placeholder="Password *" value={form.password} onChangeText={(v) => set("password", v)} secureTextEntry />
        <PasswordStrengthMeter password={form.password} />
        <TextInput style={styles.input} placeholder="Confirm password *" value={form.confirmPassword} onChangeText={(v) => set("confirmPassword", v)} secureTextEntry />
        <View style={styles.row}>
          <TextInput style={[styles.input, styles.rowInput]} placeholder="Age *" value={form.age} onChangeText={(v) => set("age", v)} keyboardType="number-pad" />
          <View style={[styles.rowInput, { gap: 6 }]}>
            <Text style={styles.chipRowLabel}>Gender *</Text>
            <View style={styles.chipRow}>
              {GENDER_OPTIONS.map((g) => (
                <TouchableOpacity key={g} style={[styles.chip, form.gender === g && styles.chipActive]} onPress={() => set("gender", g)}>
                  <Text style={[styles.chipText, form.gender === g && styles.chipTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
        <TextInput style={styles.input} placeholder="Email (optional)" value={form.email} onChangeText={(v) => set("email", v)} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="City, State" value={form.cityState} onChangeText={(v) => set("cityState", v)} />
        <TextInput style={styles.input} placeholder="Permanent address (if different)" value={form.permanentAddress} onChangeText={(v) => set("permanentAddress", v)} />
        <View style={styles.row}>
          <TextInput style={[styles.input, styles.rowInput]} placeholder="Emergency contact name *" value={form.emergencyContactName} onChangeText={(v) => set("emergencyContactName", v)} />
          <TextInput style={[styles.input, styles.rowInput]} placeholder="Emergency contact phone *" value={form.emergencyContactPhone} onChangeText={(v) => set("emergencyContactPhone", v)} keyboardType="phone-pad" />
        </View>

        <Text style={styles.sectionTitle}>Identity verification</Text>
        <Text style={styles.chipRowLabel}>ID proof type *</Text>
        <View style={styles.chipRow}>
          {ID_PROOF_OPTIONS.map((o) => (
            <TouchableOpacity key={o.value} style={[styles.chip, form.idProofType === o.value && styles.chipActive]} onPress={() => set("idProofType", o.value)}>
              <Text style={[styles.chipText, form.idProofType === o.value && styles.chipTextActive]}>{o.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput style={styles.input} placeholder="ID number *" value={form.idNumber} onChangeText={(v) => set("idNumber", v)} />

        <View style={styles.docRow}>
          <DocUploadTile label="ID front *" uri={docUris.idFront} uploading={uploading.idFront} onPress={() => pickAndUpload("idFront")} />
          {form.idProofType === "aadhaar" && (
            <DocUploadTile label="ID back *" uri={docUris.idBack} uploading={uploading.idBack} onPress={() => pickAndUpload("idBack")} />
          )}
          <DocUploadTile label="Your photo *" uri={docUris.photo} uploading={uploading.photo} round onPress={() => pickAndUpload("photo")} />
        </View>

        <Text style={styles.sectionTitle}>Volunteering details</Text>
        <MultiSelectField label="Skills *" options={SKILL_OPTIONS} selected={form.skills} onChange={(v) => set("skills", v)} />
        <MultiSelectField label="Languages spoken *" options={LANGUAGE_OPTIONS} selected={form.languages} onChange={(v) => set("languages", v)} />

        <Text style={styles.chipRowLabel}>Availability *</Text>
        <AvailabilityPicker slots={form.availabilitySlots} onChange={(v) => set("availabilitySlots", v)} />

        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Prior volunteering experience (optional)"
          value={form.priorExperience}
          onChangeText={(v) => set("priorExperience", v)}
          multiline
        />

        <Text style={styles.chipRowLabel}>T-shirt size</Text>
        <View style={styles.chipRow}>
          {TSHIRT_SIZES.map((s) => (
            <TouchableOpacity key={s} style={[styles.chip, form.tshirtSize === s && styles.chipActive]} onPress={() => set("tshirtSize", s)}>
              <Text style={[styles.chipText, form.tshirtSize === s && styles.chipTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Eligibility</Text>
        <TextInput style={styles.input} placeholder="Volunteering via an organization/NGO/college (optional)" value={form.organizationAffiliation} onChangeText={(v) => set("organizationAffiliation", v)} />
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Any medical condition relevant to duty assignment (optional)"
          value={form.medicalConditions}
          onChangeText={(v) => set("medicalConditions", v)}
          multiline
        />

        <ConsentRow
          label="I declare I have no pending criminal case *"
          value={form.noCriminalRecord}
          onChange={(v) => set("noCriminalRecord", v)}
        />

        <Text style={styles.sectionTitle}>Consent</Text>
        <ConsentRow
          label="I agree to the volunteer code of conduct *"
          value={form.codeOfConductAccepted}
          onChange={(v) => set("codeOfConductAccepted", v)}
        />
        <ConsentRow
          label="I consent to being photographed/filmed during duty"
          value={form.mediaConsent}
          onChange={(v) => set("mediaConsent", v)}
        />

        <TouchableOpacity style={styles.primaryButton} onPress={submit} disabled={submitting}>
          {submitting ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.primaryButtonText}>Submit application</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
          <Text style={styles.backLinkText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function DocUploadTile({
  label,
  uri,
  uploading,
  round,
  onPress,
}: {
  label: string;
  uri: string | null;
  uploading: boolean;
  round?: boolean;
  onPress: () => void;
}) {
  return (
    <View style={styles.docTile}>
      <TouchableOpacity style={[styles.docPicker, round && styles.docPickerRound]} onPress={onPress} disabled={uploading}>
        {uploading ? (
          <ActivityIndicator color={colors.muted} />
        ) : uri ? (
          <Image source={{ uri }} style={[styles.docPreview, round && styles.docPickerRound]} />
        ) : (
          <Text style={styles.docPickerText}>Upload</Text>
        )}
      </TouchableOpacity>
      <Text style={styles.docLabel}>{label}</Text>
    </View>
  );
}

function ConsentRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.consentRow}>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.teal }} />
      <Text style={styles.consentLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 22, paddingBottom: 40, gap: 10 },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  subtitle: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted, marginBottom: 4 },
  sectionTitle: { fontFamily: fonts.bodyBold, fontSize: 15.5, color: colors.ink, marginTop: 14 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 11, backgroundColor: colors.surface, fontFamily: fonts.body, fontSize: 14, color: colors.ink },
  multiline: { minHeight: 72, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 8 },
  rowInput: { flex: 1 },
  chipRowLabel: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.muted2, marginTop: 4 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, marginRight: 6 },
  chipActive: { backgroundColor: colors.teal, borderColor: colors.teal },
  chipText: { fontFamily: fonts.body, fontSize: 12.5, color: colors.ink },
  chipTextActive: { color: colors.surface },
  docRow: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginTop: 6 },
  docTile: { alignItems: "center", gap: 6 },
  docPicker: {
    width: 88,
    height: 88,
    borderRadius: 12,
    backgroundColor: colors.surfaceTint,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  docPickerRound: { borderRadius: 44 },
  docPickerText: { fontFamily: fonts.body, fontSize: 11.5, color: colors.muted },
  docPreview: { width: 88, height: 88 },
  docLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.muted },
  consentRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 },
  consentLabel: { flex: 1, fontFamily: fonts.body, fontSize: 12.5, color: colors.ink },
  primaryButton: { backgroundColor: colors.ink, borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 20 },
  primaryButtonText: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: colors.surface },
  backLink: { alignItems: "center", marginTop: 14 },
  backLinkText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.muted },
});
