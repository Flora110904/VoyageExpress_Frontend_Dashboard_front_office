import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { forkJoin, of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService, LocalServiceApi, ReservationServiceApi } from '../../services';
import { LocalResponse } from '../../models';
import { StatistiquesResponse } from '../../services/reservation.service';
import { EtablisementNavbarComponent } from '../shared/etablisement-navbar/etablisement-navbar.component';

interface SeriesPoint {
  label: string;
  value: number;
}

@Component({
  selector: 'app-statistiques',
  standalone: true,
  imports: [CommonModule, RouterModule, EtablisementNavbarComponent],
  templateUrl: './statistiques.html',
  styleUrls: ['./statistiques.css']
})
export class Statistiques implements OnInit, OnDestroy {
  isLoading = false;
  error: string | null = null;

  stats: StatistiquesResponse | null = null;
  monthlyReservationSeries: SeriesPoint[] = [];
  monthlyRevenueSeries: SeriesPoint[] = [];

  private subscriptions = new Subscription();
  private etablissementId: string | null = null;
  private errorMessages: string[] = [];
  private locaux: LocalResponse[] = [];

  constructor(
    private readonly reservationService: ReservationServiceApi,
    private readonly authService: AuthService,
    private readonly localService: LocalServiceApi
  ) {}

