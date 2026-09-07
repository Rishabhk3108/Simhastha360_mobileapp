import { api } from "./client";
import { getDeviceId } from "../device/deviceId";
import type { GuardianFields, PilgrimFields } from "../screens/onboarding/types";
import type { PilgrimProfile } from "../pilgrim/PilgrimContext";

interface RegisterArgs {
  registeredVia: "self" | "guardian";
  pilgrim: PilgrimFields;
  guardian: GuardianFields;
}

export async function registerPilgrim({ registeredVia, pilgrim, guardian }: RegisterArgs) {
  const deviceId = await getDeviceId();
  const { data } = await api.post("/pilgrims/register", {
    registered_via: registeredVia,
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
    guardian: {
      name: guardian.name,
      phone: guardian.phone,
      aadhar_number: guardian.aadharNumber,
      email: guardian.email || undefined,
      relation_to_pilgrim: guardian.relationToPilgrim,
    },
  });
  return data as { pilgrim_id: number; guardian_id: number; name: string; registered_via: string; created_at: string };
}

export async function loginPilgrim(aadharNumber: string, password: string): Promise<PilgrimProfile> {
  const { data } = await api.post("/pilgrims/login", { aadhar_number: aadharNumber, password });

  return {
    pilgrimId: data.pilgrim_id,
    registeredVia: data.registered_via,
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
    guardian: {
      name: data.guardian.name,
      phone: data.guardian.phone,
      aadharNumber: data.guardian.aadhar_number,
      email: data.guardian.email ?? "",
      relationToPilgrim: data.guardian.relation_to_pilgrim,
    },
  };
}
