import { api } from "./client";
import { getDeviceId } from "../device/deviceId";
import type { PilgrimFields } from "../screens/onboarding/types";
import type { PilgrimProfile } from "../pilgrim/PilgrimContext";

export async function registerPilgrim(pilgrim: PilgrimFields): Promise<{ pilgrim_id: number; name: string; created_at: string }> {
  const deviceId = await getDeviceId();
  const { data } = await api.post("/pilgrims/register", {
    device_id: deviceId,
    pilgrim: {
      name: pilgrim.name,
      phone: pilgrim.phone,
      aadhar_number: pilgrim.aadharNumber,
      password: pilgrim.password,
      age: parseInt(pilgrim.age, 10),
      photo_base64: pilgrim.photoBase64 || undefined,
      samagra_id: pilgrim.samagraId || undefined,
      address_line1: pilgrim.addressLine1,
      address_line2: pilgrim.addressLine2 || undefined,
      city: pilgrim.city,
      state: pilgrim.state,
      pincode: pilgrim.pincode,
      country: pilgrim.country || "India",
      medical_history: pilgrim.medicalHistory || undefined,
    },
  });
  return data;
}

export async function loginPilgrim(aadharNumber: string, password: string): Promise<PilgrimProfile> {
  const { data } = await api.post("/pilgrims/login", { aadhar_number: aadharNumber, password });

  return {
    pilgrimId: data.pilgrim_id,
    pilgrim: {
      name: data.pilgrim.name,
      phone: data.pilgrim.phone,
      aadharNumber: data.pilgrim.aadhar_number,
      password: "",
      age: String(data.pilgrim.age),
      photoBase64: data.pilgrim.photo_base64,
      samagraId: data.pilgrim.samagra_id ?? "",
      addressLine1: data.pilgrim.address_line1,
      addressLine2: data.pilgrim.address_line2 ?? "",
      city: data.pilgrim.city,
      state: data.pilgrim.state,
      pincode: data.pilgrim.pincode,
      country: data.pilgrim.country,
      medicalHistory: data.pilgrim.medical_history ?? "",
    },
  };
}

export async function createGuardianLinkToken(pilgrimId: number): Promise<{ token: string; expires_at: string }> {
  const { data } = await api.post(`/pilgrims/${pilgrimId}/link-token`);
  return data;
}

export async function updateMyPilgrimLocation(pilgrimId: number, lat: number, lng: number): Promise<void> {
  const deviceId = await getDeviceId();
  await api.patch(`/pilgrims/${pilgrimId}/location`, { device_id: deviceId, lat, lng });
}
