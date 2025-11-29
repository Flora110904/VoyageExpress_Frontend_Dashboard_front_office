import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LocalRequest, LocalResponse } from '../../models';
import { TypeLocal } from '../../models/enums.model';
import { AuthService, EtablissementServiceApi, LocalServiceApi } from '../../services';
import { EtablisementNavbarComponent } from '../shared/etablisement-navbar/etablisement-navbar.component';

type AvailabilityFilter = 'all' | 'available' | 'occupied';
type TypeFilter = 'all' | string;

type ChambreRecord = LocalResponse & {
  nom?: string | null;
  statut?: string | null;
  typeLocal?: string | null;
  tarifBase?: number | null;
  image?: string | null;
  disponible?: boolean | null;
  capacite?: number | null;
  superficie?: number | null;
};

interface ChambreFilters {
  search: string;
  availability: AvailabilityFilter;
  type: TypeFilter;
}

@Component({
  selector: 'app-chambres',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, EtablisementNavbarComponent],
  templateUrl: './chambres.html',
  styleUrl: './chambres.css'
})
export class Chambres implements OnInit, OnDestroy {
  isLoading = false;
  error: string | null = null;

  chambres: ChambreRecord[] = [];
  filteredChambres: ChambreRecord[] = [];

  filters: ChambreFilters = {
    search: '',
    availability: 'all',
    type: 'all'
  };

  totalChambres = 0;
  availableChambres = 0;
  occupiedChambres = 0;
  averagePrice = 0;
  availableTypes: string[] = [];

  // Création de chambre
  isCreateModalOpen = false;
  isCreating = false;
  createError: string | null = null;
  newChambre: {
    numero: string;
    description: string;
    type: TypeLocal | '';
    superficie: number | null;
    capacite: number | null;
    nombreLits: number | null;
    equipements: string;
  } = {
    numero: '',
    description: '',
    type: '',
    superficie: null,
    capacite: null,
    nombreLits: null,
    equipements: ''
  };
  selectedImage: File | null = null;

  private subscriptions = new Subscription();
  private etablissementId: string | null = null;

  constructor(
    private readonly localService: LocalServiceApi,
    private readonly authService: AuthService,
    private readonly etablissementService: EtablissementServiceApi
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    const authSub = this.authService.currentUser.subscribe((user) => {
      const userTrackingId = user?.trackingId ?? null;

      if (!userTrackingId) {
        this.error = "Aucun utilisateur connecté ou identifiant utilisateur manquant.";
        this.resetState();
        this.isLoading = false;
        return;
      }

      const sub = this.etablissementService
        .getByProprietaire(userTrackingId)
        .pipe(
          catchError(() => {
            this.error = "Aucun établissement associé à ce compte.";
            this.resetState();
            this.isLoading = false;
            return of(null);
          })
        )
        .subscribe((etablissement) => {
          if (!etablissement) {
            return;
          }
          this.etablissementId = etablissement.trackingId;
          this.loadChambres();
        });

      this.subscriptions.add(sub);
    });

    this.subscriptions.add(authSub);
  }

  private resetState(): void {
    this.chambres = [];
    this.filteredChambres = [];
    this.totalChambres = 0;
    this.availableChambres = 0;
    this.occupiedChambres = 0;
    this.averagePrice = 0;
    this.availableTypes = [];
  }

  // --- Création de chambre ---

  get typeLocalOptions(): TypeLocal[] {
    return Object.values(TypeLocal);
  }

  openCreateModal(): void {
    this.createError = null;
    this.newChambre = {
      numero: '',
      description: '',
      type: '',
      superficie: null,
      capacite: null,
      nombreLits: null,
      equipements: ''
    };
    this.selectedImage = null;
    this.isCreateModalOpen = true;
  }

  closeCreateModal(): void {
    if (this.isCreating) {
      return;
    }
    this.isCreateModalOpen = false;
  }

