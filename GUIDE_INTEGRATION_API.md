# 🔌 GUIDE COMPLET - Intégration API Backend

## ✅ CE QUI A ÉTÉ FAIT

### 1. Configuration centralisée de l'API
**Fichier créé** : `src/app/config/api.config.ts`

```typescript
// Configuration unique pour toutes les URLs API
export const API_CONFIG = {
  BASE_URL: 'http://localhost:3001/api',
  ENDPOINTS: {
    AUTH: '/auth',
    USERS: '/users',
    ETABLISSEMENTS: '/etablissements',
    LOCAUX: '/locaux',
    RESERVATIONS: '/reservations',
    // ... tous les endpoints
  }
};

// Helper pour construire les URLs
ApiUrlBuilder.users()          // → http://localhost:3001/api/users
ApiUrlBuilder.etablissements() // → http://localhost:3001/api/etablissements
```

**Avantages** :
- ✅ URL centralisée (facile à changer pour production)
- ✅ Pas de duplication de `http://localhost:3001/api`
- ✅ Type-safe avec TypeScript

---

### 2. Intercepteurs HTTP

#### a) AuthInterceptor (`src/app/interceptors/auth.interceptor.ts`)
**Rôle** : Ajouter automatiquement le token JWT à toutes les requêtes

```typescript
// Ajoute automatiquement :
// Authorization: Bearer <token>
// à chaque requête HTTP
```

**Fonctionnalités** :
- ✅ Ajoute `Authorization: Bearer <token>` automatiquement
- ✅ Redirige vers login si erreur 401 (non authentifié)
- ✅ Redirige vers home si erreur 403 (accès interdit)
- ✅ Conserve l'URL de retour (`returnUrl`)

#### b) ErrorInterceptor (`src/app/interceptors/error.interceptor.ts`)
**Rôle** : Gérer les erreurs HTTP de manière centralisée

```typescript
// Transforme les erreurs HTTP en messages utilisateur
400 → "Requête invalide"
401 → "Non authentifié. Veuillez vous connecter."
403 → "Accès interdit"
404 → "Ressource non trouvée"
500 → "Erreur serveur"
```

**Fonctionnalités** :
- ✅ Messages d'erreur en français
- ✅ Logging détaillé en console
- ✅ Gestion des erreurs réseau
- ✅ Format uniforme des erreurs

---

### 3. Services API mis à jour

Tous les services utilisent maintenant `ApiUrlBuilder` :

```typescript
// ✅ Avant
const API = 'http://localhost:3001/api';
private base = `${API}/users`;

// ✅ Après
private base = ApiUrlBuilder.users();
```

**Services modifiés** :
- ✅ `auth.service.ts`
- ✅ `user.service.ts`
- ✅ `etablissement.service.ts`
- ✅ `local.service.ts`
- ✅ `reservation.service.ts`

---

### 4. Exemple d'intégration avec composant

**Fichier créé** : `src/app/etablisement/etablisement-api.ts`

Composant exemple qui charge des données réelles depuis l'API :
- ✅ Chargement des chambres/locaux
- ✅ Chargement des réservations
- ✅ Calcul automatique des métriques
- ✅ Gestion du loading
- ✅ Gestion des erreurs
- ✅ Rafraîchissement des données

---

## 🚀 COMMENT UTILISER

### Étape 1 : Configurer les intercepteurs

**Fichier** : `src/app/app.config.ts` ou `app.module.ts`

#### Pour application standalone (Angular 17+)

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { ErrorInterceptor } from './interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([AuthInterceptor, ErrorInterceptor])
    ),
    // ... autres providers
  ]
};
```

#### Pour application avec modules (Angular <17)

**Fichier** : `src/app/app.module.ts`

```typescript
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { ErrorInterceptor } from './interceptors/error.interceptor';

@NgModule({
  imports: [
    HttpClientModule,
    // ... autres imports
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true
    }
  ]
})
export class AppModule { }
```

---

### Étape 2 : Utiliser les services dans vos composants

#### Exemple : Dashboard Établissement

```typescript
import { Component, OnInit } from '@angular/core';
import { EtablissementServiceApi } from '../services/etablissement.service';
import { LocalServiceApi } from '../services/local.service';
import { EtablissementResponse, LocalResponse } from '../models';

