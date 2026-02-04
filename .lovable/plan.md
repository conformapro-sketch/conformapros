

# Plan: Correction UI Mobile-Friendly - Phase 2

## Contexte

Après la première phase de corrections responsive, plusieurs composants de la page `/bibliotheque/articles` et d'autres pages similaires restent problématiques sur mobile. L'analyse révèle des problèmes spécifiques dans:

1. **ArticlesDataGrid** - Table non-responsive, pas de mode carte mobile
2. **ArticlesFilters** - Filtres avec `min-w` fixes qui débordent sur mobile
3. **BibliothequeArticles** - Container sans padding mobile adapté
4. **PaginationControls** - Texte et contrôles trop denses sur mobile
5. **ArticlesStatsCards** - Déjà responsive mais peut être amélioré
6. **BibliothequeHeader** - Layout flex qui peut casser sur très petit écran

---

## Corrections à implémenter

### 1. ArticlesDataGrid.tsx - Mode hybride table/cartes

**Problème actuel:** 
- Table classique sans scroll horizontal ni mode carte
- Sur mobile, les colonnes se compressent et deviennent illisibles
- Pas de breakpoint pour basculer en mode carte

**Solution:**
- Ajouter un wrapper avec scroll horizontal + indicateur visuel pour la table (desktop/tablet)
- Créer un mode carte mobile (< 768px) similaire à BibliothequeTextes
- Masquer la table sur mobile avec `hidden md:block`
- Afficher les cartes sur mobile avec `block md:hidden`

**Changements:**
```text
Structure:
- Wrapper: overflow-x-auto scrollbar-thin
- Table: hidden md:block, min-w-[900px]
- Mobile cards: block md:hidden, cards compactes avec infos essentielles
```

### 2. ArticlesFilters.tsx - Grille responsive

**Problème actuel:**
- `min-w-[150px]`, `min-w-[180px]`, `min-w-[200px]` fixes
- Sur mobile, les Select débordent ou s'empilent mal
- Checkboxes en ligne, peuvent casser sur petit écran

**Solution:**
- Remplacer les min-w fixes par une grille responsive
- grid-cols-1 (mobile) → grid-cols-2 (sm) → grid-cols-3 (md) → auto-flow (lg)
- Checkboxes en colonne sur mobile, ligne sur sm+

**Changements:**
```text
- Conteneur filtres: grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:flex lg:flex-wrap
- Supprimer min-w fixes, utiliser w-full dans la grille
- Checkboxes: flex flex-col sm:flex-row gap-3 sm:gap-6
```

### 3. BibliothequeArticles.tsx - Padding et espacement

**Problème actuel:**
- `container mx-auto py-6` mais pas de padding horizontal explicite
- Sur mobile, le contenu peut toucher les bords

**Solution:**
- Ajouter padding horizontal responsive
- Réduire les gaps sur mobile

**Changements:**
```text
- Container: px-3 sm:px-4 md:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6
- Texte filter badge: flex-col sm:flex-row, texte plus compact
```

### 4. PaginationControls.tsx - Compact mobile

**Problème actuel:**
- Texte "Lignes par page" prend de la place
- Navigation sur 2 lignes mais dense

**Solution:**
- Masquer le label "Lignes par page" sur mobile, garder le Select
- Simplifier l'affichage du total sur mobile
- Boutons de navigation plus grands (touch-friendly)

**Changements:**
```text
- Label "Lignes par page": hidden sm:inline
- Total: "X éléments" sur mobile, version complète sur sm+
- Boutons: h-9 w-9 (touch target 44px)
```

### 5. ArticlesStatsCards.tsx - Amélioration mineure

**Problème actuel:**
- Déjà `grid-cols-2 md:grid-cols-4`
- Peut réduire encore le padding sur très petit écran

**Solution:**
- Padding cards: p-3 sm:p-4
- Taille texte valeur: text-xl sm:text-2xl

### 6. BibliothequeHeader.tsx - Flexbox responsive

**Problème actuel:**
- `flex items-center justify-between` peut casser avec des actions longues

**Solution:**
- Passer en flex-col sur mobile pour le header avec actions
- Titre plus petit sur mobile

**Changements:**
```text
- Header: flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3
- Titre: text-xl sm:text-2xl md:text-3xl
- Icon container: p-2 sm:p-3, icon h-5 w-5 sm:h-6 sm:w-6
```

### 7. ArticleQuickViewModal.tsx - Sheet mobile-friendly

**Problème actuel:**
- Sheet max-width fixe peut être trop large sur tablette
- Contenu peut être dense

