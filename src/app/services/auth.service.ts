import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoginRequest, LoginResponse } from '../models';

const API = 'http://localhost:3001/api';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = `${API}/auth`;
  constructor(private http: HttpClient) {}

  login(body: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/login`, body);
  }

  logout(): Observable<string> {
    return this.http.post(`${this.base}/logout`, {}, { responseType: 'text' });
  }
}
