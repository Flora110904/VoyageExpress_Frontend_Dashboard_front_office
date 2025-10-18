export interface VehiculeItineraireRequest {
  vehiculeTrackingId: string; // UUID as string
  itineraireTrackingId: string; // UUID as string
}

export interface VehiculeItineraireResponse {
  trackingId: string;
  vehiculeTrackingId: string;
  itineraireTrackingId: string;
}
