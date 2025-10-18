import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { CompagnieVolRoutingModule } from './compagnie-vol-routing-module';
import { CompagnieVol } from './compagnie-vol';
import { Statistiques } from './statistiques/statistiques';
import { Reservations } from './reservations/reservations';
import { Vols } from './vols/vols';
import { Avions } from './avions/avions';


@NgModule({
  declarations: [
    CompagnieVol,
    Statistiques,
    Reservations,
    Vols,
    Avions
  ],
  imports: [
    CommonModule,
    RouterModule,
    CompagnieVolRoutingModule
  ]
})
export class CompagnieVolModule { }
