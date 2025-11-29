# 🎨 Guide de Design VoyageExpress

## Palette de Couleurs Officielle

Voici la palette de couleurs harmonisée pour tout le projet VoyageExpress :

```css
--primary-color: #0D47A1   /* Bleu principal */
--secondary-color: #26A69A /* Turquoise secondaire */
--light-bg: #FFFFFF        /* Fond clair */
--accent-color: #FFA726    /* Orange pour boutons/accents */
```

## 📋 Travaux Réalisés

### ✅ 1. Mise à Jour du Fichier Styles Globaux

**Fichier:** `src/styles.css`

- ✅ Palette de couleurs mise à jour avec les couleurs officielles
- ✅ Gradients harmonisés :
  - `--primary-gradient`: Bleu → Turquoise
  - `--secondary-gradient`: Turquoise → Bleu
  - `--accent-gradient`: Orange clair → Orange foncé
  - `--hero-gradient`: Bleu → Turquoise → Bleu (pour les sections hero)

### ✅ 2. Composants Réutilisables Créés

#### Navbar (`src/app/shared/components/navbar/`)
- Composant standalone avec logo, navigation et boutons d'authentification
- Responsive avec menu hamburger
- Utilise la palette officielle
- Prêt à être importé dans toutes les pages

#### Footer (`src/app/shared/components/footer/`)
- Footer professionnel avec 4 sections
- Liens réseaux sociaux
- Informations de contact
- Copyright dynamique
- Design cohérent avec la palette

### ✅ 3. Pages Publiques Harmonisées

#### Page d'Accueil (`src/app/pages/home/`)
- ✅ Déjà très bien conçue
- ✅ Utilise correctement la palette de couleurs
- ✅ Sections Hero, Services, Destinations harmonisées

#### Page À Propos (`src/app/pages/about/`)
- ✅ Hero section avec `var(--hero-gradient)`
- ✅ Tous les boutons utilisant `var(--accent-gradient)`
- ✅ Icônes avec les couleurs primaires, secondaires et accent
- ✅ Section équipe et valeurs harmonisées

#### Page Services (`src/app/pages/services/`)
- ✅ Hero section harmonisé
- ✅ Tous les boutons btn-warning remplacés par accent-gradient
- ✅ CTA sections avec gradient primaire

#### Page Contact (`src/app/pages/contact/`)
- ✅ Hero section avec gradient harmonisé
- ✅ Boutons et call-to-action cohérents
- ✅ Formulaire et sections d'information stylisés

### ✅ 4. Authentification Harmonisée

#### Login (`src/app/auth/login/`)
- ✅ Background avec `var(--hero-gradient)`
- ✅ Design professionnel et cohérent

#### Register (`src/app/auth/register/`)
- ✅ Background avec `var(--hero-gradient)`
- ✅ Formulaire multi-étapes stylisé

### ✅ 5. Espace Client Harmonisé

#### Dashboard Client (`src/app/client/dashboard/`)
- ✅ Hero section avec gradient harmonisé
- ✅ Boutons d'action avec accent-gradient
- ✅ Cards et sections cohérentes

## 📦 Comment Utiliser les Composants Réutilisables

### Utiliser la Navbar

Dans n'importe quel composant standalone :

```typescript
import { NavbarComponent } from './shared/components/navbar/navbar.component';

@Component({
  selector: 'app-my-page',
  standalone: true,
  imports: [NavbarComponent, ...],
  template: `
    <app-navbar></app-navbar>
    <!-- Votre contenu -->
  `
})
```

### Utiliser le Footer

```typescript
import { FooterComponent } from './shared/components/footer/footer.component';

@Component({
  selector: 'app-my-page',
  standalone: true,
  imports: [FooterComponent, ...],
  template: `
    <!-- Votre contenu -->
    <app-footer></app-footer>
  `
})
```

## 🎯 Prochaines Étapes Recommandées

### 1. Remplacer les Navbar/Footer Dupliqués

Actuellement, chaque page a sa propre navbar et son propre footer. Il faut :

1. **Supprimer** les sections navbar/footer des fichiers HTML individuels
2. **Importer** les composants `NavbarComponent` et `FooterComponent`
3. **Ajouter** `<app-navbar>` et `<app-footer>` dans les templates

Exemple pour `about.html` :
```html
<app-navbar></app-navbar>

<!-- Hero Section -->
<div class="hero-about position-relative" style="background: var(--hero-gradient); ...">
  ...
</div>

<!-- Autres sections -->
...

<app-footer></app-footer>
```

### 2. Harmoniser les Modules Restants

Les modules suivants nécessitent encore une harmonisation :

