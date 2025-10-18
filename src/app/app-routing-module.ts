import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { Contact } from './pages/contact/contact';
import { About } from './pages/about/about';
import { Services } from './pages/services/services';

// Export des routes pour une utilisation dans main.ts
export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'about', component: About },
  { path: 'services', component: Services },
  { path: 'contact', component: Contact },
  { path: 'client', loadChildren: () => import('./client/client-module').then(m => m.ClientModule) },
  { path: 'compagnieBus', loadChildren: () => import('./compagnie-bus/compagnie-bus-module').then(m => m.CompagnieBusModule) },
  { path: 'compagnieVol', loadChildren: () => import('./compagnie-vol/compagnie-vol-module').then(m => m.CompagnieVolModule) },
  { path: 'etablissement', loadChildren: () => import('./etablisement/etablisement-module').then(m => m.EtablisementModule) },
  { path: 'auth', loadChildren: () => import('./auth/auth-module').then(m => m.AuthModule) },
  { path: '**', redirectTo: '' } // Redirection vers la page d'accueil pour les routes inconnues
];
