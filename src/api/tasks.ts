import { api } from "./client";
import type { PointsSummary, Task } from "./types";

export const MIN_COMPLETION_PHOTOS = 3;

export async function getMyTasks(): Promise<Task[]> {
  const { data } = await api.get<Task[]>("/tasks/mine");
  return data;
}

export async function getMyPoints(): Promise<PointsSummary> {
  const { data } = await api.get<PointsSummary>("/tasks/mine/points");
  return data;
}

export async function acknowledgeTask(taskId: number): Promise<Task> {
  const { data } = await api.patch<Task>(`/tasks/${taskId}/acknowledge`);
  return data;
}

export async function submitTaskPhotos(taskId: number, photoDocIds: string[]): Promise<Task> {
  const { data } = await api.patch<Task>(`/tasks/${taskId}/submit-photos`, { photo_doc_ids: photoDocIds });
  return data;
}
