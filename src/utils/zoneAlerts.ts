import { haversineM } from "../navigation/turnByTurn";
import type { Zone } from "../api/types";

// Only red/yellow zones are hazards worth warning about or routing around -
// green is the "normal" baseline crowd level, not a condition to react to.
export function hazardZones(zones: Zone[]): Zone[] {
  return zones.filter((z) => z.crowd_level === "red" || z.crowd_level === "yellow");
}

export function zonesContainingPoint(point: { lat: number; lng: number }, zones: Zone[]): Zone[] {
  return hazardZones(zones).filter(
    (z) => haversineM(point, { lat: z.center_lat, lng: z.center_lng }) <= z.radius_m,
  );
}

// Red always outranks yellow when a point falls inside more than one zone.
export function worstZone(zones: Zone[]): Zone | null {
  return zones.find((z) => z.crowd_level === "red") ?? zones.find((z) => z.crowd_level === "yellow") ?? null;
}

// Samples every point already present in the route's decoded polyline
// (Mappls' own overview geometry) against each hazard zone's radius. Good
// enough resolution for warning/scoring purposes without needing per-segment
// interpolation.
export function routeZoneCrossings(
  routeCoords: { lat: number; lng: number }[],
  zones: Zone[],
): Zone[] {
  const zonesToCheck = hazardZones(zones);
  const crossedIds = new Set<number>();
  for (const point of routeCoords) {
    for (const zone of zonesToCheck) {
      if (crossedIds.has(zone.id)) continue;
      if (haversineM(point, { lat: zone.center_lat, lng: zone.center_lng }) <= zone.radius_m) {
        crossedIds.add(zone.id);
      }
    }
  }
  return zonesToCheck.filter((z) => crossedIds.has(z.id));
}

// Red crossings are weighted worse than yellow so a route through one red
// zone loses to a longer route that only clips a yellow zone.
export function zoneCrossingScore(crossedZones: Zone[]): number {
  return crossedZones.reduce((sum, z) => sum + (z.crowd_level === "red" ? 2 : 1), 0);
}
