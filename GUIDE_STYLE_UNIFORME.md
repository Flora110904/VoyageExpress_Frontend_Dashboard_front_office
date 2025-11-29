# 🎨 GUIDE STYLE UNIFORME - VoyageExpress

## 🎯 NOUVELLE APPROCHE

Au lieu de remplacer tous les navbars par `<app-navbar>`, nous allons :

✅ **Garder les navbars spécifiques** de chaque module  
✅ **Appliquer le même STYLE visuel** que la page Home  
✅ **Conserver les menus et données** de chaque page  

## 📦 FICHIER CSS CRÉÉ

### `src/styles-navbar-common.css`

Ce fichier contient **tous les styles communs** pour harmoniser visuellement les navbars sans changer leur structure.

## 🔧 ÉTAPE 1 : Inclure les Styles Communs

### Ajouter dans `src/styles.css`

Ouvrez le fichier `styles.css` et ajoutez cette ligne **à la fin** :

```css
/* Styles communs pour tous les navbars */
@import './styles-navbar-common.css';
```

## 📝 ÉTAPE 2 : Vérifier les Couleurs dans Chaque Navbar

### Remplacements à Faire

Dans **TOUS** les fichiers HTML qui ont un navbar, recherchez et remplacez :

#### 1. Localisation
```html
<!-- ❌ AVANT -->
<p class="m-0">Dakar, Sénégal</p>

<!-- ✅ APRÈS -->
<p class="m-0">Lomé, Togo</p>
```

#### 2. Téléphone
```html
<!-- ❌ AVANT -->
<h5 class="m-0 text-secondary">+221 33 XXX XX XX</h5>

<!-- ✅ APRÈS -->
<h5 class="m-0 text-secondary">+228 98337662</h5>
```

#### 3. Email
```html
<!-- ❌ AVANT -->
<p class="m-0">contact@voyageexpress.sn</p>

<!-- ✅ APRÈS -->
<p class="m-0">contact@voyageexpress.tg</p>
```

#### 4. Nom de marque
```html
<!-- ❌ AVANT -->
<h1 class="text-primary m-0">VoyageExpress Client</h1>

<!-- ✅ APRÈS -->
<h1 class="text-primary m-0">VoyageExpress</h1>
```

## 🎨 CE QUI SERA AUTOMATIQUEMENT STYLÉ

Grâce au fichier CSS commun, ces éléments seront **automatiquement harmonisés** :

✅ **Couleur des liens** → Bleu #0D47A1  
✅ **Hover sur les liens** → Animation douce  
✅ **Boutons sociaux** → Ronds et cohérents  
✅ **Boutons Auth** → Même style partout  
✅ **Topbar** → Espacement uniforme  
✅ **Navbar** → Ombre et fond identiques  
✅ **Active state** → Soulignement bleu  
✅ **Responsive** → Comportement mobile cohérent  

## 📋 PAGES À VÉRIFIER

### Client Module
- ✅ `client/client.html` → Navbar Client avec menus spécifiques
- ✅ Dashboard, Recherche, etc. peuvent garder leurs navbars ou utiliser le parent

### Compagnie Bus
- ⏳ `compagnie-bus/*.html` → Garder navbars avec menus Compagnie

### Compagnie Vol
- ⏳ `compagnie-vol/*.html` → Garder navbars avec menus Compagnie

### Établissement
- ⏳ `etablisement/*.html` → Garder navbars avec menus Établissement

## 🔄 RETIRER `<app-navbar>` SI NÉCESSAIRE

Si vous avez déjà remplacé certains navbars par `<app-navbar>`, vous pouvez :

### Option 1 : Garder `<app-navbar>` pour les pages publiques
- Home, About, Services, Contact → `<app-navbar>` (OK)

### Option 2 : Restaurer les navbars originaux pour les modules

Pour les pages Client, Compagnie, Établissement :

1. **Ouvrir le fichier HTML**
2. **Retirer** `<app-navbar></app-navbar>`
3. **Restaurer** le navbar original avec les menus spécifiques
4. Les styles CSS communs s'appliqueront automatiquement

## 💡 EXEMPLE CONCRET

### Navbar Client (garder cette structure)

```html
<!-- Topbar Start -->
<div class="container-fluid bg-light d-none d-lg-block">
  <div class="row align-items-center top-bar">
    <div class="col-lg-3 col-md-12 text-center text-lg-start">
      <a routerLink="/" class="navbar-brand m-0 p-0">
        <h1 class="text-primary m-0">VoyageExpress</h1>
      </a>
    </div>
    <div class="col-lg-9 col-md-12 text-end">
      <div class="h-100 d-inline-flex align-items-center me-4">
        <i class="fa fa-phone text-primary me-2"></i>
        <p class="m-0">+228 98337662</p>
      </div>
      <div class="h-100 d-inline-flex align-items-center me-4">
        <i class="fa fa-map-marker-alt text-primary me-2"></i>
        <p class="m-0">Lomé, Togo</p>
      </div>
      <!-- Réseaux sociaux ... -->
    </div>
  </div>
</div>
<!-- Topbar End -->

<!-- Navbar Start -->
<div class="container-fluid nav-bar bg-light">
  <nav class="navbar navbar-expand-lg navbar-light bg-white p-3 py-lg-0 px-lg-4">
    <!-- Logo mobile -->
    <a routerLink="/" class="navbar-brand d-flex align-items-center m-0 p-0 d-lg-none">
      <h1 class="text-primary m-0">VoyageExpress</h1>
    </a>
    
    <!-- Toggle button -->
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarCollapse">
      <span class="fa fa-bars"></span>
    </button>
    
    <!-- Menus SPÉCIFIQUES au module Client -->
    <div class="collapse navbar-collapse" id="navbarCollapse">
      <div class="navbar-nav me-auto">
        <a routerLink="/client" class="nav-item nav-link">
          <i class="fa fa-dashboard me-2"></i>Dashboard
        </a>
        <a routerLink="/client/recherche" class="nav-item nav-link">
          <i class="fa fa-search me-2"></i>Rechercher
        </a>
        <a routerLink="/client/mes-reservations" class="nav-item nav-link">
          <i class="fa fa-ticket-alt me-2"></i>Réservations
        </a>
        <!-- ... autres menus Client ... -->
      </div>
    </div>
  </nav>
</div>
<!-- Navbar End -->
```

**Les styles CSS s'appliqueront automatiquement** pour donner le même look que la page Home !

## ✨ AVANTAGES DE CETTE APPROCHE

✅ **Flexibilité** : Chaque module garde ses menus spécifiques  
✅ **Cohérence** : Style visuel identique partout  
✅ **Maintenabilité** : Un seul fichier CSS à modifier  
✅ **Données préservées** : Aucune perte d'information  
✅ **Responsive** : Comportement mobile uniforme  

## 🚀 POUR APPLIQUER

### 1. Ajouter l'import dans styles.css

```css
@import './styles-navbar-common.css';
```

### 2. Corriger les infos dans chaque navbar

- Lomé, Togo
- +228 98337662
- contact@voyageexpress.tg
- VoyageExpress (sans "Client", "Bus", etc.)

### 3. Redémarrer le serveur

```bash
ng serve
```

### 4. Vérifier le résultat

Tous les navbars auront maintenant **le même style visuel** que la page Home !

---

**Date** : 30 octobre 2025, 11:45 AM  
**Approche** : Styles CSS communs au lieu de composant unique  
**Résultat** : Style uniforme + Structure flexible
