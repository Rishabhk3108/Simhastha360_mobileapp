import axios from "axios";
import { hazardZones, routeZoneCrossings, zoneCrossingScore } from "../utils/zoneAlerts";
import type { Zone } from "./types";

const MAPPLS_KEY = process.env.EXPO_PUBLIC_MAPPLS_KEY ?? "";

export interface PlaceResult {
  eLoc: string;
  placeName: string;
  placeAddress: string;
}

export interface RouteStep {
  instruction: string;
  streetName: string;
  distanceM: number;
  durationS: number;
  location: { lat: number; lng: number };
}

export interface RouteResult {
  destination: { lat: number; lng: number };
  coordinates: { lat: number; lng: number }[];
  distanceKm: number;
  durationMin: number;
  steps: RouteStep[];
  crossedZones: Zone[];
  rerouted: boolean;
}

// Current (post Aug-2025) Mappls REST auth: a plain `access_token` query
// param carrying the same static key used by the map SDK - confirmed live
// against https://search.mappls.com and https://route.mappls.com. The older
// apis.mappls.com/advancedmaps/v1/{key}/... path style returns
// "Client Credentials Expired" for this account and must not be used.
const searchApi = axios.create({ baseURL: "https://search.mappls.com/search/places", timeout: 15000 });
const routeApi = axios.create({ baseURL: "https://route.mappls.com/route/direction", timeout: 15000 });

export async function searchPlaces(query: string, near?: { lat: number; lng: number }): Promise<PlaceResult[]> {
  const { data } = await searchApi.get("/textsearch/json", {
    params: {
      query,
      location: near ? `${near.lat},${near.lng}` : undefined,
      access_token: MAPPLS_KEY,
    },
  });
  const suggestions = data?.suggestedLocations ?? [];
  return suggestions
    .filter((s: any) => s.eLoc && s.placeName)
    .map((s: any) => ({
      eLoc: s.eLoc,
      placeName: s.placeName,
      placeAddress: s.placeAddress ?? "",
    }));
}

async function fetchRoute(waypointsPath: string, profile: "driving" | "walking" = "driving") {
  const { data } = await routeApi.get(`/route_adv/${profile}/${waypointsPath}`, {
    params: { geometries: "polyline", overview: "full", steps: true, access_token: MAPPLS_KEY },
  });
  return data;
}

function scoreRoute(route: any, hazards: Zone[]) {
  const coordinates = decodePolyline(route.geometry).map(([lat, lng]) => ({ lat, lng }));
  const crossedZones = routeZoneCrossings(coordinates, hazards);
  return { route, coordinates, crossedZones, score: zoneCrossingScore(crossedZones) };
}

// Points ringing the zone just outside its radius - routed through as a
// via-point, these force the engine to plan a real path around the hazard
// instead of straight through it, since Mappls has no native "avoid this
// area" parameter to ask for that directly.
function viaPointsAround(zone: Zone, marginFactor: number): { lat: number; lng: number }[] {
  const R = 6371000;
  const lat0 = (zone.center_lat * Math.PI) / 180;
  const dist = zone.radius_m * marginFactor;
  const bearings = [0, 45, 90, 135, 180, 225, 270, 315];
  return bearings.map((bearingDeg) => {
    const angle = (bearingDeg * Math.PI) / 180;
    const dLat = (dist * Math.cos(angle)) / R;
    const dLng = (dist * Math.sin(angle)) / (R * Math.cos(lat0));
    return { lat: zone.center_lat + (dLat * 180) / Math.PI, lng: zone.center_lng + (dLng * 180) / Math.PI };
  });
}

