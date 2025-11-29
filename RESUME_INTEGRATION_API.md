# 🎯 RÉSUMÉ - Intégration API Complete

## ✅ TRAVAIL EFFECTUÉ

### 1. Configuration API Centralisée
**Fichier** : `src/app/config/api.config.ts`

- ✅ URL de base : `http://localhost:3001/api`
- ✅ Tous les endpoints définis
- ✅ Helper `ApiUrlBuilder` pour construire les URLs
- ✅ Facile à modifier pour production

**Utilisation** :
```typescript
ApiUrlBuilder.users()          // → http://localhost:3001/api/users
ApiUrlBuilder.etablissements() // → http://localhost:3001/api/etablissements
ApiUrlBuilder.auth()           // → http://localhost:3001/api/auth
```

---

### 2. Intercepteurs HTTP

#### AuthInterceptor (`src/app/interceptors/auth.interceptor.ts`)
**Fonctions** :
- ✅ Ajoute automatiquement `Authorization: Bearer <token>` à toutes les requêtes
- ✅ Redirige vers login si 401 (non authentifié)
- ✅ Redirige vers home si 403 (accès interdit)
- ✅ Conserve l'URL de retour

#### ErrorInterceptor (`src/app/interceptors/error.interceptor.ts`)
**Fonctions** :
- ✅ Transforme erreurs HTTP en messages français
- ✅ Log détaillé des erreurs en console
- ✅ Gestion centralisée des erreurs

---

### 3. Services API Mis à Jour

**Tous les services utilisent maintenant `ApiUrlBuilder`** :

| Service | Avant | Après |
|---------|-------|-------|
| `auth.service.ts` | `const API = 'http://localhost:3001/api'` | `ApiUrlBuilder.auth()` |
| `user.service.ts` | `const API = 'http://localhost:3001/api'` | `ApiUrlBuilder.users()` |
| `etablissement.service.ts` | `const API = '/api'` | `ApiUrlBuilder.etablissements()` |
| `local.service.ts` | `const API = '/api'` | `ApiUrlBuilder.locaux()` |
| `reservation.service.ts` | `const API = '/api'` | `ApiUrlBuilder.reservations()` |

**Avantages** :
- ✅ Une seule source de vérité pour les URLs
- ✅ Changement facile pour production
- ✅ Pas de duplication

---

### 4. Exemple d'Intégration Complète

**Fichier** : `src/app/etablisement/etablisement-api.ts`

Composant dashboard avec :
- ✅ Chargement de données depuis API
- ✅ Gestion du loading
- ✅ Gestion des erreurs
- ✅ Calcul automatique des métriques
- ✅ Méthodes de rafraîchissement

**Fonctionnalités** :
```typescript
- loadChambres()      → Charge toutes les chambres
- loadReservations()  → Charge toutes les réservations
- calculateMetrics()  → Calcule taux occupation, revenus
- refresh()           → Rafraîchit les données
- formatMontant()     → Formate en FCFA (2.4M, etc.)
```

---

## 🚀 COMMENT ACTIVER L'INTÉGRATION

### Étape 1 : Configurer les Intercepteurs

**IMPORTANT** : Vous devez enregistrer les intercepteurs dans votre application.

#### Si vous utilisez Angular 17+ (standalone)

**Fichier** : `src/app/app.config.ts`

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptorFn } from './interceptors/auth.interceptor';
import { errorInterceptorFn } from './interceptors/error.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptorFn, errorInterceptorFn])
    )
  ]
};
```

**OU créer des functional interceptors** :

```typescript
// src/app/interceptors/auth.interceptor.ts
export const authInterceptorFn: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();
  
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();
        router.navigate(['/auth/login']);
      }
      return throwError(() => error);
    })
  );
};
```

#### Si vous utilisez Angular <17 (avec modules)

**Fichier** : `src/app/app.module.ts`

```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { ErrorInterceptor } from './interceptors/error.interceptor';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    HttpClientModule  // ← Important !
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
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

---

### Étape 2 : Vérifier le Backend

**Le backend doit être lancé sur** : `http://localhost:3001`

```bash
# Dans le projet backend
npm start
# ou
mvn spring-boot:run
```

**Vérifier CORS** : Le backend doit autoriser `http://localhost:4200`

---

### Étape 3 : Tester l'Intégration

#### Test 1 : Login

