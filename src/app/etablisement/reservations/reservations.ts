import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LocalResponse, ReservationResponse } from '../../models';

import { AuthService, EtablissementServiceApi, LocalServiceApi, ReservationServiceApi } from '../../services';
import { EtablisementNavbarComponent } from '../shared/etablisement-navbar/etablisement-navbar.component';

type StatusFilter = 'all' | 'CONFIRMEE' | 'EN_ATTENTE_PAIEMENT' | 'EN_COURS' | 'ANNULEE';

interface ReservationFilters {
  search: string;
  status: StatusFilter;
  date: string | null;
}

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, EtablisementNavbarComponent],
  templateUrl: './reservations.html',
  styleUrl: './reservations.css'
})
export class Reservations implements OnInit, OnDestroy {
  isLoading = false;
  error: string | null = null;

  reservations: ReservationResponse[] = [];
  filteredReservations: ReservationResponse[] = [];

  filters: ReservationFilters = {
    search: '',
    status: 'all',
    date: null
  };

  private subscriptions = new Subscription();
  private etablissementId: string | null = null;
  private localTrackingIds: Set<string> = new Set();
  private readonly pageSize = 200;

  constructor(
    private readonly reservationService: ReservationServiceApi,
    private readonly authService: AuthService,
    private readonly localService: LocalServiceApi,
    private readonly etablissementService: EtablissementServiceApi
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    const authSub = this.authService.currentUser.subscribe((user) => {
      const userTrackingId = user?.trackingId ?? null;

      if (!userTrackingId) {
        this.error = "Aucun utilisateur connecté ou identifiant utilisateur manquant.";
        this.resetState();
        this.isLoading = false;
        return;
      }

      const sub = this.etablissementService
        .getByProprietaire(userTrackingId)
        .pipe(
          catchError(() => {
            this.error = "Aucun établissement associé à ce compte.";
            this.resetState();
            this.isLoading = false;
            return of(null);
          })
        )
        .subscribe((etablissement) => {
          if (!etablissement) {
            return;
          }
          this.etablissementId = etablissement.trackingId;
          this.loadReservations();
        });

      this.subscriptions.add(sub);
    });

    this.subscriptions.add(authSub);
  }

