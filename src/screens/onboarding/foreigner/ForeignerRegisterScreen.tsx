import { useState } from "react";
import { ActivityIndicator, Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { colors, fonts } from "../../../theme";
import { TextInput } from "../../../components/AppTextInput";
import { registerForeigner } from "../../../api/pilgrims";
import { usePilgrim } from "../../../pilgrim/PilgrimContext";
import { emptyForeignerFields } from "../types";
import type { OnboardingStackParamList } from "../../../navigation/AppStack";

type Props = NativeStackScreenProps<OnboardingStackParamList, "ForeignerRegister">;

export function ForeignerRegisterScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { setProfile } = usePilgrim();
  const [fields, setFields] = useState(emptyForeignerFields);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof typeof fields>(key: K, value: (typeof fields)[K]) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1] });
    if (picked.canceled) return;
    const resized = await ImageManipulator.manipulateAsync(picked.assets[0].uri, [{ resize: { width: 480 } }], {
      compress: 0.5,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    });
    if (resized.base64) set("photoBase64", `data:image/jpeg;base64,${resized.base64}`);
  }

  async function submit() {
    if (!fields.name.trim() || !fields.phone.trim() || !fields.country.trim()) {
      Alert.alert(t("foreignerRegister.missingTitle"), t("foreignerRegister.missingBody"));
      return;
    }
    if (fields.password.length < 8) {
      Alert.alert(t("guardianRegister.shortPasswordTitle"), t("guardianRegister.shortPasswordBody"));
      return;
    }
    if (fields.password !== confirmPassword) {
      Alert.alert(t("guardianRegister.mismatchTitle"), t("guardianRegister.mismatchBody"));
      return;
    }
    setSubmitting(true);
    try {
      const result = await registerForeigner(fields);
      await setProfile({ pilgrimId: result.pilgrim_id, pilgrim: { ...emptyForeignerFieldsAsPilgrim(fields) } });
      navigation.replace("ForeignerWelcome");
    } catch (err: any) {
      if (err.response?.status === 409) {
        Alert.alert(t("guardianRegister.existsTitle"), t("foreignerRegister.existsBody"));
      } else if (!err.response) {
        Alert.alert(t("common.noConnectionTitle"), t("common.noConnectionBody"));
      } else {
        Alert.alert(t("guardianRegister.errorTitle"), t("common.tryAgain"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t("foreignerRegister.title")}</Text>
        <Text style={styles.subtitle}>{t("foreignerRegister.subtitle")}</Text>

        <TouchableOpacity style={styles.photoPicker} onPress={pickPhoto}>
          {fields.photoBase64 ? (
            <Image source={{ uri: fields.photoBase64 }} style={styles.photoPreview} />
          ) : (
            <Text style={styles.photoPickerText}>{t("pilgrimFields.addPhoto")}</Text>
          )}
        </TouchableOpacity>

        <TextInput style={styles.input} placeholder={t("pilgrimFields.fullName")} value={fields.name} onChangeText={(v) => set("name", v)} />
        <TextInput style={styles.input} placeholder={t("common.phonePlaceholder")} value={fields.phone} onChangeText={(v) => set("phone", v)} keyboardType="phone-pad" />
        <TextInput style={styles.input} placeholder={t("foreignerRegister.countryPlaceholder")} value={fields.country} onChangeText={(v) => set("country", v)} />
        <TextInput style={styles.input} placeholder={t("common.passwordPlaceholder")} value={fields.password} onChangeText={(v) => set("password", v)} secureTextEntry />
        <TextInput style={styles.input} placeholder={t("common.confirmPasswordPlaceholder")} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

        <TouchableOpacity style={styles.submitButton} onPress={submit} disabled={submitting}>
          {submitting ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.submitButtonText}>{t("common.register")}</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
          <Text style={styles.backLinkText}>{t("common.back")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function emptyForeignerFieldsAsPilgrim(fields: typeof emptyForeignerFields) {
  return {
    name: fields.name,
    phone: fields.phone,
    aadharNumber: "",
    password: "",
    age: "",
    photoBase64: fields.photoBase64,
    samagraId: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: fields.country,
    medicalHistory: "",
    isForeigner: true,
  };
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 24, gap: 12, paddingBottom: 40 },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.ink },
  subtitle: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginBottom: 6 },
  photoPicker: {
    alignSelf: "center",
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surfaceTint,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  photoPickerText: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, textAlign: "center" },
  photoPreview: { width: 96, height: 96 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 13, backgroundColor: colors.surface, fontFamily: fonts.body, fontSize: 14.5, color: colors.ink },
  submitButton: { backgroundColor: colors.ink, borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 8 },
  submitButtonText: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: colors.surface },
  backLink: { alignItems: "center", marginTop: 14 },
  backLinkText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.muted },
});
