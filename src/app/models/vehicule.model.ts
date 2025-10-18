import { TypeVehicule } from './enums.model';

export interface VehiculeRequest {
  nombrePlace: number;
  type: TypeVehicule;
  compagnieTrackingId: string; // UUID as string
}

export interface VehiculeResponse {
  trackingId: string;
  nombrePlace: number;
  type: TypeVehicule;
  compagnieId: string;
}
