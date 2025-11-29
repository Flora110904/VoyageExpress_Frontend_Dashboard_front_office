import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../models/enums.model';

/**
 * Guard pour protéger les routes selon le rôle de l'utilisateur
 * Utilisation: canActivate: [RoleGuard], data: { roles: [Role.ADMIN, Role.CLIENT] }
 */
@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const currentUser = this.authService.currentUserValue;
    
    if (!currentUser || !this.authService.isLoggedIn) {
      // Pas connecté, rediriger vers login
      this.router.navigate(['/auth/login'], { 
        queryParams: { returnUrl: state.url } 
      });
      return false;
    }

    const requiredRoles = route.data['roles'] as Role[] | undefined;
    const requireActive = route.data['requireActive'] ?? false;
    const inactiveRedirect = route.data['inactiveRedirect'] ?? '/client/dashboard';
    const unauthorizedRedirect = route.data['unauthorizedRedirect'] ?? '/';

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const userRole = currentUser.role;
    const isActive = currentUser.actif;

    if (!requiredRoles.includes(userRole)) {
      console.warn(`Accès refusé: rôle ${userRole} non autorisé pour cette route`);
      this.router.navigate([unauthorizedRedirect]);
      return false;
    }

    if (requireActive && !isActive) {
      console.warn(`Accès refusé: compte ${userRole} inactif pour cette route protégée`);
      this.router.navigate([inactiveRedirect]);
      return false;
    }

    return true;
  }
}
