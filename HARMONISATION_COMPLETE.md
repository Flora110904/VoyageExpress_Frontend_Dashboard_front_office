# 🎯 HARMONISATION COMPLÈTE - VoyageExpress

## 📊 Inventaire Complet : 31 Pages HTML

### ✅ Pages Déjà Unifiées (4/31)
- [x] pages/home/home.component.html
- [x] pages/about/about.html
- [x] pages/services/services.html
- [x] pages/contact/contact.html

### ⏳ Pages À Unifier (27/31)

#### Auth (2 pages) - SANS navbar/footer
- [ ] auth/login/login.component.html
- [ ] auth/register/register.component.html

#### Client (6 pages) - AVEC navbar/footer
- [x] client/historique/historique.html
- [ ] client/dashboard/dashboard.html
- [ ] client/recherche/recherche.html
- [ ] client/mes-reservations/mes-reservations.html
- [ ] client/profil/profil.html
- [ ] client/paiements/paiements.html

#### Compagnie Bus (5 pages) - AVEC navbar/footer
- [ ] compagnie-bus/statistiques/statistiques.html
- [ ] compagnie-bus/reservations/reservations.html
- [ ] compagnie-bus/itineraires/itineraires.html
- [ ] compagnie-bus/vehicules/vehicules.html
- [ ] compagnie-bus/compagnie-bus.html

#### Compagnie Vol (5 pages) - AVEC navbar/footer
- [ ] compagnie-vol/statistiques/statistiques.html
- [ ] compagnie-vol/reservations/reservations.html
- [ ] compagnie-vol/vols/vols.html
- [ ] compagnie-vol/avions/avions.html
- [ ] compagnie-vol/compagnie-vol.html

#### Établissement (5 pages) - AVEC navbar/footer
- [ ] etablisement/statistiques/statistiques.html
- [ ] etablisement/reservations/reservations.html
- [ ] etablisement/chambres/chambres.html
- [ ] etablisement/types-hebergement/types-hebergement.html
- [ ] etablisement/etablisement.html

#### Autres (4 pages)
- [ ] app.html
- [ ] client/client.html
- [ ] shared/components/navbar/navbar.component.html
- [ ] shared/components/footer/footer.component.html

## 🔧 Actions à Effectuer sur Chaque Page

### Pour TOUTES les pages (sauf Login/Register):

1. **Remplacer le navbar** :
   ```html
   <!-- Supprimer tout le code navbar existant -->
   <app-navbar></app-navbar>
   ```

2. **Ajouter le footer** :
   ```html
   <app-footer></app-footer>
   ```

3. **Corriger les infos** :
   - ❌ "Dakar" → ✅ "Lomé"
   - ❌ "Sénégal" → ✅ "Togo"
   - ❌ ".sn" → ✅ ".tg"
   - ❌ "+221" → ✅ "+228 98337662"

4. **Importer dans le .ts** :
   ```typescript
   import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
   import { FooterComponent } from '../../shared/components/footer/footer.component';
   
   @Component({
     imports: [CommonModule, RouterModule, NavbarComponent, FooterComponent],
   })
   ```

### Pour Login/Register UNIQUEMENT:

- ❌ PAS de navbar
- ❌ PAS de footer
- ✅ Plein écran uniquement

## 📝 Informations Standard

### Topbar
```
VoyageExpress | +228 98337662 | Lomé, Togo | Réseaux sociaux
```

### Navigation
```
Accueil | À Propos | Services | Contact | Se Connecter | S'Inscrire
```

### Footer
```
VoyageExpress | Liens Rapides | Nos Services | Contact
© 2025 VoyageExpress. Tous droits réservés.
```

## ✅ Critères de Validation

Chaque page DOIT avoir :
- ✅ Navbar unifié (sauf Login/Register)
- ✅ Footer unifié (sauf Login/Register)
- ✅ +228 98337662
- ✅ Lomé, Togo
- ✅ contact@voyageexpress.tg
- ✅ 100% Français
- ✅ Palette de couleurs cohérente

## 🚀 Progression

**Total**: 31 pages  
**Unifiées**: 5 pages (16%)  
**Restantes**: 26 pages (84%)

---
**Dernière mise à jour**: 30 octobre 2025, 11:02 AM
