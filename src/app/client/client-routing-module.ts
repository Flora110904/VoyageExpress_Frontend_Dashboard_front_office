import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClientComponent } from './client';
import { DashboardClientComponent } from './dashboard/dashboard.component';
import { RechercheComponent } from './recherche/recherche.component';
import { MesReservations } from './mes-reservations/mes-reservations';
import { Historique } from './historique/historique';
import { Profil } from './profil/profil';
import { Paiements } from './paiements/paiements';
import { PaiementSuccessComponent } from './paiements/success/paiement-success';
import { PaiementCancelComponent } from './paiements/cancel/paiement-cancel';
import { ItineraireDetailComponent } from './itineraire-detail/itineraire-detail.component';
import { HebergementDetailComponent } from './hebergement-detail/hebergement-detail.component';
import { ReservationDetailComponent } from './reservation-detail/reservation-detail.component';

const routes: Routes = [
  {
    path: '',
    component: ClientComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardClientComponent },
      { path: 'recherche', component: RechercheComponent },
      { path: 'mes-reservations', component: MesReservations },
      { path: 'historique', component: Historique },
      { path: 'profil', component: Profil },
      { path: 'paiements', component: Paiements },
      { path: 'paiements/success', component: PaiementSuccessComponent },
      { path: 'paiements/cancel', component: PaiementCancelComponent },
      { path: 'itineraire/:trackingId', component: ItineraireDetailComponent },
      { path: 'hebergement/:trackingId', component: HebergementDetailComponent },
      { path: 'reservation/:trackingId', component: ReservationDetailComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClientRoutingModule { }
