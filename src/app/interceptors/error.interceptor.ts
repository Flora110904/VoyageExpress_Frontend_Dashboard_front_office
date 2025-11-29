import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * Intercepteur pour gérer les erreurs HTTP de manière centralisée
 * Formate les messages d'erreur pour affichage utilisateur
 */
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'Une erreur est survenue';
        
        if (error.error instanceof ErrorEvent) {
          // Erreur côté client
          errorMessage = `Erreur: ${error.error.message}`;
        } else {
          // Erreur côté serveur
          switch (error.status) {
            case 400:
              errorMessage = error.error?.message || 'Requête invalide';
              break;
            case 401:
              errorMessage = 'Non authentifié. Veuillez vous connecter.';
              break;
            case 403:
              errorMessage = 'Accès interdit. Vous n\'avez pas les permissions nécessaires.';
              break;
            case 404:
              errorMessage = 'Ressource non trouvée';
              break;
            case 409:
              errorMessage = error.error?.message || 'Conflit - Cette ressource existe déjà';
              break;
            case 500:
              errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
              break;
            case 503:
              errorMessage = 'Service temporairement indisponible';
              break;
            default:
              if (error.error?.message) {
                errorMessage = error.error.message;
              } else {
                errorMessage = `Erreur ${error.status}: ${error.statusText}`;
              }
          }
        }
        
        // Logger l'erreur pour debug
        console.error('🔴 HTTP Error:', {
          status: error.status,
          message: errorMessage,
          url: error.url,
          error: error.error
        });
        
        // Vous pouvez ici afficher un toast/notification à l'utilisateur
        // Par exemple avec un service de notification
        
        return throwError(() => ({
          status: error.status,
          message: errorMessage,
          originalError: error
        }));
      })
    );
  }
}
