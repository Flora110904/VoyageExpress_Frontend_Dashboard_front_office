import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BilletRequest, BilletResponse } from '../models';

const API = '/api';

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
