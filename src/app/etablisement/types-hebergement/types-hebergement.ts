import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { LocalResponse } from '../../models';
import { AuthService, LocalServiceApi } from '../../services';
import { EtablisementNavbarComponent } from '../shared/etablisement-navbar/etablisement-navbar.component';

interface HebergementType {
  type: string;
  totalChambres: number;
  disponible: number;
  occupee: number;
  tarifMoyen: number;
  chambres: LocalResponse[];
}

@Component({
  selector: 'app-types-hebergement',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, EtablisementNavbarComponent],
  templateUrl: './types-hebergement.html',
  styleUrl: './types-hebergement.css'
})
export class TypesHebergement implements OnInit, OnDestroy {
  isLoading = false;
  error: string | null = null;

  hebergementTypes: HebergementType[] = [];
  filteredTypes: HebergementType[] = [];

  searchTerm = '';
  selectedType: string | 'all' = 'all';

  private subscriptions = new Subscription();
  private etablissementId: string | null = null;

  constructor(
    private readonly localService: LocalServiceApi,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    const authSub = this.authService.currentUser.subscribe((user) => {
      this.etablissementId = user?.etablissementId ?? null;

      if (!this.etablissementId) {
        this.error = "Aucun établissement associé à ce compte.";
        this.hebergementTypes = [];
        this.filteredTypes = [];
        this.isLoading = false;
        return;
      }

      this.loadTypes();
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
    this.error = null;
    this.loadTypes();
  }

  refresh(): void {
    this.loadTypes();
  }

  get uniqueTypes(): string[] {
    return this.hebergementTypes.map((item) => item.type).sort();
  }

  get metrics(): Array<{ icon: string; label: string; value: string; tone: string; hint: string }> {
    const total = this.hebergementTypes.reduce((sum, type) => sum + type.totalChambres, 0);
    const available = this.hebergementTypes.reduce((sum, type) => sum + type.disponible, 0);
    const occupied = this.hebergementTypes.reduce((sum, type) => sum + type.occupee, 0);
    const averageTarif = this.hebergementTypes.length
      ? this.hebergementTypes.reduce((sum, type) => sum + type.tarifMoyen, 0) / this.hebergementTypes.length
      : 0;

    return [
      {
        icon: 'fa-layer-group',
        label: 'Types référencés',
        value: this.formatNumber(this.hebergementTypes.length),
        tone: 'primary',
        hint: 'Catégories distinctes recensées'
      },
      {
        icon: 'fa-bed',
        label: 'Chambres totales',
        value: this.formatNumber(total),
        tone: 'info',
        hint: `${this.formatNumber(available)} disponibles`
      },
      {
        icon: 'fa-door-closed',
        label: 'Occupées',
        value: this.formatNumber(occupied),
        tone: 'warning',
        hint: 'À surveiller pour la planification'
      },
      {
        icon: 'fa-money-bill-wave',
        label: 'Tarif moyen',
        value: this.formatCurrency(averageTarif),
        tone: 'success',
        hint: 'Calculé sur tous les types'
      }
    ];
  }

  trackType(index: number, type: HebergementType): string {
    return `${type.type}-${index}`;
  }

  trackChambre(index: number, chambre: LocalResponse): string {
    return chambre.trackingId ?? `${index}`;
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    const selected = this.selectedType;

    this.filteredTypes = this.hebergementTypes
      .filter((type) => selected === 'all' || type.type === selected)
      .map((type) => ({
        ...type,
        chambres: type.chambres.filter((chambre) => {
          if (!term) {
            return true;
          }
          const fields = [chambre.trackingId, chambre.description, chambre.type?.toString()].map((value) =>
            value ? value.toLowerCase() : ''
          );
          return fields.some((field) => field.includes(term));
        })
      }));
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

  toTitleCase(value: string): string {
    return value
      .toLowerCase()
      .split(' ')
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  }

  getAvailabilityBadge(disponible: number, totale: number): string {
    if (!totale) {
      return 'bg-secondary';
    }
    const ratio = disponible / totale;
    if (ratio > 0.6) {
      return 'bg-success';
    }
    if (ratio > 0.3) {
      return 'bg-warning text-dark';
    }
    return 'bg-danger';
  }

  getAvailabilityLabel(disponible: number, totale: number): string {
    if (!totale) {
      return 'Disponibilité inconnue';
    }
    const ratio = Math.round((disponible / totale) * 100);
    return `${this.formatNumber(disponible)} libres (${ratio}%)`;
  }

  handleSearchChange(): void {
    this.applyFilters();
  }

  handleTypeChange(): void {
    this.applyFilters();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedType = 'all';
    this.applyFilters();
  }

  private loadTypes(): void {
    const targetId = this.etablissementId;
    if (!targetId) {
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.error = null;

    const sub = this.localService.listByEtablissement(targetId).subscribe({
      next: (chambres) => {
        const grouped = this.groupByType(chambres ?? []);
        this.hebergementTypes = grouped;
        this.filteredTypes = grouped;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error("Erreur lors du chargement des types d'hébergement:", err);
        this.error = "Impossible de récupérer les types d'hébergement pour le moment.";
        this.hebergementTypes = [];
        this.filteredTypes = [];
        this.isLoading = false;
      }
    });

    this.subscriptions.add(sub);
  }

  private groupByType(chambres: LocalResponse[]): HebergementType[] {
    const map = new Map<string, LocalResponse[]>();

    for (const chambre of chambres) {
      const type = this.extractType(chambre);
      if (!map.has(type)) {
        map.set(type, []);
      }
      map.get(type)?.push(chambre);
    }

    return Array.from(map.entries()).map(([type, list]) => {
      const totale = list.length;
      const disponible = list.filter((item) => this.isAvailable(item)).length;
      const occupee = totale - disponible;
      const tarifMoyen = totale
        ? list.reduce((sum, item) => sum + this.extractTarif(item), 0) / totale
        : 0;

      return {
        type,
        totalChambres: totale,
        disponible,
        occupee,
        tarifMoyen,
        chambres: list
      } satisfies HebergementType;
    });
  }

  private extractType(chambre: LocalResponse): string {
    const type = (chambre as unknown as Record<string, unknown>)['typeLocal'] ?? chambre.type;
    if (typeof type === 'string' && type.length > 0) {
      return type.toLowerCase();
    }
    return 'non_classe';
  }

  private extractTarif(chambre: LocalResponse): number {
    const valeur = (chambre as unknown as Record<string, unknown>)['tarifBase']
      ?? (chambre as unknown as Record<string, unknown>)['tarif']
      ?? (chambre as unknown as Record<string, unknown>)['prix'];

    if (typeof valeur === 'number' && Number.isFinite(valeur)) {
      return valeur;
    }
    return 0;
  }

  private isAvailable(chambre: LocalResponse): boolean {
    const record = chambre as unknown as Record<string, unknown>;
    const disponible = record['disponible'];
    const statut = (record['statut'] ?? record['status']) as string | undefined;

    if (typeof disponible === 'boolean') {
      return disponible;
    }

    if (typeof statut === 'string') {
      const lower = statut.toLowerCase();
      return !(lower.includes('occ') || lower.includes('res') || lower.includes('maintenance'));
    }

    return true;
  }
}
