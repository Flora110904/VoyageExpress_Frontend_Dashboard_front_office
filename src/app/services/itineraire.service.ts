import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ItineraireRequest, ItineraireResponse } from '../models';
import { environment } from '../../environments/environment';

const API = environment.apiUrl;

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

  listByCompagnie(compagnieTrackingId: string): Observable<ItineraireResponse[]> {
    return this.http.get<ItineraireResponse[]>(`${this.base}/compagnie/${compagnieTrackingId}`);
  }

  update(trackingId: string, body: ItineraireRequest): Observable<ItineraireResponse> {
    return this.http.put<ItineraireResponse>(`${this.base}/update/${trackingId}`, body);
  }

  delete(trackingId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/delete/${trackingId}`);
  }

  search(params: {
    villeDepart?: string;
    villeArrivee?: string;
    dateDepart?: string;
    prixMin?: number;
    prixMax?: number;
  }): Observable<ItineraireResponse[]> {
    let queryParams = new URLSearchParams();
    if (params.villeDepart) queryParams.set('villeDepart', params.villeDepart);
    if (params.villeArrivee) queryParams.set('villeArrivee', params.villeArrivee);
    if (params.dateDepart) queryParams.set('dateDepart', params.dateDepart);
    if (params.prixMin !== undefined) queryParams.set('prixMin', params.prixMin.toString());
    if (params.prixMax !== undefined) queryParams.set('prixMax', params.prixMax.toString());
    
    return this.http.get<ItineraireResponse[]>(`${this.base}/search?${queryParams.toString()}`);
  }
}