```typescript
// Dans login.component.ts
onSubmit() {
  this.authService.login(this.loginForm.value).subscribe({
    next: (response) => {
      console.log('✅ Login réussi:', response);
      this.router.navigate(['/dashboard']);
    },
    error: (err) => {
      console.error('❌ Erreur login:', err.message);
      this.errorMessage = err.message;
    }
  });
}
```

#### Test 2 : Charger des données

```typescript
// Dans n'importe quel composant
ngOnInit() {
  this.localService.list().subscribe({
    next: (chambres) => {
      console.log('✅ Chambres chargées:', chambres);
      this.chambres = chambres;
    },
    error: (err) => {
      console.error('❌ Erreur:', err.message);
    }
  });
}
```

#### Test 3 : Vérifier le token

```typescript
// Ouvrir DevTools → Console
localStorage.getItem('token')  // Devrait afficher le JWT

// Ouvrir DevTools → Network → Headers
// Vérifier que Authorization: Bearer <token> est présent
```

---

## 📚 GUIDE D'UTILISATION PAR SERVICE

### 🔐 AuthService

```typescript
import { AuthService } from './services/auth.service';

constructor(private authService: AuthService) {}

// Login
login() {
  this.authService.login({ email: '...', password: '...' })
    .subscribe({
      next: (res) => console.log('✅ Connecté:', res),
      error: (err) => console.error('❌ Erreur:', err)
    });
}

// Logout
logout() {
  this.authService.logout(); // Nettoie tout et redirige
}

// Vérifier si connecté
get isLoggedIn() {
  return this.authService.isLoggedIn;
}

// Utilisateur actuel
get currentUser() {
  return this.authService.currentUserValue;
}
```

---

### 👤 UserService

```typescript
import { UserServiceApi } from './services/user.service';

// Inscription
register() {
  const user: UserRequest = {
    nom: 'Dupont',
    prenom: 'Jean',
    email: 'jean@email.com',
    password: 'pass123',
    role: 'CLIENT',
    telephone: '98337662'
  };
  
  this.userService.inscription(user).subscribe({
    next: (u) => console.log('✅ Inscrit:', u.trackingId),
    error: (err) => console.error('❌ Erreur:', err)
  });
}

// Liste utilisateurs
loadUsers() {
  this.userService.list().subscribe(users => {
    this.users = users;
  });
}

// Par rôle
loadClients() {
  this.userService.findByRole('CLIENT').subscribe(clients => {
    this.clients = clients;
  });
}
```

---

### 🏨 EtablissementService

```typescript
import { EtablissementServiceApi } from './services/etablissement.service';

// Créer établissement
createEtab() {
  const etab: EtablissementRequest = {
    adresse: 'Lomé, Togo',
    type: TypeEtablissement.Hotel,
    proprietaireId: 'user-id'
  };
  
  this.etablissementService.create(etab).subscribe({
    next: (e) => console.log('✅ Créé:', e.trackingId)
  });
}

// Liste
loadEtablissements() {
  this.etablissementService.list().subscribe(etabs => {
    this.etablissements = etabs;
  });
}
```

---

### 🛏️ LocalService (Chambres)

```typescript
import { LocalServiceApi } from './services/local.service';

// Créer chambre
createChambre() {
  const chambre: LocalRequest = {
    description: 'Chambre climatisée',
    type: TypeLocal.CHAMBRE_CLIMER,
    etablissementId: 1
  };
  
  this.localService.create(chambre).subscribe({
    next: (c) => console.log('✅ Chambre créée:', c.trackingId)
  });
}

// Liste
loadChambres() {
  this.localService.list().subscribe(chambres => {
    this.chambres = chambres;
  });
}

// Upload image
uploadImage(trackingId: string, file: File) {
  this.localService.uploadImage(trackingId, file).subscribe({
    next: (c) => console.log('✅ Image:', c.imageUrl)
  });
}
```

---

### 📅 ReservationService

