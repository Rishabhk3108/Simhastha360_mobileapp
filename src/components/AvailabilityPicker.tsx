import { useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { X } from "./icons";
import { colors, fonts } from "../theme";
import type { AvailabilitySlot } from "../api/volunteers";

// Deliberately chip-based rather than a native date/time picker: this app
// already has a working native dev-client build, and adding a native
// picker dependency here would mean another full native rebuild cycle just
// for one form field. Chips also keep choices anchored to the actual event
// window instead of letting someone pick an unrelated date.
const DAYS_AHEAD = 60;
const HOUR_OPTIONS = Array.from({ length: 18 }, (_, i) => `${String(i + 5).padStart(2, "0")}:00`); // 05:00-22:00

function nextDates(count: number): { value: string; label: string }[] {
  const out = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const value = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
    out.push({ value, label });
  }
  return out;
}

function formatSlot(slot: AvailabilitySlot): string {
  const d = new Date(slot.date);
  const dateLabel = Number.isNaN(d.getTime()) ? slot.date : d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  return `${dateLabel} · ${slot.start_time}–${slot.end_time}`;
}

interface Props {
  slots: AvailabilitySlot[];
  onChange: (slots: AvailabilitySlot[]) => void;
}

export function AvailabilityPicker({ slots, onChange }: Props) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [date, setDate] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);

  const dates = nextDates(DAYS_AHEAD);
  const canAdd = !!date && !!startTime && !!endTime && startTime < endTime;

  function openPicker() {
    setDate(null);
    setStartTime(null);
    setEndTime(null);
    setVisible(true);
  }

  function addSlot() {
    if (!canAdd || !date || !startTime || !endTime) return;
    onChange([...slots, { date, start_time: startTime, end_time: endTime }]);
    setVisible(false);
  }

  function removeSlot(index: number) {
    onChange(slots.filter((_, i) => i !== index));
  }

  return (
    <View style={{ gap: 8 }}>
      {slots.map((slot, i) => (
        <View key={`${slot.date}-${slot.start_time}-${i}`} style={styles.slotRow}>
          <Text style={styles.slotText}>{formatSlot(slot)}</Text>
          <TouchableOpacity onPress={() => removeSlot(i)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={14} color={colors.muted} />
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.addButton} onPress={openPicker}>
        <Text style={styles.addButtonText}>{t("availabilityPicker.addAvailability")}</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{t("availabilityPicker.sheetTitle")}</Text>

            <Text style={styles.label}>{t("availabilityPicker.date")}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {dates.map((d) => (
                <TouchableOpacity
                  key={d.value}
                  style={[styles.chip, date === d.value && styles.chipActive]}
                  onPress={() => setDate(d.value)}
                >
                  <Text style={[styles.chipText, date === d.value && styles.chipTextActive]}>{d.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>{t("availabilityPicker.startTime")}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {HOUR_OPTIONS.map((hour) => (
                <TouchableOpacity
                  key={hour}
                  style={[styles.chip, startTime === hour && styles.chipActive]}
                  onPress={() => setStartTime(hour)}
                >
                  <Text style={[styles.chipText, startTime === hour && styles.chipTextActive]}>{hour}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>{t("availabilityPicker.endTime")}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {HOUR_OPTIONS.map((hour) => (
                <TouchableOpacity
                  key={hour}
                  style={[styles.chip, endTime === hour && styles.chipActive]}
                  onPress={() => setEndTime(hour)}
                >
                  <Text style={[styles.chipText, endTime === hour && styles.chipTextActive]}>{hour}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {startTime && endTime && startTime >= endTime && (
              <Text style={styles.errorText}>{t("availabilityPicker.endBeforeStart")}</Text>
            )}

            <TouchableOpacity style={[styles.doneButton, !canAdd && styles.doneButtonDisabled]} disabled={!canAdd} onPress={addSlot}>
              <Text style={styles.doneButtonText}>{t("availabilityPicker.add")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setVisible(false)}>
              <Text style={styles.cancelButtonText}>{t("common.cancel")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  slotRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceTint,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  slotText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink },
  addButton: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  addButtonText: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.tealDeep },
  backdrop: { flex: 1, backgroundColor: "rgba(27,33,64,0.55)", justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22 },
  sheetTitle: { fontFamily: fonts.display, fontSize: 18, color: colors.ink, marginBottom: 14 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.muted2, marginBottom: 6 },
  chipRow: { flexGrow: 0, marginBottom: 14 },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  chipActive: { backgroundColor: colors.teal, borderColor: colors.teal },
  chipText: { fontFamily: fonts.body, fontSize: 12.5, color: colors.ink },
  chipTextActive: { color: colors.surface },
  errorText: { fontFamily: fonts.body, fontSize: 12, color: colors.redDeep, marginBottom: 10 },
  doneButton: { backgroundColor: colors.ink, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  doneButtonDisabled: { opacity: 0.4 },
  doneButtonText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.surface },
  cancelButton: { paddingVertical: 12, alignItems: "center" },
  cancelButtonText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.muted },
});
