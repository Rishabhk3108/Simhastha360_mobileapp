import type { TaskStatus } from "../api/types";

export const STATUS_LABELS: Record<TaskStatus, string> = {
  unassigned: "Unassigned",
  assigned: "Assigned",
  acknowledged: "In progress",
  review: "In review",
  complete: "Completed",
};
