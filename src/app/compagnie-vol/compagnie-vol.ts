import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { forkJoin, of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ItineraireResponse, TypeCompagnie } from '../models';
import { AuthService, CompagnieServiceApi, ItineraireServiceApi, ReservationServiceApi, StatistiquesResponse } from '../services';
import { CompagnieVolNavbarComponent } from './shared/compagnie-vol-navbar/compagnie-vol-navbar.component';

@Component({
  selector: 'app-compagnie-vol',
  standalone: true,
  imports: [CommonModule, RouterModule, CompagnieVolNavbarComponent],
  templateUrl: './compagnie-vol.html',
  styleUrl: './compagnie-vol.css'
})
export class CompagnieVol implements OnInit, OnDestroy {
  isLoading = false;
  error: string | null = null;

  stats: StatistiquesResponse | null = null;
  itineraires: ItineraireResponse[] = [];
  upcomingItineraires: ItineraireResponse[] = [];
  todayItineraires: ItineraireResponse[] = [];
  monthlyReservationsMetric = { label: '', value: 0 };
  monthlyRevenueMetric = { label: '', value: 0 };

  private readonly lowCapacityThreshold = 5;
  private readonly mediumCapacityThreshold = 15;
  private subscriptions: Subscription = new Subscription();
  private errorMessages: string[] = [];

