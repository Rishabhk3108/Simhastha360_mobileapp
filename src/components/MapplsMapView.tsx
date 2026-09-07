import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { WebView } from "react-native-webview";
import { buildMapplsMapHtml } from "./mapplsMapHtml";
import { colors, fonts } from "../theme";

const MAPPLS_KEY = process.env.EXPO_PUBLIC_MAPPLS_KEY ?? "";

export interface MapplsMapHandle {
  setUserLocation: (lat: number, lng: number, recenter?: boolean) => void;
  setDestination: (lat: number, lng: number, label?: string) => void;
  drawRoute: (coordinates: { lat: number; lng: number }[]) => void;
  clearRoute: () => void;
}

interface Props {
  initialLat: number;
  initialLng: number;
  onReady?: () => void;
}

export const MapplsMapView = forwardRef<MapplsMapHandle, Props>(({ initialLat, initialLng, onReady }, ref) => {
  const webviewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  function send(command: object) {
    webviewRef.current?.postMessage(JSON.stringify(command));
  }

  useImperativeHandle(ref, () => ({
    setUserLocation: (lat, lng, recenter = false) => send({ type: "setUserLocation", lat, lng, recenter }),
    setDestination: (lat, lng, label) => send({ type: "setDestination", lat, lng, label }),
    drawRoute: (coordinates) => send({ type: "drawRoute", coordinates: coordinates.map((c) => [c.lat, c.lng]) }),
    clearRoute: () => send({ type: "clearRoute" }),
  }));

  function retry() {
    setError(null);
    setLoading(true);
    setReloadKey((k) => k + 1);
  }

  return (
    <View style={styles.container}>
      <WebView
        key={reloadKey}
        ref={webviewRef}
        originWhitelist={["*"]}
        source={{ html: buildMapplsMapHtml(MAPPLS_KEY, initialLat, initialLng) }}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === "mapReady") {
              setLoading(false);
              onReady?.();
            } else if (data.type === "mapError") {
              setLoading(false);
              setError(data.message);
            }
          } catch {
            // ignore malformed messages
          }
        }}
        onError={() => {
          setLoading(false);
          setError("Could not load the map (no connection?).");
        }}
        javaScriptEnabled
        domStorageEnabled
        style={styles.webview}
      />
      {loading && !error && (
        <View style={styles.overlay}>
          <ActivityIndicator color={colors.ink} size="large" />
        </View>
      )}
      {error && (
        <View style={styles.overlay}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={retry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, borderRadius: 20, overflow: "hidden" },
  webview: { flex: 1, backgroundColor: "#EFE7D6" },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#EFE7D6",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 14,
  },
  errorText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.redDeep, textAlign: "center" },
  retryButton: { backgroundColor: colors.ink, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 11 },
  retryButtonText: { fontFamily: fonts.bodyBold, color: colors.surface, fontSize: 13.5 },
});
