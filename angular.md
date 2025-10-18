# Angular models & services mapping

## Models (TypeScript)

```ts
// Enums
export enum Role {
  ADMIN = 'ADMIN',
  CLIENT = 'CLIENT',
  COMPAGNIE_BUS = 'COMPAGNIE_BUS',
  COMPAGNIE_AERIEN = 'COMPAGNIE_AERIEN',
  ETABLISSEMENT = 'ETABLISSEMENT',
}

export enum TypeCompagnie {
  AEROPORT = 'AEROPORT',
  STATION = 'STATION',
}

export enum TypeEtablissement {
  Hotel = 'Hotel',
  Motel = 'Motel',
  Appartement = 'Appartement',
}

export enum TypeLocal {
  CHAMBRE_SIMPLE = 'CHAMBRE_SIMPLE',
  CHAMBRE_CLIMER = 'CHAMBRE_CLIMER',
  CHAMBRE_VENTILLER = 'CHAMBRE_VENTILLER',
  SALLE_DE_CONFERENCE = 'SALLE_DE_CONFERENCE',
  SALLE_DES_FETES = 'SALLE_DES_FETES',
  SUITE = 'SUITE',
}

export enum TypeVehicule {
  AVION = 'AVION',
  BUS = 'BUS',
}

// Request DTOs
export interface LoginRequest {
  email: string;
  password: string;
}

export interface PasswordUpdateRequest {
  email: string;
  oldPassword: string;
  newPassword: string;
}

export interface UserRequest {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  role: string; // or Role if backend expects enum string values compatible
  telephone: string;
}

export interface CompagnieRequest {
  nom: string;
  type: string; // or TypeCompagnie
}

export interface EtablissementRequest {
  adresse: string;
  type: TypeEtablissement;
  proprietaireId: string; // UUID as string
}

export interface ItineraireRequest {
  villeDepart: string;
  villeArrivee: string;
  dateDepart: string; // LocalDate (YYYY-MM-DD)
  heureDepart: string;
  prix: number;
  placeDisponible: number;
  compagnieId: string; // UUID as string
}

export interface LocalRequest {
  description: string;
  type: TypeLocal;
  etablissementId: number; // Java Long
}

export interface ReservationRequest {
  statut: string;
  dateReservation: string; // LocalDateTime ISO
  userTrakingId: string; // UUID as string (note: spelling from backend)
}

export interface VehiculeRequest {
  nombrePlace: number;
  type: TypeVehicule;
  compagnieTrackingId: string; // UUID as string
}

export interface VehiculeItineraireRequest {
  vehiculeTrackingId: string; // UUID as string
  itineraireTrackingId: string; // UUID as string
}

export interface BilletRequest {
  montant: number;
  statut: string;
  fils: string;
}

// Response DTOs
export interface LoginResponse {
  token: string;
  type: string;
  email: string;
  role: Role;
  nom: string;
  prenom: string;
  actif: boolean;
}

export interface ErrorResponseDto {
  message: string;
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

export interface CompagnieResponse {
  trackingId: string;
  nom: string;
  type: TypeCompagnie;
}

export interface EtablissementResponse {
  id: number;
  trackingId: string;
  adresse: string;
  type: TypeEtablissement;
}

export interface ItineraireResponse {
  trackingId: string;
  villeDepart: string;
  villeArrivee: string;
  dateDepart: string; // LocalDate
  heureDepart: string;
  prix: number;
  placeDisponible: number;
}

export interface LocalResponse {
  trackingId: string;
  description: string;
  type: TypeLocal;
  etablissementTrackingId: string;
  imageUrl: string;
}

export interface ReservationResponse {
  trackingId: string;
  statut: string;
  dateReservation: string; // LocalDateTime
  ticketHebergementUrl: string;
  utilisateurTrackingId: string;
  localTrackingId: string;
}

export interface VehiculeResponse {
  trackingId: string;
  nombrePlace: number;
  type: TypeVehicule;
  compagnieId: string;
}

export interface VehiculeItineraireResponse {
  trackingId: string;
  vehiculeTrackingId: string;
  itineraireTrackingId: string;
}

export interface BilletResponse {
  trackingId: string;
  id: number;
  montant: number;
  statut: string;
  fils: string;
  pdfUrl: string;
  reservationId: number;
  itineraireId: number;
}
```

## Angular services (HttpClient)

```ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  LoginRequest, LoginResponse,
  PasswordUpdateRequest,
  UserRequest, UserResponse,
  CompagnieRequest, CompagnieResponse,
  EtablissementRequest, EtablissementResponse,
  ItineraireRequest, ItineraireResponse,
  LocalRequest, LocalResponse,
  ReservationRequest, ReservationResponse,
  VehiculeRequest, VehiculeResponse,
  VehiculeItineraireRequest, VehiculeItineraireResponse,
  BilletRequest, BilletResponse
} from './models';
import { Observable } from 'rxjs';

const API = '/api';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = `${API}/auth`;
  constructor(private http: HttpClient) {}
  login(body: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/login`, body);
  }
  logout(): Observable<string> {
    return this.http.post(`${this.base}/logout`, {}, { responseType: 'text' as any });
  }
}

