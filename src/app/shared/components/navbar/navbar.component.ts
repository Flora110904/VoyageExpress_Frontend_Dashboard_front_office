import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { Role } from '../../../models/enums.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  isMenuOpen = false;

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  onLogout() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      this.authService.logout();
    }
  }

  get currentUser() {
    return this.authService.currentUserValue;
  }

  get isLoggedIn() {
    return this.authService.isLoggedIn;
  }

  get userRole(): string | null {
    return this.currentUser?.role || null;
  }

  get userName(): string {
    if (this.currentUser) {
      return `${this.currentUser.prenom} ${this.currentUser.nom}`;
    }
    return 'Utilisateur';
  }

  getDashboardLink(): string {
    const role = this.userRole;
    switch (role) {
      case Role.CLIENT:
        return '/client';
      case Role.COMPAGNIE_BUS:
      case Role.COMPAGNIE_AERIEN:
        return '/compagnieBus';
      case Role.ETABLISSEMENT:
        return '/etablisement';
      default:
        return '/';
    }
  }
}
