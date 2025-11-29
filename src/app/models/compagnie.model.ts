import { TypeCompagnie } from './enums.model';

export interface CompagnieRequest {
  nom: string;
  type: TypeCompagnie;
  telephone: string;
  proprietaireId: string;
  email?: string;
  adresse?: string;
  siteWeb?: string;
  description?: string;
  logo?: string;
  numeroLicence?: string;
}

export interface CompagnieResponse {
  trackingId: string;
  nom: string;
  type: TypeCompagnie;
}
