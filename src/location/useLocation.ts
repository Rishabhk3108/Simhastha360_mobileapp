import { useCallback, useEffect, useState } from "react";
import * as Location from "expo-location";

interface Coords {
  lat: number;
  lng: number;
}

export function useLocation() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setError("Location permission denied — showing all facilities unsorted.");
      return;
    }
    try {
      const position = await Location.getCurrentPositionAsync({});
      setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
      setError(null);
    } catch {
      setError("Could not get current location.");
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { coords, error, refresh };
}
