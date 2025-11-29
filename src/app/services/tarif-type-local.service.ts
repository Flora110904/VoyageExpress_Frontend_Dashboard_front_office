import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TarifTypeLocalRequest, TarifTypeLocalResponse } from '../models';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class TarifTypeLocalServiceApi {
  private readonly base = `${API}/tarifs-types`;

  constructor(private readonly http: HttpClient) {}

  create(etablissementTrackingId: string, body: TarifTypeLocalRequest): Observable<TarifTypeLocalResponse> {
    const url = `${this.base}/create?etablissementTrackingId=${encodeURIComponent(etablissementTrackingId)}`;
    return this.http.post<TarifTypeLocalResponse>(url, body);
  }

  listByEtablissement(etablissementTrackingId: string): Observable<TarifTypeLocalResponse[]> {
    return this.http.get<TarifTypeLocalResponse[]>(`${this.base}/etablissement/${etablissementTrackingId}`);
  }

  update(trackingId: string, body: TarifTypeLocalRequest): Observable<TarifTypeLocalResponse> {
    return this.http.put<TarifTypeLocalResponse>(`${this.base}/update/${trackingId}`, body);
  }

  delete(trackingId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/delete/${trackingId}`);
  }
}
