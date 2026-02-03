
# Plan de Correction: Rechargement de Pages et Fermeture de Formulaires

## Analyse Approfondie du Problème

### 1. Cause Principale: Configuration de React Query

Le fichier `src/lib/query-config.ts` contient une configuration qui provoque ce comportement:

```typescript
// Ligne 30
refetchOnMount: false,
```

**Problème**: Quand `refetchOnMount: false` est combiné avec des états locaux (`useState`) dans les composants de pages, le comportement suivant se produit:

1. L'utilisateur ouvre une page → le composant est monté → les données sont chargées
2. L'utilisateur ouvre une modal (état local: `showArticleModal = true`)
3. L'utilisateur navigue vers une autre page → le composant est **démonté** → les états locaux sont **perdus**
4. L'utilisateur revient → le composant est **remonté** → les états sont réinitialisés (`showArticleModal = false`)
5. Les données sont récupérées du cache (pas de refetch) mais **l'état UI est perdu**

### 2. Problèmes Spécifiques Identifiés

| Fichier | Problème |
|---------|----------|
| `BibliothequeTexteDetail.tsx` | 15+ états locaux (`useState`) perdus à chaque navigation |
| `BibliothequeReglementaire.tsx` | États de filtres, pagination, modals perdus |
| `GestionTexteDetail.tsx` | États de modals articles/versions perdus |
| Toutes les pages avec modals | L'état ouvert/fermé des modals n'est pas persisté |

### 3. Flux du Problème

```text
┌─────────────────────────────────────────────────────────────────┐
│                    FLUX ACTUEL (DÉFAILLANT)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Utilisateur sur /bibliotheque/textes/123                    │
│     └── useState créés: showArticleModal=false, etc.            │
│                                                                 │
│  2. Utilisateur clique "Modifier Article"                       │
│     └── setShowEditArticleModal(true)                           │
│     └── setEditingArticle({...})                                │
│     └── Modal s'ouvre                                           │
│                                                                 │
│  3. Utilisateur navigue vers /bibliotheque (sidebar)            │
│     └── BibliothequeTexteDetail.tsx est DÉMONTÉ                 │
│     └── TOUS les useState sont PERDUS                           │
│                                                                 │
│  4. Utilisateur retourne à /bibliotheque/textes/123             │
│     └── BibliothequeTexteDetail.tsx est REMONTÉ                 │
│     └── useState réinitialisés: showArticleModal=false          │
│     └── React Query: données en cache, pas de refetch           │
│     └── Résultat: données présentes mais modal fermée           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Solutions Proposées

### Solution 1: Activer `refetchOnMount` (Recommandé)

Modifier `src/lib/query-config.ts` pour refetch les données au remontage:

```typescript
// Ligne 30
refetchOnMount: true,  // ← Changer de false à true
```

**Avantage**: Garantit que les données sont fraîches quand l'utilisateur revient
**Inconvénient**: Plus de requêtes réseau (mais acceptable avec staleTime: 5min)

### Solution 2: Utiliser les Query Params pour l'état UI (Avancé)

Persister l'état des modals dans l'URL:
- `/bibliotheque/textes/123?edit=article-id`
- `/bibliotheque/textes/123?modal=add-article`

### Solution 3: Utiliser un State Manager Global (Avancé)

Persister l'état UI dans un store global (Zustand, Jotai) ou dans le cache React Query.

---

## Plan de Correction

### Phase 1: Correction Immédiate (Priorité HAUTE)

**Modifier `src/lib/query-config.ts`**:

```typescript
export const queryConfig = {
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 3,
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,
      refetchOnMount: true,  // ← CHANGEMENT CRITIQUE
      suspense: false,
    },
    // ...
  },
};
```

### Phase 2: Amélioration de l'Expérience Utilisateur (Priorité MOYENNE)

**Ajouter `placeholderData` aux requêtes principales pour éviter le flash de chargement:**

```typescript
// BibliothequeTexteDetail.tsx
const { data: texte, isLoading } = useQuery({
  queryKey: ["texte-detail", id],
  queryFn: () => textesQueries.getById(id!),
  enabled: !!id,
  placeholderData: (previousData) => previousData, // Garde les données précédentes
});
```

### Phase 3: Persistance d'État pour les Modals Critiques (Priorité BASSE)

Pour les modals d'édition, ajouter la gestion via URL:

```typescript
// Dans BibliothequeReglementaire.tsx
const [searchParams, setSearchParams] = useSearchParams();
const editingTexteId = searchParams.get('edit');

const handleEdit = (texte: TexteReglementaire) => {
  setSearchParams({ edit: texte.id });
};

const handleCloseModal = () => {
  setSearchParams({});
};

// La modal s'ouvre si editingTexteId existe
<TexteFormModal
  open={!!editingTexteId}
  onOpenChange={(open) => !open && handleCloseModal()}
  texteId={editingTexteId}
/>
```

---

## Fichiers à Modifier

| # | Fichier | Modification | Complexité |
|---|---------|--------------|------------|
| 1 | `src/lib/query-config.ts` | Changer `refetchOnMount: false` → `true` | Basse |
| 2 | `src/pages/BibliothequeTexteDetail.tsx` | Ajouter `placeholderData` aux queries principales | Basse |
| 3 | `src/pages/BibliothequeReglementaire.tsx` | Ajouter `placeholderData` aux queries principales | Basse |

---

## Impact des Changements

### Avant la Correction

| Action | Résultat |
|--------|----------|
| Navigation aller-retour | Page semble "recharger" (états UI perdus) |
| Ouverture modal puis navigation | Modal fermée au retour |
| Filtres appliqués puis navigation | Filtres perdus au retour |

### Après la Correction

| Action | Résultat |
|--------|----------|
| Navigation aller-retour | Données refetchées mais affichage fluide avec placeholderData |
| Ouverture modal puis navigation | Modal fermée (comportement normal car état local) |
| Filtres appliqués puis navigation | Filtres perdus (nécessite Phase 3 pour persister) |

---

## Considérations Techniques

### Pourquoi `refetchOnMount: true` est la bonne solution

1. **Cohérence des données**: Garantit que l'utilisateur voit toujours les données à jour
2. **Avec `staleTime: 5min`**: Les refetch ne sont effectués que si les données sont "stale"
3. **Cache toujours actif**: Les données en cache sont affichées immédiatement, le refetch se fait en arrière-plan

### Performance

- **Requêtes supplémentaires**: Oui, mais uniquement si staleTime est dépassé
- **Impact réseau**: Minimal car la plupart des retours se font dans les 5 minutes
- **Expérience utilisateur**: Améliorée car les données sont toujours cohérentes

---

## Tests de Validation

- [ ] Naviguer de la liste des textes vers un détail, puis retour → page ne "recharge" pas visuellement
- [ ] Ouvrir une modal, naviguer ailleurs, revenir → données présentes (modal fermée = normal)
- [ ] Appliquer des filtres, naviguer ailleurs, revenir → filtres réinitialisés (comportement attendu sans Phase 3)
- [ ] Vérifier qu'aucune erreur console n'apparaît lors de la navigation