@Component({
  selector: 'app-etablissement-dashboard',
  templateUrl: './dashboard.html'
})
export class DashboardComponent implements OnInit {
  
  chambres: LocalResponse[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private localService: LocalServiceApi
  ) {}

  ngOnInit(): void {
    this.loadChambres();
  }

  loadChambres(): void {
    this.loading = true;
    this.error = null;
    
    this.localService.list().subscribe({
      next: (data) => {
        this.chambres = data;
        this.loading = false;
        console.log('✅ Chambres chargées:', data);
      },
      error: (err) => {
        this.error = err.message;
        this.loading = false;
        console.error('❌ Erreur:', err);
      }
    });
  }
}
```

#### Template HTML

```html
<!-- Loading -->
<div *ngIf="loading" class="text-center py-5">
  <div class="spinner-border text-primary" role="status">
    <span class="visually-hidden">Chargement...</span>
  </div>
</div>

<!-- Erreur -->
<div *ngIf="error" class="alert alert-danger">
  {{ error }}
  <button (click)="loadChambres()" class="btn btn-sm btn-outline-danger ms-3">
    Réessayer
  </button>
</div>

<!-- Données -->
<div *ngIf="!loading && !error">
  <div class="row">
    <div *ngFor="let chambre of chambres" class="col-md-4">
      <div class="card">
        <div class="card-body">
          <h5>{{ chambre.type }}</h5>
          <p>{{ chambre.description }}</p>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

### Étape 3 : Exemples d'utilisation par service

#### 🔐 AuthService

```typescript
import { AuthService } from '../services/auth.service';

// Login
this.authService.login({ email: 'user@email.com', password: '123456' })
  .subscribe({
    next: (response) => {
      console.log('✅ Connexion réussie:', response);
      // Token stocké automatiquement
      // Redirection gérée par le composant
    },
    error: (err) => {
      console.error('❌ Erreur login:', err.message);
    }
  });

// Logout
this.authService.logout(); // Nettoie localStorage + redirige

// Vérifier si connecté
if (this.authService.isLoggedIn) {
  console.log('Utilisateur connecté');
}

// Récupérer l'utilisateur actuel
const user = this.authService.currentUserValue;
console.log('User:', user.nom, user.email, user.role);
```

---

#### 👤 UserService

```typescript
import { UserServiceApi } from '../services/user.service';
import { UserRequest } from '../models';

// Inscription
const newUser: UserRequest = {
  nom: 'Dupont',
  prenom: 'Jean',
  email: 'jean@email.com',
  password: 'SecurePass123',
  role: 'CLIENT',
  telephone: '98337662'
};

this.userService.inscription(newUser).subscribe({
  next: (user) => {
    console.log('✅ Inscription réussie:', user.trackingId);
  },
  error: (err) => {
    console.error('❌ Erreur inscription:', err.message);
  }
});

// Liste des utilisateurs
this.userService.list().subscribe(users => {
  console.log('Tous les utilisateurs:', users);
});

// Recherche par rôle
this.userService.findByRole('CLIENT').subscribe(clients => {
  console.log('Clients:', clients);
});

// Modifier un utilisateur
this.userService.update(trackingId, updatedUser).subscribe({
  next: (user) => console.log('✅ Utilisateur modifié'),
  error: (err) => console.error('❌ Erreur:', err)
});
```

---

#### 🏨 EtablissementService

