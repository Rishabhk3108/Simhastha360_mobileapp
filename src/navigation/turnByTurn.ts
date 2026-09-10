import type { RouteStep } from "../api/mappls";

type LatLng = { lat: number; lng: number };

const ADVANCE_THRESHOLD_M = 35;
const ARRIVAL_THRESHOLD_M = 25;
export const OFF_ROUTE_THRESHOLD_M = 60;

export function haversineM(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export interface StepProgress {
  stepIndex: number;
  distanceToManeuverM: number;
  arrived: boolean;
}

// Advances through steps as the user passes each maneuver point. Skips
// forward (never back) so a GPS jump past two close-together turns doesn't
// get stuck re-announcing an already-passed instruction.
export function advanceStep(steps: RouteStep[], stepIndex: number, userPos: LatLng): StepProgress {
  let idx = Math.min(stepIndex, steps.length - 1);
  while (idx < steps.length - 1 && haversineM(userPos, steps[idx].location) < ADVANCE_THRESHOLD_M) {
    idx++;
  }
  const current = steps[idx];
  const distanceToManeuverM = current ? haversineM(userPos, current.location) : 0;
  const arrived = idx === steps.length - 1 && distanceToManeuverM < ARRIVAL_THRESHOLD_M;
  return { stepIndex: idx, distanceToManeuverM, arrived };
}

// Shortest distance from a point to the route polyline - used to detect
// when the traveler has left the planned route and a reroute is needed.
export function distanceToRouteM(point: LatLng, routeCoords: LatLng[]): number {
  let min = Infinity;
  for (let i = 0; i < routeCoords.length - 1; i++) {
    const d = distanceToSegmentM(point, routeCoords[i], routeCoords[i + 1]);
    if (d < min) min = d;
  }
  return Number.isFinite(min) ? min : 0;
}

function distanceToSegmentM(p: LatLng, a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toXY = (pt: LatLng) => ({
    x: ((pt.lng - a.lng) * Math.PI * R * Math.cos((a.lat * Math.PI) / 180)) / 180,
    y: ((pt.lat - a.lat) * Math.PI * R) / 180,
  });
  const A = { x: 0, y: 0 };
  const B = toXY(b);
  const P = toXY(p);
  const abx = B.x - A.x;
  const aby = B.y - A.y;
  const lenSq = abx * abx + aby * aby;
  let t = lenSq > 0 ? (P.x * abx + P.y * aby) / lenSq : 0;
  t = Math.max(0, Math.min(1, t));
  const dx = P.x - abx * t;
  const dy = P.y - aby * t;
  return Math.sqrt(dx * dx + dy * dy);
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
