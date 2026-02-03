

# Plan: Modification de la Navigation des Textes Réglementaires

## Objectif

1. **Supprimer** la fonctionnalité d'export de la page `/bibliotheque/textes`
2. **Modifier** le comportement du clic sur un texte réglementaire:
   - Au lieu d'ouvrir une page de détail (`/bibliotheque/textes/:id`)
   - Naviguer vers `/bibliotheque/articles?texte=<texte_id>` avec le filtre pré-appliqué

---

## Modifications à Effectuer

### 1. Supprimer l'Export - Page Textes

**Fichier: `src/pages/BibliothequeReglementaire.tsx`**

Retirer:
- L'import du composant `ExportButton`
- L'import de l'icône `FileDown` (non utilisée après suppression)
- Le composant `<ExportButton>` dans le header (lignes 251-263)

```typescript
// AVANT
import { ExportButton } from "@/components/shared/ExportButton";

// APRÈS
// (import supprimé)
```

### 2. Modifier le Handler de Clic

**Fichier: `src/pages/BibliothequeReglementaire.tsx`**

Modifier la fonction `handleView` pour naviguer vers la page articles avec un filtre:

```typescript
// AVANT
const handleView = (texte: any) => {
  navigate(`/bibliotheque/textes/${texte.id}`);
};

// APRÈS
const handleView = (texte: any) => {
  // Navigate to articles page with texte filter
  navigate(`/bibliotheque/articles?texte=${texte.id}`);
};
```

### 3. Ajouter le Filtre par Texte - Requêtes Articles

**Fichier: `src/lib/articles-queries.ts`**

Ajouter le support du filtre `texteId` dans l'interface et la requête:

```typescript
// Interface - ajouter
export interface ArticleFilters {
  // ... existing filters
  texteId?: string;  // ← NOUVEAU: Filtre par ID du texte parent
}

// Dans getAll() - ajouter le filtre
if (filters?.texteId && filters.texteId !== "all") {
  query = query.eq("texte_id", filters.texteId);
}
```

### 4. Lire le Paramètre URL - Page Articles

**Fichier: `src/pages/BibliothequeArticles.tsx`**

Lire le paramètre `texte` de l'URL et l'utiliser comme filtre:

```typescript
import { useSearchParams } from "react-router-dom";

// Dans le composant
const [searchParams, setSearchParams] = useSearchParams();
const texteIdFromUrl = searchParams.get("texte");

// Initialiser le state avec la valeur de l'URL
const [texteFilter, setTexteFilter] = useState(texteIdFromUrl || "all");

// Utiliser dans la requête
const { data: articlesResult } = useQuery({
  queryKey: [
    "articles-list",
    // ... other keys
    texteFilter,  // ← ajouter
  ],
  queryFn: () =>
    articlesListQueries.getAll({
      // ... other filters
      texteId: texteFilter !== "all" ? texteFilter : undefined,
    }),
});
```

### 5. Afficher le Filtre Actif par Texte

**Fichier: `src/pages/BibliothequeArticles.tsx`**

Afficher un badge/chip quand le filtre par texte est actif:

```typescript
// Charger les infos du texte pour affichage
const { data: texteInfo } = useQuery({
  queryKey: ["texte-info", texteFilter],
  queryFn: async () => {
    if (!texteFilter || texteFilter === "all") return null;
    const { data } = await supabase
      .from("textes_reglementaires")
      .select("id, reference, titre")
      .eq("id", texteFilter)
      .single();
    return data;
  },
  enabled: !!texteFilter && texteFilter !== "all",
});

// Dans le JSX - afficher le filtre actif
{texteInfo && (
  <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-4 py-2">
    <FileText className="h-4 w-4 text-primary" />
    <span className="text-sm">
      Articles du texte: <strong>{texteInfo.reference}</strong>
    </span>
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        setTexteFilter("all");
        setSearchParams({});
      }}
    >
      <X className="h-4 w-4" />
    </Button>
  </div>
)}
```

### 6. Mettre à Jour l'Action Menu

**Fichier: `src/components/bibliotheque/BibliothequeRowActionsMenu.tsx`**

Modifier le libellé du bouton "Voir les détails" pour refléter la nouvelle action:

```typescript
// AVANT
<DropdownMenuItem onClick={() => onView(texte)}>
  <Eye className="h-4 w-4 mr-2" />
  Voir les détails
</DropdownMenuItem>

// APRÈS
<DropdownMenuItem onClick={() => onView(texte)}>
  <FileText className="h-4 w-4 mr-2" />
  Voir les articles
</DropdownMenuItem>
```

---

## Résumé des Fichiers à Modifier

| # | Fichier | Modifications |
|---|---------|---------------|
| 1 | `src/pages/BibliothequeReglementaire.tsx` | Supprimer ExportButton, modifier handleView |
| 2 | `src/lib/articles-queries.ts` | Ajouter filtre `texteId` |
| 3 | `src/pages/BibliothequeArticles.tsx` | Lire URL param, afficher filtre actif |
| 4 | `src/components/bibliotheque/BibliothequeRowActionsMenu.tsx` | Modifier libellé action |
| 5 | `src/components/bibliotheque/BibliothequeDataGrid.tsx` | (optionnel) Modifier le tooltip |
| 6 | `src/components/bibliotheque/BibliothequeCardView.tsx` | (aucune modification nécessaire - utilise déjà onView) |

---

## Flux Utilisateur Après Modification

```text
Page /bibliotheque/textes
        │
        ▼
┌───────────────────────────────┐
│  Liste des textes             │
│  ┌─────────────────────────┐  │
│  │ Décret n°2024-123       │  │
│  │ [Clic sur la ligne]     │◄─┼── L'utilisateur clique
│  └─────────────────────────┘  │
└───────────────────────────────┘
        │
        ▼ navigate("/bibliotheque/articles?texte=uuid")
        │
┌───────────────────────────────┐
│  Page /bibliotheque/articles  │
│                               │
│  ┌─────────────────────────┐  │
│  │ Articles du texte:      │  │
│  │ Décret n°2024-123  [X]  │◄─┼── Badge filtre actif
│  └─────────────────────────┘  │
│                               │
│  Article 1 - Champ d'app...   │
│  Article 2 - Obligations...   │
│  Article 3 - ...              │
└───────────────────────────────┘
```

---

## Tests de Validation

1. **Export supprimé**: Vérifier que le bouton "Exporter" n'apparaît plus dans le header de la page textes
2. **Navigation**: Cliquer sur un texte doit naviguer vers `/bibliotheque/articles?texte=<id>`
3. **Filtre pré-appliqué**: La page articles doit afficher uniquement les articles du texte sélectionné
4. **Badge visible**: Un badge indiquant le texte filtré doit apparaître
5. **Bouton X**: Cliquer sur le X du badge doit supprimer le filtre et afficher tous les articles
6. **URL persistante**: Rafraîchir la page doit conserver le filtre (URL param)

