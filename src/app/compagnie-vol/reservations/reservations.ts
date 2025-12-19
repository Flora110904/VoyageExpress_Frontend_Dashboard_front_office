import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, ReservationServiceApi, CompagnieServiceApi } from '../../services';
import { CompagnieVolNavbarComponent } from '../shared/compagnie-vol-navbar/compagnie-vol-navbar.component';
import { ReservationResponse, ReservationDetailResponse } from '../../models';

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CompagnieVolNavbarComponent],
  templateUrl: './reservations.html',
  styleUrl: './reservations.css'
})
export class Reservations implements OnInit, OnDestroy {
  isLoading = false;
  error: string | null = null;

  reservations: ReservationResponse[] = [];
  filteredReservations: ReservationResponse[] = [];

  searchTerm = '';
  statusFilter: 'all' | 'CONFIRMEE' | 'EN_ATTENTE_PAIEMENT' | 'ANNULEE' = 'all';
  dateFilter: string | null = null;

  showDetailModal = false;
  detailLoading = false;
  detailError: string | null = null;
  selectedReservationDetail: ReservationDetailResponse | null = null;
  private compagnieTrackingId: string | null = null;

  private subscriptions = new Subscription();

  constructor(
    private readonly reservationService: ReservationServiceApi,
    private readonly authService: AuthService,
    private readonly compagnieService: CompagnieServiceApi
  ) {}

  ngOnInit(): void {
    this.loadReservations();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn;
  }

  logout(): void {
    this.authService.logout();
  }

  get totalReservations(): number {
    return this.reservations.length;
  }

  get confirmedCount(): number {
    return this.reservations.filter((res) => res.statut === 'CONFIRMEE').length;
  }

  get pendingCount(): number {
    return this.reservations.filter((res) => res.statut === 'EN_ATTENTE_PAIEMENT').length;
  }

  get cancelledCount(): number {
    return this.reservations.filter((res) => res.statut === 'ANNULEE').length;
  }

  trackReservation(_index: number, reservation: ReservationResponse): string {
    return reservation?.trackingId ?? `${_index}`;
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.applyFilters();
  }

  onStatusChange(status: string): void {
    this.statusFilter = status as typeof this.statusFilter;
    this.applyFilters();
  }

  onDateChange(date: string): void {
    this.dateFilter = date || null;
    this.applyFilters();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.dateFilter = null;
    this.applyFilters();
  }

  retry(): void {
    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();
    this.loadReservations();
  }

  refresh(): void {
    this.loadReservations();
  }

  formatCurrency(amount: number | null | undefined): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount ?? 0);
  }

  formatDate(dateIso: string): string {
    const date = new Date(dateIso);
    if (Number.isNaN(date.getTime())) {
      return 'Date inconnue';
    }
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  getStatusBadge(statut: string): string {
    switch (statut) {
      case 'CONFIRMEE':
        return 'bg-success';
      case 'EN_ATTENTE_PAIEMENT':
        return 'bg-warning text-dark';
      case 'ANNULEE':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  private loadReservations(): void {
    this.isLoading = true;
    this.error = null;
    const currentUser = this.authService.currentUserValue;
    if (!currentUser?.trackingId) {
      this.error = "Impossible d'identifier la compagnie connectée.";
      this.isLoading = false;
      this.reservations = [];
      this.filteredReservations = [];
      return;
    }

    const sub = this.compagnieService.getByProprietaire(currentUser.trackingId).subscribe({
      next: (compagnie) => {
        this.compagnieTrackingId = compagnie?.trackingId ?? null;
        if (!this.compagnieTrackingId) {
          this.error = "Aucune compagnie aérienne associée à ce compte.";
          this.resetState();
          return;
        }

        const reservationsSub = this.reservationService.listByCompagnie(this.compagnieTrackingId).subscribe({
          next: (reservations) => {
            this.reservations = reservations ?? [];
            this.applyFilters();
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Erreur lors du chargement des réservations:', err);
            this.error = 'Impossible de récupérer les réservations pour le moment.';
            this.resetState();
          }
        });

        this.subscriptions.add(reservationsSub);
      },
      error: (err) => {
        console.error('Erreur lors de la récupération de la compagnie:', err);
        this.error = "Impossible de déterminer la compagnie associée.";
        this.resetState();
      }
    });

    this.subscriptions.add(sub);
  }

  private applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();

    let filtered = [...this.reservations];

    if (term) {
      filtered = filtered.filter((reservation) => {
        const numero = reservation.numeroReservation?.toLowerCase() ?? '';
        return numero.includes(term);
      });
    }

    if (this.statusFilter !== 'all') {
      filtered = filtered.filter((reservation) => reservation.statut === this.statusFilter);
    }

    if (this.dateFilter) {
      filtered = filtered.filter((reservation) => {
        const date = reservation.dateReservation ? reservation.dateReservation.substring(0, 10) : '';
        return date === this.dateFilter;
      });
    }

    this.filteredReservations = filtered;
  }

  openReservationDetail(reservation: ReservationResponse): void {
    if (!this.compagnieTrackingId) {
      return;
    }

    this.detailError = null;
    this.selectedReservationDetail = null;
    this.showDetailModal = true;
    this.detailLoading = true;

    const sub = this.reservationService
      .detailForCompagnie(this.compagnieTrackingId, reservation.trackingId)
      .subscribe({
        next: (detail) => {
          this.selectedReservationDetail = detail;
          this.detailLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement du détail de la réservation:', error);
          this.detailError = "Impossible de charger le détail de la réservation.";
          this.detailLoading = false;
        }
      });

    this.subscriptions.add(sub);
  }

  closeReservationDetail(): void {
    this.showDetailModal = false;
    this.detailError = null;
    this.selectedReservationDetail = null;
    this.detailLoading = false;
  }

  getSeatSummary(detail: ReservationDetailResponse | null): string | null {
    if (!detail || !detail.seatSelections || detail.seatSelections.length === 0) {
      return null;
    }
    return detail.seatSelections
      .map((seat) => seat.seatCode || seat.seatTrackingId)
      .filter((value): value is string => !!value)
      .join(', ');
  }

  private resetState(): void {
    this.reservations = [];
    this.filteredReservations = [];
    this.isLoading = false;
  }
}