**Solution:**
- Width: w-full sm:max-w-lg md:max-w-2xl
- Grid infos: grid-cols-1 sm:grid-cols-2

---

## Fichiers à modifier

| # | Fichier | Modifications |
|---|---------|---------------|
| 1 | `src/components/bibliotheque/ArticlesDataGrid.tsx` | Mode carte mobile + scroll horizontal table |
| 2 | `src/components/bibliotheque/ArticlesFilters.tsx` | Grille responsive, suppression min-w |
| 3 | `src/pages/BibliothequeArticles.tsx` | Padding horizontal responsive |
| 4 | `src/components/shared/PaginationControls.tsx` | Compactage mobile |
| 5 | `src/components/bibliotheque/ArticlesStatsCards.tsx` | Padding/typo ajustés |
| 6 | `src/components/bibliotheque/BibliothequeHeader.tsx` | Flexbox responsive |
| 7 | `src/components/bibliotheque/ArticleQuickViewModal.tsx` | Sheet width responsive |

---

## Détail technique des modifications

### ArticlesDataGrid.tsx

**Nouvelle structure:**
```tsx
// Desktop/Tablet: Table avec scroll
<div className="hidden md:block rounded-md border overflow-x-auto scrollbar-thin">
  <Table className="min-w-[900px]">
    {/* ... table content ... */}
  </Table>
</div>

// Mobile: Cartes
<div className="block md:hidden space-y-3">
  {articles.map((article) => (
    <MobileArticleCard key={article.id} article={article} />
  ))}
</div>
```

**Carte mobile (nouveau composant inline):**
```tsx
<div className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
  <div className="flex items-start justify-between gap-2 mb-2">
    <span className="font-semibold">Art. {article.numero}</span>
    <div className="flex gap-1">
      {badges: type, statut}
    </div>
  </div>
  <p className="text-sm font-medium line-clamp-2">{article.titre}</p>
  {article.texte && (
    <p className="text-xs text-muted-foreground mt-1 truncate">
      {article.texte.reference}
    </p>
  )}
  <div className="flex justify-end mt-2">
    {action buttons}
  </div>
</div>
```

### ArticlesFilters.tsx

```tsx
<div className="space-y-4">
  {/* Main filters grid */}
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
    <div className="flex flex-col gap-1.5">
      {/* Select sans min-w, utilise w-full implicite */}
    </div>
    {/* ... autres filtres ... */}
  </div>

  {/* Checkboxes */}
  <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
    {/* checkboxes */}
  </div>
</div>
```

### PaginationControls.tsx

```tsx
<div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 px-2 py-3">
  {/* Total - compact sur mobile */}
  <div className="flex items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
    <span className="font-medium">
      {totalItems} élément{totalItems > 1 ? "s" : ""}
    </span>
    <span className="hidden sm:inline">
      Affichage de {startItem} à {endItem}
    </span>
  </div>

  {/* Controls */}
  <div className="flex items-center gap-3 sm:gap-4">
    {/* Page size - label masqué sur mobile */}
    <div className="flex items-center gap-2">
      <span className="hidden sm:inline text-sm text-muted-foreground">
        Lignes par page :
      </span>
      <Select ...>
        <SelectTrigger className="h-9 w-16 sm:w-20">
          ...
        </SelectTrigger>
      </Select>
    </div>

    {/* Navigation - boutons plus grands */}
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {currentPage}/{totalPages}
      </span>
      <Button size="sm" className="h-9 w-9">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button size="sm" className="h-9 w-9">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  </div>
</div>
```

---

## Résumé des breakpoints utilisés

| Breakpoint | Largeur | Comportement |
|------------|---------|--------------|
| Base | < 640px | Cartes mobiles, grille 1 col, labels masqués |
| sm | ≥ 640px | Grille 2 cols filtres, labels visibles |
| md | ≥ 768px | Table visible, grille 3 cols filtres |
| lg | ≥ 1024px | Layout complet, tous filtres en ligne |

---

## Tests de validation

Après implémentation:

1. **Mobile (iPhone SE/14):**
   - Cartes articles lisibles et cliquables
   - Filtres empilés verticalement, aucun débordement
   - Pagination compacte, boutons touch-friendly

2. **Tablette (iPad):**
   - Table avec scroll horizontal si nécessaire
   - Filtres en grille 2-3 colonnes
   - Sheet modal à bonne largeur

3. **Desktop:**
   - Table complète visible
   - Tous les filtres sur une ligne
   - Aucun changement de comportement

