import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ItineraireResponse } from '../../models';
import { ItineraireServiceApi } from '../../services/itineraire.service';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-itineraire-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FooterComponent],
  templateUrl: './itineraire-detail.component.html',
  styleUrl: './itineraire-detail.component.css'
})
export class ItineraireDetailComponent implements OnInit, OnDestroy {
  loading = true;
  error: string | null = null;
  itineraire: ItineraireResponse | null = null;

  private trackingId: string | null = null;
  private subscriptions = new Subscription();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly itineraireService: ItineraireServiceApi
  ) {}

  ngOnInit(): void {
    this.trackingId = this.route.snapshot.paramMap.get('trackingId');
    if (!this.trackingId) {
      this.error = "Référence d'itinéraire manquante";
      this.loading = false;
      return;
    }

    this.loadItineraire(this.trackingId);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  retry(): void {
    if (this.trackingId) {
      this.loadItineraire(this.trackingId);
    }
  }

  private loadItineraire(id: string): void {
    this.loading = true;
    this.error = null;

    const sub = this.itineraireService.get(id).subscribe({
      next: (itineraire) => {
        this.itineraire = itineraire;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement de l\'itinéraire:', err);
        this.error = "Impossible de charger les détails de l'itinéraire.";
        this.loading = false;
      }
    });

    this.subscriptions.add(sub);
  }
}