```typescript
import { EtablissementServiceApi } from '../services/etablissement.service';
import { EtablissementRequest, TypeEtablissement } from '../models';

// Créer un établissement
const newEtab: EtablissementRequest = {
  adresse: 'Lomé, Togo',
  type: TypeEtablissement.Hotel,
  proprietaireId: 'user-tracking-id'
};

this.etablissementService.create(newEtab).subscribe({
  next: (etab) => {
    console.log('✅ Établissement créé:', etab.trackingId);
  },
  error: (err) => {
    console.error('❌ Erreur:', err.message);
  }
});

// Liste de tous les établissements
this.etablissementService.list().subscribe(etablissements => {
  console.log('Établissements:', etablissements);
});

// Récupérer un établissement
this.etablissementService.get(trackingId).subscribe(etab => {
  console.log('Établissement:', etab);
});

// Activer/Désactiver
this.etablissementService.activer(trackingId).subscribe();
this.etablissementService.desactiver(trackingId).subscribe();
```

---

#### 🛏️ LocalService (Chambres)

```typescript
import { LocalServiceApi } from '../services/local.service';
import { LocalRequest, TypeLocal } from '../models';

// Créer une chambre
const nouvelleChambre: LocalRequest = {
  description: 'Chambre climatisée avec vue sur mer',
  type: TypeLocal.CHAMBRE_CLIMER,
  etablissementId: 1
};

this.localService.create(nouvelleChambre).subscribe({
  next: (chambre) => {
    console.log('✅ Chambre créée:', chambre.trackingId);
  }
});

// Liste des chambres
this.localService.list().subscribe(chambres => {
  console.log('Chambres:', chambres);
  
  // Filtrer par type
  const suites = chambres.filter(c => c.type === TypeLocal.SUITE);
  console.log('Suites:', suites);
});

// Upload d'image
const file: File = /* fichier sélectionné */;
this.localService.uploadImage(trackingId, file).subscribe({
  next: (chambre) => {
    console.log('✅ Image uploadée:', chambre.imageUrl);
  }
});
```

---

#### 📅 ReservationService

```typescript
import { ReservationServiceApi } from '../services/reservation.service';
import { ReservationRequest } from '../models';

// Créer une réservation
const reservation: ReservationRequest = {
  statut: 'EN_ATTENTE',
  dateReservation: new Date().toISOString(),
  userTrakingId: 'user-id'
};

this.reservationService.create(reservation).subscribe({
  next: (res) => {
    console.log('✅ Réservation créée:', res.trackingId);
  }
});

// Liste paginée
this.reservationService.list(0, 20).subscribe(reservations => {
  console.log('20 premières réservations:', reservations);
});

// Générer un ticket
this.reservationService.generateTicketHebergement(trackingId).subscribe({
  next: (res) => {
    console.log('✅ Ticket généré:', res.ticketHebergementUrl);
  }
});

// Télécharger le ticket PDF
this.reservationService.downloadTicketHebergement(trackingId).subscribe({
  next: (blob) => {
    // Créer un lien de téléchargement
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ticket-${trackingId}.pdf`;
    link.click();
  }
});
```

---

## 🛠️ CONFIGURATION COMPLÈTE

### 1. Vérifier que HttpClientModule est importé

**Dans `app.config.ts` (Angular 17+)** :
```typescript
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    // ... autres providers
  ]
};
```

**Dans `app.module.ts` (Angular <17)** :
```typescript
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  imports: [
    HttpClientModule,
    // ... autres imports
  ]
})
export class AppModule { }
```

---

### 2. Configurer l'URL de l'API

**Pour développement** : Déjà configuré dans `api.config.ts`
```typescript
BASE_URL: 'http://localhost:3001/api'
```

**Pour production** :
```typescript
BASE_URL: 'https://api.voyageexpress.tg/api'
```

Ou utiliser les environments Angular :

**`src/environments/environment.ts`** (dev) :
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3001/api'
};
```

**`src/environments/environment.prod.ts`** (prod) :
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.voyageexpress.tg/api'
};
```

Puis dans `api.config.ts` :
```typescript
import { environment } from '../../environments/environment';

