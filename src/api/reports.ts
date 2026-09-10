import { api } from "./client";

export interface IssueReportPayload {
  device_id: string;
  description?: string;
  photo_doc_ids: string[];
  lat?: number;
  lng?: number;
}

export async function createIssueReport(payload: IssueReportPayload): Promise<void> {
  await api.post("/reports/issues", payload);
}
