import { SeasonRuleType } from './enums.model';

export interface SaisonTarifaireRequest {
  nom: string;
  dateDebut: string; // ISO date (yyyy-MM-dd)
  dateFin: string; // ISO date (yyyy-MM-dd)
  typeRegle: SeasonRuleType;
  pourcentage?: number | null;
  prixFixe?: number | null;
  actif?: boolean | null;
}

export interface SaisonTarifaireResponse {
  trackingId: string;
  nom: string;
  dateDebut: string;
  dateFin: string;
  typeRegle: SeasonRuleType;
  pourcentage: number | null;
  prixFixe: number | null;
  actif: boolean;
}
