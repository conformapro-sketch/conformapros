
# Plan de Correction: Modification des Textes Réglementaires depuis la Liste

## Problème Identifié

Lorsque l'utilisateur clique sur "Modifier" dans le menu d'actions, la navigation vers la page de détail se déclenche simultanément, empêchant l'ouverture du modal d'édition.

### Cause Technique

1. **BibliothequeDataGrid.tsx (ligne 229-230)** : La ligne du tableau a un `onClick={() => onView(row.original)}` 
2. **BibliothequeCardView.tsx (ligne 66)** : La carte a un `onClick={() => onView(texte)}`
3. **BibliothequeRowActionsMenu.tsx** : Le menu dropdown et ses éléments n'ont pas de `stopPropagation()`

Quand l'utilisateur clique sur le bouton "Modifier", l'événement remonte (bubble) jusqu'au conteneur parent (TableRow ou Card), déclenchant la navigation vers la page de détail.

### Comparaison avec le Code Fonctionnel

Dans `Clients.tsx` et `Sites.tsx`, le pattern correct est utilisé :
```typescript
<TableCell onClick={(e) => e.stopPropagation()}>
  <DropdownMenu>...</DropdownMenu>
</TableCell>
```

---

## Modifications Requises

### 1. BibliothequeDataGrid.tsx

Modifier la cellule des actions pour stopper la propagation :

```typescript
// Ligne 153-168 - Colonne actions
{
  id: "actions",
  size: 100,
  cell: ({ row }) => (
    <div onClick={(e) => e.stopPropagation()}>
      <BibliothequeRowActionsMenu
        texte={row.original}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
        onViewPdf={onViewPdf}
        onToggleFavorite={onToggleFavorite}
        isFavorite={false}
        canEdit={canEdit}
      />
    </div>
  ),
  enableSorting: false,
}
```

### 2. BibliothequeCardView.tsx

Envelopper le composant BibliothequeRowActionsMenu dans un conteneur avec stopPropagation :

```typescript
// Ligne 88-97
<div onClick={(e) => e.stopPropagation()}>
  <BibliothequeRowActionsMenu
    texte={texte}
    onView={onView}
    onEdit={onEdit}
    onDelete={onDelete}
    onViewPdf={onViewPdf}
    onToggleFavorite={onToggleFavorite}
    isFavorite={false}
    canEdit={canEdit}
  />
</div>
```

### 3. BibliothequeRowActionsMenu.tsx (Amélioration)

Ajouter stopPropagation sur le bouton déclencheur du dropdown pour une protection supplémentaire :

```typescript
<DropdownMenuTrigger asChild>
  <Button
    variant="ghost"
    size="sm"
    className="h-9 w-9 p-0 hover:bg-accent/10 data-[state=open]:bg-accent/10"
    disabled={isLoading}
    onClick={(e) => e.stopPropagation()}
  >
    <MoreVertical className="h-4 w-4" />
    <span className="sr-only">Ouvrir le menu</span>
  </Button>
</DropdownMenuTrigger>
```

---

## Fichiers à Modifier

| Fichier | Modification | Complexité |
|---------|--------------|------------|
| `src/components/bibliotheque/BibliothequeDataGrid.tsx` | Ajouter wrapper avec stopPropagation autour du menu dans la cellule actions | Basse |
| `src/components/bibliotheque/BibliothequeCardView.tsx` | Ajouter wrapper avec stopPropagation autour du menu | Basse |
| `src/components/bibliotheque/BibliothequeRowActionsMenu.tsx` | Ajouter stopPropagation sur le bouton trigger | Basse |

---

## Résumé des Changements

```text
┌────────────────────────────────────────────────────────────────┐
│                    FLUX CLICK CORRIGÉ                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  AVANT (Bug)                                                   │
│  ───────────                                                   │
│  Click "Modifier" → DropdownMenuItem.onClick()                 │
│                   → Event bubbles up                           │
│                   → TableRow/Card.onClick()                    │
│                   → navigate() → Page change                   │
│                   → Modal never opens                          │
│                                                                │
│  APRÈS (Fix)                                                   │
│  ──────────                                                    │
│  Click "Modifier" → DropdownMenuItem.onClick()                 │
│                   → Event bubbles up                           │
│                   → Wrapper div catches event                  │
│                   → e.stopPropagation()                        │
│                   → TableRow/Card.onClick() NOT called         │
│                   → Modal opens correctly                      │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Impact

Cette correction résout le bug où :
- Cliquer sur "Modifier" depuis la liste des textes réglementaires ne fonctionnait pas
- Cliquer sur "Supprimer" depuis la liste ne fonctionnait pas
- Cliquer sur "Voir PDF" depuis la liste ne fonctionnait pas
- Toutes les actions du menu contextuel étaient inaccessibles

Après la correction, toutes ces actions fonctionneront correctement sans déclencher la navigation vers la page de détail.
