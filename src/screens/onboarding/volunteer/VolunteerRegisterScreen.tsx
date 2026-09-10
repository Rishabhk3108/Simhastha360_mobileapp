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
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { colors, fonts } from "../../../theme";
import { MultiSelectField } from "../../../components/MultiSelectField";
import { AvailabilityPicker } from "../../../components/AvailabilityPicker";
import { PasswordStrengthMeter } from "../../../components/PasswordStrengthMeter";
import { TextInput } from "../../../components/AppTextInput";
import { applyAsVolunteer, uploadDocument, type AvailabilitySlot } from "../../../api/volunteers";
import type { OnboardingStackParamList } from "../../../navigation/AppStack";

type Props = NativeStackScreenProps<OnboardingStackParamList, "VolunteerRegister">;

const SKILL_VALUES = [
  "first_aid",
  "crowd_management",
  "translation",
  "it_support",
  "logistics",
  "security",
  "driving",
  "food_service",
  "sanitation",
  "general_assistance",
];

const LANGUAGE_VALUES = [
  "hindi",
  "english",
  "marathi",
  "gujarati",
  "rajasthani",
  "bengali",
  "tamil",
  "telugu",
  "kannada",
  "punjabi",
];

const GENDER_VALUES = ["Male", "Female", "Other"];
const ID_PROOF_VALUES = ["aadhaar", "voter_id", "passport", "driving_license"];
const TSHIRT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

function optionsFor(t: TFunction, ns: string, values: string[]) {
  return values.map((value) => ({ value, label: t(`volunteerRegister.${ns}.${value}`) }));
}