  constructor(
    private reservationService: ReservationServiceApi,
    private itineraireService: ItineraireServiceApi,
    private authService: AuthService,
    private compagnieService: CompagnieServiceApi
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  retry(): void {
    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();
    this.loadDashboardData();
  }

  get totalReservations(): number {
    return this.stats?.totalReservations ?? 0;
  }

  get confirmedReservations(): number {
    return this.stats?.reservationsConfirmees ?? 0;
  }

  get pendingReservations(): number {
    return this.stats?.reservationsEnCours ?? 0;
  }

  get cancelledReservations(): number {
    return this.stats?.reservationsAnnulees ?? 0;
  }

  get confirmationRate(): number {
    const total = this.totalReservations;
    if (!total) {
      return 0;
    }
    return Math.round((this.confirmedReservations / total) * 100);
  }

  get monthlyRevenue(): number {
    return this.stats?.revenusMoisActuel ?? 0;
  }

  get totalRevenue(): number {
    return this.stats?.revenusTotal ?? 0;
  }

  get itinerariesCount(): number {
    return this.itineraires.length;
  }

  get upcomingFlightsCount(): number {
    return this.upcomingItineraires.length;
  }

  get upcomingWeekFlightsCount(): number {
    const now = new Date();
    const limit = new Date(now);
    limit.setDate(now.getDate() + 7);

    return this.itineraires.filter((itinerary) => {
      const departure = this.getItineraryDateTime(itinerary);
      return departure ? departure >= now && departure <= limit : false;
    }).length;
  }

  get hasError(): boolean {
    return !!this.error;
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn;
  }

  logout(): void {
    this.authService.logout();
  }

  formatNumber(value?: number | null): string {
    return new Intl.NumberFormat('fr-FR').format(value ?? 0);
  }

  formatCurrency(value?: number | null): string {
    const amount = value ?? 0;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatDepartureLabel(itinerary: ItineraireResponse): string {
    const departure = this.getItineraryDateTime(itinerary);
    if (!departure) {
      return 'Horaire à confirmer';
    }
    return `Départ ${this.formatTime(departure)}`;
  }

  formatDepartureDate(itinerary: ItineraireResponse): string {
    const departure = this.getItineraryDateTime(itinerary);
    if (!departure) {
      return 'Date à confirmer';
    }
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(departure);
  }

  formatDepartureTimeLabel(itinerary: ItineraireResponse): string {
    const departure = this.getItineraryDateTime(itinerary);
    if (!departure) {
      return '--:--';
    }
    return this.formatTime(departure);
  }

  formatFlightCode(trackingId: string): string {
    if (!trackingId) {
      return 'VE-0000';
    }
    return `VE-${trackingId.substring(0, 4).toUpperCase()}`;
  }

  formatRouteLabel(itinerary: ItineraireResponse): string {
    return `${itinerary.villeDepart} → ${itinerary.villeArrivee}`;
  }

  trackItinerary(_index: number, itinerary: ItineraireResponse): string {
    return itinerary?.trackingId ?? `${_index}`;
  }

  getFlightBadgeClass(itinerary: ItineraireResponse): string {
    const seats = itinerary?.placeDisponible ?? 0;

    if (seats === 0) {
      return 'bg-danger';
    }

    if (seats <= this.lowCapacityThreshold) {
      return 'bg-warning text-dark';
    }

    if (seats <= this.mediumCapacityThreshold) {
      return 'bg-info text-dark';
    }

    return 'bg-success';
  }

  getFlightBadgeLabel(itinerary: ItineraireResponse): string {
    const seats = itinerary?.placeDisponible ?? 0;

    if (seats === 0) {
      return 'Complet';
    }

    const label = `${seats} place${seats > 1 ? 's' : ''}`;
    return seats <= this.lowCapacityThreshold ? `${label} restantes` : label;
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    this.error = null;
    this.errorMessages = [];

    const currentUser = this.authService.currentUserValue;
    if (!currentUser?.trackingId) {
      this.error = "Impossible d'identifier la compagnie connectée.";
      this.resetFlightData();
      return;
    }

    const compagnieSub = this.compagnieService.getByProprietaire(currentUser.trackingId).subscribe({
      next: (compagnie) => {
        const compagnieTrackingId = compagnie?.trackingId;
        if (!compagnieTrackingId) {
          this.error = "Aucune compagnie aérienne associée à ce compte.";
          this.resetFlightData();
          return;
        }

        const load$ = forkJoin({
          stats: this.reservationService.getStatistiques().pipe(
            catchError(() => {
              this.pushError("Impossible de récupérer les statistiques de réservation.");
              return of(null);
            })
          ),
          itineraires: this.itineraireService.listByCompagnie(compagnieTrackingId).pipe(
            catchError(() => {
              this.pushError("Impossible de récupérer la liste des itinéraires.");
              return of([]);
            })
          )
        });

        const dataSub = load$.subscribe(({ stats, itineraires }) => {
          this.stats = stats;
          if (this.stats) {
            this.monthlyReservationsMetric = this.extractLatestMetric(this.stats.reservationsParMois);
            this.monthlyRevenueMetric = this.extractLatestMetric(this.stats.revenusParMois);
          } else {
            this.resetMonthlyMetrics();
          }

          const ownFlights = (itineraires ?? []).filter((itinerary) => itinerary.compagnieType === TypeCompagnie.AEROPORT);
          this.itineraires = ownFlights;
          this.computeUpcomingItineraires();
          this.isLoading = false;
        });

        this.subscriptions.add(dataSub);
      },
      error: (err) => {
        console.error('Erreur lors de la récupération de la compagnie:', err);
        this.error = "Impossible de déterminer la compagnie associée.";
        this.resetFlightData();
      }
    });

    this.subscriptions.add(compagnieSub);
  }

  private resetFlightData(): void {
    this.stats = null;
    this.itineraires = [];
    this.upcomingItineraires = [];
    this.todayItineraires = [];
    this.resetMonthlyMetrics();
    this.isLoading = false;
  }

  private computeUpcomingItineraires(): void {
    const now = new Date();
    const sorted = [...this.itineraires].sort((a, b) => {
      const dateA = this.getItineraryDateTime(a)?.getTime() ?? 0;
      const dateB = this.getItineraryDateTime(b)?.getTime() ?? 0;
      return dateA - dateB;
    });

    this.todayItineraires = sorted
      .filter((itinerary) => {
        const departure = this.getItineraryDateTime(itinerary);
        return departure ? this.isSameDay(departure, now) : false;
      })
      .slice(0, 3);

    this.upcomingItineraires = sorted
      .filter((itinerary) => {
        const departure = this.getItineraryDateTime(itinerary);
        return departure ? departure >= now : false;
      })
      .slice(0, 3);
  }

  private extractLatestMetric(metrics?: Record<string, number> | null): { label: string; value: number } {
    if (!metrics) {
      return { label: '', value: 0 };
    }

    const entries = Object.entries(metrics);
    if (!entries.length) {
      return { label: '', value: 0 };
    }

    const [label, value] = entries[entries.length - 1];
    return { label, value: value ?? 0 };
  }

  private resetMonthlyMetrics(): void {
    this.monthlyReservationsMetric = { label: '', value: 0 };
    this.monthlyRevenueMetric = { label: '', value: 0 };
  }

  private getItineraryDateTime(itinerary: ItineraireResponse): Date | null {
    if (!itinerary?.dateDepart) {
      return null;
    }

    const departureDate = new Date(itinerary.dateDepart);
    if (Number.isNaN(departureDate.getTime())) {
      return null;
    }

    if (itinerary.heureDepart) {
      const [hoursStr, minutesStr] = itinerary.heureDepart.split(':');
      const hours = Number.parseInt(hoursStr, 10);
      const minutes = Number.parseInt(minutesStr ?? '0', 10);
      if (!Number.isNaN(hours)) {
        departureDate.setHours(hours, Number.isNaN(minutes) ? 0 : minutes, 0, 0);
      }
    }

    return departureDate;
  }

  private formatTime(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  }

  private isSameDay(dateA: Date, dateB: Date): boolean {
    return (
      dateA.getFullYear() === dateB.getFullYear() &&
      dateA.getMonth() === dateB.getMonth() &&
      dateA.getDate() === dateB.getDate()
    );
  }

  private pushError(message: string): void {
    if (!this.errorMessages.includes(message)) {
      this.errorMessages.push(message);
    }
    this.error = this.errorMessages.join(' ');
  }
}
