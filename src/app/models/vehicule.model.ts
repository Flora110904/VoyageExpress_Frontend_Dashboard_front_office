import { TypeVehicule } from './enums.model';

export interface VehiculeRequest {
  immatriculation: string;
  nombrePlace: number;
  type: TypeVehicule;
  compagnieTrackingId: string; // UUID as string
  marque?: string;
  modele?: string;
  annee?: number;
  equipements?: string;
  etat?: string;
}

export interface VehiculeResponse {
  immatriculation?: string;
  trackingId: string;
  nombrePlace: number;
  type: TypeVehicule;
  compagnieId: string;
  marque?: string;
  modele?: string;
  annee?: number;
  equipements?: string;
  etat?: string;
}
