import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Intercepteur HTTP pour :
 * 1. Ajouter automatiquement le token JWT aux requêtes
 * 2. Gérer les erreurs d'authentification (401, 403)
 * 3. Rediriger vers login si non authentifié
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Récupérer le token depuis le service d'authentification
    const token = this.authService.getToken();
    
    // Cloner la requête et ajouter le header Authorization si token existe
    let authReq = req;
    if (token) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    
    // Passer la requête au handler suivant et gérer les erreurs
    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Token invalide ou expiré - déconnecter et rediriger
          console.error('❌ Erreur 401 - Non authentifié');
          this.authService.logout();
        } else if (error.status === 403) {
          // Accès interdit - l'utilisateur n'a pas les permissions
          console.error('❌ Erreur 403 - Accès interdit');
          this.router.navigate(['/']);
        } else if (error.status === 0) {
          // Erreur réseau - serveur inaccessible
          console.error('❌ Erreur réseau - Impossible de contacter le serveur');
        }
        
        return throwError(() => error);
      })
    );
  }
}
