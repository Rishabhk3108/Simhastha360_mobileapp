import { useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, fonts } from "../theme";

export interface SelectOption {
  value: string;
  label: string;
}

interface Props {
  label: string;
  placeholder?: string;
  options: SelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
}

export function MultiSelectField({ label, placeholder = "Select...", options, selected, onChange }: Props) {
  const [visible, setVisible] = useState(false);

  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  }

  const summary = options.filter((o) => selected.includes(o.value)).map((o) => o.label);

  return (
    <>
      <TouchableOpacity style={styles.field} onPress={() => setVisible(true)}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={[styles.fieldValue, summary.length === 0 && styles.fieldPlaceholder]} numberOfLines={1}>
          {summary.length > 0 ? summary.join(", ") : placeholder}
        </Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <ScrollView style={styles.optionList}>
              {options.map((o) => {
                const checked = selected.includes(o.value);
                return (
                  <TouchableOpacity key={o.value} style={styles.optionRow} onPress={() => toggle(o.value)}>
                    <View style={[styles.checkbox, checked && styles.checkboxChecked]} />
                    <Text style={styles.optionLabel}>{o.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.doneButton} onPress={() => setVisible(false)}>
              <Text style={styles.doneButtonText}>Done ({selected.length} selected)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 11,
    backgroundColor: colors.surface,
  },
  fieldLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.muted2, marginBottom: 3 },
  fieldValue: { fontFamily: fonts.body, fontSize: 14, color: colors.ink },
  fieldPlaceholder: { color: colors.faint },
  backdrop: { flex: 1, backgroundColor: "rgba(27,33,64,0.55)", justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, maxHeight: "75%" },
  sheetTitle: { fontFamily: fonts.display, fontSize: 18, color: colors.ink, marginBottom: 12 },
  optionList: { maxHeight: 360 },
  optionRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: colors.border },
  checkboxChecked: { backgroundColor: colors.teal, borderColor: colors.teal },
  optionLabel: { fontFamily: fonts.body, fontSize: 14.5, color: colors.ink },
  doneButton: { backgroundColor: colors.ink, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 14 },
  doneButtonText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.surface },
});
