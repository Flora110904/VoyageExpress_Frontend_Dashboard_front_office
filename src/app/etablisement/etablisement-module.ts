import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { EtablisementRoutingModule } from './etablisement-routing-module';
import { Etablisement } from './etablisement';
import { Statistiques } from './statistiques/statistiques';
import { Chambres } from './chambres/chambres';
import { Reservations } from './reservations/reservations';
import { TypesHebergement } from './types-hebergement/types-hebergement';
import { SeasonsComponent } from './seasons/seasons.component';
import { EtablisementNavbarComponent } from './shared/etablisement-navbar/etablisement-navbar.component';


@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    EtablisementRoutingModule,
    Etablisement,
    Statistiques,
    Chambres,
    Reservations,
    TypesHebergement,
    EtablisementNavbarComponent,
    SeasonsComponent
  ]
})
export class EtablisementModule { }
