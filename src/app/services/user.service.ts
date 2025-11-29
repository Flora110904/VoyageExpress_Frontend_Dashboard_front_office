import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PasswordUpdateRequest, UserRequest, UserResponse } from '../models';
import { Role } from '../models/enums.model';
import { environment } from '../../environments/environment';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class UserServiceApi {
  private base = `${API}/users`;
  constructor(private http: HttpClient) {}
  inscription(body: UserRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.base}/inscription`, body);
  }
  activer(trackingId: string): Observable<string> {
    return this.http.post(`${this.base}/activer/${trackingId}`, {}, { responseType: 'text' }) as Observable<string>;
  }
  desactiver(trackingId: string): Observable<string> {
    return this.http.post(`${this.base}/desactiver/${trackingId}`, {}, { responseType: 'text' }) as Observable<string>;
  }
  modifierMotDePasse(body: PasswordUpdateRequest): Observable<string> {
    return this.http.post(`${this.base}/modifier-mot-de-passe`, body, { responseType: 'text' }) as Observable<string>;
  }
  nouveauMotDePasse(body: PasswordUpdateRequest): Observable<string> {
    return this.http.post(`${this.base}/nouveau-mot-de-passe`, body, { responseType: 'text' }) as Observable<string>;
  }
  get(trackingId: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.base}/${trackingId}`);
  }
  list(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.base}/all`);
  }
  findByRole(role: Role): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.base}/role/${role}`);
  }
  update(trackingId: string, body: UserRequest): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.base}/update/${trackingId}`, body);
  }
  delete(trackingId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/delete/${trackingId}`);
  }
  nonActifs(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.base}/non-actifs`);
  }
}
