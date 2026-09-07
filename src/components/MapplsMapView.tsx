import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { buildMapplsMapHtml } from "./mapplsMapHtml";
import { colors } from "../theme";

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

  function send(command: object) {
    webviewRef.current?.postMessage(JSON.stringify(command));
  }

  useImperativeHandle(ref, () => ({
    setUserLocation: (lat, lng, recenter = false) => send({ type: "setUserLocation", lat, lng, recenter }),
    setDestination: (lat, lng, label) => send({ type: "setDestination", lat, lng, label }),
    drawRoute: (coordinates) => send({ type: "drawRoute", coordinates: coordinates.map((c) => [c.lat, c.lng]) }),
    clearRoute: () => send({ type: "clearRoute" }),
  }));

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        originWhitelist={["*"]}
        source={{ html: buildMapplsMapHtml(MAPPLS_KEY, initialLat, initialLng) }}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === "mapReady") {
              setLoading(false);
              onReady?.();
            }
          } catch {
            // ignore malformed messages
          }
        }}
        javaScriptEnabled
        domStorageEnabled
        style={styles.webview}
      />
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={colors.ink} size="large" />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, borderRadius: 20, overflow: "hidden" },
  webview: { flex: 1, backgroundColor: "#EFE7D6" },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#EFE7D6",
    alignItems: "center",
    justifyContent: "center",
  },
});
