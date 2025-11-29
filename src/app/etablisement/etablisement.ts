import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { forkJoin, of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService, EtablissementServiceApi, LocalServiceApi, ReservationServiceApi } from '../services';
import { EtablisementNavbarComponent } from './shared/etablisement-navbar/etablisement-navbar.component';
import { EtablissementResponse, LocalResponse, ReservationResponse } from '../models';
import { StatistiquesResponse } from '../services/reservation.service';

@Component({
  selector: 'app-etablisement',
  standalone: true,
  imports: [CommonModule, RouterModule, EtablisementNavbarComponent],
  templateUrl: './etablisement.html',
  styleUrls: ['./etablisement.css']
})
export class Etablisement implements OnInit, OnDestroy {
  isLoading = false;
  error: string | null = null;

  etablissement: EtablissementResponse | null = null;
  locaux: LocalResponse[] = [];
  stats: StatistiquesResponse | null = null;
  todayCheckins: LocalReservationHighlight[] = [];
  todayCheckouts: LocalReservationHighlight[] = [];
  priorityActions: PriorityAction[] = [];
  private reservations: ReservationResponse[] = [];

  monthlyReservationsMetric = { label: '', value: 0 };
  monthlyRevenueMetric = { label: '', value: 0 };

  private subscriptions: Subscription = new Subscription();
  private etablissementId: string | null = null;
  private errorMessages: string[] = [];
  private readonly reservationPageSize = 200;

