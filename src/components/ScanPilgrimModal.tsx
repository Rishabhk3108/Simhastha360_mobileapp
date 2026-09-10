import { useState } from "react";
import { ActivityIndicator, Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { X } from "./icons";
import { linkPilgrimByToken } from "../api/guardians";
import { colors, fonts } from "../theme";

interface Props {
  visible: boolean;
  onClose: () => void;
  onLinked: () => void;
}

export function ScanPilgrimModal({ visible, onClose, onLinked }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [linking, setLinking] = useState(false);

  function reset() {
    setScanning(true);
    setLinking(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleScanned({ data }: { data: string }) {
    if (!scanning || linking) return;
    setScanning(false);
    setLinking(true);
    try {
      await linkPilgrimByToken(data.trim());
      reset();
      onLinked();
    } catch (err: any) {
      Alert.alert(
        "Could not add this member",
        err.response?.data?.detail ?? "This code may have expired. Ask them to generate a new one and try again.",
        [{ text: "OK", onPress: () => setScanning(true) }],
      );
      setLinking(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.title}>Scan QR code</Text>
          <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={22} color={colors.surface} weight="bold" />
          </TouchableOpacity>
        </View>

        {!permission ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.surface} />
          </View>
        ) : !permission.granted ? (
          <View style={styles.center}>
            <Text style={styles.permissionText}>Camera access is needed to scan the pilgrim's code.</Text>
            <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
              <Text style={styles.permissionButtonText}>Allow camera access</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={scanning ? handleScanned : undefined}
            />
            <View style={styles.frameOverlay}>
              <View style={styles.frame} />
              <Text style={styles.hint}>
                {linking ? "Adding member…" : "Point your camera at the pilgrim's QR code"}
              </Text>
              {linking && <ActivityIndicator color={colors.surface} style={{ marginTop: 12 }} />}
            </View>
          </>
        )}
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: { fontFamily: fonts.display, fontSize: 20, color: colors.surface },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30, gap: 18 },
  permissionText: { fontFamily: fonts.body, fontSize: 14.5, color: colors.surface, textAlign: "center", lineHeight: 21 },
  permissionButton: { backgroundColor: colors.surface, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 13 },
  permissionButtonText: { fontFamily: fonts.bodyBold, color: colors.ink },
  camera: { flex: 1 },
  frameOverlay: {
    position: "absolute",
    top: 130,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    paddingTop: 40,
  },
  frame: { width: 240, height: 240, borderWidth: 3, borderColor: colors.surface, borderRadius: 20, backgroundColor: "transparent" },
  hint: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.surface, marginTop: 20, textAlign: "center", paddingHorizontal: 30 },
});
