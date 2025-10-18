import { NgModule, ErrorHandler, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, Routes } from '@angular/router';
// Import des composants
import { HomeComponent } from './pages/home/home.component';
import { About } from './pages/about/about';
import { Contact } from './pages/contact/contact';
import { Services } from './pages/services/services';

// Configuration des routes
const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'about', component: About },
  { path: 'services', component: Services },
  { path: 'contact', component: Contact },
  { path: 'client', loadChildren: () => import('./client/client-module').then(m => m.ClientModule) },
  { path: 'compagnieBus', loadChildren: () => import('./compagnie-bus/compagnie-bus-module').then(m => m.CompagnieBusModule) },
  { path: 'compagnieVol', loadChildren: () => import('./compagnie-vol/compagnie-vol-module').then(m => m.CompagnieVolModule) },
  { path: 'etablisement', loadChildren: () => import('./etablisement/etablisement-module').then(m => m.EtablisementModule) },
  { path: 'auth', loadChildren: () => import('./auth/auth-module').then(m => m.AuthModule) },
  { path: '**', redirectTo: '' }
];

// Gestion des erreurs
class MyErrorHandler implements ErrorHandler {
  handleError(error: any) {
    console.error('Une erreur est survenue:', error);
    if (isDevMode()) {
      console.error('Détails de l\'erreur:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
  }
}

@NgModule({
  declarations: [
    // Composants standalone utilisés directement dans les routes
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    RouterModule.forRoot(routes)
  ],
  providers: [
    { provide: ErrorHandler, useClass: MyErrorHandler }
  ],
  // Pas de bootstrap ici car on utilise bootstrapApplication dans main.ts
})
export class AppModule {
  constructor() {
    if (isDevMode()) {
      console.log('Mode développement activé');
    } else {
      console.log('Mode production activé');
    }
  }
}
