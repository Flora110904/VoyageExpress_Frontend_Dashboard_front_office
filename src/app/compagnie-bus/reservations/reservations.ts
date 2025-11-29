import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ReservationResponse } from '../../models';
import { AuthService, ReservationServiceApi, CompagnieServiceApi } from '../../services';
import { CompagnieBusNavbarComponent } from '../shared/compagnie-bus-navbar/compagnie-bus-navbar.component';

interface ReservationFilters {
  search?: string;
  status?: string;
  date?: string;
}

type BusReservation = ReservationResponse & {
  clientNom?: string | null;
  clientPrenom?: string | null;
  clientEmail?: string | null;
  quantite?: number | null;
  itineraire?: {
    trackingId?: string | null;
    villeDepart?: string | null;
    villeArrivee?: string | null;
    dateDepart?: string | null;
    heureDepart?: string | null;
  } | null;
};

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CompagnieBusNavbarComponent],
  templateUrl: './reservations.html',
  styleUrl: './reservations.css'
})
export class Reservations implements OnInit, OnDestroy {
  isLoading = false;
  error: string | null = null;

  reservations: BusReservation[] = [];
  filteredReservations: BusReservation[] = [];

  filters: ReservationFilters = {
    search: '',
    status: 'ALL',
    date: ''
  };

  totalReservations = 0;
  confirmedReservations = 0;
  pendingReservations = 0;
  cancelledReservations = 0;
  totalRevenue = 0;

  private subscriptions = new Subscription();

  constructor(
    private reservationService: ReservationServiceApi,
    private authService: AuthService,
    private compagnieService: CompagnieServiceApi
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

  trackReservation(_index: number, reservation: ReservationResponse): string {
    return reservation?.trackingId ?? `${_index}`;
  }

  refresh(): void {
    this.loadReservations();
  }

  onFiltersChange(): void {
    this.applyFilters();
  }

  resetFilters(): void {
    this.filters = { search: '', status: 'ALL', date: '' };
    this.applyFilters();
  }

  get confirmationRate(): number {
    return this.totalReservations ? (this.confirmedReservations / this.totalReservations) * 100 : 0;
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
        const compagnieTrackingId = compagnie?.trackingId;
        if (!compagnieTrackingId) {
          this.error = "Aucune compagnie associée à ce compte.";
          this.isLoading = false;
          this.reservations = [];
          this.filteredReservations = [];
          return;
        }

        const reservationsSub = this.reservationService.listByCompagnie(compagnieTrackingId).subscribe({
          next: (reservations) => {
            this.reservations = (reservations ?? []) as BusReservation[];
            this.computeMetrics();
            this.applyFilters();
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Erreur lors du chargement des reservations bus:', err);
            this.error = "Impossible de récupérer les réservations pour le moment.";
            this.reservations = [];
            this.filteredReservations = [];
            this.totalReservations = 0;
            this.confirmedReservations = 0;
            this.pendingReservations = 0;
            this.cancelledReservations = 0;
            this.totalRevenue = 0;
            this.isLoading = false;
          }
        });

        this.subscriptions.add(reservationsSub);
      },
      error: (err) => {
        console.error('Erreur lors de la récupération de la compagnie:', err);
        this.error = "Impossible de déterminer la compagnie associée.";
        this.isLoading = false;
        this.reservations = [];
        this.filteredReservations = [];
      }
    });

    this.subscriptions.add(sub);
  }

  private computeMetrics(): void {
    const reservations = this.reservations;

    this.totalReservations = reservations.length;
    this.confirmedReservations = reservations.filter((reservation) => reservation.statut === 'CONFIRMEE').length;
    this.pendingReservations = reservations.filter((reservation) => reservation.statut === 'EN_ATTENTE_PAIEMENT').length;
    this.cancelledReservations = reservations.filter((reservation) => reservation.statut === 'ANNULEE').length;
    this.totalRevenue = reservations.reduce((sum, reservation) => sum + (reservation.montantTotal ?? 0), 0);
  }

  private applyFilters(): void {
    const { search, status, date } = this.filters;
    const normalizedSearch = (search ?? '').trim().toLowerCase();

    const filtered = this.reservations.filter((reservation) => {
      const searchPool = [
        reservation.numeroReservation,
        reservation.trackingId,
        reservation.clientNom,
        reservation.clientPrenom,
        reservation.clientEmail,
        reservation.itineraire?.villeDepart,
        reservation.itineraire?.villeArrivee
      ];

      const matchesSearch = !normalizedSearch
        || searchPool.some((value) => value?.toLowerCase().includes(normalizedSearch));

      const matchesStatus = !status || status === 'ALL' || reservation.statut === status;

      const matchesDate = !date || (reservation.dateReservation && reservation.dateReservation.startsWith(date));

      return matchesSearch && matchesStatus && matchesDate;
    });

    this.filteredReservations = filtered;
  }
}
