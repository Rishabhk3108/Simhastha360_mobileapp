import { api } from "./client";

export interface PointOfInterest {
  id: number;
  name: string;
  description: string;
  category: "temple" | "ghat" | "heritage" | "ashram";
  icon: string;
  lat: number;
  lng: number;
}

export async function getPointsOfInterest(): Promise<PointOfInterest[]> {
  const { data } = await api.get("/points-of-interest");
  return data;
}
