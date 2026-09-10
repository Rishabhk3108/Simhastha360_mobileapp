import { useEffect, useRef, useState } from "react";
import { Dimensions, PanResponder, StyleSheet, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WarningCircle } from "./icons";
import { ReportIssueModal } from "./ReportIssueModal";
import { colors } from "../theme";

const BUTTON_SIZE = 58;
const EDGE_MARGIN = 12;
const TOP_MARGIN = 60;
const BOTTOM_MARGIN = 110; // keeps it clear of the bottom tab bar by default
const DRAG_THRESHOLD = 6;
const POSITION_STORAGE_KEY = "s360_report_button_position";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

const DEFAULT_POSITION = {
  x: SCREEN_W - BUTTON_SIZE - EDGE_MARGIN,
  y: SCREEN_H - BUTTON_SIZE - BOTTOM_MARGIN,
};

export function FloatingReportButton() {
  const [pos, setPos] = useState(DEFAULT_POSITION);
  const [modalVisible, setModalVisible] = useState(false);
  const posRef = useRef(pos);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const movedRef = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(POSITION_STORAGE_KEY).then((saved) => {
      if (!saved) return;
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          const next = {
            x: clamp(parsed.x, EDGE_MARGIN, SCREEN_W - BUTTON_SIZE - EDGE_MARGIN),
            y: clamp(parsed.y, TOP_MARGIN, SCREEN_H - BUTTON_SIZE - BOTTOM_MARGIN),
          };
          posRef.current = next;
          setPos(next);
        }
      } catch {
        // ignore malformed saved position, keep default
      }
    });
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2,
      onPanResponderGrant: () => {
        dragStartRef.current = { ...posRef.current };
        movedRef.current = false;
      },
      onPanResponderMove: (_, gesture) => {
        if (Math.abs(gesture.dx) > DRAG_THRESHOLD || Math.abs(gesture.dy) > DRAG_THRESHOLD) {
          movedRef.current = true;
        }
        const next = {
          x: clamp(dragStartRef.current.x + gesture.dx, EDGE_MARGIN, SCREEN_W - BUTTON_SIZE - EDGE_MARGIN),
          y: clamp(dragStartRef.current.y + gesture.dy, TOP_MARGIN, SCREEN_H - BUTTON_SIZE - EDGE_MARGIN),
        };
        posRef.current = next;
        setPos(next);
      },
      onPanResponderRelease: () => {
        AsyncStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(posRef.current)).catch(() => {});
        if (!movedRef.current) {
          setModalVisible(true);
        }
      },
    }),
  ).current;

  return (
    <>
      <View
        {...panResponder.panHandlers}
        style={[styles.button, { left: pos.x, top: pos.y }]}
      >
        <WarningCircle size={26} color={colors.surface} weight="fill" />
      </View>
      <ReportIssueModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: colors.redDeep,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.ink,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    zIndex: 999,
  },
});
