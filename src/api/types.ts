export type CrowdLevel = "green" | "yellow" | "red";
export type FacilityType = "medical" | "toilet" | "water" | "help_desk" | "parking";
export type TaskStatus = "unassigned" | "acknowledged" | "in_progress" | "review" | "complete";

export interface Zone {
  id: number;
  name: string;
  center_lat: number;
  center_lng: number;
  radius_m: number;
  crowd_level: CrowdLevel;
  updated_at: string;
}

export type VehicleType = "two_wheeler" | "three_wheeler" | "four_wheeler" | "six_wheeler";

export interface ParkingZone {
  id: number;
  name: string;
  center_lat: number;
  center_lng: number;
  capacity_two_wheeler: number;
  capacity_three_wheeler: number;
  capacity_four_wheeler: number;
  capacity_six_wheeler: number;
  occupied_two_wheeler: number;
  occupied_three_wheeler: number;
  occupied_four_wheeler: number;
  occupied_six_wheeler: number;
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
  lat: number | null;
  lng: number | null;
  points: number;
  priority: "low" | "medium" | "high";
  status: TaskStatus;
  assignee_id: number | null;
  ack_deadline_minutes: number;
  completion_photo_doc_ids: string[];
  review_note: string | null;
  created_at: string;
  acknowledged_at: string | null;
  submitted_at: string | null;
  completed_at: string | null;
}

export interface PointsSummary {
  today: number;
  total: number;
}

export interface AppNotification {
  id: number;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

export interface ChatResponse {
  reply: string;
  grounded_on: string[];
}
