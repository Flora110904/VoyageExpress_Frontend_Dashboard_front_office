import { enableProdMode, importProvidersFrom, isDevMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app/app';

// Import des routes
import { routes } from './app/app-routing-module';

// Active le mode production si ce n'est pas localhost
if (window.location.hostname !== 'localhost' && !isDevMode()) {
  enableProdMode();
}

console.log('Démarrage de VoyageExpress...');

// Démarrage de l'application avec le composant racine autonome
bootstrapApplication(AppComponent, {
  providers: [
    // Fournit les fournisseurs nécessaires pour le routage
    importProvidersFrom(
      BrowserAnimationsModule,
      RouterModule.forRoot(routes, {
        // Configuration du routeur
        enableTracing: isDevMode(), // Active le traçage des routes en mode développement
        scrollPositionRestoration: 'enabled', // Restaure la position de défilement lors de la navigation
        anchorScrolling: 'enabled', // Active le défilement vers les ancres
      })
    )
  ]
}).catch((err: any) => {
  console.error('Erreur lors du démarrage de l\'application', err);
  
  // Afficher un message d'erreur convivial
  const errorDiv = document.createElement('div');
  errorDiv.style.textAlign = 'center';
  errorDiv.style.padding = '50px';
  errorDiv.style.fontFamily = 'Arial, sans-serif';
  
  errorDiv.innerHTML = `
    <h1 style="color: #d32f2f;">Oups! Quelque chose s'est mal passé</h1>
    <p>Désolé, une erreur est survenue lors du chargement de l'application.</p>
    <p>Veuillez rafraîchir la page ou réessayer plus tard.</p>
    <p><small style="color: #666;">${err.message || 'Erreur inconnue'}</small></p>
    <button onclick="window.location.reload()" style="
      background-color: #1976d2;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      margin-top: 20px;
    ">
      Rafraîchir la page
    </button>
  `;
  
  document.body.innerHTML = '';
  document.body.appendChild(errorDiv);
});
