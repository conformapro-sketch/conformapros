
# Plan de Vérification et Correction - Page /bibliotheque/articles

## Analyse Complète des Problèmes Identifiés

### 1. Problèmes Critiques

#### 1.1 Page BibliothequeArticleVersions: Incohérence des Colonnes

La page `BibliothequeArticleVersions.tsx` attend des colonnes qui n'existent pas dans la table `article_versions`:

| Colonne Attendue | Colonne Réelle | Impact |
|------------------|----------------|--------|
| `version.effective_from` | `date_effet` | Comparaison de dates échoue |
| `version.effective_to` | N'existe pas | isVersionActive() toujours faux |
| `version.modification_type` | N'existe pas | Badges de type non affichés |
| `version.date_version` | `date_effet` | Filtrage par période échoue |
| `version.version_label` | N'existe pas | Affichage vide |
| `version.version_numero` | `numero_version` | Affichage incorrect |
| `version.raison_modification` | N'existe pas | Recherche échoue |
| `article.contenu` | N'existe pas dans `articles` | Contenu actuel non affiché |

**Solution:** Adapter la page aux vraies colonnes de `article_versions`:
- `id`, `article_id`, `numero_version`, `date_effet`, `statut`, `source_texte_id`, `contenu`, `notes_modifications`

#### 1.2 Article Content: Architecture Incorrecte

La page `BibliothequeArticleVersions` cherche `article.contenu` mais la table `articles` ne contient PAS de colonne `contenu`. Le contenu est stocké dans `article_versions.contenu` (version active).

**Solution:** Charger la version "en_vigueur" pour afficher le contenu actuel.

#### 1.3 BibliothequeHeader: Lien Breadcrumb Cassé

Le lien "Bibliothèque" pointe vers `/bibliotheque` qui fait une redirection vers `/bibliotheque/textes`. Techniquement fonctionnel mais pourrait être plus direct vers `/bibliotheque/dashboard`.

---

### 2. Problèmes de Cohérence UI

#### 2.1 Bouton "Voir l'article" Non Connecté

Dans `ArticlesDataGrid.tsx`, le bouton "Voir l'article" (icône Eye) appelle `onViewArticle?.(article)` mais cette prop n'est pas passée dans `BibliothequeArticles.tsx`:

```typescript
// BibliothequeArticles.tsx ligne 168-171
<ArticlesDataGrid
  articles={articlesResult?.data || []}
  isLoading={articlesLoading}
  // MANQUANT: onViewArticle handler
/>
```

**Solution:** Ajouter soit une modal QuickView, soit une navigation vers la page de détail.

#### 2.2 Références Texte Parent dans DataGrid

Le champ `texte?.reference_officielle` et `texte?.intitule` sont référencés dans `BibliothequeArticleVersions` mais les données retournées par `textesArticlesQueries.getById` utilisent `textes_reglementaires.reference` et `textes_reglementaires.titre`.

---

### 3. Problèmes de Filtrage

#### 3.1 Filtre Statut Version: Logique Incomplète

Dans `articles-queries.ts`, quand `statutVersionFilter !== "all"`, les articles sans version correspondante sont filtrés côté client APRÈS la pagination, ce qui fausse le count et crée des pages vides.

**Solution:** Appliquer le filtre AVANT la pagination ou utiliser une jointure SQL.

---

## Plan de Corrections

### Phase 1: Corrections Critiques (Page Versions)

**Fichier: `src/pages/BibliothequeArticleVersions.tsx`**

1. Adapter les noms de colonnes:
   - `version.effective_from` → `version.date_effet`
   - `version.version_numero` → `version.numero_version`
   - Supprimer références à `effective_to`, `modification_type`, `version_label`, `raison_modification`

2. Charger le contenu depuis la version active:
```typescript
const { data: activeVersion } = useQuery({
  queryKey: ["article-active-version", articleId],
  queryFn: async () => {
    const { data } = await supabase
      .from("article_versions")
      .select("*")
      .eq("article_id", articleId)
      .eq("statut", "en_vigueur")
      .order("date_effet", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data;
  },
  enabled: !!articleId,
});
```

