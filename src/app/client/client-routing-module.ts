import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClientComponent } from './client';
import { Dashboard } from './dashboard/dashboard';
import { Recherche } from './recherche/recherche';
import { MesReservations } from './mes-reservations/mes-reservations';
import { Historique } from './historique/historique';
import { Profil } from './profil/profil';
import { Paiements } from './paiements/paiements';

const routes: Routes = [
  {
    path: '',
    component: ClientComponent,
    children: [
      { path: '', redirectTo: '/', pathMatch: 'full' }, // Redirection vers la page d'accueil
      { path: 'recherche', component: Recherche },
      { path: 'mes-reservations', component: MesReservations },
      { path: 'historique', component: Historique },
      { path: 'profil', component: Profil },
      { path: 'paiements', component: Paiements }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClientRoutingModule { }
