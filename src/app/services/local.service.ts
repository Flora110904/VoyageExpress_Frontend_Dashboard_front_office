import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LocalRequest, LocalResponse } from '../models';

const API = '/api';

@Injectable({ providedIn: 'root' })
export class LocalServiceApi {
  private base = `${API}/locaux`;
  constructor(private http: HttpClient) {}

  // Note: if backend requires a query param trackingId on create, this matches angular.md suggestion.
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