@Injectable({ providedIn: 'root' })
export class UserServiceApi {
  private base = `${API}/users`;
  constructor(private http: HttpClient) {}
  inscription(body: UserRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.base}/inscription`, body);
  }
  activer(trackingId: string): Observable<string> {
    return this.http.post(`${this.base}/activer/${trackingId}`, {}, { responseType: 'text' as any });
  }
  desactiver(trackingId: string): Observable<string> {
    return this.http.post(`${this.base}/desactiver/${trackingId}`, {}, { responseType: 'text' as any });
  }
  modifierMotDePasse(body: PasswordUpdateRequest): Observable<string> {
    return this.http.post(`${this.base}/modifier-mot-de-passe`, body, { responseType: 'text' as any });
  }
  nouveauMotDePasse(body: PasswordUpdateRequest): Observable<string> {
    return this.http.post(`${this.base}/nouveau-mot-de-passe`, body, { responseType: 'text' as any });
  }
  get(trackingId: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.base}/${trackingId}`);
  }
  list(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.base}/all`);
  }
  findByRole(role: string): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.base}/role/${role}`);
  }
  update(trackingId: string, body: UserRequest): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.base}/update/${trackingId}`, body);
  }
  delete(trackingId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/delete/${trackingId}`);
  }
  nonActifs(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.base}/non-actifs`);
  }
}

@Injectable({ providedIn: 'root' })
export class CompagnieServiceApi {
  private base = `${API}/compagnies`;
  constructor(private http: HttpClient) {}
  create(body: CompagnieRequest): Observable<CompagnieResponse> {
    return this.http.post<CompagnieResponse>(`${this.base}/create`, body);
  }
  get(trackingId: string): Observable<CompagnieResponse> {
    return this.http.get<CompagnieResponse>(`${this.base}/${trackingId}`);
  }
  list(): Observable<CompagnieResponse[]> {
    return this.http.get<CompagnieResponse[]>(`${this.base}/all`);
  }
  update(trackingId: string, body: CompagnieRequest): Observable<CompagnieResponse> {
    return this.http.put<CompagnieResponse>(`${this.base}/update/${trackingId}`, body);
  }
  delete(trackingId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/delete/${trackingId}`);
  }
  activer(trackingId: string): Observable<string> {
    return this.http.put(`${this.base}/activer/${trackingId}`, {}, { responseType: 'text' as any });
  }
}

@Injectable({ providedIn: 'root' })
export class EtablissementServiceApi {
  private base = `${API}/etablissements`;
  constructor(private http: HttpClient) {}
  create(body: EtablissementRequest): Observable<EtablissementResponse> {
    return this.http.post<EtablissementResponse>(`${this.base}/create`, body);
  }
  get(trackingId: string): Observable<EtablissementResponse> {
    return this.http.get<EtablissementResponse>(`${this.base}/${trackingId}`);
  }
  list(): Observable<EtablissementResponse[]> {
    return this.http.get<EtablissementResponse[]>(`${this.base}/all`);
  }
  update(trackingId: string, body: EtablissementRequest): Observable<EtablissementResponse> {
    return this.http.put<EtablissementResponse>(`${this.base}/update/${trackingId}`, body);
  }
  delete(trackingId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/delete/${trackingId}`);
  }
  activer(trackingId: string): Observable<string> {
    return this.http.put(`${this.base}/activer/${trackingId}`, {}, { responseType: 'text' as any });
  }
  desactiver(trackingId: string): Observable<string> {
    return this.http.put(`${this.base}/desactiver/${trackingId}`, {}, { responseType: 'text' as any });
  }
}

@Injectable({ providedIn: 'root' })
export class ItineraireServiceApi {
  private base = `${API}/itineraires`;
  constructor(private http: HttpClient) {}
  create(body: ItineraireRequest): Observable<ItineraireResponse> {
    return this.http.post<ItineraireResponse>(`${this.base}/create`, body);
  }
  get(trackingId: string): Observable<ItineraireResponse> {
    return this.http.get<ItineraireResponse>(`${this.base}/${trackingId}`);
  }
  list(): Observable<ItineraireResponse[]> {
    return this.http.get<ItineraireResponse[]>(`${this.base}/all`);
  }
  update(trackingId: string, body: ItineraireRequest): Observable<ItineraireResponse> {
    return this.http.put<ItineraireResponse>(`${this.base}/update/${trackingId}`, body);
  }
  delete(trackingId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/delete/${trackingId}`);
  }
}

