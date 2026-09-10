import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { X } from "../icons";
import { colors, fonts } from "../../theme";

interface Props {
  visible: boolean;
  onClose: () => void;
}

const SECTION_KEYS = ["what", "manthan", "whyUjjain", "whyDevoteesCome", "shahiSnan", "dates2028"];

export function SimhasthaInfoModal({ visible, onClose }: Props) {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.title}>{t("simhasthaInfo.title")}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={22} color={colors.surface} weight="bold" />
          </TouchableOpacity>
        </View>
        <Text style={styles.wordmark}>सिंहस्थ ३६०</Text>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {SECTION_KEYS.map((key) => (
            <View key={key} style={styles.section}>
              <Text style={styles.sectionTitle}>{t(`simhasthaInfo.${key}.title`)}</Text>
              <Text style={styles.sectionBody}>{t(`simhasthaInfo.${key}.body`)}</Text>
            </View>
          ))}
          <Text style={styles.footnote}>{t("simhasthaInfo.footnote")}</Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingTop: 56,
  },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.surface },
  wordmark: { fontFamily: fonts.wordmark, fontSize: 15, color: colors.brass, paddingHorizontal: 22, marginTop: 4, letterSpacing: 1 },
  content: { padding: 22, paddingTop: 18, paddingBottom: 48, gap: 22 },
  section: { gap: 8 },
  sectionTitle: { fontFamily: fonts.display, fontSize: 18, color: colors.brass },
  sectionBody: { fontFamily: fonts.body, fontSize: 14, color: "rgba(255,253,248,0.88)", lineHeight: 21 },
  footnote: { fontFamily: fonts.body, fontSize: 11.5, color: "rgba(255,253,248,0.5)", fontStyle: "italic", marginTop: 4 },
});
