import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { LoginRequest, LoginResponse } from '../models';
import { Role } from '../models/enums.model';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = `${API}/auth`;
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;
  private tokenTimeoutHandle: any = null;

  constructor(private http: HttpClient, private router: Router) {
    const storedUser = this.getUserFromStorage();
    this.currentUserSubject = new BehaviorSubject<any>(storedUser);
    this.currentUser = this.currentUserSubject.asObservable();
    // Si un token est présent au démarrage, démarrer le timer d'expiration
    const token = this.getToken();
    if (token) {
      this.startTokenTimer(token);
    }
  }

  public get currentUserValue(): any {
    return this.currentUserSubject.value;
  }

  public get isLoggedIn(): boolean {
    return !!this.currentUserValue && !!this.getToken();
  }

  private getUserFromStorage(): any {
    const userStr = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Parse a JWT and return its payload as object
  private parseJwt(token: string): any | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decodeURIComponent(escape(decoded)));
    } catch (e) {
      return null;
    }
  }

  private getTokenExpirationDate(token: string): Date | null {
    const payload = this.parseJwt(token);
    if (!payload || !payload.exp) return null;
    // exp is in seconds since epoch
    const date = new Date(0);
    date.setUTCSeconds(payload.exp);
    return date;
  }

  private isTokenExpired(token: string): boolean {
    const expDate = this.getTokenExpirationDate(token);
    if (!expDate) return false; // Treat unknown as not expired
    return expDate.valueOf() <= new Date().valueOf();
  }

  private startTokenTimer(token: string) {
    this.stopTokenTimer();
    const expDate = this.getTokenExpirationDate(token);
    if (!expDate) return;
    const timeout = expDate.valueOf() - new Date().valueOf();
    if (timeout <= 0) {
      // Token déjà expiré
      this.logout();
      return;
    }
    this.tokenTimeoutHandle = setTimeout(() => {
      // Auto logout when token expires
      this.logout();
    }, timeout);
  }

  private stopTokenTimer() {
    if (this.tokenTimeoutHandle) {
      clearTimeout(this.tokenTimeoutHandle);
      this.tokenTimeoutHandle = null;
    }
  }

  public getToken(): string | null {
    // Support both localStorage (remember me) and sessionStorage
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }

  login(body: LoginRequest, remember: boolean = false): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/login`, body).pipe(
      map((response: LoginResponse) => {
        const originalRole = response.role;
        const isPendingValidationRole = [
          Role.COMPAGNIE_AERIEN,
          Role.COMPAGNIE_BUS,
          Role.ETABLISSEMENT
        ].includes(originalRole);

        const shouldDowngrade = isPendingValidationRole && !response.actif;
        const effectiveRole = shouldDowngrade ? Role.CLIENT : originalRole;

        return {
          ...response,
          role: effectiveRole,
          originalRole: shouldDowngrade ? originalRole : response.originalRole,
          effectiveRole
        } as LoginResponse;
      }),
      tap((normalized: LoginResponse) => {
        if (normalized && normalized.token) {
          const storage = remember ? localStorage : sessionStorage;
          storage.setItem('token', normalized.token);
          storage.setItem('currentUser', JSON.stringify(normalized));
          this.currentUserSubject.next(normalized);
          // Démarrer timer d'expiration
          this.startTokenTimer(normalized.token);
        }
      })
    );
  }

  logout(): void {
    // Nettoyer les deux emplacements de stockage
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.stopTokenTimer();
    this.router.navigate(['/']);
  }

  logoutWithAPI(): Observable<string> {
    return this.http.post(`${this.base}/logout`, {}, { responseType: 'text' }).pipe(
      tap(() => this.logout())
    );
  }
}
