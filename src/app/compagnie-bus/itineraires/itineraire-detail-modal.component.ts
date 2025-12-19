import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ItineraireResponse } from '../../models';

@Component({
  selector: 'app-itineraire-detail-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isOpen" class="modal-backdrop" (click)="close()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <header class="modal-header">
          <div>
            <p class="eyebrow">Vue détaillée</p>
            <h2>{{ itinerary?.villeDepart }} → {{ itinerary?.villeArrivee }}</h2>
            <p class="subtitle" *ngIf="itinerary">
              Départ le {{ itinerary.dateDepart | date: 'fullDate' }} à {{ itinerary.heureDepart || '--:--' }}
            </p>
          </div>
          <button type="button" class="btn-close" (click)="close()" aria-label="Fermer">×</button>
        </header>

        <div class="modal-body" *ngIf="itinerary; else emptyState">
          <section class="highlight-card">
            <div>
              <span class="label">Tarif standard</span>
              <span class="value">{{ itinerary.prix | currency:'XOF':'symbol-narrow':'1.0-0' }}</span>
            </div>
            <div>
              <span class="label">Capacité restante</span>
              <span class="value seats">{{ itinerary.placeDisponible }}/{{ itinerary.placeTotal }}</span>
            </div>
            <div>
              <span class="label">Bagage inclus</span>
              <span class="value">{{ itinerary.bagageInclusKg }} kg</span>
            </div>
          </section>

          <section class="info-grid">
            <article>
              <h3>Informations trajet</h3>
              <ul>
                <li>
                  <span>Référence</span>
                  <strong>{{ itinerary.trackingId }}</strong>
                </li>
                <li>
                  <span>Heure de départ</span>
                  <strong>{{ itinerary.heureDepart || 'Non spécifiée' }}</strong>
                </li>
                <li>
                  <span>Ville de départ</span>
                  <strong>{{ itinerary.villeDepart }}</strong>
                </li>
                <li>
                  <span>Ville d'arrivée</span>
                  <strong>{{ itinerary.villeArrivee }}</strong>
                </li>
              </ul>
            </article>

            <article>
              <h3>Compagnie</h3>
              <ul>
                <li>
                  <span>Nom</span>
                  <strong>{{ itinerary.compagnieNom || 'Non renseigné' }}</strong>
                </li>
                <li>
                  <span>Type</span>
                  <strong>{{ itinerary.compagnieType || '—' }}</strong>
                </li>
              </ul>

              <div class="stacked" *ngIf="classeTarifs.length">
                <h4>Tarifs par classe</h4>
                <div class="pill-group">
                  <span class="pill" *ngFor="let classe of classeTarifs">
                    {{ classe.label }} · {{ classe.value | currency:'XOF':'symbol-narrow':'1.0-0' }}
                  </span>
                </div>
              </div>
            </article>

            <article>
              <h3>Fret & bagages</h3>
              <ul>
                <li>
                  <span>Bagage inclus</span>
                  <strong>{{ itinerary.bagageInclusKg }} kg</strong>
                </li>
                <li>
                  <span>Supplement autorisé</span>
                  <strong>{{ itinerary.bagageSupplementaireMaxKg ?? 0 }} kg</strong>
                </li>
                <li>
                  <span>Prix par kg supplémentaire</span>
                  <strong>
                    {{ (itinerary.prixFreightParKg ?? 0) | currency:'XOF':'symbol-narrow':'1.0-0' }}
                  </strong>
                </li>
              </ul>
            </article>
          </section>

          <footer class="modal-footer">
            <button type="button" class="btn-secondary" (click)="close()">Fermer</button>
          </footer>
        </div>

        <ng-template #emptyState>
          <div class="modal-body empty">
            <p>Aucun itinéraire sélectionné pour l'instant.</p>
            <button type="button" class="btn-secondary" (click)="close()">Fermer</button>
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
        background: rgba(15, 23, 42, 0.55);
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 1.5rem;
        z-index: 1050;
      }
      .modal-container {
        width: min(880px, 100%);
        border-radius: 1.5rem;
        background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
        box-shadow: 0 40px 80px rgba(15, 23, 42, 0.22);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
        padding: 2rem 2.25rem 1.75rem;
        border-bottom: 1px solid rgba(148, 163, 184, 0.25);
      }
      .modal-header h2 {
        margin: 0;
        font-size: 1.75rem;
        font-weight: 700;
        color: #0f172a;
      }
      .eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 0.75rem;
        font-weight: 600;
        color: #475569;
        margin-bottom: 0.25rem;
      }
      .subtitle {
        margin: 0.35rem 0 0;
        color: #475569;
      }
      .btn-close {
        border: none;
        background: rgba(148, 163, 184, 0.2);
        border-radius: 999px;
        width: 2.5rem;
        height: 2.5rem;
        font-size: 1.5rem;
        color: #334155;
        cursor: pointer;
        transition: background 0.2s ease;
      }
      .btn-close:hover {
        background: rgba(148, 163, 184, 0.35);
      }
      .modal-body {
        padding: 2rem 2.25rem;
        display: flex;
        flex-direction: column;
        gap: 1.75rem;
      }
      .highlight-card {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 1rem;
        padding: 1.25rem 1.5rem;
        background: linear-gradient(120deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0));
        border-radius: 1rem;
        border: 1px solid rgba(59, 130, 246, 0.25);
      }
      .highlight-card .label {
        font-size: 0.85rem;
        color: #1d4ed8;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        display: block;
        margin-bottom: 0.35rem;
      }
      .highlight-card .value {
        font-size: 1.4rem;
        font-weight: 700;
        color: #0f172a;
      }
      .highlight-card .value.seats {
        color: #0ea5e9;
      }
      .info-grid {
        display: grid;
        gap: 1.5rem;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }
      article {
        background: white;
        border-radius: 1rem;
        padding: 1.25rem 1.5rem;
        border: 1px solid rgba(148, 163, 184, 0.2);
        box-shadow: 0 15px 25px rgba(15, 23, 42, 0.07);
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      article h3 {
        margin: 0;
        font-size: 1.05rem;
        font-weight: 600;
        color: #0f172a;
      }
      article ul {
        margin: 0;
        padding: 0;
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      article li {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 0.5rem;
        font-size: 0.95rem;
        color: #475569;
      }
      article li strong {
        color: #0f172a;
        font-weight: 600;
      }
      .stacked h4 {
        margin: 0 0 0.5rem;
        font-size: 0.95rem;
        color: #1e293b;
        font-weight: 600;
      }
      .pill-group {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .pill {
        background: rgba(59, 130, 246, 0.14);
        color: #1d4ed8;
        border-radius: 999px;
        padding: 0.4rem 0.9rem;
        font-size: 0.85rem;
        font-weight: 600;
      }
      .modal-footer {
        display: flex;
        justify-content: flex-end;
        padding-top: 0.5rem;
      }
      .btn-secondary {
        background: #0f172a;
        color: white;
        border: none;
        border-radius: 0.75rem;
        padding: 0.7rem 1.4rem;
        font-size: 0.95rem;
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      .btn-secondary:hover {
        transform: translateY(-1px);
        box-shadow: 0 10px 20px rgba(15, 23, 42, 0.15);
      }
      .empty {
        text-align: center;
        gap: 1.5rem;
      }
      @media (max-width: 640px) {
        .modal-container {
          border-radius: 1rem;
        }
        .modal-header,
        .modal-body {
          padding: 1.5rem;
        }
        .highlight-card {
          grid-template-columns: 1fr;
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItineraireDetailModalComponent {
  @Input({ required: true }) isOpen = false;
  @Input() itinerary: ItineraireResponse | null = null;
  @Output() closed = new EventEmitter<void>();

  get classeTarifs(): Array<{ label: string; value: number }> {
    if (!this.itinerary) {
      return [];
    }

    const entries: Array<{ label: string; value: number | null | undefined }> = [
      { label: 'Économique', value: this.itinerary.prixEconomique },
      { label: 'Éco Premium', value: this.itinerary.prixEconomiquePremium },
      { label: 'Affaires', value: this.itinerary.prixAffaires },
      { label: 'Première', value: this.itinerary.prixPremiere }
    ];

    return entries
      .filter((entry): entry is { label: string; value: number } => entry.value != null)
      .map((entry) => ({ label: entry.label, value: entry.value as number }));
  }

  close(): void {
    this.closed.emit();
  }
}
