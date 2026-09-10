import { api } from "./client";

export interface AvailabilitySlot {
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
}

export type VolunteerStatus = "pending" | "approved" | "rejected";

export interface VolunteerProfile {
  id: number;
  user_id: number;
  name: string;
  phone: string;
  age: number | null;
  gender: string | null;
  email: string | null;
  city_state: string | null;
  permanent_address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  id_proof_type: string | null;
  id_number: string | null;
  id_proof_front_doc_id: string | null;
  id_proof_back_doc_id: string | null;
  photo_doc_id: string | null;
  skills: string;
  languages: string;
  availability_slots: AvailabilitySlot[];
  prior_experience: string | null;
  tshirt_size: string | null;
  organization_affiliation: string | null;
  medical_conditions: string | null;
  no_criminal_record: boolean;
  code_of_conduct_accepted: boolean;
  media_consent: boolean;
  status: VolunteerStatus;
  review_note: string | null;
  rating: number | null;
  on_duty: boolean;
  preferred_zone_id: number | null;
  current_lat: number | null;
  current_lng: number | null;
  location_updated_at: string | null;
  created_at: string;
}

export interface VolunteerApplyPayload {
  name: string;
  phone: string;
  password: string;
  age?: number;
  gender?: string;
  email?: string;
  city_state?: string;
  permanent_address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  id_proof_type?: string;
  id_number?: string;
  id_proof_front_doc_id?: string;
  id_proof_back_doc_id?: string;
  photo_doc_id?: string;
  skills: string[];
  languages: string[];
  availability_slots: AvailabilitySlot[];
  prior_experience?: string;
  tshirt_size?: string;
  organization_affiliation?: string;
  medical_conditions?: string;
  no_criminal_record: boolean;
  code_of_conduct_accepted: boolean;
  media_consent: boolean;
  preferred_zone_id?: number;
}

// Backed by a real multipart upload endpoint (not inline base64 like the
// pilgrim photo) since volunteer documents (ID proofs, photo) are reviewed
// by an admin later and benefit from being independently fetchable by id.
export async function uploadDocument(uri: string, filename: string, mimeType: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", { uri, name: filename, type: mimeType } as unknown as Blob);
  const { data } = await api.post<{ id: string }>("/uploads", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.id;
}

export async function applyAsVolunteer(payload: VolunteerApplyPayload): Promise<VolunteerProfile> {
  const { data } = await api.post<VolunteerProfile>("/volunteers/apply", payload);
  return data;
}

export async function getMyVolunteerStatus(): Promise<VolunteerProfile> {
  const { data } = await api.get<VolunteerProfile>("/volunteers/me");
  return data;
}

export async function updateMyAvailability(onDuty: boolean): Promise<VolunteerProfile> {
  const { data } = await api.patch<VolunteerProfile>("/volunteers/me/availability", { on_duty: onDuty });
  return data;
}