@Injectable({ providedIn: 'root' })
export class LocalServiceApi {
  private base = `${API}/locaux`;
  constructor(private http: HttpClient) {}
  // Note: backend method signature shows an unannotated UUID param. Adjust if backend expects a query param like ?trackingId=
  create(body: LocalRequest, trackingId?: string): Observable<LocalResponse> {
    const url = `${this.base}/create` + (trackingId ? `?trackingId=${encodeURIComponent(trackingId)}` : '');
    return this.http.post<LocalResponse>(url, body);
  }
  get(trackingId: string): Observable<LocalResponse> {
    return this.http.get<LocalResponse>(`${this.base}/${trackingId}`);
  }
  list(): Observable<LocalResponse[]> {
    return this.http.get<LocalResponse[]>(`${this.base}/all`);
  }
  update(trackingId: string, body: LocalRequest): Observable<LocalResponse> {
    return this.http.put<LocalResponse>(`${this.base}/update/${trackingId}`, body);
  }
  delete(trackingId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/delete/${trackingId}`);
  }
  uploadImage(trackingId: string, file: File): Observable<LocalResponse> {
    const form = new FormData();
    form.append('image', file);
    return this.http.post<LocalResponse>(`${this.base}/${trackingId}/image`, form);
  }
}

@Injectable({ providedIn: 'root' })
export class ReservationServiceApi {
  private base = `${API}/reservations`;
  constructor(private http: HttpClient) {}
  create(body: ReservationRequest): Observable<ReservationResponse> {
    return this.http.post<ReservationResponse>(`${this.base}/create`, body);
  }
  get(trackingId: string): Observable<ReservationResponse> {
    return this.http.get<ReservationResponse>(`${this.base}/${trackingId}`);
  }
  list(page = 0, size = 10): Observable<ReservationResponse[]> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ReservationResponse[]>(`${this.base}/all`, { params });
  }
  update(trackingId: string, body: ReservationRequest): Observable<ReservationResponse> {
    return this.http.put<ReservationResponse>(`${this.base}/update/${trackingId}`, body);
  }
  delete(trackingId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/delete/${trackingId}`);
  }
  generateTicketHebergement(trackingId: string): Observable<ReservationResponse> {
    return this.http.post<ReservationResponse>(`${this.base}/${trackingId}/generate-ticket-hebergement`, {});
  }
  downloadTicketHebergement(trackingId: string): Observable<Blob> {
    return this.http.get(`${this.base}/${trackingId}/download-ticket-hebergement`, { responseType: 'blob' });
  }
}

@Injectable({ providedIn: 'root' })
export class VehiculeServiceApi {
  private base = `${API}/vehicules`;
  constructor(private http: HttpClient) {}
  create(body: VehiculeRequest): Observable<VehiculeResponse> {
    return this.http.post<VehiculeResponse>(`${this.base}`, body);
  }
  get(trackingId: string): Observable<VehiculeResponse> {
    return this.http.get<VehiculeResponse>(`${this.base}/${trackingId}`);
  }
  list(): Observable<VehiculeResponse[]> {
    return this.http.get<VehiculeResponse[]>(`${this.base}`);
  }
  update(trackingId: string, body: VehiculeRequest): Observable<VehiculeResponse> {
    return this.http.put<VehiculeResponse>(`${this.base}/${trackingId}`, body);
  }
  delete(trackingId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${trackingId}`);
  }
}

@Injectable({ providedIn: 'root' })
export class VehiculeItineraireServiceApi {
  private base = `${API}/vehicule-itineraires`;
  constructor(private http: HttpClient) {}
  create(body: VehiculeItineraireRequest): Observable<VehiculeItineraireResponse> {
    return this.http.post<VehiculeItineraireResponse>(`${this.base}`, body);
  }
  get(trackingId: string): Observable<VehiculeItineraireResponse> {
    return this.http.get<VehiculeItineraireResponse>(`${this.base}/${trackingId}`);
  }
  list(): Observable<VehiculeItineraireResponse[]> {
    return this.http.get<VehiculeItineraireResponse[]>(`${this.base}`);
  }
  update(trackingId: string, body: VehiculeItineraireRequest): Observable<VehiculeItineraireResponse> {
    return this.http.put<VehiculeItineraireResponse>(`${this.base}/${trackingId}`, body);
  }
  delete(trackingId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${trackingId}`);
  }
}

@Injectable({ providedIn: 'root' })
export class BilletServiceApi {
  private base = `${API}/billets`;
  constructor(private http: HttpClient) {}
  create(body: BilletRequest): Observable<BilletResponse> {
    return this.http.post<BilletResponse>(`${this.base}`, body);
  }
  get(trackingId: string): Observable<BilletResponse> {
    return this.http.get<BilletResponse>(`${this.base}/${trackingId}`);
  }
  list(): Observable<BilletResponse[]> {
    return this.http.get<BilletResponse[]>(`${this.base}`);
  }
  update(trackingId: string, body: BilletRequest): Observable<BilletResponse> {
    return this.http.put<BilletResponse>(`${this.base}/${trackingId}`, body);
  }
  delete(trackingId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${trackingId}`);
  }
  uploadFichier(trackingId: string, fichier: File): Observable<BilletResponse> {
    const form = new FormData();
    form.append('fichier', fichier);
    return this.http.post<BilletResponse>(`${this.base}/${trackingId}/fichier`, form);
  }
  generatePdf(trackingId: string): Observable<BilletResponse> {
    return this.http.post<BilletResponse>(`${this.base}/${trackingId}/generate-pdf`, {});
  }
  downloadPdf(trackingId: string): Observable<Blob> {
    return this.http.get(`${this.base}/${trackingId}/download-pdf`, { responseType: 'blob' });
  }
}
```
