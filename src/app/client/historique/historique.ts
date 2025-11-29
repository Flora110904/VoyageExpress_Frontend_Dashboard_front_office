import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ReservationResponse } from '../../models';
import { ReservationServiceApi } from '../../services/reservation.service';
import { AuthService } from '../../services/auth.service';
import { FooterComponent } from '../../shared/components/footer/footer.component';

type ReservationStatusFilter = 'all' | 'CONFIRMEE' | 'EN_ATTENTE' | 'TERMINEE' | 'ANNULEE';

@Component({
  selector: 'app-historique',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FooterComponent],
  templateUrl: './historique.html',
  styleUrl: './historique.css'
})
export class Historique implements OnInit, OnDestroy {
  isLoading = true;
  error: string | null = null;

  reservations: ReservationResponse[] = [];

  statusFilter: ReservationStatusFilter = 'all';
  searchTerm = '';
  dateRange = {
    from: '',
    to: ''
  };

  private subscriptions = new Subscription();

  constructor(
    private reservationService: ReservationServiceApi,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.authService.currentUser.subscribe((user: any) => {
        if (user?.trackingId) {
          this.loadReservations(user.trackingId);
        } else {
          this.isLoading = false;
          this.error = "Impossible de récupérer les informations de l'utilisateur.";
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get filteredReservations(): ReservationResponse[] {
    const fromDate = this.dateRange.from ? new Date(this.dateRange.from) : null;
    const toDate = this.dateRange.to ? new Date(this.dateRange.to) : null;

    return this.reservations
      .filter((reservation) => {
        if (this.statusFilter !== 'all' && reservation.statut !== this.statusFilter) {
          return false;
        }

        if (this.searchTerm) {
          const lowerTerm = this.searchTerm.toLowerCase();
          const ref = reservation.trackingId.toLowerCase();
          const numero = reservation.numeroReservation?.toLowerCase() ?? '';
          if (!ref.includes(lowerTerm) && !numero.includes(lowerTerm)) {
            return false;
          }
        }

        if (fromDate) {
          const resDate = new Date(reservation.dateReservation);
          if (resDate < fromDate) {
            return false;
          }
        }

        if (toDate) {
          const resDate = new Date(reservation.dateReservation);
          if (resDate > toDate) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => new Date(b.dateReservation).getTime() - new Date(a.dateReservation).getTime());
  }

  get totalReservations(): number {
    return this.reservations.length;
  }

  get totalSpent(): number {
    return this.reservations.reduce((sum, reservation) => sum + (reservation.montantTotal ?? 0), 0);
  }

  get lastActivity(): string {
    if (!this.reservations.length) {
      return 'Aucune activité';
    }
    const latest = this.reservations
      .map((reservation) => new Date(reservation.dateReservation))
      .sort((a, b) => b.getTime() - a.getTime())[0];
    return this.formatDate(latest.toISOString());
  }

  get cancelledCount(): number {
    return this.reservations.filter((r) => r.statut === 'ANNULEE').length;
  }

  get statuses(): ReservationStatusFilter[] {
    return ['all', 'CONFIRMEE', 'EN_ATTENTE', 'TERMINEE', 'ANNULEE'];
  }

  setStatusFilter(filter: ReservationStatusFilter): void {
    this.statusFilter = filter;
  }

  resetFilters(): void {
    this.statusFilter = 'all';
    this.searchTerm = '';
    this.dateRange = { from: '', to: '' };
  }

  retry(): void {
    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();
    this.error = null;
    this.isLoading = true;
    this.ngOnInit();
  }

  viewReservation(reservation: ReservationResponse): void {
    this.router.navigate(['/client/reservation', reservation.trackingId]);
  }

  downloadTicket(reservation: ReservationResponse): void {
    this.reservationService.downloadTicketHebergement(reservation.trackingId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ticket-${reservation.trackingId}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Erreur lors du téléchargement du ticket:', err);
      }
    });
  }

  getStatutLabel(statut: string): string {
    switch (statut) {
      case 'CONFIRMEE':
        return 'Confirmée';
      case 'EN_ATTENTE':
        return 'En attente';
      case 'ANNULEE':
        return 'Annulée';
      case 'TERMINEE':
        return 'Terminée';
      default:
        return statut;
    }
  }

  getBadgeClass(statut: string): string {
    switch (statut) {
      case 'CONFIRMEE':
        return 'bg-success';
      case 'EN_ATTENTE':
        return 'bg-warning text-dark';
      case 'ANNULEE':
        return 'bg-danger';
      case 'TERMINEE':
        return 'bg-secondary';
      default:
        return 'bg-info';
    }
  }

  getReservationType(reservation: ReservationResponse): string {
    return reservation.localTrackingId ? 'Hébergement' : 'Voyage';
  }

  formatDate(date: string): string {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  trackReservation(_index: number, reservation: ReservationResponse): string {
    return reservation?.trackingId ?? `${_index}`;
  }

  private loadReservations(userTrackingId: string): void {
    this.isLoading = true;
    this.error = null;

    this.reservationService.listByUser(userTrackingId).subscribe({
      next: (reservations) => {
        this.reservations = reservations;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement de l\'historique des réservations:', err);
        this.error = 'Impossible de charger votre historique. Merci de réessayer ultérieurement.';
        this.isLoading = false;
      }
    });
  }
}
