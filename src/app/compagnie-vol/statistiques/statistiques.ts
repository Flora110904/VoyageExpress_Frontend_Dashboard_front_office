import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, ReservationServiceApi, StatistiquesResponse } from '../../services';
import { CompagnieVolNavbarComponent } from '../shared/compagnie-vol-navbar/compagnie-vol-navbar.component';

@Component({
  selector: 'app-statistiques',
  standalone: true,
  imports: [CommonModule, RouterModule, CompagnieVolNavbarComponent],
  templateUrl: './statistiques.html',
  styleUrl: './statistiques.css'
})
export class Statistiques implements OnInit, OnDestroy {
  isLoading = false;
  error: string | null = null;

  stats: StatistiquesResponse | null = null;
  reservationsByMonth: Array<{ month: string; count: number }> = [];
  revenuesByMonth: Array<{ month: string; amount: number }> = [];

  private subscriptions = new Subscription();

  constructor(
    private readonly reservationService: ReservationServiceApi,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadStats();
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
    return total ? Math.round((this.confirmedReservations / total) * 100) : 0;
  }

  get totalRevenue(): number {
    return this.stats?.revenusTotal ?? 0;
  }

  get currentMonthRevenue(): number {
    return this.stats?.revenusMoisActuel ?? 0;
  }

  retry(): void {
    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();
    this.loadStats();
  }

  refresh(): void {
    this.loadStats();
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

  private loadStats(): void {
    this.isLoading = true;
    this.error = null;

    const sub = this.reservationService.getStatistiques().subscribe({
      next: (stats) => {
        this.stats = stats ?? null;
        this.reservationsByMonth = this.buildCountSeries(stats?.reservationsParMois);
        this.revenuesByMonth = this.buildAmountSeries(stats?.revenusParMois);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des statistiques:', err);
        this.error = 'Impossible de récupérer les statistiques pour le moment.';
        this.stats = null;
        this.reservationsByMonth = [];
        this.revenuesByMonth = [];
        this.isLoading = false;
      }
    });

    this.subscriptions.add(sub);
  }

  private buildCountSeries(metrics?: Record<string, number> | null): Array<{ month: string; count: number }> {
    if (!metrics) {
      return [];
    }

    return Object.entries(metrics)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, value]) => ({ month, count: value ?? 0 }));
  }

  private buildAmountSeries(metrics?: Record<string, number> | null): Array<{ month: string; amount: number }> {
    if (!metrics) {
      return [];
    }

    return Object.entries(metrics)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, value]) => ({ month, amount: value ?? 0 }));
  }
}
