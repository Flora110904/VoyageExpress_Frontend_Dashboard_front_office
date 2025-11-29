import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { Contact } from './pages/contact/contact';
import { About } from './pages/about/about';
import { Services } from './pages/services/services';
import { PendingValidationComponent } from './pages/pending-validation/pending-validation.component';
import { RoleGuard } from './guards';
import { Role } from './models/enums.model';

// Export des routes pour une utilisation dans main.ts
export const routes: Routes = [
  // Routes publiques
  { path: '', component: HomeComponent },
  { path: 'about', component: About },
  { path: 'services', component: Services },
  { path: 'contact', component: Contact },
  { path: 'auth', loadChildren: () => import('./auth/auth-module').then(m => m.AuthModule) },
  
  // Page d'attente de validation (accessible aux utilisateurs connectés non actifs)
  { 
    path: 'pending-validation', 
    component: PendingValidationComponent
  },
  
  { 
    path: 'client', 
    canActivate: [RoleGuard],
    data: {
      roles: [Role.CLIENT, Role.COMPAGNIE_BUS, Role.COMPAGNIE_AERIEN, Role.ETABLISSEMENT],
      unauthorizedRedirect: '/auth/login'
    },
    loadChildren: () => import('./client/client-module').then(m => m.ClientModule)
  },
  { 
    path: 'compagnieBus', 
    canActivate: [RoleGuard],
    data: {
      roles: [Role.COMPAGNIE_BUS],
      requireActive: true,
      inactiveRedirect: '/client/dashboard',
      unauthorizedRedirect: '/client/dashboard'
    },
    loadChildren: () => import('./compagnie-bus/compagnie-bus-module').then(m => m.CompagnieBusModule)
  },
  { 
    path: 'compagnieVol', 
    canActivate: [RoleGuard],
    data: {
      roles: [Role.COMPAGNIE_AERIEN],
      requireActive: true,
      inactiveRedirect: '/client/dashboard',
      unauthorizedRedirect: '/client/dashboard'
    },
    loadChildren: () => import('./compagnie-vol/compagnie-vol-module').then(m => m.CompagnieVolModule)
  },
  { 
    path: 'etablisement', 
    canActivate: [RoleGuard],
    data: {
      roles: [Role.ETABLISSEMENT],
      requireActive: true,
      inactiveRedirect: '/client/dashboard',
      unauthorizedRedirect: '/client/dashboard'
    },
    loadChildren: () => import('./etablisement/etablisement-module').then(m => m.EtablisementModule)
  },
  
  // Redirection pour les routes inconnues
  { path: '**', redirectTo: '' }
];
