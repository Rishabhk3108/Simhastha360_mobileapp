import { useState } from "react";
import { ActivityIndicator, Alert, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { Camera, X } from "./icons";
import { uploadDocument } from "../api/volunteers";
import { MIN_COMPLETION_PHOTOS, submitTaskPhotos } from "../api/tasks";
import { colors, fonts } from "../theme";

interface Props {
  visible: boolean;
  taskId: number | null;
  onClose: () => void;
  onSubmitted: () => void;
}

export function TaskCompletionModal({ visible, taskId, onClose, onSubmitted }: Props) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [capturing, setCapturing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setPhotos([]);
    setCapturing(false);
    setSubmitting(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function capturePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera permission needed", "Please allow camera access to capture completion photos.");
      return;
    }
    setCapturing(true);
    try {
      const picked = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.7 });
      if (picked.canceled) return;
      const resized = await ImageManipulator.manipulateAsync(picked.assets[0].uri, [{ resize: { width: 1000 } }], {
        compress: 0.6,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      setPhotos((p) => [...p, resized.uri]);
    } catch {
      Alert.alert("Could not capture photo", "Please try again.");
    } finally {
      setCapturing(false);
    }
  }

  function removePhoto(index: number) {
    setPhotos((p) => p.filter((_, i) => i !== index));
  }

  async function submit() {
    if (!taskId || photos.length < MIN_COMPLETION_PHOTOS) return;
    setSubmitting(true);
    try {
      const docIds = await Promise.all(photos.map((uri, i) => uploadDocument(uri, `completion-${i}.jpg`, "image/jpeg")));
      await submitTaskPhotos(taskId, docIds);
      reset();
      onSubmitted();
    } catch {
      Alert.alert("Could not submit", "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.title}>Complete task</Text>
          <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={22} color={colors.ink} weight="bold" />
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>
          Capture at least {MIN_COMPLETION_PHOTOS} photos showing the task is done. Your manager will review them before this task
          counts as complete.
        </Text>

        <ScrollView contentContainerStyle={styles.grid}>
          {photos.map((uri, i) => (
            <View key={uri} style={styles.thumbWrap}>
              <Image source={{ uri }} style={styles.thumb} />
              <TouchableOpacity style={styles.removeBadge} onPress={() => removePhoto(i)}>
                <X size={12} color={colors.surface} weight="bold" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.addTile} onPress={capturePhoto} disabled={capturing}>
            {capturing ? <ActivityIndicator color={colors.ink} /> : <Camera size={26} color={colors.muted} />}
            <Text style={styles.addTileText}>Add photo</Text>
          </TouchableOpacity>
        </ScrollView>

        <Text style={styles.count}>
          {photos.length} / {MIN_COMPLETION_PHOTOS}+ photos
        </Text>

        <TouchableOpacity
          style={[styles.submitButton, (photos.length < MIN_COMPLETION_PHOTOS || submitting) && styles.submitButtonDisabled]}
          onPress={submit}
          disabled={photos.length < MIN_COMPLETION_PHOTOS || submitting}
        >
          {submitting ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.submitButtonText}>Submit for review</Text>}
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, padding: 20, paddingTop: 60 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.ink },
  subtitle: { fontFamily: fonts.body, fontSize: 13.5, color: colors.muted, marginTop: 8, lineHeight: 19 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 20 },
  thumbWrap: { width: 96, height: 96, borderRadius: 14, overflow: "hidden" },
  thumb: { width: "100%", height: "100%" },
  removeBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: colors.redDeep,
    borderRadius: 999,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  addTile: {
    width: 96,
    height: 96,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  addTileText: { fontFamily: fonts.body, fontSize: 11, color: colors.muted },
  count: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.muted, marginTop: 16 },
  submitButton: { backgroundColor: colors.ink, borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 16 },
  submitButtonDisabled: { opacity: 0.4 },
  submitButtonText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.surface },
});
