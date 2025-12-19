import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ReservationServiceApi } from '../../services/reservation.service';
import { ReservationResponse } from '../../models';
import { AuthService } from '../../services/auth.service';
import { FooterComponent } from '../../shared/components/footer/footer.component';

type ReservationFilter = 'upcoming' | 'past' | 'all';

@Component({
  selector: 'app-mes-reservations',
  standalone: true,
  imports: [CommonModule, RouterModule, FooterComponent],
  templateUrl: './mes-reservations.html',
  styleUrl: './mes-reservations.css'
})
export class MesReservations implements OnInit, OnDestroy {
  isLoading = true;
  error: string | null = null;

  reservations: ReservationResponse[] = [];
  upcomingReservations: ReservationResponse[] = [];
  pastReservations: ReservationResponse[] = [];

  activeFilter: ReservationFilter = 'upcoming';

  private subscriptions = new Subscription();

  constructor(
    private reservationService: ReservationServiceApi,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.authService.currentUser.subscribe((user: any) => {
        if (user && user.trackingId) {
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
    switch (this.activeFilter) {
      case 'past':
        return this.pastReservations;
      case 'all':
        return this.reservations;
      default:
        return this.upcomingReservations;
    }
  }

  get totalReservations(): number {
    return this.reservations.length;
  }

  get cancelledCount(): number {
    return this.reservations.filter((r) => r.statut === 'ANNULEE').length;
  }

  get completedCount(): number {
    return this.reservations.filter((r) => r.statut === 'TERMINEE').length;
  }

  setActiveFilter(filter: ReservationFilter): void {
    this.activeFilter = filter;
  }

  retry(): void {
    if (!this.subscriptions.closed) {
      this.subscriptions.unsubscribe();
    }
    this.subscriptions = new Subscription();
    this.isLoading = true;
    this.error = null;
    this.ngOnInit();
  }

  rechercherVoyage(): void {
    this.router.navigate(['/client/recherche']);
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

  getBagageInclus(reservation: ReservationResponse): number | null {
    return reservation.bagageInclusKg ?? null;
  }

  getBagageSupplementaire(reservation: ReservationResponse): { poids: number; montant: number } | null {
    const poids = reservation.bagageSupplementaireKg ?? 0;
    const montant = reservation.bagageSupplementaireMontant ?? 0;
    if (!poids || poids <= 0 || !montant || montant <= 0) {
      return null;
    }
    return { poids, montant };
  }

  hasSeatSelections(reservation: ReservationResponse): boolean {
    return (reservation.seatSelections?.length ?? 0) > 0;
  }

  getSeatCodes(reservation: ReservationResponse): string {
    if (!this.hasSeatSelections(reservation)) {
      return '';
    }
    return reservation.seatSelections!
      .map((seat) => seat.seatCode || seat.seatTrackingId)
      .filter((code): code is string => !!code)
      .join(', ');
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

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'CONFIRMEE':
        return 'badge bg-success';
      case 'EN_ATTENTE':
        return 'badge bg-warning text-dark';
      case 'ANNULEE':
        return 'badge bg-danger';
      case 'TERMINEE':
        return 'badge bg-secondary';
      default:
        return 'badge bg-info';
    }
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
        this.categoriseReservations();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des réservations:', err);
        this.error = 'Impossible de charger vos réservations. Veuillez réessayer ultérieurement.';
        this.isLoading = false;
      }
    });
  }

  private categoriseReservations(): void {
    const now = new Date();

    this.upcomingReservations = this.reservations
      .filter((reservation) => {
        const dateReservation = new Date(reservation.dateReservation);
        return (
          (reservation.statut === 'CONFIRMEE' || reservation.statut === 'EN_ATTENTE') &&
          dateReservation >= now
        );
      })
      .sort((a, b) => new Date(a.dateReservation).getTime() - new Date(b.dateReservation).getTime());

    this.pastReservations = this.reservations
      .filter((reservation) => {
        const dateReservation = new Date(reservation.dateReservation);
        return (
          reservation.statut === 'ANNULEE' ||
          reservation.statut === 'TERMINEE' ||
          dateReservation < now
        );
      })
      .sort((a, b) => new Date(b.dateReservation).getTime() - new Date(a.dateReservation).getTime());

    if (this.filteredReservations.length === 0 && this.upcomingReservations.length === 0) {
      this.activeFilter = 'all';
    }
  }
}
