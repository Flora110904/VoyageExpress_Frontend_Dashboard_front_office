 import { Role } from './enums.model';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface PasswordUpdateRequest {
  email: string;
  oldPassword: string;
  newPassword: string;
}

export interface LoginResponse {
  token: string;
  type: string;
  email: string;
  trackingId: string;
  role: Role;
  nom: string;
  prenom: string;
  actif: boolean;
}

export interface ErrorResponseDto {
  message: string;
}