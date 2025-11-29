import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ItineraireRequest, ItineraireResponse, VehiculeResponse } from '../../models';
import { AuthService, CompagnieServiceApi, ItineraireServiceApi, VehiculeServiceApi } from '../../services';

@Component({
  selector: 'app-itineraire-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div *ngIf="isOpen" class="modal-backdrop" (click)="onBackdropClick($event)">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Nouvel itinéraire</h2>
          <button type="button" class="btn-close" (click)="closeModal()">×</button>
        </div>

        <div class="modal-body" *ngIf="!compagnieError; else compagnieErrorTpl">
          <form [formGroup]="form" (ngSubmit)="submit()">
            <div class="grid">
              <label>
                <span>Ville de départ *</span>
                <input type="text" formControlName="villeDepart" placeholder="Ex: Dakar" />
              </label>
              <label>
                <span>Ville d'arrivée *</span>
                <input type="text" formControlName="villeArrivee" placeholder="Ex: Thiès" />
              </label>
              <label>
                <span>Date de départ *</span>
                <input type="date" formControlName="dateDepart" />
              </label>
              <label>
                <span>Heure de départ *</span>
                <input type="time" formControlName="heureDepart" />
              </label>
              <label>
                <span>Prix (XOF) *</span>
                <input type="number" min="0" formControlName="prix" />
              </label>
              <label>
                <span>Véhicule *</span>
                <select formControlName="vehiculeId" (change)="onVehicleChange($event)">
                  <option value="" disabled>Sélectionner un véhicule</option>
                  <option *ngFor="let vehicule of vehicules" [value]="vehicule.trackingId">
                    {{ vehicule.immatriculation || ('Véhicule ' + vehicule.trackingId) }} — {{ vehicule.nombrePlace }} places
                  </option>
                </select>
              </label>
            </div>

            <div *ngIf="selectedVehicleCapacity !== null" class="info-box">
              <i class="fa fa-info-circle"></i>
              Capacité du véhicule sélectionné : {{ selectedVehicleCapacity }} places (appliquée automatiquement)
            </div>

            <div *ngIf="vehiculeError" class="alert alert-error">{{ vehiculeError }}</div>

            <div *ngIf="submissionError" class="alert alert-error">{{ submissionError }}</div>

            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="closeModal()" [disabled]="isSubmitting">Annuler</button>
              <button type="submit" class="btn-primary" [disabled]="form.invalid || isSubmitting || !compagnieTrackingId || vehicules.length === 0">
                {{ isSubmitting ? 'Enregistrement...' : 'Créer l\'itinéraire' }}
              </button>
            </div>
          </form>
        </div>

        <ng-template #compagnieErrorTpl>
          <div class="modal-body">
            <div class="alert alert-error">{{ compagnieError }}</div>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="closeModal()">Fermer</button>
              <button type="button" class="btn-primary" (click)="loadCompagnie()">Réessayer</button>
            </div>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [
    `
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1050;
        padding: 1.5rem;
      }
      .modal-container {
        background: #fff;
        border-radius: 1rem;
        max-width: 720px;
        width: 100%;
        box-shadow: 0 20px 45px rgba(15, 23, 42, 0.15);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      .modal-header {
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid #f1f5f9;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .modal-header h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
      }
      .btn-close {
        border: none;
        background: transparent;
        font-size: 1.5rem;
        line-height: 1;
        cursor: pointer;
      }
      .modal-body {
        padding: 1.5rem;
      }
      form label {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        font-weight: 500;
        color: #334155;
      }
      form input {
        padding: 0.65rem 0.75rem;
        border: 1px solid #cbd5f5;
        border-radius: 0.5rem;
        font-size: 0.95rem;
      }
      .grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }
      .info-box {
        margin-top: 0.5rem;
        padding: 0.75rem 1rem;
        background: #eff6ff;
        border: 1px solid #bfdbfe;
        border-radius: 0.5rem;
        display: flex;
        gap: 0.5rem;
        align-items: center;
        color: #1d4ed8;
        font-size: 0.9rem;
      }
      .modal-actions {
        margin-top: 1.5rem;
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
      }
      .btn-primary {
        background: #2563eb;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 0.75rem;
        cursor: pointer;
        font-weight: 600;
      }
      .btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .btn-secondary {
        background: #e2e8f0;
        color: #1e293b;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 0.75rem;
        cursor: pointer;
        font-weight: 500;
      }
      .alert {
        padding: 0.75rem 1rem;
        border-radius: 0.5rem;
        background: #fef2f2;
        color: #991b1b;
        margin-top: 1rem;
      }
    `
  ]
})
export class ItineraireFormModalComponent implements OnInit, OnChanges, OnDestroy {
  private readonly fb = inject(FormBuilder);
  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<ItineraireResponse>();

  form = this.fb.group({
    villeDepart: ['', [Validators.required, Validators.minLength(2)]],
    villeArrivee: ['', [Validators.required, Validators.minLength(2)]],
    dateDepart: ['', Validators.required],
    heureDepart: ['', Validators.required],
    prix: [0, [Validators.required, Validators.min(0)]],
    vehiculeId: ['', Validators.required]
  });

