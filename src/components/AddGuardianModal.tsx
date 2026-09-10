import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { X } from "./icons";
import { createGuardianLinkToken } from "../api/pilgrims";
import { colors, fonts } from "../theme";

interface Props {
  visible: boolean;
  pilgrimId: number;
  onClose: () => void;
}

export function AddGuardianModal({ visible, pilgrimId, onClose }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    setToken(null);
    try {
      const result = await createGuardianLinkToken(pilgrimId);
      setToken(result.token);
    } catch {
      Alert.alert("Could not generate code", "Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (visible) generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Add a guardian</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={20} color={colors.ink} weight="bold" />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>
            Have them open the app, sign in as a Guardian, and tap "Add member" to scan this code.
          </Text>

          <View style={styles.qrWrap}>
            {loading ? <ActivityIndicator color={colors.ink} size="large" /> : token ? <QRCode value={token} size={200} /> : null}
          </View>

          {token && <Text style={styles.code}>{token}</Text>}
          <Text style={styles.expiry}>Valid for 15 minutes.</Text>

          <TouchableOpacity style={styles.regenerateButton} onPress={generate} disabled={loading}>
            <Text style={styles.regenerateButtonText}>Generate a new code</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(27,33,64,0.55)", alignItems: "center", justifyContent: "center", padding: 24 },
  card: { width: "100%", maxWidth: 380, backgroundColor: colors.surface, borderRadius: 24, padding: 24, alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" },
  title: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  subtitle: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, textAlign: "center", marginTop: 8, lineHeight: 19 },
  qrWrap: { width: 220, height: 220, alignItems: "center", justifyContent: "center", marginTop: 20 },
  code: { fontFamily: fonts.bodyBold, fontSize: 20, letterSpacing: 3, color: colors.ink, marginTop: 16 },
  expiry: { fontFamily: fonts.body, fontSize: 12, color: colors.muted2, marginTop: 6 },
  regenerateButton: { marginTop: 20, paddingVertical: 10 },
  regenerateButtonText: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.saffronDeep, textDecorationLine: "underline" },
});
