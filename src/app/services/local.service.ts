import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LocalRequest, LocalResponse, TypeLocal, TarifTypeLocalRequest, TarifTypeLocalResponse } from '../models';
import { environment } from '../../environments/environment';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class LocalServiceApi {
  private base = `${API}/locaux`;
  constructor(private http: HttpClient) {}
  // Backend expects etablissementTrackingId as query param
  create(body: LocalRequest, etablissementTrackingId: string): Observable<LocalResponse> {
    const url = `${this.base}/create?etablissementTrackingId=${encodeURIComponent(etablissementTrackingId)}`;
    return this.http.post<LocalResponse>(url, body);
  }
  get(trackingId: string): Observable<LocalResponse> {
    return this.http.get<LocalResponse>(`${this.base}/${trackingId}`);
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

  search(params: { type?: string; etablissementId?: string }): Observable<LocalResponse[]> {
    let queryParams = new URLSearchParams();
    if (params.type) queryParams.set('type', params.type);
    if (params.etablissementId) queryParams.set('etablissementId', params.etablissementId);
    
    return this.http.get<LocalResponse[]>(`${this.base}/search?${queryParams.toString()}`);
  }

  listByEtablissement(etablissementTrackingId: string): Observable<LocalResponse[]> {
    return this.http.get<LocalResponse[]>(`${this.base}/etablissement/${etablissementTrackingId}`);
  }

  list(): Observable<LocalResponse[]> {
    return this.http.get<LocalResponse[]>(`${this.base}/all`);
  }

  getTarif(etablissementTrackingId: string, type: TypeLocal): Observable<TarifTypeLocalResponse> {
    return this.http.get<TarifTypeLocalResponse>(`${API}/tarifs-types/etablissement/${etablissementTrackingId}/type/${type}`);
  }

  upsertTarif(etablissementTrackingId: string, body: TarifTypeLocalRequest): Observable<TarifTypeLocalResponse> {
    const url = `${API}/tarifs-types/create?etablissementTrackingId=${encodeURIComponent(etablissementTrackingId)}`;
    return this.http.post<TarifTypeLocalResponse>(url, body);
  }
}
