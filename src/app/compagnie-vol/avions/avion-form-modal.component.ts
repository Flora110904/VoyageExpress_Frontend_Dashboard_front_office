import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService, CompagnieServiceApi, VehiculeServiceApi } from '../../services';
import { TypeVehicule, VehiculeRequest, VehiculeResponse } from '../../models';

@Component({
  selector: 'app-avion-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div *ngIf="isOpen" class="modal-backdrop" (click)="onBackdropClick($event)">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Ajouter un avion</h2>
          <button type="button" class="btn-close" (click)="closeModal()">×</button>
        </div>

        <div class="modal-body" *ngIf="!compagnieError; else compagnieErrorTpl">
          <form [formGroup]="form" (ngSubmit)="submit()">
            <div class="grid">
              <label>
                <span>Immatriculation *</span>
                <input type="text" formControlName="immatriculation" placeholder="Ex: VE-AX01" />
              </label>
              <div class="type-indicator">
                <span class="type-label">Type de véhicule</span>
                <span class="type-value">Avion</span>
              </div>
              <label>
                <span>Nombre de places *</span>
                <input type="number" min="1" formControlName="nombrePlace" />
              </label>
            </div>

            <div class="type-indicator">
              <span class="type-label">Type de véhicule</span>
              <span class="type-value">Avion</span>
            </div>

            <div *ngIf="submissionError" class="alert alert-error">{{ submissionError }}</div>

            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="closeModal()" [disabled]="isSubmitting">Annuler</button>
              <button type="submit" class="btn-primary" [disabled]="form.invalid || isSubmitting || !compagnieTrackingId">
                {{ isSubmitting ? 'Enregistrement...' : "Créer l'avion" }}
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
        max-width: 680px;
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
      form input,
      form textarea {
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
      .type-indicator {
        background: #eef2ff;
        border: 1px solid #c7d2fe;
        border-radius: 0.75rem;
        padding: 0.9rem 1.2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .type-label {
        text-transform: uppercase;
        font-size: 0.85rem;
        letter-spacing: 0.05em;
        color: #64748b;
      }
      .type-value {
        font-weight: 600;
        color: #4338ca;
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
export class AvionFormModalComponent implements OnInit, OnChanges, OnDestroy {
  private readonly fb = inject(FormBuilder);
  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<VehiculeResponse>();

  form = this.fb.group({
    immatriculation: ['', [Validators.required, Validators.pattern(/^[A-Z0-9-]{4,10}$/)]],
    nombrePlace: [1, [Validators.required, Validators.min(1)]]
  });

  isSubmitting = false;
  submissionError = '';
  compagnieTrackingId: string | null = null;
  compagnieError: string | null = null;
  private subscriptions = new Subscription();
  private triedToLoadCompagnie = false;

  constructor(
    private readonly vehiculeService: VehiculeServiceApi,
    private readonly compagnieService: CompagnieServiceApi,
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
        }
      },
      error: (error) => {
        console.error('[AvionFormModal] Erreur chargement compagnie', error);
        this.compagnieError = "Impossible de récupérer la compagnie associée.";
      }
    });

    this.subscriptions.add(sub);
  }

  submit(): void {
    if (this.isSubmitting || this.form.invalid || !this.compagnieTrackingId) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.submissionError = '';

    const formValue = this.form.getRawValue();
    const payload: VehiculeRequest = {
      immatriculation: (formValue.immatriculation ?? '').toString().trim().toUpperCase(),
      type: TypeVehicule.AVION,
      nombrePlace: Number(formValue.nombrePlace ?? 1),
      compagnieTrackingId: this.compagnieTrackingId
    };

    const sub = this.vehiculeService.create(payload).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.saved.emit(response);
        this.closeModal();
      },
      error: (error) => {
        console.error('[AvionFormModal] Erreur création avion', error);
        this.isSubmitting = false;
        this.submissionError = error?.error?.message || "Erreur lors de la création de l'avion.";
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
      immatriculation: '',
      nombrePlace: 1
    });
  }

  onBackdropClick(event: MouseEvent): void {
    event.stopPropagation();
    this.closeModal();
  }
}
