import type { TFunction } from "i18next";
import type { TaskStatus } from "../api/types";

export function taskStatusLabel(t: TFunction, status: TaskStatus): string {
  return t(`taskStatus.${status}`);
}
