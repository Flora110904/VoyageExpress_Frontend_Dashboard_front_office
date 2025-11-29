import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CompagnieRequest, CompagnieResponse } from '../models';
import { environment } from '../../environments/environment';

const API = environment.apiUrl;

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

  getByProprietaire(trackingId: string): Observable<CompagnieResponse> {
    return this.http.get<CompagnieResponse>(`${this.base}/proprietaire/${trackingId}`);
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
    return this.http.put(`${this.base}/activer/${trackingId}`, {}, { responseType: 'text' }) as Observable<string>;
  }
}