function buildResult(data: any, best: ReturnType<typeof scoreRoute>, rerouted: boolean): RouteResult {
  const steps: RouteStep[] = (best.route.legs ?? []).flatMap((leg: any) =>
    (leg.steps ?? []).map((step: any) => ({
      instruction: formatInstruction(step.maneuver?.type, step.maneuver?.modifier, step.name),
      streetName: step.name ?? "",
      distanceM: step.distance ?? 0,
      durationS: step.duration ?? 0,
      location: step.maneuver?.location
        ? { lat: step.maneuver.location[1], lng: step.maneuver.location[0] }
        : best.coordinates[best.coordinates.length - 1],
    })),
  );

  const destWaypoint = data.waypoints?.[data.waypoints.length - 1]?.location;
  const destination = destWaypoint
    ? { lat: destWaypoint[1], lng: destWaypoint[0] }
    : best.coordinates[best.coordinates.length - 1];

  return {
    destination,
    coordinates: best.coordinates,
    distanceKm: best.route.distance / 1000,
    durationMin: best.route.duration / 60,
    steps,
    crossedZones: best.crossedZones,
    rerouted,
  };
}

async function fetchBestAlternative(from: { lat: number; lng: number }, destParam: string, hazards: Zone[]) {
  const data = await routeApi
    .get(`/route_adv/driving/${from.lng},${from.lat};${destParam}`, {
      params: {
        geometries: "polyline",
        overview: "full",
        steps: true,
        alternatives: hazards.length > 0 ? 2 : undefined,
        access_token: MAPPLS_KEY,
      },
    })
    .then((r) => r.data);
  const routes = data.routes ?? [];
  if (routes.length === 0) throw new Error("No route found");

  const candidates = routes.map((route: any) => scoreRoute(route, hazards));
  const best = candidates.reduce((a: (typeof candidates)[number], b: (typeof candidates)[number]) =>
    b.score < a.score || (b.score === a.score && b.route.duration < a.route.duration) ? b : a,
  );
  return { data, routes, best };
}

// Mappls' textsearch response does not include coordinates on this account
// tier (confirmed live), and place-details' Location Coordinates subtemplate
// is a restricted premium add-on that returns "RESTRICTED" placeholders.
// The routing API, however, accepts an eLoc directly as a geoposition
// (confirmed in Mappls' routing docs and live) and returns the resolved,
// snapped coordinate in its `waypoints` array - so destinations are
// resolved as a side effect of requesting directions, never guessed.
//
// Cheap default: ask for alternatives (documented `alternatives` param,
// confirmed live to return genuinely distinct candidates) and pick whichever
// crosses the fewest/least-severe zones. Does not force detours - that's a
// heavier, explicit step the caller opts into via findClearRoute() once the
// traveler has seen a warning and asked to look for a better route.
export async function getDirections(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number } | { eLoc: string },
  zones: Zone[] = [],
): Promise<RouteResult> {
  const destParam = "eLoc" in to ? to.eLoc : `${to.lng},${to.lat}`;
  const hazards = hazardZones(zones);
  const { data, routes, best } = await fetchBestAlternative(from, destParam, hazards);
  return buildResult(data, best, best.route !== routes[0]);
}

export interface WalkingRoute {
  coordinates: { lat: number; lng: number }[];
  distanceKm: number;
  durationMin: number;
}

// A plain pedestrian route with no zone-avoidance logic - used for the
// "last mile" leg from a parking spot to the traveler's actual destination.
// Walking through a crowded area on foot to reach it is normal and expected,
// not something to route around the way a vehicle would.
export async function getWalkingRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): Promise<WalkingRoute> {
  const data = await fetchRoute(`${from.lng},${from.lat};${to.lng},${to.lat}`, "walking");
  const route = data.routes?.[0];
  if (!route) throw new Error("No walking route found");
  const coordinates = decodePolyline(route.geometry).map(([lat, lng]) => ({ lat, lng }));
  return { coordinates, distanceKm: route.distance / 1000, durationMin: route.duration / 60 };
}

// Progressively wider rings tried per zone (as a multiple of its radius)
// before giving up on avoiding that specific zone and moving to the next
// one - a tight ring often just snaps back onto the same road that cuts
// through the zone, so a wider ring gets a real shot at finding a different
// street entirely.
const DETOUR_MARGIN_FACTORS = [1.6, 2.5, 4];

