import { api } from "./client";
import type { AppNotification } from "./types";

export async function getMyNotifications(): Promise<AppNotification[]> {
  const { data } = await api.get<AppNotification[]>("/notifications/mine");
  return data;
}

export async function markNotificationRead(id: number): Promise<AppNotification> {
  const { data } = await api.patch<AppNotification>(`/notifications/${id}/read`);
  return data;
}
