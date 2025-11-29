import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ReservationResponse } from '../../models';
import { ReservationServiceApi } from '../../services/reservation.service';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-reservation-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FooterComponent],
  templateUrl: './reservation-detail.component.html',
  styleUrl: './reservation-detail.component.css'
})
export class ReservationDetailComponent implements OnInit, OnDestroy {
  loading = true;
  refreshing = false;
  error: string | null = null;
  reservation: ReservationResponse | null = null;

  private trackingId: string | null = null;
  private subscriptions = new Subscription();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly reservationService: ReservationServiceApi
  ) {}

  ngOnInit(): void {
    this.trackingId = this.route.snapshot.paramMap.get('trackingId');
    if (!this.trackingId) {
      this.error = "Référence de réservation manquante";
      this.loading = false;
      return;
    }

    this.loadReservation(this.trackingId);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  retry(): void {
    if (this.trackingId) {
      this.loadReservation(this.trackingId);
    }
  }

  refreshStatus(): void {
    if (!this.reservation || !this.reservation.numeroReservation) {
      return;
    }

    this.refreshing = true;
    const sub = this.reservationService.refreshPaymentStatus(this.reservation.numeroReservation).subscribe({
      next: () => {
        if (this.trackingId) {
          this.loadReservation(this.trackingId, false);
        }
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour du statut de paiement:', err);
        this.refreshing = false;
      }
    });

    this.subscriptions.add(sub);
  }

  goToHebergement(): void {
    if (this.reservation?.localTrackingId) {
      this.router.navigate(['/client/hebergement', this.reservation.localTrackingId]);
    }
  }

  private loadReservation(id: string, showLoader = true): void {
    if (showLoader) {
      this.loading = true;
    }
    this.error = null;

    const sub = this.reservationService.get(id).subscribe({
      next: (reservation) => {
        this.reservation = reservation;
        this.loading = false;
        this.refreshing = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement de la réservation:', err);
        this.error = "Impossible de charger les détails de la réservation.";
        this.loading = false;
        this.refreshing = false;
      }
    });

    this.subscriptions.add(sub);
  }

  get statutBadge(): string {
    const statut = this.reservation?.statut ?? '';
    switch (statut) {
      case 'CONFIRMEE':
        return 'bg-success';
      case 'EN_ATTENTE_PAIEMENT':
      case 'EN_ATTENTE':
        return 'bg-warning text-dark';
      case 'ANNULEE':
        return 'bg-danger';
      case 'TERMINEE':
        return 'bg-secondary';
      default:
        return 'bg-info text-dark';
    }
  }
}
