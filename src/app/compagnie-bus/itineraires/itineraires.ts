import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ItineraireResponse } from '../../models';
import { AuthService, CompagnieServiceApi, ItineraireServiceApi } from '../../services';
import { CompagnieBusNavbarComponent } from '../shared/compagnie-bus-navbar/compagnie-bus-navbar.component';
import { ItineraireFormModalComponent } from './itineraire-form-modal.component';

type ItineraryStatus = 'ALL' | 'TODAY' | 'UPCOMING' | 'PAST';

interface ItineraryFilters {
  search: string;
  date: string;
  status: ItineraryStatus;
  minSeats: number | null;
  maxPrice: number | null;
}

type BusItinerary = ItineraireResponse & {
  departureDateTime: Date | null;
  computedStatus: Exclude<ItineraryStatus, 'ALL'>;
};

@Component({
  selector: 'app-itineraires',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CompagnieBusNavbarComponent, ItineraireFormModalComponent],
  templateUrl: './itineraires.html',
  styleUrl: './itineraires.css'
})
export class Itineraires implements OnInit, OnDestroy {
  isLoading = false;
  error: string | null = null;

  isCreateModalOpen = false;

  itineraires: BusItinerary[] = [];
  filteredItineraires: BusItinerary[] = [];

  filters: ItineraryFilters = {
    search: '',
    date: '',
    status: 'ALL',
    minSeats: null,
    maxPrice: null
  };

  totalItineraires = 0;
  todayDepartures = 0;
  upcomingDepartures = 0;
  lowCapacityCount = 0;
  averagePrice = 0;

  private subscriptions = new Subscription();
  readonly lowCapacityThreshold = 10;

  constructor(
    private readonly itineraireService: ItineraireServiceApi,
    private readonly authService: AuthService,
    private readonly compagnieService: CompagnieServiceApi
  ) {}

  ngOnInit(): void {
    this.loadItineraires();
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
    this.loadItineraires();
  }

  openCreateItinerary(): void {
    this.isCreateModalOpen = true;
  }

  onItineraryModalClosed(): void {
    this.isCreateModalOpen = false;
  }

  onItinerarySaved(_itinerary: ItineraireResponse): void {
    this.isCreateModalOpen = false;
    this.loadItineraires();
  }

  trackItinerary(_index: number, itinerary: BusItinerary): string {
    return itinerary?.trackingId ?? `${_index}`;
  }

  onFiltersChange(): void {
    this.applyFilters();
  }

  resetFilters(): void {
    this.filters = { search: '', date: '', status: 'ALL', minSeats: null, maxPrice: null };
    this.applyFilters();
  }

  get kpiCards(): Array<{ icon: string; label: string; value: string; hint: string; tone: string }> {
    return [
      {
        icon: 'fa-road',
        label: 'Itinéraires actifs',
        value: this.formatNumber(this.totalItineraires),
        hint: `${this.formatNumber(this.todayDepartures)} départ(s) aujourd'hui`,
        tone: 'primary'
      },
      {
        icon: 'fa-clock',
        label: 'Départs à venir',
        value: this.formatNumber(this.upcomingDepartures),
        hint: 'Sur les prochains jours',
        tone: 'info'
      },
      {
        icon: 'fa-bus-alt',
        label: 'Capacité limitée',
        value: this.formatNumber(this.lowCapacityCount),
        hint: `≤ ${this.lowCapacityThreshold} places restantes`,
        tone: 'warning'
      },
      {
        icon: 'fa-wallet',
        label: 'Tarif moyen',
        value: this.formatCurrency(this.averagePrice),
        hint: 'Basé sur l’ensemble des trajets',
        tone: 'success'
      }
    ];
  }

  getStatusLabel(status: Exclude<ItineraryStatus, 'ALL'>): string {
    switch (status) {
      case 'TODAY':
        return "Aujourd'hui";
      case 'UPCOMING':
        return 'À venir';
      case 'PAST':
      default:
        return 'Passé';
    }
  }

  getStatusBadge(status: Exclude<ItineraryStatus, 'ALL'>): string {
    switch (status) {
      case 'TODAY':
        return 'bg-primary';
      case 'UPCOMING':
        return 'bg-success';
      case 'PAST':
      default:
        return 'bg-secondary';
    }
  }