  private resetState(): void {
    this.reservations = [];
    this.filteredReservations = [];
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

  refresh(): void {
    this.loadReservations();
  }

  retry(): void {
    this.error = null;
    this.loadReservations();
  }

  get totalReservations(): number {
    return this.reservations.length;
  }

  get confirmedCount(): number {
    return this.reservations.filter((reservation) => reservation.statut === 'CONFIRMEE').length;
  }

  get pendingCount(): number {
    return this.reservations.filter((reservation) => reservation.statut === 'EN_ATTENTE_PAIEMENT' || reservation.statut === 'EN_COURS').length;
  }

  get cancelledCount(): number {
    return this.reservations.filter((reservation) => reservation.statut === 'ANNULEE').length;
  }

  get metrics(): Array<{ icon: string; label: string; value: string; hint: string; tone: string }> {
    return [
      {
        icon: 'fa-ticket-alt',
        label: 'Total',
        value: this.formatNumber(this.totalReservations),
        hint: 'Réservations enregistrées',
        tone: 'primary'
      },
      {
        icon: 'fa-check-circle',
        label: 'Confirmées',
        value: this.formatNumber(this.confirmedCount),
        hint: 'Paiements validés',
        tone: 'success'
      },
      {
        icon: 'fa-hourglass-half',
        label: 'En attente',
        value: this.formatNumber(this.pendingCount),
        hint: 'En cours de traitement',
        tone: 'warning'
      },
      {
        icon: 'fa-times-circle',
        label: 'Annulées',
        value: this.formatNumber(this.cancelledCount),
        hint: 'À analyser',
        tone: 'danger'
      }
    ];
  }

  trackReservation(index: number, reservation: ReservationResponse): string {
    return reservation?.trackingId ?? `${index}`;
  }

  onFiltersChange(): void {
    this.applyFilters();
  }

  resetFilters(): void {
    this.filters = { search: '', status: 'all', date: null };
    this.applyFilters();
  }

  formatCurrency(amount: number | null | undefined): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount ?? 0);
  }

  formatDate(dateIso: string | null | undefined): string {
    if (!dateIso) {
      return 'Date inconnue';
    }
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

  formatNumber(value: number | null | undefined): string {
    return new Intl.NumberFormat('fr-FR').format(value ?? 0);
  }

  getStatusBadge(statut: string | null | undefined): string {
    switch (statut) {
      case 'CONFIRMEE':
        return 'bg-success';
      case 'EN_ATTENTE_PAIEMENT':
      case 'EN_COURS':
        return 'bg-warning text-dark';
      case 'ANNULEE':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  getClientName(reservation: ReservationResponse): string {
    const parts = [reservation.clientPrenom, reservation.clientNom].filter((value) => !!value);
    if (parts.length) {
      return parts.join(' ');
    }
    return reservation.clientEmail ?? 'Client inconnu';
  }

  getLocalLabel(reservation: ReservationResponse): string {
    return reservation.localTrackingId ?? 'Local non attribué';
  }

  private loadReservations(): void {
    this.isLoading = true;
    this.error = null;

    const targetId = this.etablissementId;
    if (!targetId) {
      this.isLoading = false;
      return;
    }

    const localsSub = this.localService.listByEtablissement(targetId).subscribe({
      next: (locaux: LocalResponse[]) => {
        this.localTrackingIds = new Set((locaux ?? []).map((local) => local.trackingId).filter((id): id is string => !!id));

        if (this.localTrackingIds.size === 0) {
          this.reservations = [];
          this.filteredReservations = [];
          this.isLoading = false;
          return;
        }

        this.fetchReservations();
      },
      error: (err: unknown) => {
        console.error('Erreur lors du chargement des locaux établissement:', err);
        this.error = "Impossible de récupérer les locaux de l'établissement.";
        this.reservations = [];
        this.filteredReservations = [];
        this.localTrackingIds = new Set();
        this.isLoading = false;
      }
    });

    this.subscriptions.add(localsSub);
  }

  private fetchReservations(): void {
    const reservationsSub = this.reservationService.list(0, this.pageSize).subscribe({
      next: (reservations: ReservationResponse[]) => {
        const relevantReservations = (reservations ?? []).filter((reservation) => {
          return reservation.localTrackingId ? this.localTrackingIds.has(reservation.localTrackingId) : false;
        });

        this.reservations = relevantReservations;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err: unknown) => {
        console.error('Erreur lors du chargement des réservations hébergement:', err);
        this.error = 'Impossible de récupérer les réservations pour le moment.';
        this.reservations = [];
        this.filteredReservations = [];
        this.isLoading = false;
      }
    });

    this.subscriptions.add(reservationsSub);
  }

  private applyFilters(): void {
    const term = this.filters.search.trim().toLowerCase();
    const status = this.filters.status;
    const date = this.filters.date;

    let filtered = [...this.reservations];

    if (term) {
      filtered = filtered.filter((reservation) => {
        const numero = reservation.numeroReservation?.toLowerCase() ?? '';
        const client = this.getClientName(reservation).toLowerCase();
        const local = this.getLocalLabel(reservation).toLowerCase();
        return numero.includes(term) || client.includes(term) || local.includes(term);
      });
    }

    if (status !== 'all') {
      filtered = filtered.filter((reservation) => reservation.statut === status);
    }

    if (date) {
      filtered = filtered.filter((reservation) =>
        reservation.dateReservation ? reservation.dateReservation.substring(0, 10) === date : false
      );
    }

    this.filteredReservations = filtered.sort((a, b) => {
      const dateA = a.dateReservation ? new Date(a.dateReservation).getTime() : 0;
      const dateB = b.dateReservation ? new Date(b.dateReservation).getTime() : 0;
      return dateB - dateA;
    });
  }
}
