import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { PlaceDetailModal } from "./PlaceDetailModal";
import { getPointsOfInterest, type PointOfInterest } from "../../api/pointsOfInterest";
import { useLocation } from "../../location/useLocation";
import { haversineKm } from "../../location/geo";
import { colors, fonts } from "../../theme";

// Cycles a nearby recommendation onto the screen roughly every 7s (a new
// place appears, stays up ~5.5s, a short gap, then the next one) - the
// "5-8 seconds" cadence the feature was asked for.
const CYCLE_INTERVAL_MS = 7000;
const VISIBLE_DURATION_MS = 5500;

export function RecommendedPlaceToast() {
  const { t } = useTranslation();
  const { coords } = useLocation();
  const [places, setPlaces] = useState<PointOfInterest[]>([]);
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(false);
  const [selected, setSelected] = useState<PointOfInterest | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getPointsOfInterest()
      .then(setPlaces)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (places.length === 0) return;
    let cancelled = false;
    let showTimer: ReturnType<typeof setTimeout>;
    let hideTimer: ReturnType<typeof setTimeout>;

    function cycle() {
      showTimer = setTimeout(() => {
        if (cancelled) return;
        setIndex((i) => (i + 1) % places.length);
        setShown(true);
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        hideTimer = setTimeout(() => {
          if (cancelled) return;
          Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => setShown(false));
          cycle();
        }, VISIBLE_DURATION_MS);
      }, CYCLE_INTERVAL_MS - VISIBLE_DURATION_MS);
    }

    cycle();
    return () => {
      cancelled = true;
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [places, opacity]);

  const place = places[index];
  const showToast = !!place && shown && !selected;
  const distanceKm = place && coords ? haversineKm(coords.lat, coords.lng, place.lat, place.lng) : null;

  return (
    <>
      {showToast && (
        <Animated.View style={[styles.toast, { opacity }]}>
          <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={() => setSelected(place)}>
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons name={place.icon as any} size={26} color={colors.brass} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{t("foreignerHome.recommendedLabel")}</Text>
              <Text style={styles.name} numberOfLines={1}>{place.name}</Text>
              {distanceKm != null && <Text style={styles.distance}>{t("foreignerHome.distanceAway", { distance: distanceKm.toFixed(1) })}</Text>}
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      <PlaceDetailModal place={selected} onClose={() => setSelected(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 180,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.ink,
    borderRadius: 18,
    padding: 14,
    shadowColor: colors.ink,
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "rgba(233,180,92,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontFamily: fonts.bodyMedium, fontSize: 10.5, color: colors.brass, textTransform: "uppercase", letterSpacing: 0.6 },
  name: { fontFamily: fonts.display, fontSize: 15.5, color: colors.surface, marginTop: 2 },
  distance: { fontFamily: fonts.body, fontSize: 12, color: "rgba(255,253,248,0.7)", marginTop: 2 },
});
