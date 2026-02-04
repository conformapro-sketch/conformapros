
# Plan: UI Responsive - Adaptation pour Desktop, Tablette et Mobile

## Analyse de l'existant

### Points forts actuels
- Le projet utilise déjà Tailwind CSS avec des breakpoints standards (sm:640px, md:768px, lg:1024px, xl:1280px)
- La sidebar utilise un Sheet/drawer sur mobile (< 768px) via `useIsMobile`
- Certaines pages comme Dashboard et BibliothequeTextes ont déjà des grilles responsives
- TopNavBar adapte son contenu selon la taille d'écran

### Problèmes identifiés

1. **Sidebar (AppSidebar.tsx)**
   - Le bouton flottant de réouverture (bottom-4 left-4) peut chevaucher le contenu sur mobile
   - En mode collapsed, les HoverCards ne sont pas adaptés au tactile
   - La largeur fixe w-64 (256px) prend trop de place sur tablette

2. **TopNavBar (TopNavBar.tsx)**
   - min-w-[170px] est trop rigide pour petits écrans
   - Le SiteSwitcher peut déborder sur mobile
   - La barre de recherche masquée sur mobile mais le dialog n'est pas optimisé

3. **Layout principal (Layout.tsx)**
   - Le padding main (px-4 sm:px-6 lg:px-8) est correct mais pt-20 pourrait être ajusté
   - Pas de gestion de la hauteur sur tablette

4. **Composants de pages**
   - StatCard: Le texte value (text-3xl) peut déborder sur très petit écran
   - BibliothequeDataGrid: Table non responsive (hidden lg:block mais les cards mobiles pourraient être améliorées)
   - UserProfileMenu: Le nom utilisateur n'apparaît pas sur tablette (hidden sm:flex devrait être sm:hidden md:flex)

5. **Composants de navigation**
   - SiteSwitcher: hidden sm:inline sur le nom complet mais le bouton peut être trop grand
   - NotificationsButton: Pas de problème majeur
   - SearchBar: Le dialogue mobile fonctionne mais pourrait être en plein écran

---

## Corrections à implémenter

### 1. Sidebar Responsive (AppSidebar.tsx)

**Modifications:**
- Ajuster le bouton flottant pour qu'il soit moins intrusif sur mobile (plus petit, position ajustée)
- Sur tablette (md), permettre un mode semi-collapsed par défaut
- Améliorer le touch target des items de menu

```text
Changements:
- Bouton flottant: h-10 w-10 (au lieu de h-12 w-12), bottom-6 left-2
- Ajouter des classes pour améliorer le touch: min-h-[44px] sur les items
- Pour tablette: le Sheet mobile devrait s'activer à md au lieu de juste mobile
```

### 2. TopNavBar Responsive (TopNavBar.tsx)

**Modifications:**
- Réduire min-w sur le conteneur gauche pour petits écrans
- Masquer le logo ConformaPro sur très petit écran (< 400px) pour plus d'espace
- Améliorer l'espacement des boutons d'action

```text
Changements:
- min-w-[170px] → min-w-0 sm:min-w-[140px] md:min-w-[170px]
- Logo: hidden xs:block (ou min-w-[100px])
- Client logo: hidden lg:flex (au lieu de md:flex)
- Gap: gap-1 xs:gap-2 md:gap-3
```

### 3. Layout Principal (Layout.tsx)

**Modifications:**
- Ajuster le padding pour mieux utiliser l'espace sur tablette
- Ajouter une gestion safe-area pour les appareils avec encoche

```text
Changements:
- main: px-3 sm:px-4 md:px-6 lg:px-8
- Ajouter env(safe-area-inset-*) support dans CSS
```

### 4. StatCard Responsive (StatCard.tsx)

**Modifications:**
- Adapter la taille du texte value pour petits écrans
- Réduire le padding sur mobile

```text
Changements:
- value: text-2xl sm:text-3xl
- CardHeader padding ajusté
- Icon: h-4 w-4 sm:h-5 sm:w-5
```

### 5. UserProfileMenu Responsive (UserProfileMenu.tsx)

**Modifications:**
- Améliorer l'affichage du nom sur tablette
- Dropdown plus large sur mobile pour meilleure lisibilité

```text
Changements:
- Nom: hidden md:flex (tablette montre, phone cache)
- Dropdown: w-[280px] sm:w-56 (plus large sur mobile)
```

### 6. SiteSwitcher Responsive (SiteSwitcher.tsx)

