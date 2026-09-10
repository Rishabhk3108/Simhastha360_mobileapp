import { api } from "./client";
import { getDeviceId } from "../device/deviceId";
import type { ForeignerFields, PilgrimFields } from "../screens/onboarding/types";
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

function toPilgrimFields(detail: any): PilgrimFields {
  return {
    name: detail.name,
    phone: detail.phone,
    aadharNumber: detail.aadhar_number ?? "",
    password: "",
    age: detail.age != null ? String(detail.age) : "",
    photoBase64: detail.photo_base64,
    samagraId: detail.samagra_id ?? "",
    addressLine1: detail.address_line1 ?? "",
    addressLine2: detail.address_line2 ?? "",
    city: detail.city ?? "",
    state: detail.state ?? "",
    pincode: detail.pincode ?? "",
    country: detail.country,
    medicalHistory: detail.medical_history ?? "",
    isForeigner: detail.is_foreigner,
  };
}

export async function loginPilgrim(aadharNumber: string, password: string): Promise<PilgrimProfile> {
  const { data } = await api.post("/pilgrims/login", { aadhar_number: aadharNumber, password });
  return { pilgrimId: data.pilgrim_id, pilgrim: toPilgrimFields(data.pilgrim) };
}

export async function registerForeigner(foreigner: ForeignerFields): Promise<{ pilgrim_id: number; name: string; created_at: string }> {
  const deviceId = await getDeviceId();
  const { data } = await api.post("/pilgrims/register-foreign", {
    device_id: deviceId,
    foreigner: {
      name: foreigner.name,
      phone: foreigner.phone,
      country: foreigner.country,
      password: foreigner.password,
      photo_base64: foreigner.photoBase64 || undefined,
    },
  });
  return data;
}

export async function loginForeigner(phone: string, password: string): Promise<PilgrimProfile> {
  const { data } = await api.post("/pilgrims/login-foreign", { phone, password });
  return { pilgrimId: data.pilgrim_id, pilgrim: toPilgrimFields(data.pilgrim) };
}

export async function createGuardianLinkToken(pilgrimId: number): Promise<{ token: string; expires_at: string }> {
  const { data } = await api.post(`/pilgrims/${pilgrimId}/link-token`);
  return data;
}

export async function updateMyPilgrimLocation(pilgrimId: number, lat: number, lng: number): Promise<void> {
  const deviceId = await getDeviceId();
  await api.patch(`/pilgrims/${pilgrimId}/location`, { device_id: deviceId, lat, lng });
}