```typescript
import { ReservationServiceApi } from './services/reservation.service';

// Créer réservation
createReservation() {
  const res: ReservationRequest = {
    statut: 'EN_ATTENTE',
    dateReservation: new Date().toISOString(),
    userTrakingId: 'user-id'
  };
  
  this.reservationService.create(res).subscribe({
    next: (r) => console.log('✅ Réservation:', r.trackingId)
  });
}

// Liste paginée
loadReservations() {
  this.reservationService.list(0, 20).subscribe(reservations => {
    this.reservations = reservations;
  });
}

// Télécharger ticket PDF
downloadTicket(trackingId: string) {
  this.reservationService.downloadTicketHebergement(trackingId)
    .subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ticket-${trackingId}.pdf`;
      link.click();
    });
}
```

---

## 🎨 PATTERN D'INTÉGRATION DANS COMPOSANTS

### Pattern Standard

```typescript
import { Component, OnInit } from '@angular/core';
import { ServiceApi } from '../services/service.service';
import { Model } from '../models';

@Component({
  selector: 'app-component',
  templateUrl: './component.html'
})
export class MyComponent implements OnInit {
  
  // Données
  items: Model[] = [];
  
  // États
  loading = false;
  error: string | null = null;
  
  constructor(private service: ServiceApi) {}
  
  ngOnInit(): void {
    this.loadData();
  }
  
  loadData(): void {
    this.loading = true;
    this.error = null;
    
    this.service.list().subscribe({
      next: (data) => {
        this.items = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message;
        this.loading = false;
      }
    });
  }
  
  refresh(): void {
    this.loadData();
  }
}
```

### Template HTML Correspondant

```html
<!-- Loading -->
<div *ngIf="loading" class="text-center py-5">
  <div class="spinner-border text-primary"></div>
  <p class="mt-2">Chargement...</p>
</div>

<!-- Erreur -->
<div *ngIf="error" class="alert alert-danger alert-dismissible">
  <strong>Erreur :</strong> {{ error }}
  <button (click)="refresh()" class="btn btn-sm btn-outline-danger ms-3">
    Réessayer
  </button>
</div>

<!-- Données -->
<div *ngIf="!loading && !error">
  <div *ngIf="items.length === 0" class="alert alert-info">
    Aucun élément trouvé
  </div>
  
  <div *ngIf="items.length > 0" class="row">
    <div *ngFor="let item of items" class="col-md-4 mb-3">
      <div class="card">
        <div class="card-body">
          <!-- Affichage de l'item -->
        </div>
      </div>
    </div>
  </div>
</div>
```

---

## ✅ CHECKLIST COMPLÈTE

### Configuration
- [ ] `HttpClientModule` importé dans app
- [ ] Intercepteurs configurés (Auth + Error)
- [ ] `api.config.ts` avec URL correcte
- [ ] Backend lancé sur `localhost:3001`
- [ ] CORS configuré sur backend

### Tests de base
- [ ] Login fonctionne
- [ ] Token stocké dans localStorage
- [ ] Token ajouté dans requêtes (vérifier Network)
- [ ] Logout fonctionne
- [ ] Erreur 401 redirige vers login

### Intégration dans composants
- [ ] Services injectés
- [ ] Appels API avec `subscribe()`
- [ ] Loading states
- [ ] Gestion des erreurs
- [ ] Affichage des données

---

## 🚨 DÉPANNAGE

### Problème : CORS Error

**Solution Backend (Spring Boot)** :
```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:4200")
                .allowedMethods("*")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
```

### Problème : Token non envoyé

**Vérifier** :
1. Intercepteur bien configuré ?
2. Token existe ? `localStorage.getItem('token')`
3. Header présent ? (DevTools → Network → Headers)

### Problème : Erreur 401 en boucle

**Solution** : Exclure `/auth/login` de l'intercepteur

---

## 📞 RÉSUMÉ FINAL

### ✅ FAIT
- Configuration API centralisée
- Intercepteurs HTTP (Auth + Error)
- Tous les services mis à jour
- Exemple d'intégration complète
- Documentation détaillée

### ⏳ À FAIRE
1. **Configurer les intercepteurs** dans `app.config.ts` ou `app.module.ts`
2. **Lancer le backend** sur `localhost:3001`
3. **Tester le login** et vérifier le token
4. **Intégrer dans vos composants** selon vos besoins
5. **Profiter de l'API** ! 🎉

### 📚 DOCUMENTATION
- `GUIDE_INTEGRATION_API.md` → Guide complet (80+ exemples)
- `RESUME_INTEGRATION_API.md` → Ce fichier (résumé)
- `api.config.ts` → Configuration centralisée
- `etablisement-api.ts` → Exemple complet

---

**Date** : 31 octobre 2025, 11h10  
**Statut** : Intégration API prête ✅  
**Action** : Configurer intercepteurs et tester 🚀
