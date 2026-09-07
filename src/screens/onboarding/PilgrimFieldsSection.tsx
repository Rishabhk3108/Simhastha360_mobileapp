import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { colors, fonts } from "../../theme";
import type { PilgrimFields } from "./types";

interface Props {
  values: PilgrimFields;
  onChange: (values: PilgrimFields) => void;
  title?: string;
}

export function PilgrimFieldsSection({ values, onChange, title = "Pilgrim details" }: Props) {
  function set<K extends keyof PilgrimFields>(key: K, value: PilgrimFields[K]) {
    onChange({ ...values, [key]: value });
  }

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
      <Text style={styles.sectionTitle}>{title}</Text>

      <TouchableOpacity style={styles.photoPicker} onPress={pickPhoto}>
        {values.photoBase64 ? (
          <Image source={{ uri: values.photoBase64 }} style={styles.photoPreview} />
        ) : (
          <Text style={styles.photoPickerText}>Add photo</Text>
        )}
      </TouchableOpacity>

      <TextInput style={styles.input} placeholder="Full name" value={values.name} onChangeText={(v) => set("name", v)} />
      <TextInput style={styles.input} placeholder="Phone number" value={values.phone} onChangeText={(v) => set("phone", v)} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="Age" value={values.age} onChangeText={(v) => set("age", v)} keyboardType="number-pad" />
      <TextInput style={styles.input} placeholder="Aadhar number" value={values.aadharNumber} onChangeText={(v) => set("aadharNumber", v)} keyboardType="number-pad" maxLength={12} />
      <TextInput style={styles.input} placeholder="Samagra ID (optional)" value={values.samagraId} onChangeText={(v) => set("samagraId", v)} />

      <Text style={styles.subTitle}>Address</Text>
      <TextInput style={styles.input} placeholder="Address line 1" value={values.addressLine1} onChangeText={(v) => set("addressLine1", v)} />
      <TextInput style={styles.input} placeholder="Address line 2 (optional)" value={values.addressLine2} onChangeText={(v) => set("addressLine2", v)} />
      <View style={styles.row}>
        <TextInput style={[styles.input, styles.rowInput]} placeholder="City" value={values.city} onChangeText={(v) => set("city", v)} />
        <TextInput style={[styles.input, styles.rowInput]} placeholder="State" value={values.state} onChangeText={(v) => set("state", v)} />
      </View>
      <View style={styles.row}>
        <TextInput style={[styles.input, styles.rowInput]} placeholder="Pincode" value={values.pincode} onChangeText={(v) => set("pincode", v)} keyboardType="number-pad" />
        <TextInput style={[styles.input, styles.rowInput]} placeholder="Country" value={values.country} onChangeText={(v) => set("country", v)} />
      </View>

      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Any serious medical history (optional)"
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
