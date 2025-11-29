import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReservationRequest, ReservationResponse } from '../models';
import { environment } from '../../environments/environment';

const API = environment.apiUrl;

export interface StatistiquesResponse {
  totalReservations: number;
  reservationsEnCours: number;
  reservationsConfirmees: number;
  reservationsAnnulees: number;
  revenusTotal: number;
  revenusMoisActuel: number;
  reservationsParMois: { [key: string]: number };
  revenusParMois: { [key: string]: number };
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
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.http.get<ReservationResponse[]>(`${this.base}/all`, { params });
  }

  listByCompagnie(compagnieTrackingId: string): Observable<ReservationResponse[]> {
    return this.http.get<ReservationResponse[]>(`${this.base}/compagnie/${compagnieTrackingId}`);
  }

  listByUser(userTrackingId: string): Observable<ReservationResponse[]> {
    return this.http.get<ReservationResponse[]>(`${this.base}/user/${userTrackingId}`);
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

  getStatistiques(): Observable<StatistiquesResponse> {
    return this.http.get<StatistiquesResponse>(`${this.base}/statistiques`);
  }

  getStatistiquesLocal(localTrackingId: string): Observable<StatistiquesResponse> {
    return this.http.get<StatistiquesResponse>(`${this.base}/statistiques/local/${localTrackingId}`);
  }

  refreshPaymentStatus(transactionId: string): Observable<void> {
    return this.http.post<void>(`${this.base}/payment-status/${transactionId}/refresh`, {});
  }
}
