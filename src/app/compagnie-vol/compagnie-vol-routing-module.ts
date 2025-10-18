import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CompagnieVol } from './compagnie-vol';
import { Statistiques } from './statistiques/statistiques';
import { Reservations } from './reservations/reservations';
import { Vols } from './vols/vols';
import { Avions } from './avions/avions';

const routes: Routes = [
  { path: '', component: CompagnieVol },
  { path: 'statistiques', component: Statistiques },
  { path: 'reservations', component: Reservations },
  { path: 'vols', component: Vols },
  { path: 'avions', component: Avions }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CompagnieVolRoutingModule { }
