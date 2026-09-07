export type CrowdLevel = "green" | "yellow" | "red";
export type FacilityType = "medical" | "toilet" | "water" | "help_desk" | "parking";
export type TaskStatus = "unassigned" | "acknowledged" | "in_progress" | "complete";

export interface Zone {
  id: number;
  name: string;
  center_lat: number;
  center_lng: number;
  crowd_level: CrowdLevel;
  updated_at: string;
}

export interface Facility {
  id: number;
  name: string;
  type: FacilityType;
  lat: number;
  lng: number;
  zone_id: number | null;
  status: string;
}

export interface Task {
  id: number;
  description: string;
  zone_id: number | null;
  priority: "low" | "medium" | "high";
  status: TaskStatus;
  assignee_id: number | null;
  ack_deadline_minutes: number;
  created_at: string;
}

export interface ChatResponse {
  reply: string;
  grounded_on: string[];
}

export interface VolunteerMe {
  id: number;
  user_id: number;
  name: string;
  phone: string;
  skills: string;
  status: "pending" | "approved" | "rejected";
  on_duty: boolean;
  preferred_zone_id: number | null;
  created_at: string;
}
