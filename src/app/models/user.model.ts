import { Role } from './enums.model';

export interface UserRequest {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  role: string; // or Role if backend expects enum-compatible strings
  telephone: string;
}

export interface UserResponse {
  trackingId: string;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  telephone: string;
}

export interface UtilisateurResponse {
  trackingId: string;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  telephone: string;
}