  ngOnInit(): void {
    const authSub = this.authService.currentUser.subscribe((user) => {
      this.etablissementId = user?.etablissementId ?? null;

      if (!this.etablissementId) {
        this.error = "Aucun établissement associé à ce compte.";
        this.stats = this.createEmptyStats();
        this.monthlyReservationSeries = [];
        this.monthlyRevenueSeries = [];
        this.isLoading = false;
        return;
      }

      this.fetchStats();
    });

    this.subscriptions.add(authSub);
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

  retry(): void {
    this.fetchStats();
  }

  refresh(): void {
    this.fetchStats();
  }

  get totalReservations(): number {
    return this.stats?.totalReservations ?? 0;
  }

  get confirmedReservations(): number {
    return this.stats?.reservationsConfirmees ?? 0;
  }

  get pendingReservations(): number {
    return (this.stats?.reservationsEnCours ?? 0) + (this.stats?.reservationsAnnulees ?? 0);
  }

  get totalRevenue(): number {
    return this.stats?.revenusTotal ?? 0;
  }

  get currentMonthRevenue(): number {
    return this.stats?.revenusMoisActuel ?? 0;
  }

  get occupancyRate(): number {
    const total = this.stats?.totalReservations ?? 0;
    if (!total) {
      return 0;
    }
    return Math.round(((this.stats?.reservationsConfirmees ?? 0) / total) * 100);
  }

  get kpis(): Array<{ icon: string; label: string; value: string; variant: string; hint: string }> {
    return [
      {
        icon: 'fa-calendar-check',
        label: 'Réservations totales',
        value: this.formatNumber(this.totalReservations),
        variant: 'primary',
        hint: 'Toutes les réservations enregistrées'
      },
      {
        icon: 'fa-check-circle',
        label: 'Confirmées',
        value: this.formatNumber(this.confirmedReservations),
        variant: 'success',
        hint: 'Réservations payées et validées'
      },
      {
        icon: 'fa-percentage',
        label: 'Taux d’occupation',
        value: `${this.formatNumber(this.occupancyRate)}%`,
        variant: 'warning',
        hint: 'Sur la période analysée'
      },
      {
        icon: 'fa-coins',
        label: 'Revenus totaux',
        value: this.formatCurrency(this.totalRevenue),
        variant: 'info',
        hint: 'Revenus cumulés (XOF)'
      }
    ];
  }

  trackSeries(index: number, point: SeriesPoint): string {
    return `${point.label}-${index}`;
  }

  formatNumber(value: number | null | undefined): string {
    return new Intl.NumberFormat('fr-FR').format(value ?? 0);
  }

  formatCurrency(value: number | null | undefined): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value ?? 0);
  }

  private fetchStats(): void {
    this.isLoading = true;
    this.error = null;
    this.errorMessages = [];

    if (!this.etablissementId) {
      this.stats = this.createEmptyStats();
      this.monthlyReservationSeries = [];
      this.monthlyRevenueSeries = [];
      this.isLoading = false;
      return;
    }

    const sub = this.localService.listByEtablissement(this.etablissementId).subscribe({
      next: (locaux) => {
        this.locaux = locaux ?? [];

        if (!this.locaux.length) {
          this.stats = this.createEmptyStats();
          this.monthlyReservationSeries = [];
          this.monthlyRevenueSeries = [];
          this.error = this.errorMessages.length ? this.errorMessages.join(' ') : null;
          this.isLoading = false;
          return;
        }

        this.loadStatsForLocals(this.locaux);
      },
      error: (err) => {
        console.error("Erreur lors du chargement des locaux de l'établissement:", err);
        this.error = "Impossible de récupérer les locaux de l'établissement.";
        this.stats = this.createEmptyStats();
        this.monthlyReservationSeries = [];
        this.monthlyRevenueSeries = [];
        this.isLoading = false;
      }
    });

    this.subscriptions.add(sub);
  }

  private loadStatsForLocals(locaux: LocalResponse[]): void {
    const requests = locaux.map((local) =>
      this.reservationService.getStatistiquesLocal(local.trackingId).pipe(
        catchError((err) => {
          console.error(`Erreur lors du chargement des statistiques du local ${local.trackingId}:`, err);
          this.pushError(`Statistiques indisponibles pour ${local.description ?? local.trackingId}.`);
          return of(null);
        })
      )
    );

    if (!requests.length) {
      this.stats = this.createEmptyStats();
      this.monthlyReservationSeries = [];
      this.monthlyRevenueSeries = [];
      this.error = this.errorMessages.length ? this.errorMessages.join(' ') : null;
      this.isLoading = false;
      return;
    }

    const statsSub = forkJoin(requests).subscribe((statsList) => {
      const validStats = (statsList ?? []).filter((stat): stat is StatistiquesResponse => !!stat);
      this.applyAggregatedStats(validStats);
      this.error = this.errorMessages.length ? this.errorMessages.join(' ') : null;
      this.isLoading = false;
    });

    this.subscriptions.add(statsSub);
  }

  private buildSeries(source: Record<string, number>): SeriesPoint[] {
    return Object.entries(source)
      .map(([label, value]) => ({ label, value: value ?? 0 }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  private applyAggregatedStats(statsList: StatistiquesResponse[]): void {
    if (!statsList.length) {
      this.stats = this.createEmptyStats();
      this.monthlyReservationSeries = [];
      this.monthlyRevenueSeries = [];
      return;
    }

    const aggregated = this.aggregateStats(statsList);
    this.stats = aggregated;
    this.monthlyReservationSeries = this.buildSeries(aggregated.reservationsParMois ?? {});
    this.monthlyRevenueSeries = this.buildSeries(aggregated.revenusParMois ?? {});
  }

  private aggregateStats(statsList: StatistiquesResponse[]): StatistiquesResponse {
    const aggregated = this.createEmptyStats();
    const reservationsParMois = new Map<string, number>();
    const revenusParMois = new Map<string, number>();

    for (const stats of statsList) {
      aggregated.totalReservations += stats.totalReservations ?? 0;
      aggregated.reservationsEnCours += stats.reservationsEnCours ?? 0;
      aggregated.reservationsConfirmees += stats.reservationsConfirmees ?? 0;
      aggregated.reservationsAnnulees += stats.reservationsAnnulees ?? 0;
      aggregated.revenusTotal += stats.revenusTotal ?? 0;
      aggregated.revenusMoisActuel += stats.revenusMoisActuel ?? 0;

      Object.entries(stats.reservationsParMois ?? {}).forEach(([mois, valeur]) => {
        const current = reservationsParMois.get(mois) ?? 0;
        reservationsParMois.set(mois, current + (valeur ?? 0));
      });

      Object.entries(stats.revenusParMois ?? {}).forEach(([mois, valeur]) => {
        const current = revenusParMois.get(mois) ?? 0;
        revenusParMois.set(mois, current + (valeur ?? 0));
      });
    }

    aggregated.reservationsParMois = Array.from(reservationsParMois.entries()).reduce<Record<string, number>>(
      (acc, [key, value]) => {
        acc[key] = value;
        return acc;
      },
      {}
    );

    aggregated.revenusParMois = Array.from(revenusParMois.entries()).reduce<Record<string, number>>(
      (acc, [key, value]) => {
        acc[key] = value;
        return acc;
      },
      {}
    );

    return aggregated;
  }

  private createEmptyStats(): StatistiquesResponse {
    return {
      totalReservations: 0,
      reservationsEnCours: 0,
      reservationsConfirmees: 0,
      reservationsAnnulees: 0,
      revenusTotal: 0,
      revenusMoisActuel: 0,
      reservationsParMois: {},
      revenusParMois: {}
    };
  }

  private pushError(message: string): void {
    if (!this.errorMessages.includes(message)) {
      this.errorMessages.push(message);
    }
  }
}
