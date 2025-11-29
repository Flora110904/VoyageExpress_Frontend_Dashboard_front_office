import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VehiculeItineraireRequest, VehiculeItineraireResponse } from '../models';
import { environment } from '../../environments/environment';

const API = environment.apiUrl;

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
