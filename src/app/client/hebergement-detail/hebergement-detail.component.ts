import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { LocalResponse } from '../../models';
import { LocalServiceApi } from '../../services/local.service';

@Component({
  selector: 'app-hebergement-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './hebergement-detail.component.html',
  styleUrl: './hebergement-detail.component.css'
})
export class HebergementDetailComponent implements OnInit, OnDestroy {
  loading = true;
  error: string | null = null;
  hebergement: LocalResponse | null = null;

  private trackingId: string | null = null;
  private subscriptions = new Subscription();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly localService: LocalServiceApi
  ) {}

  ngOnInit(): void {
    this.trackingId = this.route.snapshot.paramMap.get('trackingId');
    if (!this.trackingId) {
      this.error = "Référence d'hébergement manquante";
      this.loading = false;
      return;
    }

    this.loadHebergement(this.trackingId);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  retry(): void {
    if (this.trackingId) {
      this.loadHebergement(this.trackingId);
    }
  }

  private loadHebergement(id: string): void {
    this.loading = true;
    this.error = null;

    const sub = this.localService.get(id).subscribe({
      next: (hebergement) => {
        this.hebergement = hebergement;
        this.loading = false;
      },
      error: (err) => {
        console.error("Erreur lors du chargement de l'hébergement:", err);
        this.error = "Impossible de charger les détails de l'hébergement.";
        this.loading = false;
      }
    });

    this.subscriptions.add(sub);
  }
}
