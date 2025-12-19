import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ReservationDetailResponse } from '../../models';
import { ReservationServiceApi } from '../../services/reservation.service';

@Component({
  selector: 'app-reservation-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './reservation-details.component.html',
  styleUrl: './reservation-details.component.css'
})
export class ReservationDetailsComponent implements OnInit, OnDestroy {
  loading = true;
  error: string | null = null;
  reservation: ReservationDetailResponse | null = null;

  private trackingId: string | null = null;
  private subscriptions = new Subscription();

  constructor(
    private readonly route: ActivatedRoute,
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

  private loadReservation(id: string): void {
    this.loading = true;
    this.error = null;

    const sub = this.reservationService.detail(id).subscribe({
      next: (reservation) => {
        this.reservation = reservation;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement de la réservation:', err);
        this.error = "Impossible de charger les détails de la réservation.";
        this.loading = false;
      }
    });

    this.subscriptions.add(sub);
  }

  getStatutBadgeClass(statut: string): string {
    switch (statut?.toUpperCase()) {
      case 'CONFIRMEE':
        return 'badge-success';
      case 'EN_ATTENTE':
        return 'badge-warning';
      case 'EN_ATTENTE_PAIEMENT':
        return 'badge-info';
      case 'ANNULEE':
        return 'badge-danger';
      case 'TERMINEE':
        return 'badge-secondary';
      default:
        return 'badge-light';
    }
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'Non spécifié';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatMontant(montant: number | null | undefined): string {
    if (montant == null) return '0 FCFA';
    return `${montant.toLocaleString('fr-FR')} FCFA`;
  }

  downloadTicket(): void {
    console.log('Téléchargement du ticket pour la réservation:', this.trackingId);
  }

  goBack(): void {
    window.history.back();
  }

  getStatutClass(statut: string): string {
    switch (statut?.toUpperCase()) {
      case 'CONFIRMEE':
        return 'success';
      case 'EN_ATTENTE':
        return 'warning';
      case 'EN_ATTENTE_PAIEMENT':
        return 'info';
      case 'ANNULEE':
        return 'danger';
      case 'TERMINEE':
        return 'secondary';
      default:
        return 'light';
    }
  }

  getStatutLabel(statut: string): string {
    switch (statut?.toUpperCase()) {
      case 'CONFIRMEE':
        return 'Confirmée';
      case 'EN_ATTENTE':
        return 'En attente';
      case 'EN_ATTENTE_PAIEMENT':
        return 'En attente de paiement';
      case 'ANNULEE':
        return 'Annulée';
      case 'TERMINEE':
        return 'Terminée';
      default:
        return statut || 'Inconnu';
    }
  }

  formatHeure(heureString: string | null | undefined): string {
    if (!heureString) return 'Non spécifié';
    try {
      const date = new Date(`1970-01-01T${heureString}`);
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return heureString;
    }
  }

  getClasseLabel(classe: string | null | undefined): string {
    switch (classe?.toUpperCase()) {
      case 'ECONOMIQUE':
        return 'Économique';
      case 'ECONOMIQUE_PREMIUM':
        return 'Économique Premium';
      case 'AFFAIRES':
        return 'Affaires';
      case 'PREMIERE':
        return 'Première';
      default:
        return classe || 'Non spécifiée';
    }
  }

  openPayment(): void {
    console.log('Ouverture du paiement pour la réservation:', this.trackingId);
  }

  printTicket(): void {
    window.print();
  }
}
