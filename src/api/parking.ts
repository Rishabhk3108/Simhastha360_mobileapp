import { api } from "./client";
import { haversineM } from "../navigation/turnByTurn";
import type { ParkingZone, VehicleType } from "./types";

export async function getParkingZones(): Promise<ParkingZone[]> {
  const { data } = await api.get<ParkingZone[]>("/parking");
  return data;
}

export async function createParkingBooking(
  parkingZoneId: number,
  vehicleType: VehicleType,
  vehicleNumber: string,
): Promise<void> {
  await api.post("/parking/bookings", {
    parking_zone_id: parkingZoneId,
    vehicle_type: vehicleType,
    vehicle_number: vehicleNumber,
  });
}

export function availableSlots(zone: ParkingZone, vehicleType: VehicleType): number {
  const capacity = zone[`capacity_${vehicleType}` as keyof ParkingZone] as number;
  const occupied = zone[`occupied_${vehicleType}` as keyof ParkingZone] as number;
  return capacity - occupied;
}

// Picks the nearest parking zone (to the given point, typically the
// traveler's destination) that still has room for the chosen vehicle type -
// zones already full for that type are excluded outright rather than just
// deprioritized, since routing someone to a full lot would be actively
// unhelpful.
export function findNearestAvailable(
  zones: ParkingZone[],
  point: { lat: number; lng: number },
  vehicleType: VehicleType,
): ParkingZone | null {
  const candidates = zones.filter((z) => availableSlots(z, vehicleType) > 0);
  if (candidates.length === 0) return null;
  return candidates.reduce((nearest, z) =>
    haversineM(point, { lat: z.center_lat, lng: z.center_lng }) <
    haversineM(point, { lat: nearest.center_lat, lng: nearest.center_lng })
      ? z
      : nearest,
  );
}
