import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { AuthService, EtablissementServiceApi, TarifTypeLocalServiceApi } from '../../services';
import { TarifTypeLocalRequest, TarifTypeLocalResponse, TypeLocal } from '../../models';
import { EtablisementNavbarComponent } from '../shared/etablisement-navbar/etablisement-navbar.component';

type AuthUser = {
  trackingId?: string | null;
  etablissementId?: string | null;
};

interface TarifFormState {
  trackingId: string | null;
  type: TypeLocal | '';
  prixTtc: number | null;
  actif: boolean;
}

@Component({
  selector: 'app-tarifs-types',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, EtablisementNavbarComponent],
  templateUrl: './seasons.component.html',
  styleUrls: ['./seasons.component.css'],
})
export class SeasonsComponent implements OnInit, OnDestroy {
  isLoading = false;
  isSaving = false;
  isDeleting = false;

  error: string | null = null;
  formError: string | null = null;
  deleteError: string | null = null;
  successMessage: string | null = null;

  tarifs: TarifTypeLocalResponse[] = [];
  highlightedTarifId: string | null = null;

  form: TarifFormState = this.defaultForm();
  showForm = false;

  readonly typeOptions: TypeLocal[] = Object.values(TypeLocal);

  private readonly subscriptions = new Subscription();
  private etablissementTrackingId: string | null = null;

  constructor(
    private readonly authService: AuthService,
    private readonly etablissementService: EtablissementServiceApi,
    private readonly tarifService: TarifTypeLocalServiceApi
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    const authSub = this.authService.currentUser.subscribe((user: AuthUser | null) => {
      if (!user) {
        this.error = "Aucun utilisateur connecté.";
        this.isLoading = false;
        return;
      }

      const directEtablissementId = user.etablissementId ?? null;
      if (directEtablissementId) {
        this.etablissementTrackingId = directEtablissementId;
        this.loadTarifs();
        return;
      }

      const ownerId = user.trackingId ?? null;
      if (!ownerId) {
        this.error = "Identifiant propriétaire introuvable.";
        this.isLoading = false;
        return;
      }

      const establishSub = this.etablissementService
        .getByProprietaire(ownerId)
        .pipe(
          catchError(() => {
            this.error = "Aucun établissement associé à ce compte.";
            this.isLoading = false;
            this.resetState();
            return of(null);
          })
        )
        .subscribe((etablissement) => {
          if (!etablissement) {
            return;
          }
          this.etablissementTrackingId = etablissement.trackingId;
          this.loadTarifs();
        });

      this.subscriptions.add(establishSub);
    });

    this.subscriptions.add(authSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get hasTarifs(): boolean {
    return this.tarifs.length > 0;
  }

  get selectableTypes(): TypeLocal[] {
    if (this.form.trackingId) {
      return this.typeOptions;
    }
    const used = new Set(this.tarifs.map((tarif) => tarif.type));
    return this.typeOptions.filter((type) => !used.has(type));
  }

  openCreateForm(): void {
    this.successMessage = null;
    this.formError = null;
    this.form = this.defaultForm();
    this.showForm = true;
  }

  editTarif(tarif: TarifTypeLocalResponse): void {
    this.successMessage = null;
    this.formError = null;
    this.form = {
      trackingId: tarif.trackingId,
      type: tarif.type,
      prixTtc: tarif.prixTtc,
      actif: tarif.actif,
    };
    this.showForm = true;
  }

  cancelForm(): void {
    if (this.isSaving) {
      return;
    }
    this.showForm = false;
    this.form = this.defaultForm();
    this.formError = null;
  }

  submitForm(): void {
    this.formError = null;
    this.successMessage = null;

    if (!this.etablissementTrackingId) {
      this.formError = "Aucun établissement associé pour cette action.";
      return;
    }

    if (!this.validateForm()) {
      return;
    }

    const payload: TarifTypeLocalRequest = {
      type: this.form.type as TypeLocal,
      prixTtc: this.form.prixTtc ?? 0,
      actif: this.form.actif,
    };

    this.isSaving = true;
    const request$ = this.form.trackingId
      ? this.tarifService.update(this.form.trackingId, payload)
      : this.tarifService.create(this.etablissementTrackingId, payload);

    const sub = request$
      .pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: (response: TarifTypeLocalResponse) => {
          this.successMessage = this.form.trackingId
            ? 'Tarif mis à jour avec succès.'
            : 'Tarif créé avec succès.';
          this.showForm = false;
          this.form = this.defaultForm();
          this.highlightTarif(response.trackingId);
          this.loadTarifs();
        },
        error: (error: unknown) => {
          this.formError = this.resolveError(error, 'Une erreur est survenue lors de l\'enregistrement.');
        },
      });

    this.subscriptions.add(sub);
  }

  loadTarifs(): void {
    if (!this.etablissementTrackingId) {
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.error = null;
    const sub = this.tarifService
      .listByEtablissement(this.etablissementTrackingId)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (tarifs: TarifTypeLocalResponse[]) => {
          this.tarifs = [...tarifs].sort((a, b) => a.type.localeCompare(b.type));
        },
        error: (error: unknown) => {
          this.error = this.resolveError(error, 'Erreur lors du chargement des tarifs.');
          this.tarifs = [];
        },
      });

    this.subscriptions.add(sub);
  }

  deleteTarif(tarif: TarifTypeLocalResponse): void {
    if (!confirm(`Supprimer le tarif du type "${this.formatType(tarif.type)}" ?`)) {
      return;
    }

    this.isDeleting = true;
    this.deleteError = null;
    const sub = this.tarifService
      .delete(tarif.trackingId)
      .pipe(finalize(() => (this.isDeleting = false)))
      .subscribe({
        next: () => {
          this.successMessage = 'Tarif supprimé avec succès.';
          this.loadTarifs();
        },
        error: (error: unknown) => {
          this.deleteError = this.resolveError(error, 'Suppression impossible.');
        },
      });

    this.subscriptions.add(sub);
  }

  refresh(): void {
    this.loadTarifs();
  }

  formatType(type: TypeLocal | string): string {
    const value = String(type);
    return value
      .toLowerCase()
      .split('_')
      .map((segment: string) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  }

  formatCurrency(value: number | null | undefined): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value ?? 0);
  }

  private defaultForm(): TarifFormState {
    return {
      trackingId: null,
      type: '',
      prixTtc: null,
      actif: true,
    };
  }

  private resetState(): void {
    this.tarifs = [];
    this.form = this.defaultForm();
    this.showForm = false;
  }

  private validateForm(): boolean {
    if (!this.form.type) {
      this.formError = 'Veuillez sélectionner un type d\'hébergement.';
      return false;
    }

    if (this.form.prixTtc === null || this.form.prixTtc === undefined || this.form.prixTtc < 0) {
      this.formError = 'Veuillez renseigner un prix TTC valide.';
      return false;
    }

    return true;
  }

  private highlightTarif(trackingId: string): void {
    this.highlightedTarifId = trackingId;
    setTimeout(() => (this.highlightedTarifId = null), 3000);
  }

  private resolveError(error: unknown, fallback: string): string {
    if (typeof error === 'string') {
      return error;
    }
    if (error && typeof error === 'object') {
      const typed = error as { error?: { message?: unknown }; message?: unknown };
      const nestedMessage = typed.error?.message ?? typed.message;
      if (typeof nestedMessage === 'string') {
        return nestedMessage;
      }
    }
    return fallback;
  }
}
