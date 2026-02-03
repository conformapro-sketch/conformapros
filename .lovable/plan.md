
# Plan d'Amélioration Global du Module Bibliothèque Réglementaire

## 1. Analyse des Problèmes Identifiés

### 1.1 Problème de Duplication des Sous-Domaines dans l'UI

**Cause Racine:** Il existe **deux définitions différentes** de `sousDomainesQueries` dans le code:

| Fichier | Localisation | Comportement |
|---------|--------------|--------------|
| `src/lib/textes-queries.ts` | Lignes 43-57 | **Sans filtre `actif`** - retourne TOUS les sous-domaines |
| `src/lib/actes-queries.ts` | Lignes 398-453 | **Avec filtre `actif=true`** - retourne uniquement les actifs |

Quand un composant importe `sousDomainesQueries` depuis `textes-queries.ts` (ex: `ArticleSousDomainesSelector.tsx`), il obtient tous les sous-domaines **y compris les inactifs**, ce qui peut créer des entrées "en double" dans l'interface si des sous-domaines ont été désactivés plutôt que supprimés.

**Base de données vérifiée:** Aucun doublon réel dans `sous_domaines_application` (les libellés sont uniques). Le problème est causé par l'absence de filtre `actif=true` dans certaines requêtes.

### 1.2 Incohérences d'Architecture de Requêtes

```text
┌─────────────────────────────────────────────────────────────────┐
│        DUPLICATION DE CODE DANS LES FICHIERS QUERIES            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  textes-queries.ts                                              │
│  └── sousDomainesQueries.getActive() ← SANS filtre actif       │
│  └── domainesQueries.getActive()                                │
│                                                                 │
│  actes-queries.ts                                               │
│  └── sousDomainesQueries.getActive() ← AVEC filtre actif       │
│  └── sousDomainesQueries.getByDomaineId()                       │
│  └── domainesQueries.getActive()                                │
│                                                                 │
│  domaines-queries.ts                                            │
│  └── fetchSousDomaines()                                        │
│  └── fetchSousDomainesByDomaine()                               │
│                                                                 │
│  bibliotheque-queries.ts                                        │
│  └── Pas de sous-domaines queries                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Recherche Avancée: Limitations

| Limitation | Impact |
|------------|--------|
| Recherche mots-clés côté client (après fetch) | Performance dégradée sur gros volumes |
| Pas de recherche full-text PostgreSQL | Pas de ranking par pertinence |
| Pas de tokenization | "équipement protection" ne trouve pas "équipements de protection" |
| Année extraite des résultats filtrés | Pas d'années disponibles avant la première recherche |

### 1.4 Opportunités d'Amélioration UI/UX

| Zone | Problème Actuel | Amélioration Proposée |
|------|-----------------|----------------------|
| DataGrid | Pas de colonne statut | Ajouter badge statut (en_vigueur/modifié/abrogé) |
| Filtres | Années extraites des résultats | Pré-charger les années disponibles |
| Recherche | Historique local seulement | Suggestions auto-complétion |
| Mobile | Basculement card view forcé | Optimiser l'affichage responsive |
| Navigation | Pas de breadcrumb cohérent | Ajouter fil d'Ariane |
| Empty State | Générique | Messages contextuels selon les filtres |
| Export | Non visible | Ajouter bouton export CSV/PDF |
| Pagination | Basique | Afficher "sélecteur de page size" |

---

## 2. Plan de Corrections

### Phase 1: Correction des Duplications (Priorité CRITIQUE)

#### 2.1 Unifier les requêtes sous-domaines

**Fichier: `src/lib/textes-queries.ts`**

```typescript
// AVANT (ligne 43-56)
export const sousDomainesQueries = {
  async getActive(domaineId?: string) {
    let query = supabase
      .from("sous_domaines_application")
      .select("*");
    // ... PAS de filtre actif!
  }
};

