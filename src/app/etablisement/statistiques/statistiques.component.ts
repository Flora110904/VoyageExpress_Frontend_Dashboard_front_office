import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationServiceApi, StatistiquesResponse } from '../../services/reservation.service';
import { LocalServiceApi } from '../../services/local.service';
import { AuthService } from '../../services/auth.service';
import { LocalResponse } from '../../models';

@Component({
  selector: 'app-statistiques-etablissement',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './statistiques.component.html',
  styleUrls: ['./statistiques.component.css']
})
export class StatistiquesEtablissementComponent implements OnInit {
  loading = true;
  stats: StatistiquesResponse | null = null;
  locaux: LocalResponse[] = [];
  etablissementId: string | null = null;
  
  // Données pour les graphiques
  chartLabels: string[] = [];
  chartReservations: number[] = [];
  chartRevenus: number[] = [];

  constructor(
    private reservationService: ReservationServiceApi,
    private localService: LocalServiceApi,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.authService.currentUser.subscribe((user: any) => {
      if (user && user.etablissementId) {
        this.etablissementId = user.etablissementId;
        this.loadData();
      }
    });
  }

  loadData() {
    if (!this.etablissementId) return;

    this.loading = true;
    
    // Charger les locaux de l'établissement
    this.localService.listByEtablissement(this.etablissementId).subscribe({
      next: (locaux) => {
        this.locaux = locaux;
        if (locaux.length > 0) {
          // Charger les stats du premier local comme exemple
          this.loadStatistiques(locaux[0].trackingId);
        } else {
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Erreur lors du chargement des locaux:', err);
        this.loading = false;
      }
    });
  }

  loadStatistiques(localId: string) {
    this.reservationService.getStatistiquesLocal(localId).subscribe({
      next: (stats) => {
        this.stats = stats;
        this.prepareChartData();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des statistiques:', err);
        this.loading = false;
      }
    });
  }

  prepareChartData() {
    if (!this.stats) return;

    this.chartLabels = Object.keys(this.stats.reservationsParMois);
    this.chartReservations = Object.values(this.stats.reservationsParMois);
    this.chartRevenus = Object.values(this.stats.revenusParMois);
  }

  getTauxOccupation(): number {
    if (!this.stats || this.stats.totalReservations === 0) return 0;
    return Math.round((this.stats.reservationsConfirmees / this.stats.totalReservations) * 100);
  }

  getRevenuMoyen(): number {
    if (!this.stats || this.stats.reservationsConfirmees === 0) return 0;
    return Math.round(this.stats.revenusTotal / this.stats.reservationsConfirmees);
  }

  selectLocal(local: LocalResponse) {
    this.loadStatistiques(local.trackingId);
  }
}
