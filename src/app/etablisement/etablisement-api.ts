import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EtablissementServiceApi } from '../services/etablissement.service';
import { LocalServiceApi } from '../services/local.service';
import { ReservationServiceApi } from '../services/reservation.service';
import { EtablissementResponse, LocalResponse, ReservationResponse } from '../models';
import { NavbarComponent } from '../shared/components/navbar/navbar.component';
import { FooterComponent } from '../shared/components/footer/footer.component';

@Component({
  selector: 'app-etablisement',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, FooterComponent],
  templateUrl: './etablisement-improved.html',
  styleUrls: ['./etablisement-simplified.css']
})
export class EtablisementComponentWithApi implements OnInit {
  
  // Données du dashboard
  etablissement: EtablissementResponse | null = null;
  chambres: LocalResponse[] = [];
  reservations: ReservationResponse[] = [];
  
  // Métriques calculées
  metrics = {
    totalChambres: 0,
    chambresOccupees: 0,
    tauxOccupation: 0,
    revenus: 0
  };
  
  // État de chargement
  loading = {
    etablissement: false,
    chambres: false,
    reservations: false
  };
  
  // Gestion des erreurs
  errors = {
    etablissement: null as string | null,
    chambres: null as string | null,
    reservations: null as string | null
  };

  constructor(
    private etablissementService: EtablissementServiceApi,
    private localService: LocalServiceApi,
    private reservationService: ReservationServiceApi
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  /**
   * Charge toutes les données du dashboard
   */
  loadDashboardData(): void {
    this.loadChambres();
    this.loadReservations();
  }

  /**
   * Charge la liste des chambres/locaux
   */
  loadChambres(): void {
    this.loading.chambres = true;
    this.errors.chambres = null;
    
    this.localService.list().subscribe({
      next: (data: LocalResponse[]) => {
        this.chambres = data;
        this.metrics.totalChambres = data.length;
        this.calculateMetrics();
        this.loading.chambres = false;
      },
      error: (error: unknown) => {
        const message = typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message?: unknown }).message ?? '')
          : '';
        this.errors.chambres = message || 'Erreur lors du chargement des chambres';
        this.loading.chambres = false;
        console.error('Erreur chargement chambres:', error);
      }
    });
  }

  /**
   * Charge les réservations
   */
  loadReservations(): void {
    this.loading.reservations = true;
    this.errors.reservations = null;
    
    this.reservationService.list(0, 100).subscribe({
      next: (data: ReservationResponse[]) => {
        this.reservations = data;
        this.calculateMetrics();
        this.loading.reservations = false;
      },
      error: (error: unknown) => {
        const message = typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message?: unknown }).message ?? '')
          : '';
        this.errors.reservations = message || 'Erreur lors du chargement des réservations';
        this.loading.reservations = false;
        console.error('Erreur chargement réservations:', error);
      }
    });
  }

  /**
   * Calcule les métriques du dashboard
   */
  calculateMetrics(): void {
    // Chambres occupées (réservations avec statut CONFIRMEE)
    const reservationsConfirmees = this.reservations.filter(r => 
      r.statut === 'CONFIRMEE' || r.statut === 'EN_COURS'
    );
    this.metrics.chambresOccupees = reservationsConfirmees.length;
    
    // Taux d'occupation
    if (this.metrics.totalChambres > 0) {
      this.metrics.tauxOccupation = Math.round(
        (this.metrics.chambresOccupees / this.metrics.totalChambres) * 100
      );
    }
    
    // Revenus (exemple: 45000 FCFA par réservation en moyenne)
    // À ajuster selon votre logique métier
    this.metrics.revenus = reservationsConfirmees.length * 45000;
  }

  /**
   * Récupère les réservations récentes (3 dernières)
   */
  get recentReservations(): ReservationResponse[] {
    return this.reservations
      .sort((a, b) => new Date(b.dateReservation).getTime() - new Date(a.dateReservation).getTime())
      .slice(0, 3);
  }

  /**
   * Formate un montant en FCFA
   */
  formatMontant(montant: number): string {
    if (montant >= 1000000) {
      return `${(montant / 1000000).toFixed(1)}M`;
    }
    return montant.toLocaleString('fr-FR');
  }

  /**
   * Formate une date
   */
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  /**
   * Rafraîchit les données
   */
  refresh(): void {
    this.loadDashboardData();
  }

  /**
   * Vérifie si le dashboard est en chargement
   */
  get isLoading(): boolean {
    return this.loading.chambres || this.loading.reservations;
  }

  /**
   * Vérifie si une erreur est présente
   */
  get hasError(): boolean {
    return !!this.errors.chambres || !!this.errors.reservations;
  }
}
