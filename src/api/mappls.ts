import axios from "axios";

const MAPPLS_KEY = process.env.EXPO_PUBLIC_MAPPLS_KEY ?? "";
const mapplsApi = axios.create({ baseURL: `https://apis.mappls.com/advancedmaps/v1/${MAPPLS_KEY}`, timeout: 15000 });

export interface PlaceResult {
  eLoc: string;
  placeName: string;
  placeAddress: string;
  lat: number;
  lng: number;
}

export interface RouteResult {
  coordinates: { lat: number; lng: number }[];
  distanceKm: number;
  durationMin: number;
}

// Endpoint path confirmed against Mappls' documented "Search API" product name -
// verify against the account-specific reference under the dashboard's "Document"
// link if this doesn't return results once the key is active.
export async function searchPlaces(query: string): Promise<PlaceResult[]> {
  const { data } = await mapplsApi.get("/search/json", { params: { query } });
  const suggestions = data?.suggestedLocations ?? data?.copResults ?? [];
  return suggestions
    .filter((s: any) => s.latitude && s.longitude)
    .map((s: any) => ({
      eLoc: s.eLoc,
      placeName: s.placeName,
      placeAddress: s.placeAddress,
      lat: parseFloat(s.latitude),
      lng: parseFloat(s.longitude),
    }));
}

// Confirmed endpoint pattern (returns a real backend error, not a gateway rejection).
export async function getDirections(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): Promise<RouteResult> {
  const { data } = await mapplsApi.get(
    `/route_adv/driving/${from.lng},${from.lat};${to.lng},${to.lat}`,
    { params: { geometries: "polyline", overview: "full", steps: false } },
  );
  const route = data.routes?.[0];
  if (!route) throw new Error("No route found");

  const coordinates = decodePolyline(route.geometry).map(([lat, lng]) => ({ lat, lng }));
  return {
    coordinates,
    distanceKm: route.distance / 1000,
    durationMin: route.duration / 60,
  };
}

// Standard Google/Mapbox-style encoded polyline decoder (precision 5) - Mappls'
// route geometry uses the same encoding.
function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 1;
    let shift = 0;
    let b: number;
    do {
      b = encoded.charCodeAt(index++) - 63 - 1;
      result += b << shift;
      shift += 5;
    } while (b >= 0x1f);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    result = 1;
    shift = 0;
    do {
      b = encoded.charCodeAt(index++) - 63 - 1;
      result += b << shift;
      shift += 5;
    } while (b >= 0x1f);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push([lat * 1e-5, lng * 1e-5]);
  }
  return points;
}