**Modifications:**
- Réduire la taille sur mobile
- Utiliser seulement le code site sur petit écran

```text
Changements:
- Button hauteur: h-8 sm:h-9
- Texte: truncate avec max-w adaptatif
- Popover: w-[260px] sm:w-[280px]
```

### 7. SearchBar Responsive (SearchBar.tsx)

**Modifications:**
- Dialog mobile en quasi plein écran
- Meilleur focus management

```text
Changements:
- DialogContent: top-4 sm:top-1/2 pour être plus haut sur mobile
- Input: text-base pour éviter le zoom iOS
```

### 8. BibliothequeDataGrid Responsive (BibliothequeDataGrid.tsx)

**Modifications:**
- Améliorer l'affichage horizontal avec scroll
- Cards mobiles plus compactes

```text
Changements:
- Ajouter horizontal scroll indicator
- Breakpoint table: hidden md:block (tablette voit la table)
- Cards: spacing réduit
```

### 9. CSS Global (index.css)

**Modifications:**
- Ajouter des utilitaires pour le responsive
- Safe area padding

```css
@layer utilities {
  .safe-area-pb {
    padding-bottom: env(safe-area-inset-bottom);
  }
  .safe-area-pt {
    padding-top: env(safe-area-inset-top);
  }
}

/* Prevent iOS zoom on form inputs */
@media screen and (max-width: 768px) {
  input, select, textarea {
    font-size: 16px !important;
  }
}
```

### 10. Pages avec Grilles (Dashboard.tsx, StaffDashboard.tsx)

**Modifications:**
- Ajuster les grilles pour tablette
- Meilleur espacement

```text
Changements:
- grid-cols-2 lg:grid-cols-4 → grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
- gap-4 sm:gap-6
```

---

## Fichiers à modifier

| # | Fichier | Type de modification |
|---|---------|---------------------|
| 1 | `src/components/AppSidebar.tsx` | Bouton flottant, touch targets |
| 2 | `src/components/TopNavBar.tsx` | Min-width, espacement, visibilité |
| 3 | `src/components/Layout.tsx` | Padding responsive |
| 4 | `src/components/StatCard.tsx` | Taille texte, padding |
| 5 | `src/components/navigation/UserProfileMenu.tsx` | Affichage nom tablette |
| 6 | `src/components/navigation/SiteSwitcher.tsx` | Taille bouton, texte |
| 7 | `src/components/navigation/SearchBar.tsx` | Dialog mobile |
| 8 | `src/components/bibliotheque/BibliothequeDataGrid.tsx` | Scroll horizontal, breakpoints |
| 9 | `src/index.css` | Safe area, input zoom fix |
| 10 | `src/pages/Dashboard.tsx` | Grilles responsives |
| 11 | `src/pages/settings/StaffDashboard.tsx` | Grilles responsives |
| 12 | `src/hooks/use-mobile.tsx` | Optionnel: ajouter useIsTablet |

---

## Priorité d'implémentation

**Phase 1 - Navigation (critique)**
1. AppSidebar - Bouton flottant moins intrusif
2. TopNavBar - Espacement et visibilité
3. Layout - Padding global

**Phase 2 - Composants clés**
4. StatCard - Taille responsive
5. UserProfileMenu - Affichage tablette
6. SiteSwitcher - Taille adaptative

**Phase 3 - Contenus**
7. SearchBar - Dialog mobile
8. BibliothequeDataGrid - Table scroll
9. CSS Global - Utilitaires

**Phase 4 - Pages**
10. Dashboard - Grilles
11. StaffDashboard - Grilles

---

## Tests de validation

Après implémentation, tester sur:

1. **Mobile (< 640px)**: iPhone SE, iPhone 14
   - Sidebar en Sheet fonctionne
   - TopNavBar compact, boutons accessibles
   - Cards en colonne unique

2. **Tablette (768px - 1024px)**: iPad Mini, iPad
   - Sidebar peut être collapsed
   - TopNavBar montre les éléments essentiels
   - Grilles 2 colonnes

3. **Desktop (> 1024px)**: MacBook, écran large
   - Sidebar expanded par défaut
   - Tous éléments visibles
   - Grilles 4 colonnes

4. **Orientation**:
   - Portrait et paysage fonctionnent
   - Pas de débordement horizontal

5. **Accessibilité tactile**:
   - Touch targets minimum 44x44px
   - Espacement suffisant entre éléments cliquables
