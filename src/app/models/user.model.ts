import { Role } from './enums.model';

export interface UserRequest {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  role: Role;
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