#### Espace Client (reste à faire)
- ✅ `dashboard` - Fait
- ⏳ `recherche` - À harmoniser
- ⏳ `mes-reservations` - À harmoniser
- ⏳ `historique` - À harmoniser
- ⏳ `profil` - À harmoniser
- ⏳ `paiements` - À harmoniser

#### Compagnie Bus (`src/app/compagnie-bus/`)
- ⏳ Page principale - À harmoniser
- ⏳ Statistiques - À harmoniser
- ⏳ Réservations - À harmoniser
- ⏳ Itinéraires - À harmoniser
- ⏳ Véhicules - À harmoniser

#### Compagnie Vol (`src/app/compagnie-vol/`)
- ⏳ Page principale - À harmoniser
- ⏳ Statistiques - À harmoniser
- ⏳ Réservations - À harmoniser
- ⏳ Vols - À harmoniser
- ⏳ Avions - À harmoniser

#### Établissement (`src/app/etablisement/`)
- ⏳ Page principale - À harmoniser
- ⏳ Statistiques - À harmoniser
- ⏳ Réservations - À harmoniser
- ⏳ Chambres - À harmoniser
- ⏳ Types d'hébergement - À harmoniser

### 3. Créer des Composants Supplémentaires

Pour une meilleure cohérence, créer :

- **Sidebar Component** : Pour les dashboards (Client, Compagnies, Établissement)
- **Card Component** : Cards réutilisables avec le style cohérent
- **Button Component** : Boutons avec styles prédéfinis
- **Stats Widget** : Widget de statistiques réutilisable

## 📝 Règles de Style à Respecter

### Couleurs

**✅ À FAIRE :**
```css
/* Utiliser les variables CSS */
background: var(--primary-gradient);
color: var(--accent-color);
border-color: var(--primary-color);
```

**❌ À ÉVITER :**
```css
/* Ne pas utiliser de couleurs hardcodées */
background: linear-gradient(135deg, #4a90e2 0%, #7b68ee 50%, #ff6b6b 100%);
color: #FFA726;
background-color: #0D47A1;
```

### Boutons

**✅ Bouton Principal (Action importante) :**
```html
<button class="btn btn-lg px-5 py-3 fw-bold" 
        style="background: var(--accent-gradient); color: white; border: none;">
  <i class="fa fa-icon me-2"></i>Texte du Bouton
</button>
```

**✅ Bouton Secondaire :**
```html
<button class="btn btn-outline-primary btn-lg px-5 py-3">
  <i class="fa fa-icon me-2"></i>Texte du Bouton
</button>
```

### Sections Hero

**Template standard :**
```html
<div class="hero-section position-relative" 
     style="background: var(--hero-gradient); min-height: 70vh; display: flex; align-items: center; padding-top: 80px;">
  <div class="hero-background position-absolute top-0 start-0 w-100 h-100" 
       style="background-image: url('...'); background-size: cover; background-position: center; opacity: 0.2;">
  </div>
  <div class="container position-relative z-index-2">
    <div class="row align-items-center">
      <div class="col-lg-6 text-white">
        <h1 class="display-3 fw-bold mb-4">
          Titre Principal
          <span style="color: var(--accent-color);">Texte Accentué</span>
        </h1>
        <p class="lead mb-4 fs-5">Description...</p>
        <!-- Boutons -->
      </div>
      <!-- Image ou contenu droit -->
    </div>
  </div>
</div>
```

### Cards

```html
<div class="card border-0 shadow-lg rounded-4 h-100">
  <div class="card-body p-4">
    <!-- Contenu -->
  </div>
</div>
```

## 🔧 Commandes Utiles

```bash
# Démarrer le serveur de développement
npm start
# ou
ng serve

# Build pour production
ng build --configuration production

# Linter (si configuré)
ng lint

# Tests
ng test
```

## 📱 Responsive Design

Toutes les pages sont optimisées pour :
- 📱 Mobile (< 768px)
- 📱 Tablette (768px - 991px)
- 💻 Desktop (> 992px)

Les breakpoints Bootstrap 5 sont utilisés :
- `col-12`, `col-md-6`, `col-lg-4` etc.

## ✨ Animations Incluses

Les animations suivantes sont disponibles dans `styles.css` :

- `.animate-fade-in` : Fade in avec translation verticale
- `.animate-pulse` : Animation de pulsation
- `.animate-float` : Animation de flottement
- Hover effects sur cards et boutons

## 📞 Support

Pour toute question sur l'harmonisation du design :
- Consulter ce guide
- Vérifier `src/styles.css` pour les variables disponibles
- Regarder les exemples dans les pages déjà harmonisées

---

**Dernière mise à jour :** 30 octobre 2025  
**Palette appliquée :** #0D47A1, #26A69A, #FFFFFF, #FFA726