  formatCurrency(amount: number | null | undefined): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount ?? 0);
  }

  formatNumber(value: number | null | undefined): string {
    return new Intl.NumberFormat('fr-FR').format(value ?? 0);
  }

  getSeatCount(itinerary: BusItinerary): number {
    const seats = itinerary.placeDisponible;
    return typeof seats === 'number' && Number.isFinite(seats) ? seats : 0;
  }

  isLowCapacity(itinerary: BusItinerary): boolean {
    return this.getSeatCount(itinerary) <= this.lowCapacityThreshold;
  }

  private loadItineraires(): void {
    this.isLoading = true;
    this.error = null;

    const currentUser = this.authService.currentUserValue;
    if (!currentUser?.trackingId) {
      this.error = "Impossible d'identifier la compagnie connectée.";
      this.isLoading = false;
      return;
    }

    const compagnieSub = this.compagnieService.getByProprietaire(currentUser.trackingId).subscribe({
      next: (compagnie) => {
        const compagnieTrackingId = compagnie?.trackingId;
        if (!compagnieTrackingId) {
          this.error = "Aucune compagnie associée à ce compte.";
          this.resetItineraryData();
          return;
        }

        const itinerairesSub = this.itineraireService.listByCompagnie(compagnieTrackingId).subscribe({
          next: (itineraries) => {
            const enriched = (itineraries ?? []).map((itinerary) => this.enrichItinerary(itinerary));
            this.itineraires = enriched;
            this.computeMetrics();
            this.applyFilters();
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Erreur lors du chargement des itinéraires bus:', err);
            this.error = "Impossible de récupérer les itinéraires pour le moment.";
            this.resetItineraryData();
          }
        });

        this.subscriptions.add(itinerairesSub);
      },
      error: (err) => {
        console.error('Erreur lors de la récupération de la compagnie:', err);
        this.error = "Impossible de déterminer la compagnie associée.";
        this.resetItineraryData();
      }
    });

    this.subscriptions.add(compagnieSub);
  }

  private resetItineraryData(): void {
    this.itineraires = [];
    this.filteredItineraires = [];
    this.totalItineraires = 0;
    this.todayDepartures = 0;
    this.upcomingDepartures = 0;
    this.lowCapacityCount = 0;
    this.averagePrice = 0;
    this.isLoading = false;
  }

  private enrichItinerary(itinerary: ItineraireResponse): BusItinerary {
    const departureDateTime = this.buildItineraryDateTime(itinerary);
    const computedStatus = this.resolveStatus(departureDateTime);
    return {
      ...itinerary,
      departureDateTime,
      computedStatus
    };
  }

  private computeMetrics(): void {
    const now = new Date();

    this.totalItineraires = this.itineraires.length;
    this.todayDepartures = 0;
    this.upcomingDepartures = 0;
    this.lowCapacityCount = 0;

    let totalPrice = 0;

    for (const itinerary of this.itineraires) {
      const departure = itinerary.departureDateTime;
      if (departure) {
        if (this.isSameDay(departure, now)) {
          this.todayDepartures += 1;
        } else if (departure > now) {
          this.upcomingDepartures += 1;
        }
      }

      if ((itinerary.placeDisponible ?? 0) <= this.lowCapacityThreshold) {
        this.lowCapacityCount += 1;
      }

      totalPrice += itinerary.prix ?? 0;
    }

    this.averagePrice = this.totalItineraires ? totalPrice / this.totalItineraires : 0;
  }

  private applyFilters(): void {
    const normalizedSearch = (this.filters.search ?? '').trim().toLowerCase();
    const selectedStatus = this.filters.status;
    const selectedDate = this.filters.date;
    const minSeats = this.toNumberOrNull(this.filters.minSeats);
    const maxPrice = this.toNumberOrNull(this.filters.maxPrice);

    const filtered = this.itineraires.filter((itinerary) => {
      const matchesSearch = !normalizedSearch
        || [
          itinerary.villeDepart,
          itinerary.villeArrivee,
          `${itinerary.villeDepart} ${itinerary.villeArrivee}`
        ].some((value) => value?.toLowerCase().includes(normalizedSearch));

      const matchesStatus = selectedStatus === 'ALL' || itinerary.computedStatus === selectedStatus;

      const matchesDate = !selectedDate || itinerary.dateDepart === selectedDate;

      const places = itinerary.placeDisponible ?? 0;
      const price = itinerary.prix ?? 0;

      const matchesMinSeats = minSeats == null || places >= minSeats;
      const matchesMaxPrice = maxPrice == null || price <= maxPrice;

      return matchesSearch && matchesStatus && matchesDate && matchesMinSeats && matchesMaxPrice;
    });

    this.filteredItineraires = filtered.sort((a, b) => {
      const timeA = a.departureDateTime?.getTime() ?? 0;
      const timeB = b.departureDateTime?.getTime() ?? 0;
      return timeA - timeB;
    });
  }

  private buildItineraryDateTime(itinerary: ItineraireResponse): Date | null {
    if (!itinerary.dateDepart) {
      return null;
    }

    const isoString = itinerary.heureDepart
      ? `${itinerary.dateDepart}T${itinerary.heureDepart}`
      : `${itinerary.dateDepart}T00:00`;

    const date = new Date(isoString);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private resolveStatus(departure: Date | null): Exclude<ItineraryStatus, 'ALL'> {
    if (!departure) {
      return 'UPCOMING';
    }

    const now = new Date();
    if (this.isSameDay(departure, now)) {
      return 'TODAY';
    }

    return departure > now ? 'UPCOMING' : 'PAST';
  }

  private isSameDay(dateA: Date, dateB: Date): boolean {
    return (
      dateA.getFullYear() === dateB.getFullYear()
      && dateA.getMonth() === dateB.getMonth()
      && dateA.getDate() === dateB.getDate()
    );
  }

  private toNumberOrNull(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
}