export const API_CONFIG = {
  BASE_URL: environment.apiUrl,
  // ...
};
```

---

## 🔍 DEBUGGING

### Vérifier les requêtes HTTP

1. **Ouvrir DevTools** (F12)
2. **Onglet Network**
3. Filtrer par `XHR` ou `Fetch`
4. Observer les requêtes :
   - URL complète
   - Headers (dont `Authorization`)
   - Request Payload
   - Response

### Console Logs

Les intercepteurs loggent automatiquement :
```
🔴 HTTP Error: {status: 401, message: "...", url: "..."}
```

Les services peuvent logger :
```typescript
this.service.list().subscribe({
  next: (data) => console.log('✅ Success:', data),
  error: (err) => console.error('❌ Error:', err)
});
```

---

## 🎯 TESTS

### Test manuel - Login

1. **Lancer le backend** : `npm start` sur le projet backend
2. **Lancer le frontend** : `ng serve`
3. **Ouvrir** : `http://localhost:4200/auth/login`
4. **Se connecter** avec un compte existant
5. **Observer** :
   - Token stocké dans localStorage
   - Redirection vers dashboard
   - Navbar affiche "Mon Profil" et "Se déconnecter"

### Test manuel - API Call

Dans un composant :
```typescript
ngOnInit(): void {
  this.testApiConnection();
}

testApiConnection(): void {
  console.log('🔌 Test de connexion API...');
  
  this.userService.list().subscribe({
    next: (users) => {
      console.log('✅ API connectée !', users.length, 'utilisateurs');
    },
    error: (err) => {
      console.error('❌ API non disponible:', err);
    }
  });
}
```

---

## 📋 CHECKLIST D'INTÉGRATION

### Configuration de base
- [ ] `HttpClientModule` importé
- [ ] `api.config.ts` créé avec BASE_URL correcte
- [ ] Intercepteurs configurés (Auth + Error)
- [ ] Services mis à jour pour utiliser `ApiUrlBuilder`

### Tests de connexion
- [ ] Backend lancé et accessible
- [ ] Login fonctionne et stocke le token
- [ ] Token ajouté automatiquement aux requêtes (vérifier Network)
- [ ] Erreurs 401/403 gèrent les redirections

### Intégration dans composants
- [ ] Services injectés dans constructeur
- [ ] Méthodes `subscribe()` avec `next` et `error`
- [ ] Loading states affichés pendant requêtes
- [ ] Erreurs affichées à l'utilisateur
- [ ] Données affichées correctement

---

## 🚨 PROBLÈMES COURANTS

### 1. Erreur CORS

**Symptôme** : 
```
Access to XMLHttpRequest at 'http://localhost:3001/api/users' 
from origin 'http://localhost:4200' has been blocked by CORS policy
```

**Solution Backend (Spring Boot)** :
```java
@Configuration
public class CorsConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOrigins("http://localhost:4200")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true);
            }
        };
    }
}
```

### 2. Token non envoyé

**Vérifier** :
- [ ] `AuthInterceptor` est bien configuré
- [ ] Token existe dans localStorage : `localStorage.getItem('token')`
- [ ] Header `Authorization` présent dans Network tab

### 3. Erreur 401 en boucle

**Cause** : L'intercepteur redirige vers login, qui fait un appel API, qui renvoie 401, etc.

**Solution** : Exclure `/auth/login` de l'intercepteur :
```typescript
intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
  // Ne pas ajouter token pour /auth/login
  if (req.url.includes('/auth/login')) {
    return next.handle(req);
  }
  
  // ... reste du code
}
```

---

## 📞 RÉSUMÉ

**Fichiers créés** :
✅ `config/api.config.ts` - Configuration centralisée
✅ `interceptors/auth.interceptor.ts` - Gestion automatique du token
✅ `interceptors/error.interceptor.ts` - Gestion des erreurs
✅ `etablisement/etablisement-api.ts` - Exemple d'intégration

**Services mis à jour** :
✅ Tous les services utilisent `ApiUrlBuilder`
✅ URL centralisée facile à changer

**Prochaines étapes** :
1. Configurer les intercepteurs dans `app.config.ts` ou `app.module.ts`
2. Tester la connexion API
3. Intégrer dans vos composants
4. Profiter de l'API ! 🎉

---

**Date** : 31 octobre 2025, 11h00  
**Statut** : Intégration API configurée et documentée ✅  
**Action** : Appliquer les intercepteurs et tester
