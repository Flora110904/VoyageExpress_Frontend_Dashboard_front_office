import { TypeLocal } from './enums.model';

export interface LocalRequest {
  numero: string;
  description: string;
  type: TypeLocal;
  superficie?: number;
  capacite: number;
  nombreLits?: number;
  equipements?: string;
}

export interface LocalResponse {
  trackingId: string;
  description: string;
  type: TypeLocal;
  etablissementTrackingId: string;
  imageUrl: string;
  tarifTrackingId?: string | null;
  tarifPrixTtc?: number | null;
  tarifActif?: boolean | null;
}

export interface TarifTypeLocalRequest {
  type: TypeLocal;
  prixTtc: number;
  actif?: boolean | null;
}

export interface TarifTypeLocalResponse {
  trackingId: string;
  type: TypeLocal;
  prixTtc: number;
  actif: boolean;
  etablissementTrackingId: string;
}
