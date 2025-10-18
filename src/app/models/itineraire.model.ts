export interface ItineraireRequest {
  villeDepart: string;
  villeArrivee: string;
  dateDepart: string; // YYYY-MM-DD
  heureDepart: string;
  prix: number;
  placeDisponible: number;
  compagnieId: string; // UUID as string
}

export interface ItineraireResponse {
  trackingId: string;
  villeDepart: string;
  villeArrivee: string;
  dateDepart: string; // LocalDate
  heureDepart: string;
  prix: number;
  placeDisponible: number;
}
