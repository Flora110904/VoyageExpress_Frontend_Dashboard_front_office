import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { ReservationResponse } from '../../models';
import { AuthService } from '../../services/auth.service';
import { ReservationServiceApi } from '../../services/reservation.service';

@Component({
  selector: 'app-paiements',
  standalone: true,
  imports: [CommonModule, RouterModule, FooterComponent],
  templateUrl: './paiements.html',
  styleUrls: ['./paiements.css']
})
export class Paiements implements OnInit, OnDestroy {
  loading = true;
  error: string | null = null;
  reservations: ReservationResponse[] = [];
  private subscriptions = new Subscription();

  constructor(
    private readonly authService: AuthService,
    private readonly reservationService: ReservationServiceApi,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    const sub = this.authService.currentUser.subscribe((user) => {
      if (!user?.trackingId) {
        this.error = 'Connexion requise pour afficher vos paiements.';
        this.loading = false;
        return;
      }
      this.loadReservations(user.trackingId);
    });

    this.subscriptions.add(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get paiementEnAttente(): ReservationResponse[] {
    return this.reservations.filter((res) => res.statut === 'EN_ATTENTE_PAIEMENT');
  }

  get paiementsConfirmes(): ReservationResponse[] {
    return this.reservations.filter((res) => res.statut === 'CONFIRMEE' || res.statut === 'TERMINEE');
  }

  viewReservation(reservation: ReservationResponse): void {
    this.router.navigate(['/client/reservation', reservation.trackingId]);
  }

  getReservationDescription(reservation: ReservationResponse): string {
    if ((reservation as any).description) {
      return (reservation as any).description;
    }

    if ((reservation as any).localTrackingId) {
      return 'Réservation hébergement';
    }

    return 'Réservation VoyageExpress';
  }

  getPaiementBadge(statut: string): string {
    switch (statut) {
      case 'CONFIRMEE':
      case 'TERMINEE':
        return 'bg-success';
      case 'EN_ATTENTE_PAIEMENT':
        return 'bg-warning text-dark';
      case 'ANNULEE':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  private loadReservations(trackingId: string): void {
    this.loading = true;
    this.error = null;

    const sub = this.reservationService.listByUser(trackingId).subscribe({
      next: (reservations) => {
        this.reservations = reservations;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des paiements :', err);
        this.error = 'Impossible de récupérer vos paiements pour le moment.';
        this.loading = false;
      }
    });

    this.subscriptions.add(sub);
  }
}
