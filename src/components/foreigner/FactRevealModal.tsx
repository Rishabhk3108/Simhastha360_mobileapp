import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { X } from "../icons";
import { colors, fonts } from "../../theme";

interface Props {
  factKey: string | null;
  onClose: () => void;
}

export function FactRevealModal({ factKey, onClose }: Props) {
  const { t } = useTranslation();

  return (
    <Modal visible={!!factKey} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={18} color={colors.surface} weight="bold" />
          </TouchableOpacity>
          <View style={styles.iconWrap}>
            <Ionicons name="bulb" size={28} color={colors.ink} />
          </View>
          <Text style={styles.label}>{t("culturalFacts.label")}</Text>
          {factKey && <Text style={styles.factText}>{t(`culturalFacts.${factKey}`)}</Text>}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(27,33,64,0.65)", alignItems: "center", justifyContent: "center", padding: 28 },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: colors.ink,
    borderRadius: 24,
    padding: 26,
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 14,
    right: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brass,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  label: { fontFamily: fonts.bodyBold, fontSize: 11.5, color: colors.brass, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 },
  factText: { fontFamily: fonts.display, fontSize: 18, color: colors.surface, textAlign: "center", lineHeight: 26 },
});
