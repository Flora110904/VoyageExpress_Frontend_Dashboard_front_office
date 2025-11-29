import { Component, OnDestroy, OnInit } from '@angular/core';
import { forkJoin, of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ItineraireResponse, VehiculeResponse } from '../models';
import { TypeVehicule } from '../models/enums.model';
import { AuthService, CompagnieServiceApi, ItineraireServiceApi, ReservationServiceApi, StatistiquesResponse, VehiculeServiceApi } from '../services';

@Component({
  selector: 'app-compagnie-bus',
  standalone: false,
  templateUrl: './compagnie-bus.html',
  styleUrl: './compagnie-bus.css'
})
export class CompagnieBus implements OnInit, OnDestroy {
  isLoading = false;
  error: string | null = null;

  stats: StatistiquesResponse | null = null;
  itineraires: ItineraireResponse[] = [];
  todayItineraires: ItineraireResponse[] = [];
  upcomingItineraires: ItineraireResponse[] = [];
  vehicules: VehiculeResponse[] = [];
  operationalAlerts: OperationalAlert[] = [];

  monthlyReservationsMetric = { label: '', value: 0 };
  monthlyRevenueMetric = { label: '', value: 0 };

  private subscriptions: Subscription = new Subscription();
  private errorMessages: string[] = [];
  private readonly lowCapacityThreshold = 5;

  constructor(
    private reservationService: ReservationServiceApi,
    private itineraireService: ItineraireServiceApi,
    private vehiculeService: VehiculeServiceApi,
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

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn;
  }

  logout(): void {
    this.authService.logout();
  }

  get hasError(): boolean {
    return !!this.error;
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

  get totalRevenue(): number {
    return this.stats?.revenusTotal ?? 0;
  }

  get confirmationRate(): number {
    const total = this.totalReservations;
    return total ? Math.round((this.confirmedReservations / total) * 100) : 0;
  }

  get monthlyRevenue(): number {
    return this.monthlyRevenueMetric.value ?? 0;
  }

  get upcomingTripsCount(): number {
    return this.upcomingItineraires.length;
  }

  get todayTripsCount(): number {
    return this.todayItineraires.length;
  }

  get activeBusCount(): number {
    return this.vehicules.filter((vehicule) => vehicule.type === TypeVehicule.BUS).length;
  }

  formatNumber(value?: number | null): string {
    return new Intl.NumberFormat('fr-FR').format(value ?? 0);
  }

  formatCurrency(value?: number | null): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value ?? 0);
  }

  formatPercentage(value?: number | null): string {
    return `${this.formatNumber(value ?? 0)}%`;
  }

  formatTimeLabel(itinerary: ItineraireResponse): string {
    const departure = this.getItineraryDateTime(itinerary);
    return departure ? this.formatTime(departure) : '--:--';
  }

  formatRouteLabel(itinerary: ItineraireResponse): string {
    return `${itinerary.villeDepart} → ${itinerary.villeArrivee}`;
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

  trackItinerary(_index: number, itinerary: ItineraireResponse): string {
    return itinerary?.trackingId ?? `${_index}`;
  }

  getTripBadgeClass(itinerary: ItineraireResponse): string {
    const seats = itinerary?.placeDisponible ?? 0;

    if (seats === 0) {
      return 'badge bg-danger';
    }

    if (seats <= this.lowCapacityThreshold) {
      return 'badge bg-warning text-dark';
    }

    return 'badge bg-success';
  }

  getTripBadgeLabel(itinerary: ItineraireResponse): string {
    const seats = itinerary?.placeDisponible ?? 0;
    if (seats === 0) {
      return 'Complet';
    }
    return `${seats} place${seats > 1 ? 's' : ''}`;
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    this.error = null;
    this.errorMessages = [];

    const currentUser = this.authService.currentUserValue;
    if (!currentUser?.trackingId) {
      this.error = "Impossible d'identifier la compagnie connectée.";
      this.resetDashboardData();
      return;
    }

    const compagnieSub = this.compagnieService.getByProprietaire(currentUser.trackingId).subscribe({
      next: (compagnie) => {
        const compagnieTrackingId = compagnie?.trackingId;
        if (!compagnieTrackingId) {
          this.error = "Aucune compagnie associée à ce compte.";
          this.resetDashboardData();
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
          ),
          vehicules: this.vehiculeService.listByCompagnie(compagnieTrackingId).pipe(
            catchError(() => {
              this.pushError("Impossible de récupérer la flotte de véhicules.");
              return of([]);
            })
          )
        });

        const dataSub = load$.subscribe(({ stats, itineraires, vehicules }) => {
          this.stats = stats;
          this.itineraires = itineraires ?? [];
          this.vehicules = vehicules ?? [];

          if (this.stats) {
            this.monthlyReservationsMetric = this.extractLatestMetric(this.stats.reservationsParMois);
            this.monthlyRevenueMetric = this.extractLatestMetric(this.stats.revenusParMois);
          } else {
            this.resetMonthlyMetrics();
          }

          this.computeTripCollections();
          this.buildOperationalAlerts();

          this.isLoading = false;
        });

        this.subscriptions.add(dataSub);
      },
      error: (err) => {
        console.error('Erreur lors de la récupération de la compagnie:', err);
        this.error = "Impossible de déterminer la compagnie associée.";
        this.resetDashboardData();
      }
    });

    this.subscriptions.add(compagnieSub);
  }

  private resetDashboardData(): void {
    this.stats = null;
    this.itineraires = [];
    this.todayItineraires = [];
    this.upcomingItineraires = [];
    this.vehicules = [];
    this.operationalAlerts = [];
    this.resetMonthlyMetrics();
    this.isLoading = false;
  }

  private computeTripCollections(): void {
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

  private buildOperationalAlerts(): void {
    const alerts: OperationalAlert[] = [];

    if (this.pendingReservations > 0) {
      alerts.push({
        title: 'Réservations en attente',
        description: `${this.formatNumber(this.pendingReservations)} billets à confirmer.` ,
        actionLabel: 'Traiter',
        actionLink: 'reservations',
        type: 'info'
      });
    }

    const lowCapacityTrips = this.upcomingItineraires.filter((trip) => (trip.placeDisponible ?? 0) <= this.lowCapacityThreshold);
    if (lowCapacityTrips.length > 0) {
      alerts.push({
        title: 'Capacité limitée',
        description: `${this.formatNumber(lowCapacityTrips.length)} trajets ont moins de ${this.lowCapacityThreshold + 1} places restantes.`,
        actionLabel: 'Ajuster les trajets',
        actionLink: 'itineraires',
        type: 'warning'
      });
    }

    if (this.cancelledReservations > 0) {
      alerts.push({
        title: 'Annulations à suivre',
        description: `${this.formatNumber(this.cancelledReservations)} annulation(s) enregistrée(s) récemment.`,
        actionLabel: 'Consulter',
        actionLink: 'reservations',
        type: 'danger'
      });
    }

    this.operationalAlerts = alerts.slice(0, 3);
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

interface OperationalAlert {
  title: string;
  description: string;
  actionLabel?: string;
  actionLink?: string;
  type: 'info' | 'warning' | 'danger';
}
