import { StyleSheet, Text, TextInput, View } from "react-native";
import { colors, fonts } from "../../theme";
import type { GuardianFields } from "./types";

interface Props {
  values: GuardianFields;
  onChange: (values: GuardianFields) => void;
  title?: string;
}

export function GuardianFieldsSection({ values, onChange, title = "Guardian details" }: Props) {
  function set<K extends keyof GuardianFields>(key: K, value: GuardianFields[K]) {
    onChange({ ...values, [key]: value });
  }

  return (
    <View style={{ gap: 10 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <TextInput style={styles.input} placeholder="Guardian's full name" value={values.name} onChangeText={(v) => set("name", v)} />
      <TextInput style={styles.input} placeholder="Guardian's phone number" value={values.phone} onChangeText={(v) => set("phone", v)} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="Guardian's Aadhar number" value={values.aadharNumber} onChangeText={(v) => set("aadharNumber", v)} keyboardType="number-pad" maxLength={12} />
      <TextInput style={styles.input} placeholder="Guardian's email (optional)" value={values.email} onChangeText={(v) => set("email", v)} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Relation to pilgrim (e.g. Son, Daughter)" value={values.relationToPilgrim} onChangeText={(v) => set("relationToPilgrim", v)} />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink, marginTop: 6 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 11, backgroundColor: colors.surface, fontFamily: fonts.body },
});
