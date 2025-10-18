import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CompagnieBus } from './compagnie-bus';
import { Statistiques } from './statistiques/statistiques';
import { Reservations } from './reservations/reservations';
import { Itineraires } from './itineraires/itineraires';
import { Vehicules } from './vehicules/vehicules';

const routes: Routes = [
  { path: '', component: CompagnieBus },
  { path: 'statistiques', component: Statistiques },
  { path: 'reservations', component: Reservations },
  { path: 'itineraires', component: Itineraires },
  { path: 'vehicules', component: Vehicules }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CompagnieBusRoutingModule { }
