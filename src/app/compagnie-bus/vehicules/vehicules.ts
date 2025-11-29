import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService, VehiculeServiceApi } from '../../services';
import { CompagnieBusNavbarComponent } from '../shared/compagnie-bus-navbar/compagnie-bus-navbar.component';
import { VehiculeFormModalComponent } from './vehicule-form-modal.component';
import { TypeVehicule, VehiculeResponse } from '../../models';

type VehicleStatus = 'service' | 'maintenance' | 'inactive' | 'unknown';
type StatusFilter = VehicleStatus | 'all';
type CapacityFilter = 'all' | 'mini' | 'midi' | 'grand';

interface VehicleFilters {
  search: string;
  status: StatusFilter;
  capacity: CapacityFilter;
}

type BusVehicle = VehiculeResponse & {
  immatriculation?: string | null;
  marque?: string | null;
  modele?: string | null;
  annee?: number | null;
  etat?: string | null;
  actif?: boolean | null;
  equipements?: string | null;
  image?: string | null;
  carburant?: string | null;
};

@Component({
  selector: 'app-vehicules',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CompagnieBusNavbarComponent, VehiculeFormModalComponent],
  templateUrl: './vehicules.html',
  styleUrl: './vehicules.css'
})
export class Vehicules implements OnInit, OnDestroy {
  isLoading = false;
  error: string | null = null;

  isCreateModalOpen = false;

  vehicles: BusVehicle[] = [];
  filteredVehicles: BusVehicle[] = [];

  filters: VehicleFilters = {
    search: '',
    status: 'all',
    capacity: 'all'
  };

  totalVehicles = 0;
  totalSeats = 0;
  averageSeats = 0;
  activeVehicles = 0;
  maintenanceVehicles = 0;

  private subscriptions = new Subscription();

  constructor(
    private readonly vehiculeService: VehiculeServiceApi,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadVehicles();
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
    this.loadVehicles();
  }

  openCreateVehicle(): void {
    this.isCreateModalOpen = true;
  }

  onVehicleModalClosed(): void {
    this.isCreateModalOpen = false;
  }

  onVehicleSaved(_vehicle: VehiculeResponse): void {
    this.isCreateModalOpen = false;
    this.loadVehicles();
  }

  retry(): void {
    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();
    this.loadVehicles();
  }

  onFiltersChange(): void {
    this.applyFilters();
  }

  resetFilters(): void {
    this.filters = { search: '', status: 'all', capacity: 'all' };
    this.applyFilters();
  }

  trackVehicle(index: number, vehicle: BusVehicle): string {
    return vehicle?.trackingId ?? `${index}`;
  }

  get kpiCards(): Array<{ icon: string; label: string; value: string; hint: string; tone: string }> {
    return [
      {
        icon: 'fa-bus',
        label: 'Bus en flotte',
        value: this.formatNumber(this.totalVehicles),
        hint: `${this.formatNumber(this.activeVehicles)} en service`,
        tone: 'primary'
      },
      {
        icon: 'fa-chair',
        label: 'Sièges disponibles',
        value: this.formatNumber(this.totalSeats),
        hint: `${this.formatNumber(this.averageSeats)} sièges en moyenne`,
        tone: 'info'
      },
      {
        icon: 'fa-tools',
        label: 'Maintenance',
        value: this.formatNumber(this.maintenanceVehicles),
        hint: 'Bus actuellement indisponibles',
        tone: 'warning'
      },
      {
        icon: 'fa-gas-pump',
        label: 'Type de carburant',
        value: this.getFuelDiversityLabel(),
        hint: 'Diversité énergétique de la flotte',
        tone: 'success'
      }
    ];
  }

  getStatusLabel(vehicle: BusVehicle): string {
    switch (this.normalizeStatus(vehicle)) {
      case 'service':
        return 'En service';
      case 'maintenance':
        return 'Maintenance';
      case 'inactive':
        return 'Hors service';
      default:
        return 'Statut inconnu';
    }
  }

