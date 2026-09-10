import { Linking, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { NavigationArrow, X } from "../icons";
import type { PointOfInterest } from "../../api/pointsOfInterest";
import { colors, fonts } from "../../theme";

interface Props {
  place: PointOfInterest | null;
  onClose: () => void;
}

export function PlaceDetailModal({ place, onClose }: Props) {
  const { t } = useTranslation();

  function getDirections() {
    if (!place) return;
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`).catch(() => {});
  }

  return (
    <Modal visible={!!place} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        {place && (
          <>
            <View style={styles.hero}>
              <MaterialCommunityIcons name={place.icon as any} size={72} color={colors.brass} />
              <TouchableOpacity style={styles.closeButton} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={20} color={colors.surface} weight="bold" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
              <Text style={styles.category}>{t(`foreignerHome.category.${place.category}`)}</Text>
              <Text style={styles.name}>{place.name}</Text>
              <Text style={styles.description}>{place.description}</Text>

              <TouchableOpacity style={styles.directionsButton} onPress={getDirections}>
                <NavigationArrow size={18} color={colors.surface} />
                <Text style={styles.directionsButtonText}>{t("foreignerHome.getDirections")}</Text>
              </TouchableOpacity>
            </ScrollView>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hero: {
    height: 220,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: {
    position: "absolute",
    top: 56,
    right: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 999,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: 24, paddingBottom: 48, gap: 6 },
  category: { fontFamily: fonts.bodyBold, fontSize: 11.5, color: colors.saffronDeep, textTransform: "uppercase", letterSpacing: 0.6 },
  name: { fontFamily: fonts.display, fontSize: 24, color: colors.ink, marginTop: 4 },
  description: { fontFamily: fonts.body, fontSize: 14.5, color: colors.muted, lineHeight: 22, marginTop: 10 },
  directionsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: colors.ink,
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 24,
  },
  directionsButtonText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.surface },
});
