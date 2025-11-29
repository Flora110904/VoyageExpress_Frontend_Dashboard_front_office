export interface ItineraireRequest {
  villeDepart: string;
  villeArrivee: string;
  dateDepart: string; // YYYY-MM-DD
  heureDepart: string;
  prix: number;
  compagnieId: string; // UUID as string
  vehiculeId: string;
}

import { TypeCompagnie } from './enums.model';

export interface ItineraireResponse {
  trackingId: string;
  villeDepart: string;
  villeArrivee: string;
  dateDepart: string; // LocalDate
  heureDepart: string;
  prix: number;
  placeDisponible: number;
  placeTotal: number;
  vehiculeId: string | null;
  compagnieType: TypeCompagnie | null;
}
