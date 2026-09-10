import { api } from "./client";

export interface LinkedPilgrim {
  pilgrim_id: number;
  name: string;
  age: number | null;
  photo_base64: string | null;
  last_lat: number | null;
  last_lng: number | null;
  location_updated_at: string | null;
  zone_name: string | null;
  crowd_level: "green" | "yellow" | "red" | null;
  has_active_sos: boolean;
}

export async function registerGuardian(name: string, phone: string, password: string): Promise<void> {
  await api.post("/guardians/register", { name, phone, password });
}

export async function linkPilgrimByToken(token: string): Promise<LinkedPilgrim> {
  const { data } = await api.post<LinkedPilgrim>("/guardians/me/link", { token });
  return data;
}

export async function getMyLinkedPilgrims(): Promise<LinkedPilgrim[]> {
  const { data } = await api.get<LinkedPilgrim[]>("/guardians/me/pilgrims");
  return data;
}
