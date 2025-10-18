import { TypeLocal } from './enums.model';

export interface LocalRequest {
  description: string;
  type: TypeLocal;
  etablissementId: number; // Java Long
}

export interface LocalResponse {
  trackingId: string;
  description: string;
  type: TypeLocal;
  etablissementTrackingId: string;
  imageUrl: string;
}