// Forces real detours by routing through via-points placed just outside each
// crossed zone's radius, since Mappls has no native "avoid this area"
// parameter. Keeps going until every distinct hazard zone the route has
// crossed has been tried (no arbitrary attempt cap - bounded only by how
// many real zones exist), trying progressively wider rings around each
// before moving on. A zone whose surrounding roads all funnel through it
// (confirmed possible - some areas genuinely have no alternate street) will
// still end up reported honestly rather than forced into a nonsensical route.
export async function findClearRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number } | { eLoc: string },
  zones: Zone[],
): Promise<RouteResult> {
  const destParam = "eLoc" in to ? to.eLoc : `${to.lng},${to.lat}`;
  const hazards = hazardZones(zones);

  let { data, best } = await fetchBestAlternative(from, destParam, hazards);
  const triedZoneIds = new Set<number>();

  while (best.crossedZones.length > 0) {
    const targetZone = best.crossedZones.find((z: Zone) => !triedZoneIds.has(z.id));
    if (!targetZone) break; // every zone this route has crossed has already had a fair shot
    triedZoneIds.add(targetZone.id);

    for (const marginFactor of DETOUR_MARGIN_FACTORS) {
      const detours = await Promise.all(
        viaPointsAround(targetZone, marginFactor).map((via) =>
          fetchRoute(`${from.lng},${from.lat};${via.lng},${via.lat};${destParam}`)
            .then((d) => ({ data: d, scored: scoreRoute(d.routes?.[0], hazards) }))
            .catch(() => null),
        ),
      );
      const durationCap = Math.max(best.route.duration * 3, best.route.duration + 1800);
      const viable = detours.filter(
        (d): d is NonNullable<typeof d> => d !== null && d.scored.route.duration <= durationCap,
      );
      if (viable.length === 0) continue;

      const bestDetour = viable.reduce((a, b) =>
        b.scored.score < a.scored.score || (b.scored.score === a.scored.score && b.scored.route.duration < a.scored.route.duration)
          ? b
          : a,
      );
      if (bestDetour.scored.score < best.score) {
        best = bestDetour.scored;
        data = bestDetour.data;
        break; // improved at this margin - re-check remaining crossed zones before widening further
      }
    }
  }

  return buildResult(data, best, true);
}

// Human-readable instructions from Mappls' documented maneuver vocabulary:
// https://github.com/mappls-api/mappls-rest-apis/blob/main/docs/types.md
// https://github.com/mappls-api/mappls-rest-apis/blob/main/docs/modifiers.md
function formatInstruction(type: string | undefined, modifier: string | undefined, name: string | undefined): string {
  const road = name ? ` onto ${name}` : "";

  switch (type) {
    case "depart":
      return `Head out${road}`;
    case "arrive":
      return "You have arrived at your destination";
    case "roundabout":
    case "rotary":
      return `At the roundabout, continue${road}`;
    case "exit roundabout":
    case "exit rotary":
      return `Exit the roundabout${road}`;
    case "roundabout turn":
      return `At the roundabout, turn ${modifier ?? "onward"}${road}`;
    case "fork":
      return `Keep ${modifier ?? "straight"} at the fork${road}`;
    case "merge":
      return `Merge ${modifier ?? ""}${road}`.trim();
    case "on ramp":
      return `Take the ramp${road}`;
    case "off ramp":
      return `Take the exit${road}`;
    case "end of road":
      return `Turn ${modifier ?? ""} at the end of the road${road}`.replace(/\s+/g, " ").trim();
    case "new name":
    case "continue":
      return modifier === "straight" ? `Continue straight${road}` : `Continue ${modifier ?? ""}${road}`.trim();
    case "notification":
      return modifier ? `${modifier}${road}` : `Continue${road}`;
    case "turn":
    default:
      if (!modifier || modifier === "straight") return `Continue straight${road}`;
      if (modifier === "uturn") return "Make a U-turn";
      return `Turn ${modifier}${road}`;
  }
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
