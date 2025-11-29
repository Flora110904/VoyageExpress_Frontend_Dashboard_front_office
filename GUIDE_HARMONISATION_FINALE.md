# 🎯 GUIDE D'HARMONISATION FINALE - VoyageExpress

## ✅ ÉTAT ACTUEL : 6/31 Pages (19%)

### Pages Terminées ✅
1. pages/home/home.component.html
2. pages/about/about.html
3. pages/services/services.html
4. pages/contact/contact.html
5. client/dashboard/dashboard.html
6. client/historique/historique.html

## 📋 PAGES RESTANTES : 25/31 (81%)

### Pattern à Appliquer sur Chaque Page

#### 1. Modifier le fichier `.ts`

**Avant** :
```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-[nom]',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './[nom].html',
  styleUrl: './[nom].css'
})
export class [Nom] { }
```

**Après** :
```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-[nom]',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, FooterComponent],
  templateUrl: './[nom].html',
  styleUrl: './[nom].css'
})
export class [Nom] { }
```

#### 2. Modifier le fichier `.html`

**Supprimer** tout le bloc navbar (généralement lignes 1 à ~60) :
```html
<!-- Topbar Start -->
<div class="container-fluid bg-light d-none d-lg-block">
...
</div>
<!-- Navbar End -->
```

**Remplacer par** :
```html
<app-navbar></app-navbar>
```

**Supprimer** tout le bloc footer (généralement les ~50 dernières lignes) :
```html
<!-- Footer Start -->
<div class="container-fluid bg-dark...">
...
</div>
<!-- Footer End -->
<!-- Back to Top -->
```

**Remplacer par** :
```html
<app-footer></app-footer>
```

## 📂 LISTE COMPLÈTE DES PAGES À TRAITER

### Client (4 pages restantes)
- [ ] client/recherche/recherche.html + recherche.ts
- [ ] client/mes-reservations/mes-reservations.html + mes-reservations.ts
- [ ] client/profil/profil.html + profil.ts
- [ ] client/paiements/paiements.html + paiements.ts

### Compagnie Bus (5 pages)
- [ ] compagnie-bus/statistiques/statistiques.html + statistiques.ts
- [ ] compagnie-bus/reservations/reservations.html + reservations.ts
- [ ] compagnie-bus/itineraires/itineraires.html + itineraires.ts
- [ ] compagnie-bus/vehicules/vehicules.html + vehicules.ts
- [ ] compagnie-bus/compagnie-bus.html + compagnie-bus.ts

### Compagnie Vol (5 pages)
- [ ] compagnie-vol/statistiques/statistiques.html + statistiques.ts
- [ ] compagnie-vol/reservations/reservations.html + reservations.ts
- [ ] compagnie-vol/vols/vols.html + vols.ts
- [ ] compagnie-vol/avions/avions.html + avions.ts
- [ ] compagnie-vol/compagnie-vol.html + compagnie-vol.ts

### Établissement (5 pages)
- [ ] etablisement/statistiques/statistiques.html + statistiques.ts
- [ ] etablisement/reservations/reservations.html + reservations.ts
- [ ] etablisement/chambres/chambres.html + chambres.ts
- [ ] etablisement/types-hebergement/types-hebergement.html + types-hebergement.ts
- [ ] etablisement/etablisement.html + etablisement.ts

### Auth (2 pages) - DÉJÀ TRAITÉ ✅
- [x] auth/login/login.component.html (SANS navbar/footer)
- [x] auth/register/register.component.html (SANS navbar/footer)

## 🔧 CORRECTIONS À APPLIQUER EN CHERCHANT/REMPLAÇANT

### Dans TOUS les fichiers HTML :

**Rechercher** : `Dakar, Sénégal`  
**Remplacer par** : `Lomé, Togo`

**Rechercher** : `+221`  
**Remplacer par** : `+228 98337662`

**Rechercher** : `voyageexpress.sn`  
**Remplacer par** : `voyageexpress.tg`

**Rechercher** : `VoyageExpress Client`  
**Remplacer par** : `VoyageExpress`

**Rechercher** : `btn btn-warning`  
**Remplacer par** : `btn` et ajouter `style="background: var(--accent-gradient); color: white; border: none;"`

## ⚡ MÉTHODE RAPIDE

### Option 1 : Rechercher/Remplacer Global (VSCode)

1. `Ctrl+Shift+H` (Rechercher dans les fichiers)
2. Activer "Remplacer"
3. Appliquer les corrections ci-dessus
4. Scope : `src/app/**/*.html`

### Option 2 : Traitement Manuel Page par Page

Pour chaque page :
1. Ouvrir le fichier `.ts`
2. Ajouter les imports Navbar/Footer
3. Ajouter dans imports: `NavbarComponent, FooterComponent`
4. Ouvrir le fichier `.html`
5. Remplacer début par `<app-navbar></app-navbar>`
6. Remplacer fin par `<app-footer></app-footer>`

## ✅ CRITÈRES DE VALIDATION

Une page est harmonisée si :
- ✅ Le `.ts` importe NavbarComponent et FooterComponent
- ✅ Le `.html` commence par `<app-navbar></app-navbar>`
- ✅ Le `.html` finit par `<app-footer></app-footer>`
- ✅ Plus aucune mention de Dakar, Sénégal, +221, .sn
- ✅ Boutons utilisent routerLink (pas href)

## 🚀 APRÈS HARMONISATION

### Test
```bash
ng serve
```

### Vérification
- Aller sur chaque page
- Vérifier navbar identique partout
- Vérifier footer identique partout
- Vérifier +228 98337662 partout
- Tester navigation avec les boutons

## 📊 PROGRESSION

**Total** : 31 pages HTML  
**Terminé** : 6 pages (19%)  
**Restant** : 25 pages (81%)

**Estimation temps** : 
- Rapide (rechercher/remplacer) : ~30 minutes
- Manuel (page par page) : ~2-3 heures

---

**Dernière mise à jour** : 30 octobre 2025, 11:10 AM

**NOTE IMPORTANTE** : Les composants Navbar et Footer sont déjà créés et fonctionnels. Il suffit de les importer et les utiliser dans chaque page !
