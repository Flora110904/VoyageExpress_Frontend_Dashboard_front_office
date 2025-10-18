import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { ClientRoutingModule } from './client-routing-module';
import { ClientComponent } from './client';
import { Dashboard } from './dashboard/dashboard';
import { Recherche } from './recherche/recherche';
import { MesReservations } from './mes-reservations/mes-reservations';
import { Historique } from './historique/historique';
import { Profil } from './profil/profil';
import { Paiements } from './paiements/paiements';

@NgModule({
  declarations: [
    Dashboard
  ],
  imports: [
    CommonModule,
    RouterModule,
    ClientRoutingModule,
    ClientComponent,
    Recherche,
    MesReservations,
    Historique,
    Profil,
    Paiements
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ClientModule { }
