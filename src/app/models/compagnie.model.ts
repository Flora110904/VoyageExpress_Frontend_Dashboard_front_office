import { TypeCompagnie } from './enums.model';

export interface CompagnieRequest {
  nom: string;
  type: string; // or TypeCompagnie
}

export interface CompagnieResponse {
  trackingId: string;
  nom: string;
  type: TypeCompagnie;
}
