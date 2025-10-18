import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { EtablisementRoutingModule } from './etablisement-routing-module';
import { Etablisement } from './etablisement';
import { Statistiques } from './statistiques/statistiques';
import { Chambres } from './chambres/chambres';
import { Reservations } from './reservations/reservations';
import { TypesHebergement } from './types-hebergement/types-hebergement';


@NgModule({
  declarations: [
    Etablisement,
    Statistiques,
    Chambres,
    Reservations,
    TypesHebergement
  ],
  imports: [
    CommonModule,
    RouterModule,
    EtablisementRoutingModule
  ]
})
export class EtablisementModule { }
