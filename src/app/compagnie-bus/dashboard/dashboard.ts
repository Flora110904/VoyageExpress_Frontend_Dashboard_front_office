import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-compagnie-bus-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container-fluid py-5">
      <div class="container text-center">
        <h2 class="mb-3">Tableau de bord Compagnie Bus</h2>
        <p class="text-muted">
          Cette page de tableau de bord est encore en cours de préparation. Revenez bientôt pour retrouver vos indicateurs clés.
        </p>
      </div>
    </div>
  `
})
export class CompagnieBusDashboard {}