// APRÈS
export const sousDomainesQueries = {
  async getActive(domaineId?: string) {
    let query = supabase
      .from("sous_domaines_application")
      .select("*, domaine:domaines_reglementaires(id, libelle, code)")
      .eq("actif", true)           // ← AJOUT CRITIQUE
      .is("deleted_at", null);     // ← AJOUT CRITIQUE
    
    if (domaineId) {
      query = query.eq("domaine_id", domaineId);
    }
    
    const { data, error } = await query.order("ordre").order("libelle");
    if (error) throw error;
    return data || [];
  },
};
```

#### 2.2 Consolider les sources de requêtes

Supprimer les exports dupliqués et créer un fichier unique:

**Créer: `src/lib/regulatory-domains-queries.ts`**

Ce fichier centralisera toutes les requêtes domaines/sous-domaines avec:
- `domainesQueries.getAll()` - Tous les domaines
- `domainesQueries.getActive()` - Domaines actifs uniquement
- `sousDomainesQueries.getAll()` - Tous les sous-domaines
- `sousDomainesQueries.getActive()` - Sous-domaines actifs
- `sousDomainesQueries.getByDomaineId()` - Filtrés par domaine parent

### Phase 2: Amélioration de la Recherche (Priorité HAUTE)

#### 2.3 Améliorer la recherche par mots-clés

**Fichier: `src/lib/textes-queries.ts` - smartSearch**

```typescript
// Améliorer la recherche avec tokenization basique
if (searchTerm) {
  // Découper en mots et créer une recherche OR
  const words = searchTerm.trim().split(/\s+/).filter(w => w.length >= 2);
  const searchConditions = words.map(word => 
    `titre.ilike.%${word}%,reference.ilike.%${word}%,autorite_emettrice.ilike.%${word}%`
  ).join(',');
  
  textesQuery = textesQuery.or(searchConditions);
}
```

#### 2.4 Pré-charger les années disponibles

**Fichier: `src/pages/BibliothequeRechercheAvancee.tsx`**

```typescript
// Charger les années indépendamment des résultats
const { data: availableYears } = useQuery({
  queryKey: ["bibliotheque-years"],
  queryFn: async () => {
    const { data } = await supabase
      .from("textes_reglementaires")
      .select("annee")
      .not("annee", "is", null)
      .order("annee", { ascending: false });
    
    return [...new Set(data?.map(t => t.annee) || [])];
  },
});
```

### Phase 3: Améliorations UI/UX (Priorité MOYENNE)

#### 2.5 Ajouter colonne Statut dans DataGrid

**Fichier: `src/components/bibliotheque/BibliothequeDataGrid.tsx`**

Ajouter une nouvelle colonne après "Date":

```typescript
{
  accessorKey: "statut_vigueur",
  header: "Statut",
  size: 120,
  cell: ({ row }) => {
    const statut = row.original.statut_vigueur || "en_vigueur";
    const { label, variant } = getStatutBadge(statut);
    return <Badge variant={variant}>{label}</Badge>;
  },
},
```

#### 2.6 Améliorer les filtres avec debounce cohérent

**Fichier: `src/pages/BibliothequeReglementaire.tsx`**

```typescript
import { useDebounce } from "@/hooks/useDebounce";

// Utiliser debounce pour la recherche
const debouncedSearchTerm = useDebounce(searchTerm, 300);

// Dans la query, utiliser debouncedSearchTerm au lieu de searchTerm
```

#### 2.7 Ajouter breadcrumb de navigation

**Créer: `src/components/bibliotheque/BibliothequeHeader.tsx`**

```typescript
export function BibliothequeHeader({ 
  title, 
  breadcrumbs 
}: { 
  title: string; 
  breadcrumbs?: { label: string; href?: string }[] 
}) {
  return (
    <div className="space-y-2">
      {breadcrumbs && (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/bibliotheque">Bibliothèque</BreadcrumbLink>
            </BreadcrumbItem>
            {breadcrumbs.map((crumb, i) => (
              <Fragment key={i}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {crumb.href ? (
                    <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}
      <h1 className="text-3xl font-bold">{title}</h1>
    </div>
  );
}
```

#### 2.8 Améliorer la pagination

**Fichier: `src/pages/BibliothequeReglementaire.tsx`**

Ajouter sélecteur de taille de page:

```typescript
<Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
  <SelectTrigger className="w-[100px]">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="10">10</SelectItem>
    <SelectItem value="25">25</SelectItem>
    <SelectItem value="50">50</SelectItem>
    <SelectItem value="100">100</SelectItem>
  </SelectContent>
</Select>
```

### Phase 4: Optimisations (Priorité BASSE)

#### 2.9 Mise en cache intelligente des filtres

Utiliser les query keys de React Query pour invalider uniquement ce qui change:

```typescript
// Query keys structurées
const texteQueryKey = ["textes", { 
  type: typeFilter, 
  domaine: domaineFilter, 
  page 
}];
```

#### 2.10 Export des données

Ajouter un bouton d'export dans le header:

```typescript
<ExportButton
  data={textes}
  filename="bibliotheque-reglementaire"
  columns={["reference", "titre", "type", "date_publication", "statut_vigueur"]}
/>
```

---

## 3. Fichiers à Modifier

| # | Fichier | Modifications | Priorité |
|---|---------|---------------|----------|
| 1 | `src/lib/textes-queries.ts` | Corriger `sousDomainesQueries.getActive()` pour ajouter filtres `actif=true` et `deleted_at=null` | CRITIQUE |
| 2 | `src/components/bibliotheque/BibliothequeDataGrid.tsx` | Ajouter colonne Statut | HAUTE |
| 3 | `src/pages/BibliothequeRechercheAvancee.tsx` | Pré-charger années, améliorer recherche mots-clés | HAUTE |
| 4 | `src/pages/BibliothequeReglementaire.tsx` | Debounce search, sélecteur page size | MOYENNE |
| 5 | `src/components/bibliotheque/BibliothequeHeader.tsx` | Créer composant breadcrumb | MOYENNE |
| 6 | `src/lib/regulatory-domains-queries.ts` | Créer fichier centralisé (optionnel) | BASSE |

---

## 4. Résumé des Améliorations

### Corrections Critiques
- Élimination des sous-domaines en double via filtrage `actif=true`
- Unification des sources de données

### Améliorations Recherche
- Tokenization des mots-clés
- Pré-chargement des années
- Debounce cohérent (300ms)

### Améliorations UI/UX
- Colonne statut dans la grille
- Breadcrumb de navigation
- Sélecteur de taille de page
- Messages empty state contextuels
- Bouton export

### Impact Attendu
- Élimination des doublons visuels
- Recherche plus pertinente et rapide
- Navigation plus intuitive
- Meilleure expérience utilisateur globale
