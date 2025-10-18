import { TypeEtablissement } from './enums.model';

export interface EtablissementRequest {
  adresse: string;
  type: TypeEtablissement;
  proprietaireId: string; // UUID as string
}

export interface EtablissementResponse {
  id: number;
  trackingId: string;
  adresse: string;
  type: TypeEtablissement;
}