  isSubmitting = false;
  submissionError = '';
  compagnieTrackingId: string | null = null;
  compagnieError: string | null = null;
  vehiculeError: string | null = null;
  vehicules: VehiculeResponse[] = [];
  selectedVehicleCapacity: number | null = null;
  private subscriptions = new Subscription();
  private triedToLoadCompagnie = false;

  constructor(
    private readonly itineraireService: ItineraireServiceApi,
    private readonly compagnieService: CompagnieServiceApi,
    private readonly vehiculeService: VehiculeServiceApi,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    if (this.isOpen) {
      this.ensureCompagnieLoaded();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue && !changes['isOpen'].previousValue) {
      this.ensureCompagnieLoaded();
      this.resetForm();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private ensureCompagnieLoaded(): void {
    if (this.compagnieTrackingId || this.triedToLoadCompagnie) {
      return;
    }
    this.loadCompagnie();
  }

  loadCompagnie(): void {
    this.triedToLoadCompagnie = true;
    this.compagnieError = null;
    this.vehiculeError = null;

    const currentUser = this.authService.currentUserValue;
    if (!currentUser?.trackingId) {
      this.compagnieError = "Impossible de déterminer l'identifiant du propriétaire.";
      return;
    }

    const sub = this.compagnieService.getByProprietaire(currentUser.trackingId).subscribe({
      next: (compagnie) => {
        this.compagnieTrackingId = compagnie?.trackingId ?? null;
        if (!this.compagnieTrackingId) {
          this.compagnieError = "Aucune compagnie liée à ce compte n'a été trouvée.";
          this.resetVehicules();
        }
        if (this.compagnieTrackingId) {
          this.loadVehicules(this.compagnieTrackingId);
        }
      },
      error: (error) => {
        console.error('[ItineraireFormModal] Erreur chargement compagnie', error);
        this.compagnieError = "Impossible de récupérer la compagnie associée.";
        this.resetVehicules();
      }
    });

    this.subscriptions.add(sub);
  }

  private loadVehicules(compagnieTrackingId: string): void {
    this.vehiculeError = null;
    const sub = this.vehiculeService.listByCompagnie(compagnieTrackingId).subscribe({
      next: (vehicules) => {
        this.vehicules = vehicules ?? [];
        if (this.vehicules.length === 0) {
          this.vehiculeError = 'Aucun véhicule disponible pour cette compagnie. Veuillez en créer un avant de planifier un itinéraire.';
        }
        this.form.patchValue({ vehiculeId: this.vehicules[0]?.trackingId ?? '' });
        this.updateSelectedVehicleCapacity();
      },
      error: (error) => {
        console.error('[ItineraireFormModal] Erreur chargement véhicules', error);
        this.vehiculeError = 'Impossible de récupérer la liste des véhicules.';
        this.resetVehicules();
      }
    });

    this.subscriptions.add(sub);
  }

  private resetVehicules(): void {
    this.vehicules = [];
    this.selectedVehicleCapacity = null;
    this.form.patchValue({ vehiculeId: '' });
  }

  submit(): void {
    if (this.isSubmitting || this.form.invalid || !this.compagnieTrackingId) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.submissionError = '';

    const formValue = this.form.getRawValue();
    const payload: ItineraireRequest = {
      villeDepart: formValue.villeDepart ?? '',
      villeArrivee: formValue.villeArrivee ?? '',
      dateDepart: formValue.dateDepart ?? '',
      heureDepart: formValue.heureDepart ?? '',
      prix: Number(formValue.prix ?? 0),
      compagnieId: this.compagnieTrackingId,
      vehiculeId: formValue.vehiculeId ?? ''
    };

    const sub = this.itineraireService.create(payload).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.saved.emit(response);
        this.closeModal();
      },
      error: (error) => {
        console.error('[ItineraireFormModal] Erreur création itinéraire', error);
        this.isSubmitting = false;
        this.submissionError = error?.error?.message || "Erreur lors de la création de l'itinéraire.";
      }
    });

    this.subscriptions.add(sub);
  }

  closeModal(): void {
    this.isSubmitting = false;
    this.submissionError = '';
    this.resetForm();
    this.closed.emit();
  }

  private resetForm(): void {
    this.form.reset({
      villeDepart: '',
      villeArrivee: '',
      dateDepart: '',
      heureDepart: '',
      prix: 0,
      vehiculeId: ''
    });
    this.selectedVehicleCapacity = null;
  }

  onBackdropClick(event: MouseEvent): void {
    event.stopPropagation();
    this.closeModal();
  }

  onVehicleChange(_event: Event): void {
    this.updateSelectedVehicleCapacity();
  }

  private updateSelectedVehicleCapacity(): void {
    const vehicleId = this.form.get('vehiculeId')?.value;
    const vehicule = this.vehicules.find((v) => v.trackingId === vehicleId);
    this.selectedVehicleCapacity = vehicule ? vehicule.nombrePlace : null;
  }
}
