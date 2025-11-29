import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VehiculeRequest, VehiculeResponse } from '../models';
import { environment } from '../../environments/environment';

const API = environment.apiUrl;

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

  listByCompagnie(compagnieTrackingId: string): Observable<VehiculeResponse[]> {
    return this.http.get<VehiculeResponse[]>(`${this.base}/compagnie/${compagnieTrackingId}`);
  }

  update(trackingId: string, body: VehiculeRequest): Observable<VehiculeResponse> {
    return this.http.put<VehiculeResponse>(`${this.base}/${trackingId}`, body);
  }

  delete(trackingId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${trackingId}`);
  }
}
