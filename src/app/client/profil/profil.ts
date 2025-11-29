import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { AuthService } from '../../services/auth.service';
import { UserServiceApi } from '../../services/user.service';
import { UserResponse } from '../../models';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule, RouterModule, FooterComponent],
  templateUrl: './profil.html',
  styleUrls: ['./profil.css']
})
export class Profil implements OnInit, OnDestroy {
  loading = true;
  error: string | null = null;
  user: UserResponse | null = null;
  private subscriptions = new Subscription();

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserServiceApi,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    const sub = this.authService.currentUser.subscribe((loggedUser) => {
      if (!loggedUser?.trackingId) {
        this.error = 'Vous devez être connecté pour afficher votre profil.';
        this.user = null;
        this.loading = false;
        return;
      }

      this.fetchUser(loggedUser.trackingId);
    });

    this.subscriptions.add(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  navigateToReservations(): void {
    this.router.navigate(['/client/mes-reservations']);
  }

  get initials(): string {
    if (!this.user) {
      return 'VE';
    }
    const first = this.user.prenom?.charAt(0) ?? '';
    const last = this.user.nom?.charAt(0) ?? '';
    const initials = `${first}${last}`.trim();
    return initials || 'VE';
  }


  private fetchUser(trackingId: string): void {
    this.loading = true;
    this.error = null;

    const sub = this.userService.get(trackingId).subscribe({
      next: (user) => {
        this.user = user;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur de récupération du profil utilisateur :', err);
        this.error = "Impossible de récupérer les informations de l'utilisateur.";
        this.loading = false;
      }
    });

    this.subscriptions.add(sub);
  }
}
