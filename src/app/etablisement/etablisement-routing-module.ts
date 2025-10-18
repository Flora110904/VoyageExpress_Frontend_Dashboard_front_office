import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Etablisement } from './etablisement';
import { Statistiques } from './statistiques/statistiques';
import { Chambres } from './chambres/chambres';
import { Reservations } from './reservations/reservations';
import { TypesHebergement } from './types-hebergement/types-hebergement';

const routes: Routes = [
  { path: '', component: Etablisement },
  { path: 'statistiques', component: Statistiques },
  { path: 'chambres', component: Chambres },
  { path: 'reservations', component: Reservations },
  { path: 'types', component: TypesHebergement }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EtablisementRoutingModule { }
