import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, VehiculeServiceApi } from '../../services';
import { CompagnieVolNavbarComponent } from '../shared/compagnie-vol-navbar/compagnie-vol-navbar.component';
import { AvionFormModalComponent } from './avion-form-modal.component';
import { TypeVehicule, VehiculeResponse } from '../../models';

type Aircraft = VehiculeResponse & {
  immatriculation?: string | null;
  marque?: string | null;
  modele?: string | null;
  annee?: number | null;
  etat?: string | null;
  actif?: boolean | null;
  equipements?: string | null;
  image?: string | null;
};

@Component({
  selector: 'app-avions',
  standalone: true,
  imports: [CommonModule, RouterModule, CompagnieVolNavbarComponent, AvionFormModalComponent],
  templateUrl: './avions.html',
  styleUrl: './avions.css'
})
export class Avions implements OnInit, OnDestroy {
  isLoading = false;
  error: string | null = null;

  isCreateModalOpen = false;

  aircrafts: Aircraft[] = [];
  filteredAircrafts: Aircraft[] = [];

  searchTerm = '';
  capacityFilter: 'all' | 'regional' | 'narrow' | 'wide' = 'all';
  statusFilter: 'all' | 'service' | 'maintenance' | 'inactive' = 'all';

  private subscriptions = new Subscription();

  constructor(
    private readonly vehiculeService: VehiculeServiceApi,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadAircrafts();
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

  get totalAircraft(): number {
    return this.aircrafts.length;
  }

  get totalSeats(): number {
    return this.aircrafts.reduce((acc, aircraft) => acc + (aircraft.nombrePlace ?? 0), 0);
  }

  get averageSeats(): number {
    return this.totalAircraft ? Math.round(this.totalSeats / this.totalAircraft) : 0;
  }

  get activeAircraft(): number {
    return this.aircrafts.filter((aircraft) => this.normalizeStatus(aircraft) === 'service').length;
  }

  refresh(): void {
    this.loadAircrafts();
  }

  retry(): void {
    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();
    this.loadAircrafts();
  }

  openCreateAircraft(): void {
    this.isCreateModalOpen = true;
  }

  onAircraftModalClosed(): void {
    this.isCreateModalOpen = false;
  }

  onAircraftSaved(_aircraft: VehiculeResponse): void {
    this.isCreateModalOpen = false;
    this.loadAircrafts();
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.applyFilters();
  }

  onCapacityChange(value: string): void {
    this.capacityFilter = value as typeof this.capacityFilter;
    this.applyFilters();
  }

  onStatusChange(value: string): void {
    this.statusFilter = value as typeof this.statusFilter;
    this.applyFilters();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.capacityFilter = 'all';
    this.statusFilter = 'all';
    this.applyFilters();
  }

  trackAircraft(_index: number, aircraft: Aircraft): string {
    return aircraft?.trackingId ?? `${_index}`;
  }

  formatEquipments(aircraft: Aircraft): string[] {
    const equipements = aircraft.equipements ?? '';
    return equipements
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  hasEquipments(aircraft: Aircraft): boolean {
    return this.formatEquipments(aircraft).length > 0;
  }

  getStatusLabel(aircraft: Aircraft): string {
    const status = this.normalizeStatus(aircraft);
    switch (status) {
      case 'service':
        return 'En service';
      case 'maintenance':
        return 'Maintenance';
      case 'inactive':
        return 'Hors service';
      default:
        return 'Inconnu';
    }
  }

  getStatusBadge(aircraft: Aircraft): string {
    const status = this.normalizeStatus(aircraft);
    switch (status) {
      case 'service':
        return 'bg-success';
      case 'maintenance':
        return 'bg-warning text-dark';
      case 'inactive':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  getCapacityLabel(aircraft: Aircraft): string {
    const seats = aircraft.nombrePlace ?? 0;
    if (seats <= 120) {
      return 'Régional';
    }
    if (seats <= 220) {
      return 'Moyen-courrier';
    }
    return 'Long-courrier';
  }

  getImage(aircraft: Aircraft): string {
    return aircraft.image ?? 'https://via.placeholder.com/640x360?text=VoyageExpress+Air';
  }

  private loadAircrafts(): void {
    this.isLoading = true;
    this.error = null;

    const sub = this.vehiculeService.list().subscribe({
      next: (vehicules) => {
        const aircrafts = (vehicules ?? [])
          .filter((vehicle) => vehicle.type === TypeVehicule.AVION)
          .map((vehicle) => this.toAircraft(vehicle));

        this.aircrafts = aircrafts;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des avions:', err);
        this.error = "Impossible de récupérer la flotte d'avions pour le moment.";
        this.aircrafts = [];
        this.filteredAircrafts = [];
        this.isLoading = false;
      }
    });

    this.subscriptions.add(sub);
  }

  private toAircraft(vehicle: VehiculeResponse): Aircraft {
    return {
      ...vehicle
    } as Aircraft;
  }

  private applyFilters(): void {
    let filtered = [...this.aircrafts];
    const term = this.searchTerm.trim().toLowerCase();

    if (term) {
      filtered = filtered.filter((aircraft) => {
        const immatriculation = aircraft.immatriculation?.toLowerCase() ?? '';
        const marque = aircraft.marque?.toLowerCase() ?? '';
        const modele = aircraft.modele?.toLowerCase() ?? '';
        const tracking = aircraft.trackingId?.toLowerCase() ?? '';
        return (
          immatriculation.includes(term) ||
          marque.includes(term) ||
          modele.includes(term) ||
          tracking.includes(term)
        );
      });
    }

    if (this.capacityFilter !== 'all') {
      filtered = filtered.filter((aircraft) => this.matchesCapacity(aircraft));
    }

    if (this.statusFilter !== 'all') {
      filtered = filtered.filter((aircraft) => this.normalizeStatus(aircraft) === this.statusFilter);
    }

    this.filteredAircrafts = filtered;
  }

  private matchesCapacity(aircraft: Aircraft): boolean {
    const seats = aircraft.nombrePlace ?? 0;
    switch (this.capacityFilter) {
      case 'regional':
        return seats <= 120;
      case 'narrow':
        return seats > 120 && seats <= 220;
      case 'wide':
        return seats > 220;
      default:
        return true;
    }
  }

  private normalizeStatus(aircraft: Aircraft): 'service' | 'maintenance' | 'inactive' | 'unknown' {
    const etat = aircraft.etat?.toLowerCase() ?? '';
    if (etat.includes('maintenance')) {
      return 'maintenance';
    }
    if (etat.includes('hors') || etat.includes('inactive') || aircraft.actif === false) {
      return 'inactive';
    }
    if (etat || aircraft.actif) {
      return 'service';
    }
    return 'unknown';
  }
}
