import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { CompagnieBusRoutingModule } from './compagnie-bus-routing-module';
import { CompagnieBus } from './compagnie-bus';
import { Statistiques } from './statistiques/statistiques';
import { Vehicules } from './vehicules/vehicules';
import { Reservations } from './reservations/reservations';
import { Itineraires } from './itineraires/itineraires';


@NgModule({
  declarations: [
    CompagnieBus,
    Statistiques,
    Reservations,
    Itineraires,
    Vehicules
  ],
  imports: [
    CommonModule,
    RouterModule,
    CompagnieBusRoutingModule
  ]
})
export class CompagnieBusModule { }
