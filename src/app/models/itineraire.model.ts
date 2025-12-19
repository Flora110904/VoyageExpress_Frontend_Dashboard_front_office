export interface ItineraireRequest {
  villeDepart: string;
  villeArrivee: string;
  dateDepart: string; // YYYY-MM-DD
  heureDepart: string;
  prix: number;
  prixEconomique?: number | null;
  prixEconomiquePremium?: number | null;
  prixAffaires?: number | null;
  prixPremiere?: number | null;
  compagnieId: string; // UUID as string
  vehiculeId: string;
  bagageInclusKg?: number | null;
  prixFreightParKg?: number | null;
  bagageSupplementaireMaxKg?: number | null;
  placeDisponible?: number | null;
}

import { TypeCompagnie } from './enums.model';

export interface ItineraireResponse {
  trackingId: string;
  villeDepart: string;
  villeArrivee: string;
  dateDepart: string; // LocalDate
  heureDepart: string;
  prix: number;
  prixEconomique?: number | null;
  prixEconomiquePremium?: number | null;
  prixAffaires?: number | null;
  prixPremiere?: number | null;
  placeDisponible: number;
  placeTotal: number;
  bagageInclusKg: number;
  prixFreightParKg?: number | null;
  bagageSupplementaireMaxKg?: number | null;
  vehiculeId: string | null;
  compagnieTrackingId?: string | null;
  compagnieNom?: string | null;
  compagnieType: TypeCompagnie | null;
}