function genderLabel(t: TFunction, value: string) {
  return t(`volunteerRegister.gender.${value.toLowerCase()}`);
}

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
  const { t } = useTranslation();
  const skillOptions = optionsFor(t, "skills", SKILL_VALUES);
  const languageOptions = optionsFor(t, "languages", LANGUAGE_VALUES);
  const idProofOptions = optionsFor(t, "idProof", ID_PROOF_VALUES);
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
      Alert.alert(t("volunteerRegister.uploadFailedTitle"), t("common.tryAgain"));
    } finally {
      setUploading((u) => ({ ...u, [kind]: false }));
    }
  }

  function validate(): string | null {
    if (!form.name.trim()) return t("volunteerRegister.errors.name");
    if (!form.phone.trim()) return t("volunteerRegister.errors.phone");
    if (form.password.length < 8) return t("volunteerRegister.errors.password");
    if (form.password !== form.confirmPassword) return t("volunteerRegister.errors.passwordMismatch");
    if (!form.age.trim()) return t("volunteerRegister.errors.age");
    if (!form.gender) return t("volunteerRegister.errors.gender");
    if (!form.emergencyContactName.trim() || !form.emergencyContactPhone.trim()) return t("volunteerRegister.errors.emergencyContact");
    if (!form.idProofType) return t("volunteerRegister.errors.idProofType");
    if (!form.idNumber.trim()) return t("volunteerRegister.errors.idNumber");
    if (!docIds.idFront) return t("volunteerRegister.errors.idFront");
    if (form.idProofType === "aadhaar" && !docIds.idBack) return t("volunteerRegister.errors.idBack");
    if (!docIds.photo) return t("volunteerRegister.errors.photo");
    if (form.skills.length === 0) return t("volunteerRegister.errors.skills");
    if (form.languages.length === 0) return t("volunteerRegister.errors.languages");
    if (form.availabilitySlots.length === 0) return t("volunteerRegister.errors.availability");
    if (!form.noCriminalRecord) return t("volunteerRegister.errors.criminalRecord");
    if (!form.codeOfConductAccepted) return t("volunteerRegister.errors.codeOfConduct");
    return null;
  }

  async function submit() {
    const error = validate();
    if (error) {
      Alert.alert(t("volunteerRegister.almostThere"), error);
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
      Alert.alert(t("volunteerRegister.submitFailedTitle"), err.response?.data?.detail ?? t("common.tryAgain"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t("volunteerRegister.title")}</Text>
        <Text style={styles.subtitle}>{t("volunteerRegister.subtitle")}</Text>

        <Text style={styles.sectionTitle}>{t("volunteerRegister.sectionPersonal")}</Text>
        <TextInput style={styles.input} placeholder={t("volunteerRegister.fullName")} value={form.name} onChangeText={(v) => set("name", v)} />
        <TextInput style={styles.input} placeholder={t("volunteerRegister.phone")} value={form.phone} onChangeText={(v) => set("phone", v)} keyboardType="phone-pad" />
        <TextInput style={styles.input} placeholder={t("volunteerRegister.password")} value={form.password} onChangeText={(v) => set("password", v)} secureTextEntry />
        <PasswordStrengthMeter password={form.password} />
        <TextInput style={styles.input} placeholder={t("volunteerRegister.confirmPassword")} value={form.confirmPassword} onChangeText={(v) => set("confirmPassword", v)} secureTextEntry />
        <View style={styles.row}>
          <TextInput style={[styles.input, styles.rowInput]} placeholder={t("volunteerRegister.age")} value={form.age} onChangeText={(v) => set("age", v)} keyboardType="number-pad" />
          <View style={[styles.rowInput, { gap: 6 }]}>
            <Text style={styles.chipRowLabel}>{t("volunteerRegister.genderLabel")}</Text>
            <View style={styles.chipRow}>
              {GENDER_VALUES.map((g) => (
                <TouchableOpacity key={g} style={[styles.chip, form.gender === g && styles.chipActive]} onPress={() => set("gender", g)}>
                  <Text style={[styles.chipText, form.gender === g && styles.chipTextActive]}>{genderLabel(t, g)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
        <TextInput style={styles.input} placeholder={t("volunteerRegister.email")} value={form.email} onChangeText={(v) => set("email", v)} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder={t("volunteerRegister.cityState")} value={form.cityState} onChangeText={(v) => set("cityState", v)} />
        <TextInput style={styles.input} placeholder={t("volunteerRegister.permanentAddress")} value={form.permanentAddress} onChangeText={(v) => set("permanentAddress", v)} />
        <View style={styles.row}>
          <TextInput style={[styles.input, styles.rowInput]} placeholder={t("volunteerRegister.emergencyContactName")} value={form.emergencyContactName} onChangeText={(v) => set("emergencyContactName", v)} />
          <TextInput style={[styles.input, styles.rowInput]} placeholder={t("volunteerRegister.emergencyContactPhone")} value={form.emergencyContactPhone} onChangeText={(v) => set("emergencyContactPhone", v)} keyboardType="phone-pad" />
        </View>

        <Text style={styles.sectionTitle}>{t("volunteerRegister.sectionIdentity")}</Text>
        <Text style={styles.chipRowLabel}>{t("volunteerRegister.idProofTypeLabel")}</Text>
        <View style={styles.chipRow}>
          {idProofOptions.map((o) => (
            <TouchableOpacity key={o.value} style={[styles.chip, form.idProofType === o.value && styles.chipActive]} onPress={() => set("idProofType", o.value)}>
              <Text style={[styles.chipText, form.idProofType === o.value && styles.chipTextActive]}>{o.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput style={styles.input} placeholder={t("volunteerRegister.idNumber")} value={form.idNumber} onChangeText={(v) => set("idNumber", v)} />

        <View style={styles.docRow}>
          <DocUploadTile label={t("volunteerRegister.idFront")} uri={docUris.idFront} uploading={uploading.idFront} onPress={() => pickAndUpload("idFront")} />
          {form.idProofType === "aadhaar" && (
            <DocUploadTile label={t("volunteerRegister.idBack")} uri={docUris.idBack} uploading={uploading.idBack} onPress={() => pickAndUpload("idBack")} />
          )}
          <DocUploadTile label={t("volunteerRegister.yourPhoto")} uri={docUris.photo} uploading={uploading.photo} round onPress={() => pickAndUpload("photo")} />
        </View>

        <Text style={styles.sectionTitle}>{t("volunteerRegister.sectionVolunteering")}</Text>
        <MultiSelectField label={t("volunteerRegister.skillsLabel")} options={skillOptions} selected={form.skills} onChange={(v) => set("skills", v)} />
        <MultiSelectField label={t("volunteerRegister.languagesLabel")} options={languageOptions} selected={form.languages} onChange={(v) => set("languages", v)} />

        <Text style={styles.chipRowLabel}>{t("volunteerRegister.availabilityLabel")}</Text>
        <AvailabilityPicker slots={form.availabilitySlots} onChange={(v) => set("availabilitySlots", v)} />

        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder={t("volunteerRegister.priorExperience")}
          value={form.priorExperience}
          onChangeText={(v) => set("priorExperience", v)}
          multiline
        />

        <Text style={styles.chipRowLabel}>{t("volunteerRegister.tshirtSizeLabel")}</Text>
        <View style={styles.chipRow}>
          {TSHIRT_SIZES.map((s) => (
            <TouchableOpacity key={s} style={[styles.chip, form.tshirtSize === s && styles.chipActive]} onPress={() => set("tshirtSize", s)}>
              <Text style={[styles.chipText, form.tshirtSize === s && styles.chipTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{t("volunteerRegister.sectionEligibility")}</Text>
        <TextInput style={styles.input} placeholder={t("volunteerRegister.organizationAffiliation")} value={form.organizationAffiliation} onChangeText={(v) => set("organizationAffiliation", v)} />
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder={t("volunteerRegister.medicalConditions")}
          value={form.medicalConditions}
          onChangeText={(v) => set("medicalConditions", v)}
          multiline
        />

        <ConsentRow
          label={t("volunteerRegister.noCriminalRecord")}
          value={form.noCriminalRecord}
          onChange={(v) => set("noCriminalRecord", v)}
        />

        <Text style={styles.sectionTitle}>{t("volunteerRegister.sectionConsent")}</Text>
        <ConsentRow
          label={t("volunteerRegister.codeOfConduct")}
          value={form.codeOfConductAccepted}
          onChange={(v) => set("codeOfConductAccepted", v)}
        />
        <ConsentRow
          label={t("volunteerRegister.mediaConsent")}
          value={form.mediaConsent}
          onChange={(v) => set("mediaConsent", v)}
        />

        <TouchableOpacity style={styles.primaryButton} onPress={submit} disabled={submitting}>
          {submitting ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.primaryButtonText}>{t("volunteerRegister.submit")}</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
          <Text style={styles.backLinkText}>{t("common.back")}</Text>
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
  const { t } = useTranslation();
  return (
    <View style={styles.docTile}>
      <TouchableOpacity style={[styles.docPicker, round && styles.docPickerRound]} onPress={onPress} disabled={uploading}>
        {uploading ? (
          <ActivityIndicator color={colors.muted} />
        ) : uri ? (
          <Image source={{ uri }} style={[styles.docPreview, round && styles.docPickerRound]} />
        ) : (
          <Text style={styles.docPickerText}>{t("volunteerRegister.upload")}</Text>
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