  submitCreateChambre(): void {
    if (!this.etablissementId) {
      this.createError = "Aucun établissement associé pour cette création.";
      return;
    }

    if (!this.newChambre.numero?.trim()) {
      this.createError = "Veuillez renseigner le numéro ou nom de la chambre.";
      return;
    }

    if (!this.newChambre.description?.trim() || !this.newChambre.type) {
      this.createError = "Veuillez renseigner la description et le type de la chambre.";
      return;
    }

    if (this.newChambre.capacite === null || this.newChambre.capacite === undefined || this.newChambre.capacite <= 0) {
      this.createError = "Veuillez renseigner une capacité valide.";
      return;
    }

    const payload: LocalRequest = {
      numero: this.newChambre.numero.trim(),
      description: this.newChambre.description.trim(),
      type: this.newChambre.type as TypeLocal,
      superficie: this.newChambre.superficie ?? undefined,
      capacite: this.newChambre.capacite!,
      nombreLits: this.newChambre.nombreLits ?? undefined,
      equipements: this.newChambre.equipements?.trim() || undefined
    };

    this.isCreating = true;
    this.createError = null;

    const sub = this.localService
      .create(payload, this.etablissementId)
      .subscribe({
        next: (local) => {
          const trackingId = local?.trackingId;

          if (this.selectedImage && trackingId) {
            const uploadSub = this.localService
              .uploadImage(trackingId, this.selectedImage)
              .subscribe({
                next: () => {
                  this.isCreating = false;
                  this.isCreateModalOpen = false;
                  this.refresh();
                },
                error: (err) => {
                  console.error("Erreur lors de l'upload de l'image:", err);
                  // On ne bloque pas la création si l'upload échoue
                  this.isCreating = false;
                  this.isCreateModalOpen = false;
                  this.refresh();
                }
              });

            this.subscriptions.add(uploadSub);
          } else {
            this.isCreating = false;
            this.isCreateModalOpen = false;
            this.refresh();
          }
        },
        error: (err) => {
          console.error('Erreur lors de la création de la chambre:', err);
          this.createError = "Impossible de créer la chambre pour le moment.";
          this.isCreating = false;
        }
      });

    this.subscriptions.add(sub);
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      this.selectedImage = null;
      return;
    }
    this.selectedImage = input.files[0];
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
    this.loadChambres();
  }

  retry(): void {
    this.error = null;
    this.loadChambres();
  }

  onFiltersChange(): void {
    this.applyFilters();
  }

  resetFilters(): void {
    this.filters = { search: '', availability: 'all', type: 'all' };
    this.applyFilters();
  }

  trackChambre(index: number, chambre: ChambreRecord): string {
    return chambre?.trackingId ?? `${index}`;
  }

  get kpiCards(): Array<{ icon: string; label: string; value: string; hint: string; tone: string }> {
    return [
      {
        icon: 'fa-hotel',
        label: 'Chambres',
        value: this.formatNumber(this.totalChambres),
        hint: `${this.formatNumber(this.availableChambres)} disponibles`,
        tone: 'primary'
      },
      {
        icon: 'fa-door-open',
        label: 'Occupées',
        value: this.formatNumber(this.occupiedChambres),
        hint: `${this.formatNumber(this.availableChambres)} libres`,
        tone: 'warning'
      }
    ];
  }

  get typeOptions(): string[] {
    return this.availableTypes;
  }

  getAvailabilityLabel(chambre: ChambreRecord): string {
    if (this.isOccupied(chambre)) {
      return 'Occupée';
    }
    return 'Disponible';
  }

  getAvailabilityBadge(chambre: ChambreRecord): string {
    return this.isOccupied(chambre) ? 'bg-danger' : 'bg-success';
  }

  getStatusLabel(chambre: ChambreRecord): string {
    return this.getStatut(chambre) ?? 'Actif';
  }

  getStatusBadge(chambre: ChambreRecord): string {
    const statut = (this.getStatut(chambre) ?? '').toLowerCase();
    if (statut.includes('maintenance')) {
      return 'bg-warning text-dark';
    }
    if (statut.includes('inactif')) {
      return 'bg-secondary';
    }
    return 'bg-primary';
  }

  getTypeLabel(chambre: ChambreRecord): string {
    return this.getType(chambre) ?? 'Non spécifié';
  }

  getPrice(chambre: ChambreRecord): string {
    const prix = this.getTarif(chambre);
    if (prix === null) {
      return 'Tarif non défini';
    }
    const actif = chambre.tarifActif ?? this.getDynamicValue<boolean>(chambre, 'tarifActif');
    const suffix = actif === false ? ' (inactif)' : ' / nuit';
    return `${this.formatCurrency(prix)}${suffix}`;
  }

  getCapacityLabel(chambre: ChambreRecord): string {
    const capacity = chambre.capacite ?? null;
    return capacity ? `${capacity} pers.` : 'Capacité non précisée';
  }

  getName(chambre: ChambreRecord): string {
    return chambre.nom ?? chambre.description ?? this.getTypeLabel(chambre);
  }

  formatTypeOption(type: string): string {
    return this.toTitleCase(type.replace(/_/g, ' '));
  }

  getPreviewImage(chambre: ChambreRecord): string {
    const url = chambre.imageUrl ?? chambre.image;
    return url && url.length > 0
      ? url
      : 'https://via.placeholder.com/640x360?text=VoyageExpress+Hotel';
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

  private loadChambres(): void {
    const targetId = this.etablissementId;
    if (!targetId) {
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.error = null;

    const sub = this.localService.listByEtablissement(targetId).subscribe({
      next: (chambres) => {
        this.chambres = (chambres ?? []) as ChambreRecord[];
        this.computeMetrics();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des chambres:', err);
        this.error = "Impossible de récupérer les chambres pour le moment.";
        this.chambres = [];
        this.filteredChambres = [];
        this.totalChambres = 0;
        this.availableChambres = 0;
        this.occupiedChambres = 0;
        this.averagePrice = 0;
        this.isLoading = false;
      }
    });

    this.subscriptions.add(sub);
  }

  private computeMetrics(): void {
    this.totalChambres = this.chambres.length;
    this.availableChambres = this.chambres.filter((chambre) => !this.isOccupied(chambre)).length;
    this.occupiedChambres = this.totalChambres - this.availableChambres;

    const totalPrice = this.chambres.reduce((sum, chambre) => sum + (this.getTarif(chambre) ?? 0), 0);
    this.averagePrice = this.totalChambres ? totalPrice / this.totalChambres : 0;

    const types = new Set<string>();
    for (const chambre of this.chambres) {
      const type = this.getType(chambre)?.toLowerCase();
      if (type) {
        types.add(type);
      }
    }
    this.availableTypes = Array.from(types).sort();

    if (this.filters.type !== 'all' && !this.availableTypes.includes(this.filters.type)) {
      this.filters.type = 'all';
    }
  }

  private applyFilters(): void {
    const term = this.filters.search.trim().toLowerCase();
    const availability = this.filters.availability;
    const type = this.filters.type;

    const filtered = this.chambres.filter((chambre) => {
      const matchesSearch = !term
        || [
          chambre.nom,
          this.getType(chambre),
          chambre.trackingId,
          chambre.description
        ].some((value) => value?.toLowerCase().includes(term));

      const matchesAvailability =
        availability === 'all'
        || (availability === 'available' && !this.isOccupied(chambre))
        || (availability === 'occupied' && this.isOccupied(chambre));

      const matchesType = type === 'all' || (this.getType(chambre)?.toLowerCase() ?? '') === type;

      return matchesSearch && matchesAvailability && matchesType;
    });

    this.filteredChambres = filtered.sort((a, b) => {
      const priceA = this.getTarif(a) ?? 0;
      const priceB = this.getTarif(b) ?? 0;
      return priceB - priceA;
    });
  }

  private computeOccupancyRate(): number {
    if (!this.totalChambres) {
      return 0;
    }
    return Math.round((this.occupiedChambres / this.totalChambres) * 100);
  }

  private isOccupied(chambre: ChambreRecord): boolean {
    const statut = (this.getStatut(chambre) ?? '').toLowerCase();
    if (chambre.disponible !== null && chambre.disponible !== undefined) {
      return !chambre.disponible;
    }
    return statut.includes('occup') || statut.includes('réserv') || statut.includes('reserve');
  }

  private getStatut(chambre: ChambreRecord): string | null | undefined {
    return chambre.statut ?? this.getDynamicValue<string>(chambre, 'status');
  }

  private getType(chambre: ChambreRecord): string | null | undefined {
    return chambre.typeLocal ?? this.coerceToString(chambre.type) ?? this.getDynamicValue<string>(chambre, 'typeLocal') ?? this.getDynamicValue<string>(chambre, 'type');
  }

  private getTarif(chambre: ChambreRecord): number | null {
    const valeur = chambre.tarifPrixTtc ?? this.getDynamicValue<number>(chambre, 'tarifPrixTtc') ?? this.getDynamicValue<number>(chambre, 'tarifBase') ?? this.getDynamicValue<number>(chambre, 'tarif') ?? this.getDynamicValue<number>(chambre, 'prix');
    if (typeof valeur === 'number' && Number.isFinite(valeur)) {
      return valeur;
    }
    return null;
  }

  private getDynamicValue<T>(chambre: ChambreRecord, key: string): T | null {
    const record = chambre as unknown as Record<string, unknown>;
    const value = record?.[key];
    return (value as T) ?? null;
  }

  private coerceToString(value: unknown): string | null {
    if (typeof value === 'string') {
      return value;
    }
    return null;
  }

  private toTitleCase(value: string): string {
    return value
      .toLowerCase()
      .split(' ')
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  }
}
