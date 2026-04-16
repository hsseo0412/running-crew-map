export interface Waypoint {
  lat: number;
  lng: number;
}

export interface Route {
  id: number;
  crew_id: number;
  coordinates: Waypoint[];
  distance_km: number;
  created_at: string;
}
