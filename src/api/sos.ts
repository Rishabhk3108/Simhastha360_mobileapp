import { api } from "./client";

export type SOSStatus = "pending" | "assigned" | "responding" | "resolved";

export interface SOSAlertOut {
  id: number;
  device_id: string;
  lat: number;
  lng: number;
  status: SOSStatus;
  assigned_responder_id: number | null;
  assigned_at: string | null;
  acknowledged_at: string | null;
  escalated: boolean;
  created_at: string;
  resolved_at: string | null;
}

export interface SOSStatusOut {
  id: number;
  status: SOSStatus;
  responder_name: string | null;
  distance_km: number | null;
  duration_min: number | null;
  created_at: string;
}

export async function createSOS(deviceId: string, lat: number, lng: number): Promise<SOSAlertOut> {
  const { data } = await api.post<SOSAlertOut>("/sos", { device_id: deviceId, lat, lng });
  return data;
}

export async function getSOSStatus(sosId: number, deviceId: string): Promise<SOSStatusOut> {
  const { data } = await api.get<SOSStatusOut>(`/sos/${sosId}`, { params: { device_id: deviceId } });
  return data;
}

export async function cancelSOS(sosId: number, deviceId: string): Promise<SOSAlertOut> {
  const { data } = await api.patch<SOSAlertOut>(`/sos/${sosId}/cancel`, null, { params: { device_id: deviceId } });
  return data;
}

// Polled by a responder's own app to detect a newly-assigned emergency.
export async function getAssignedSOS(): Promise<SOSAlertOut | null> {
  const { data } = await api.get<SOSAlertOut | null>("/sos/assigned-to-me");
  return data;
}

export async function acknowledgeSOS(sosId: number): Promise<SOSAlertOut> {
  const { data } = await api.patch<SOSAlertOut>(`/sos/${sosId}/acknowledge`);
  return data;
}

export async function resolveSOS(sosId: number): Promise<SOSAlertOut> {
  const { data } = await api.patch<SOSAlertOut>(`/sos/${sosId}/resolve`);
  return data;
}
