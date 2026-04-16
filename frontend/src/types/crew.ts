export interface Crew {
  id: number;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  meeting_day: string | null;
  meeting_time: string | null;
  pace: string | null;
  level: "beginner" | "intermediate" | "advanced" | null;
  contact: string | null;
  member_count: number | null;
  avg_rating: number | null;
  review_count: number;
}