  getStatusBadge(vehicle: BusVehicle): string {
    switch (this.normalizeStatus(vehicle)) {
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

  getCapacityLabel(vehicle: BusVehicle): string {
    const seats = this.getSeatCount(vehicle);
    if (seats <= 20) {
      return 'Minibus';
    }
    if (seats <= 40) {
      return 'Autocar moyen';
    }
    return 'Autocar grande capacité';
  }

  getSeatCount(vehicle: BusVehicle): number {
    const seats = vehicle.nombrePlace;
    return typeof seats === 'number' && Number.isFinite(seats) ? seats : 0;
  }

  formatNumber(value: number | null | undefined): string {
    return new Intl.NumberFormat('fr-FR').format(value ?? 0);
  }

  formatEquipments(vehicle: BusVehicle): string[] {
    const source = vehicle.equipements ?? '';
    return source
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  hasEquipments(vehicle: BusVehicle): boolean {
    return this.formatEquipments(vehicle).length > 0;
  }

  getVehicleImage(vehicle: BusVehicle): string {
    return vehicle.image ?? 'https://via.placeholder.com/640x360?text=VoyageExpress+Bus';
  }

  private loadVehicles(): void {
    this.isLoading = true;
    this.error = null;

    const sub = this.vehiculeService.list().subscribe({
      next: (vehicules) => {
        const buses = (vehicules ?? [])
          .filter((vehicle) => vehicle.type === TypeVehicule.BUS)
          .map((vehicle) => this.enrichVehicle(vehicle));

        this.vehicles = buses;
        this.computeMetrics();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement de la flotte bus:', err);
        this.error = "Impossible de récupérer la flotte de bus pour le moment.";
        this.vehicles = [];
        this.filteredVehicles = [];
        this.totalVehicles = 0;
        this.totalSeats = 0;
        this.averageSeats = 0;
        this.activeVehicles = 0;
        this.maintenanceVehicles = 0;
        this.isLoading = false;
      }
    });

    this.subscriptions.add(sub);
  }

  private enrichVehicle(vehicle: VehiculeResponse): BusVehicle {
    return {
      ...vehicle
    } as BusVehicle;
  }

  private computeMetrics(): void {
    this.totalVehicles = this.vehicles.length;
    this.totalSeats = this.vehicles.reduce((sum, vehicle) => sum + this.getSeatCount(vehicle), 0);
    this.activeVehicles = this.vehicles.filter((vehicle) => this.normalizeStatus(vehicle) === 'service').length;
    this.maintenanceVehicles = this.vehicles.filter((vehicle) => this.normalizeStatus(vehicle) === 'maintenance').length;
    this.averageSeats = this.totalVehicles ? Math.round(this.totalSeats / this.totalVehicles) : 0;
  }

  private applyFilters(): void {
    const term = this.filters.search.trim().toLowerCase();
    const statusFilter = this.filters.status;
    const capacityFilter = this.filters.capacity;

    const filtered = this.vehicles.filter((vehicle) => {
      const matchesSearch = !term || [
        vehicle.immatriculation,
        vehicle.marque,
        vehicle.modele,
        vehicle.trackingId
      ].some((value) => value?.toLowerCase().includes(term));

      const normalizedStatus = this.normalizeStatus(vehicle);
      const matchesStatus = statusFilter === 'all' || normalizedStatus === statusFilter;

      const matchesCapacity = capacityFilter === 'all' || this.matchesCapacity(vehicle, capacityFilter);

      return matchesSearch && matchesStatus && matchesCapacity;
    });

    this.filteredVehicles = filtered.sort((a, b) => this.getSeatCount(b) - this.getSeatCount(a));
  }

  private matchesCapacity(vehicle: BusVehicle, filter: CapacityFilter): boolean {
    const seats = this.getSeatCount(vehicle);
    switch (filter) {
      case 'mini':
        return seats <= 20;
      case 'midi':
        return seats > 20 && seats <= 40;
      case 'grand':
        return seats > 40;
      default:
        return true;
    }
  }

  private normalizeStatus(vehicle: BusVehicle): VehicleStatus {
    const state = vehicle.etat?.toLowerCase() ?? '';

    if (state.includes('maintenance')) {
      return 'maintenance';
    }

    if (state.includes('hors') || state.includes('inactive') || vehicle.actif === false) {
      return 'inactive';
    }

    if (state || vehicle.actif === true) {
      return 'service';
    }

    return 'unknown';
  }

  private getFuelDiversityLabel(): string {
    const fuels = new Set(
      this.vehicles
        .map((vehicle) => vehicle.carburant?.toLowerCase() ?? '')
        .filter((fuel) => fuel.length > 0)
    );

    if (fuels.size === 0) {
      return 'NC';
    }

    if (fuels.size === 1) {
      return [...fuels][0];
    }

    return `${fuels.size} types`;
  }
}