  constructor(
    private authService: AuthService,
    private etablissementService: EtablissementServiceApi,
    private localService: LocalServiceApi,
    private reservationService: ReservationServiceApi
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.subscriptions.add(
      this.authService.currentUser.subscribe((user) => {
        const userTrackingId = user?.trackingId ?? null;

        if (!userTrackingId) {
          this.pushError("Aucun utilisateur connecté ou identifiant utilisateur manquant." );
          this.isLoading = false;
          return;
        }

        const sub = this.etablissementService.getByProprietaire(userTrackingId).pipe(
          catchError(() => {
            this.pushError("Aucun établissement associé à ce compte." );
            this.isLoading = false;
            return of(null);
          })
        ).subscribe((etablissement) => {
          if (!etablissement) {
            return;
          }
          this.etablissementId = etablissement.trackingId;
          this.loadDashboardData(this.etablissementId);
        });

        this.subscriptions.add(sub);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  retry(): void {
    if (!this.etablissementId) {
      return;
    }
    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();
    this.isLoading = true;
    this.error = null;
    this.errorMessages = [];
    this.loadDashboardData(this.etablissementId);
  }

  get hasError(): boolean {
    return !!this.error;
  }

  get totalRooms(): number {
    return this.locaux.length;
  }

  get occupiedRooms(): number {
    return this.stats?.reservationsConfirmees ?? 0;
  }

  get occupancyRate(): number {
    const total = this.stats?.totalReservations ?? 0;
    return total ? Math.round((this.stats!.reservationsConfirmees / total) * 100) : 0;
  }

  get totalRevenue(): number {
    return this.stats?.revenusTotal ?? 0;
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

  trackLocal(_index: number, local: LocalResponse): string {
    return local?.trackingId ?? `${_index}`;
  }

  trackHighlight(_index: number, highlight: LocalReservationHighlight): string {
    return highlight?.local?.trackingId ?? `${_index}`;
  }

  private loadDashboardData(etablissementId: string): void {
    this.resetStatsAndHighlights();

    const load$ = forkJoin({
      etablissement: this.etablissementService.get(etablissementId).pipe(
        catchError(() => {
          this.pushError("Impossible de charger les informations de l'établissement." );
          return of(null);
        })
      ),
      locaux: this.localService.listByEtablissement(etablissementId).pipe(
        catchError(() => {
          this.pushError("Impossible de récupérer les locaux de l'établissement." );
          return of([]);
        })
      )
    });

    this.subscriptions.add(
      load$.subscribe(({ etablissement, locaux }) => {
        this.etablissement = etablissement;
        this.locaux = locaux ?? [];

        if (this.locaux.length === 0) {
          this.resetStatsAndHighlights();
          this.isLoading = false;
          return;
        }

        this.loadAggregatedStats(this.locaux);
        this.loadReservationsForLocals(this.locaux);
      })
    );
  }

  private loadAggregatedStats(locaux: LocalResponse[]): void {
    const statRequests = locaux.map((local) =>
      this.reservationService.getStatistiquesLocal(local.trackingId).pipe(
        catchError(() => {
          this.pushError(`Impossible de récupérer les statistiques du local ${local.description || local.trackingId}.` );
          return of(null);
        })
      )
    );

    if (!statRequests.length) {
      this.applyAggregatedStats([]);
      this.isLoading = false;
      return;
    }

    this.subscriptions.add(
      forkJoin(statRequests).subscribe((statsList) => {
        const validStats = (statsList ?? []).filter((stat): stat is StatistiquesResponse => !!stat);
        this.applyAggregatedStats(validStats);
        this.buildPriorityActions();
        this.isLoading = false;
      })
    );
  }

  private loadReservationsForLocals(locaux: LocalResponse[]): void {
    const localsMap = new Map<string, LocalResponse>();
    locaux.forEach((local) => localsMap.set(local.trackingId, local));

    if (localsMap.size === 0) {
      this.todayCheckins = [];
      this.todayCheckouts = [];
      return;
    }

    const reservationsSub = this.reservationService
      .list(0, this.reservationPageSize)
      .pipe(
        catchError(() => {
          this.pushError("Impossible de récupérer les réservations de l'établissement." );
          return of([] as ReservationResponse[]);
        })
      )
      .subscribe((reservations) => {
        this.reservations = (reservations ?? []).filter(
          (reservation) => reservation.localTrackingId && localsMap.has(reservation.localTrackingId)
        );
        this.buildReservationHighlightsFromReservations(this.reservations, localsMap);
      });

    this.subscriptions.add(reservationsSub);
  }

  private applyAggregatedStats(statsList: StatistiquesResponse[]): void {
    if (!statsList.length) {
      this.stats = this.createEmptyStats();
      this.resetMonthlyMetrics();
      return;
    }

    const aggregated = this.aggregateStats(statsList);
    this.stats = aggregated;

    if (aggregated) {
      this.monthlyReservationsMetric = this.extractLatestMetric(aggregated.reservationsParMois);
      this.monthlyRevenueMetric = this.extractLatestMetric(aggregated.revenusParMois);
    } else {
      this.resetMonthlyMetrics();
    }
  }

  private buildReservationHighlightsFromReservations(
    reservations: ReservationResponse[],
    localsMap: Map<string, LocalResponse>
  ): void {
    if (!reservations.length) {
      this.todayCheckins = [];
      this.todayCheckouts = [];
      return;
    }

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const checkins: LocalReservationHighlight[] = [];
    const checkouts: LocalReservationHighlight[] = [];

    reservations.forEach((reservation) => {
      if (!reservation.dateReservation) {
        return;
      }

      const reservationDate = new Date(reservation.dateReservation);
      if (Number.isNaN(reservationDate.getTime())) {
        return;
      }

      if (reservationDate < startOfDay || reservationDate >= endOfDay) {
        return;
      }

      const local = reservation.localTrackingId ? localsMap.get(reservation.localTrackingId) : undefined;
      if (!local) {
        return;
      }

      const status = (reservation.statut ?? '').toUpperCase();
      const timeLabel = this.formatTime(reservationDate);
      const note = this.humanizeReservationStatus(status);

      if (['CONFIRMEE', 'EN_COURS', 'EN_ATTENTE', 'EN_ATTENTE_PAIEMENT'].includes(status)) {
        checkins.push({ type: 'checkin', local, timeLabel, note });
      } else if (['TERMINEE', 'ANNULEE'].includes(status)) {
        checkouts.push({ type: 'checkout', local, timeLabel, note });
      }
    });

    this.todayCheckins = checkins.slice(0, 5);
    this.todayCheckouts = checkouts.slice(0, 5);
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

  private resetStatsAndHighlights(): void {
    this.stats = null;
    this.resetMonthlyMetrics();
    this.todayCheckins = [];
    this.todayCheckouts = [];
    this.priorityActions = [];
  }

  private formatTime(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  private humanizeReservationStatus(status: string | null | undefined): string {
    const normalized = (status ?? '').toUpperCase();
    switch (normalized) {
      case 'CONFIRMEE':
        return 'Réservation confirmée';
      case 'EN_COURS':
        return 'En cours de séjour';
      case 'EN_ATTENTE':
      case 'EN_ATTENTE_PAIEMENT':
        return 'Arrivée à confirmer';
      case 'TERMINEE':
        return 'Séjour terminé';
      case 'ANNULEE':
        return 'Réservation annulée';
      default:
        return 'Statut en cours';
    }
  }

  private buildPriorityActions(): void {
    const actions: PriorityAction[] = [];

    const reservationsEnCours = this.stats?.reservationsEnCours ?? 0;
    const reservationsAnnulees = this.stats?.reservationsAnnulees ?? 0;

    if (reservationsEnCours > 0) {
      actions.push({
        title: 'Réservations en attente',
        description: `${this.formatNumber(reservationsEnCours)} demandes nécessitent une validation.`,
        actionLabel: 'Traiter',
        actionLink: 'reservations',
        type: 'warning'
      });
    }

    if (reservationsAnnulees > 0) {
      actions.push({
        title: 'Annulations à analyser',
        description: `${this.formatNumber(reservationsAnnulees)} annulation(s) récente(s).`,
        actionLabel: 'Consulter',
        actionLink: 'statistiques',
        type: 'info'
      });
    }

    actions.push({
      title: 'Mettre à jour les tarifs',
      description: 'Optimisez vos tarifs saisonniers pour améliorer le taux d’occupation.',
      actionLabel: 'Modifier tarifs',
      actionLink: 'types',
      type: 'primary'
    });

    this.priorityActions = actions.slice(0, 3);
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

  private pushError(message: string): void {
    if (!this.errorMessages.includes(message)) {
      this.errorMessages.push(message);
    }
    this.error = this.errorMessages.join(' ');
  }
}

interface LocalReservationHighlight {
  type: 'checkin' | 'checkout';
  local: LocalResponse;
  timeLabel: string;
  note?: string;
}

interface PriorityAction {
  title: string;
  description: string;
  actionLabel?: string;
  actionLink?: string;
  type: 'primary' | 'warning' | 'info';
}