3. Simplifier la fonction `isVersionActive`:
```typescript
const isVersionActive = (version: any) => {
  return version.statut === "en_vigueur";
};
```

4. Adapter les filtres aux colonnes existantes:
   - Remplacer filtre `modification_type` par filtre `statut` (en_vigueur, remplacee, abrogee)
   - Recherche sur `notes_modifications` seulement

5. Corriger l'affichage de référence texte parent:
```typescript
// Ligne 166-168
<p className="text-muted-foreground mt-2">
  {texte?.reference} - {texte?.titre}
</p>
```

### Phase 2: Connexion du Bouton "Voir Article"

**Fichier: `src/pages/BibliothequeArticles.tsx`**

Ajouter un handler pour visualiser l'article avec la modale `BibliothequeQuickView` ou navigation:

```typescript
import { BibliothequeQuickView } from "@/components/bibliotheque/BibliothequeQuickView";

const [selectedArticle, setSelectedArticle] = useState<ArticleWithDetails | null>(null);

// Dans le JSX
<ArticlesDataGrid
  articles={articlesResult?.data || []}
  isLoading={articlesLoading}
  onViewArticle={(article) => setSelectedArticle(article)}
/>

{selectedArticle && (
  <BibliothequeQuickView
    open={!!selectedArticle}
    onClose={() => setSelectedArticle(null)}
    type="article"
    item={selectedArticle}
  />
)}
```

OU créer une nouvelle modal dédiée aux articles.

### Phase 3: Amélioration du Filtre Statut Version

**Fichier: `src/lib/articles-queries.ts`**

Optimiser la requête pour appliquer le filtre statut version côté base de données:

```typescript
// Approche: utiliser un RPC ou restructurer la requête
// Option simple: joindre article_versions directement dans la requête principale
// avec filtre sur statut

let query = supabase
  .from("articles")
  .select(`
    *,
    texte:textes_reglementaires!articles_texte_id_fkey(...),
    version_active:article_versions!inner(
      id, contenu, statut, date_effet
    ),
    sous_domaines:article_sous_domaines(...)
  `, { count: "exact" })
  .eq("article_versions.statut", filters.statutVersionFilter || "en_vigueur");
```

### Phase 4: Correction BibliothequeHeader

**Fichier: `src/components/bibliotheque/BibliothequeHeader.tsx`**

Changer le lien breadcrumb de base:
```typescript
// Ligne 41
<Link to="/bibliotheque/dashboard">Bibliothèque</Link>
```

---

## Fichiers à Modifier

| # | Fichier | Modifications |
|---|---------|---------------|
| 1 | `src/pages/BibliothequeArticleVersions.tsx` | Adapter aux colonnes réelles, charger version active |
| 2 | `src/pages/BibliothequeArticles.tsx` | Ajouter handler onViewArticle |
| 3 | `src/components/bibliotheque/ArticlesDataGrid.tsx` | Vérifier le comportement du bouton Eye |
| 4 | `src/lib/articles-queries.ts` | Optimiser filtre statut version |
| 5 | `src/components/bibliotheque/BibliothequeHeader.tsx` | Corriger lien breadcrumb |

---

## Tests de Validation

Après corrections, vérifier:

1. **Page Articles `/bibliotheque/articles`**:
   - Chargement des statistiques (4 cartes)
   - Recherche textuelle fonctionne
   - Tous les filtres (Type, Domaine, Sous-domaine, Année, Statut)
   - Checkboxes Exigences/Introductifs
   - Bouton Reset visible quand filtres actifs
   - Bouton Export génère un fichier
   - Pagination fonctionne
   - Clic sur "Voir l'article" ouvre une prévisualisation
   - Clic sur "Historique versions" navigue vers la page versions
   - Clic sur "Voir le texte" navigue vers le texte parent

2. **Page Versions `/bibliotheque/articles/:id/versions`**:
   - Affichage du contenu de la version active
   - Liste des versions historiques
   - Badges de statut corrects
   - Filtres fonctionnels
   - Comparaison de versions

3. **Navigation**:
   - Breadcrumb cliquable et correct
   - Bouton retour fonctionne
