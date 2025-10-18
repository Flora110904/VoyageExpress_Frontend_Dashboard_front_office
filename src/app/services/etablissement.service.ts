import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EtablissementRequest, EtablissementResponse } from '../models';

const API = '/api';

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
    return this.http.put(`${this.base}/activer/${trackingId}`, {}, { responseType: 'text' }) as Observable<string>;
  }

  desactiver(trackingId: string): Observable<string> {
    return this.http.put(`${this.base}/desactiver/${trackingId}`, {}, { responseType: 'text' }) as Observable<string>;
  }
}
