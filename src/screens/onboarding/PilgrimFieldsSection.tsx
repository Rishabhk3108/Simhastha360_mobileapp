import { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { colors, fonts } from "../../theme";
import { PasswordStrengthMeter } from "../../components/PasswordStrengthMeter";
import { TextInput } from "../../components/AppTextInput";
import type { PilgrimFields } from "./types";

interface Props {
  values: PilgrimFields;
  onChange: (values: PilgrimFields) => void;
  onPasswordValidityChange?: (valid: boolean) => void;
  title?: string;
}

const MIN_PASSWORD_LENGTH = 8;

export function PilgrimFieldsSection({ values, onChange, onPasswordValidityChange, title }: Props) {
  const { t } = useTranslation();
  const [confirmPassword, setConfirmPassword] = useState("");

  function set<K extends keyof PilgrimFields>(key: K, value: PilgrimFields[K]) {
    onChange({ ...values, [key]: value });
  }

  const passwordLongEnough = values.password.length >= MIN_PASSWORD_LENGTH;
  const passwordsMatch = confirmPassword.length > 0 && values.password === confirmPassword;
  const showMismatch = confirmPassword.length > 0 && !passwordsMatch;

  useEffect(() => {
    onPasswordValidityChange?.(passwordLongEnough && passwordsMatch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passwordLongEnough, passwordsMatch]);

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (picked.canceled) return;

    // Quality alone doesn't cap resolution - a phone camera photo can still be
    // several MB even at low JPEG quality, which is slow to upload on mobile
    // data and can exceed the backend's request time limit. Resizing down to
    // a small fixed width keeps the payload tiny regardless of source photo size.
    const resized = await ImageManipulator.manipulateAsync(picked.assets[0].uri, [{ resize: { width: 480 } }], {
      compress: 0.5,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    });
    if (resized.base64) {
      set("photoBase64", `data:image/jpeg;base64,${resized.base64}`);
    }
  }

  return (
    <View style={{ gap: 10 }}>
      <Text style={styles.sectionTitle}>{title ?? t("pilgrimFields.defaultTitle")}</Text>

      <TouchableOpacity style={styles.photoPicker} onPress={pickPhoto}>
        {values.photoBase64 ? (
          <Image source={{ uri: values.photoBase64 }} style={styles.photoPreview} />
        ) : (
          <Text style={styles.photoPickerText}>{t("pilgrimFields.addPhoto")}</Text>
        )}
      </TouchableOpacity>

      <TextInput style={styles.input} placeholder={t("pilgrimFields.fullName")} value={values.name} onChangeText={(v) => set("name", v)} />
      <TextInput style={styles.input} placeholder={t("pilgrimFields.phone")} value={values.phone} onChangeText={(v) => set("phone", v)} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder={t("pilgrimFields.age")} value={values.age} onChangeText={(v) => set("age", v)} keyboardType="number-pad" />
      <TextInput style={styles.input} placeholder={t("pilgrimFields.aadhar")} value={values.aadharNumber} onChangeText={(v) => set("aadharNumber", v)} keyboardType="number-pad" maxLength={12} />
      <TextInput style={styles.input} placeholder={t("pilgrimFields.samagraId")} value={values.samagraId} onChangeText={(v) => set("samagraId", v)} />

      <TextInput style={styles.input} placeholder={t("common.passwordPlaceholder")} value={values.password} onChangeText={(v) => set("password", v)} secureTextEntry />
      <PasswordStrengthMeter password={values.password} />
      <TextInput style={styles.input} placeholder={t("common.confirmPasswordPlaceholder")} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
      {showMismatch && <Text style={styles.errorText}>{t("pilgrimFields.passwordMismatch")}</Text>}

      <Text style={styles.subTitle}>{t("pilgrimFields.addressTitle")}</Text>
      <TextInput style={styles.input} placeholder={t("pilgrimFields.addressLine1")} value={values.addressLine1} onChangeText={(v) => set("addressLine1", v)} />
      <TextInput style={styles.input} placeholder={t("pilgrimFields.addressLine2")} value={values.addressLine2} onChangeText={(v) => set("addressLine2", v)} />
      <View style={styles.row}>
        <TextInput style={[styles.input, styles.rowInput]} placeholder={t("pilgrimFields.city")} value={values.city} onChangeText={(v) => set("city", v)} />
        <TextInput style={[styles.input, styles.rowInput]} placeholder={t("pilgrimFields.state")} value={values.state} onChangeText={(v) => set("state", v)} />
      </View>
      <View style={styles.row}>
        <TextInput style={[styles.input, styles.rowInput]} placeholder={t("pilgrimFields.pincode")} value={values.pincode} onChangeText={(v) => set("pincode", v)} keyboardType="number-pad" />
        <TextInput style={[styles.input, styles.rowInput]} placeholder={t("pilgrimFields.country")} value={values.country} onChangeText={(v) => set("country", v)} />
      </View>

      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder={t("pilgrimFields.medicalHistory")}
        value={values.medicalHistory}
        onChangeText={(v) => set("medicalHistory", v)}
        multiline
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink, marginTop: 6 },
  subTitle: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.muted2, marginTop: 4 },
  errorText: { fontFamily: fonts.body, fontSize: 12, color: colors.redDeep, marginTop: -6 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 11, backgroundColor: colors.surface, fontFamily: fonts.body },
  multiline: { minHeight: 80, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 8 },
  rowInput: { flex: 1 },
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
});
