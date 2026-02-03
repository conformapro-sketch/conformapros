

# Plan: Corrections et Améliorations - Module Bibliothèque Réglementaire

## Problèmes Identifiés

### 1. Navigation Active Non Visible dans la Sidebar

**Problème:** La fonction `findActiveModule` dans `module-navigation-map.ts` fonctionne correctement pour trouver le module parent, mais **le sous-item actif n'est pas visuellement mis en évidence** de manière suffisante dans certains cas.

Actuellement, le code vérifie :
- Correspondance exacte : `pathname === sub.url`
- Préfixe de route : `pathname.startsWith(sub.url + "/")`

**Cependant, il y a un problème avec les routes qui contiennent des query params.** La route `/bibliotheque/articles?texte=xxx` ne sera pas correctement identifiée car le pathname contient les paramètres URL.

**Solution :**
- Améliorer la logique de correspondance pour ignorer les query params
- S'assurer que le sous-menu "Articles" est bien surligné quand on est sur `/bibliotheque/articles`

---

### 2. Bouton "Voir le texte" dans ArticlesDataGrid Pointe Vers une Page Détail

**Problème:** Dans `ArticlesDataGrid.tsx` (ligne 213), le bouton "Voir le texte" navigue vers :
```typescript
navigate(`/bibliotheque/textes/${article.texte?.id}`)
```

Cependant, selon le plan précédemment approuvé, on devrait naviguer vers les articles filtrés par ce texte, pas vers une page détail.

**Solution :**
- Ce comportement est en fait correct car l'utilisateur veut voir le texte parent complet
- Aucune modification nécessaire car c'est une action secondaire cohérente

---

### 3. VersionStatsCard Attend des Colonnes Incorrectes

**Problème:** Le composant `VersionStatsCard.tsx` attend une interface avec :
- `version_numero`
- `date_version`
- `modification_type`

Mais dans `BibliothequeArticleVersions.tsx` (lignes 202-208), les données sont mappées :
```typescript
versions.map(v => ({
  ...v,
  modification_type: v.statut,  // statut != modification_type
  date_version: v.date_effet,
  effective_from: v.date_effet,
}))
```

Le mapping utilise `statut` pour `modification_type` ce qui n'est pas sémantiquement correct.

**Solution :**
- Adapter l'interface `VersionStatsCard` pour utiliser `statut` au lieu de `modification_type`
- Ou garder le mapping actuel qui est fonctionnel mais améliorer les labels affichés

---

### 4. Route Texte Détail Toujours Accessible (Potentiel Conflit)

**Problème:** La route `/bibliotheque/textes/:id` (ligne 218 de App.tsx) existe toujours et pointe vers `BibliothequeTexteDetail`. Cela crée une incohérence avec le nouveau comportement où cliquer sur un texte navigue vers les articles.

**Solution :**
- Garder la route pour les liens directs et le bouton "Voir le texte complet" dans la modal article
- Documenter ce comportement

---

### 5. Pagination Incorrecte avec Recherche Textuelle

**Problème:** Dans `articles-queries.ts`, la recherche textuelle est appliquée **après** la pagination (lignes 217-226). Cela signifie que si on recherche un terme, le nombre d'articles retournés peut être inférieur à `pageSize` même s'il y a plus de résultats sur d'autres pages.

**Solution :**
- Implémenter une recherche côté serveur en utilisant les fonctions PostgreSQL `ilike` ou `to_tsvector`
- Ou accepter cette limitation pour l'instant en documentant le comportement

---

### 6. Amélioration Suggérée : Mise en Évidence Visuelle du Sous-Menu Actif

**Problème actuel:** Le sous-item actif utilise un style minimal :
```typescript
isActive
  ? "border-l-2 border-primary bg-sidebar-accent pl-2 font-medium text-sidebar-primary"
  : "hover:bg-sidebar-accent/50"
```

**Suggestion :**
- Ajouter une animation subtile ou un indicateur plus visible
- Améliorer le contraste pour la lisibilité

---

## Corrections à Implémenter

### Correction 1 : Améliorer la Détection de Route Active

**Fichier:** `src/lib/module-navigation-map.ts`

Modifier `findActiveModule` pour mieux gérer les routes avec paramètres :

```typescript
export const findActiveModule = (pathname: string, items: MenuItem[]): string | null => {
  // Retirer les query params pour la comparaison
  const cleanPathname = pathname.split('?')[0];
  
  for (const item of items) {
    if (item.url && cleanPathname === item.url) {
      return item.title;
    }
    if (item.url && cleanPathname.startsWith(item.url + "/")) {
      return item.title;
    }
    if (item.subItems) {
      const matchingSubItem = item.subItems.find(
        (sub) => cleanPathname === sub.url || cleanPathname.startsWith(sub.url + "/")
      );
      if (matchingSubItem) {
        return item.title;
      }
    }
  }
  return null;
};
```

### Correction 2 : Améliorer le Style du Sous-Menu Actif

**Fichier:** `src/components/AppSidebar.tsx`

Améliorer le style pour le sous-item actif (ligne 222-229) :

```typescript
<NavLink
  to={subItem.url}
  className={({ isActive }) =>
    `sidebar-hover transition-all duration-200 ${
      isActive
        ? "border-l-2 border-primary bg-primary/10 pl-2 font-semibold text-primary"
        : "hover:bg-sidebar-accent/50"
    }`
  }
>
  <span>{subItem.title}</span>
</NavLink>
```

### Correction 3 : Adapter VersionStatsCard

**Fichier:** `src/components/bibliotheque/VersionStatsCard.tsx`

Modifier l'interface pour correspondre aux vraies colonnes :

```typescript
interface Version {
  id: string;
  numero_version: number;
  date_effet: string;
  statut: string;  // Utiliser le bon nom de colonne
}
```

Et mettre à jour les références dans le composant.

### Correction 4 : Corriger le Mapping dans BibliothequeArticleVersions

**Fichier:** `src/pages/BibliothequeArticleVersions.tsx`

Ne plus mapper `statut` vers `modification_type`, utiliser directement les champs corrects :

```typescript
<VersionStatsCard versions={versions.map(v => ({
  id: v.id,
  numero_version: v.numero_version,
  date_effet: v.date_effet,
  statut: v.statut,
}))} />
```

---

## Fichiers à Modifier

| # | Fichier | Modification |
|---|---------|--------------|
| 1 | `src/lib/module-navigation-map.ts` | Améliorer `findActiveModule` pour ignorer les query params |
| 2 | `src/components/AppSidebar.tsx` | Améliorer le style visuel du sous-item actif |
| 3 | `src/components/bibliotheque/VersionStatsCard.tsx` | Adapter l'interface aux vraies colonnes DB |
| 4 | `src/pages/BibliothequeArticleVersions.tsx` | Corriger le mapping des données pour VersionStatsCard |

---

## Bugs Mineurs Supplémentaires Détectés

### 5. Tooltip Missing sur le HoverCard en Mode Collapsed

Dans `AppSidebar.tsx`, quand la sidebar est collapsed, les sous-items apparaissent dans un HoverCard (lignes 159-197). La route active est bien mise en évidence avec le style correct.

**Statut:** Fonctionne correctement, aucune modification nécessaire.

### 6. Client Routes : Incohérence de Navigation

Dans `module-navigation-map.ts` (lignes 174-184), les routes client utilisent des chemins différents :
- `/client-bibliotheque/textes`
- `/client-bibliotheque/articles`

Mais `App.tsx` (ligne 226) utilise le même composant `BibliothequeArticles` pour les deux contextes (staff et client). Cela pourrait créer des problèmes si le composant a une logique spécifique au staff.

**Recommandation :** Vérifier que `BibliothequeArticles` fonctionne correctement pour les utilisateurs client.

---

## Tests de Validation

Après implémentation :

1. **Navigation sidebar active :**
   - Naviguer vers `/bibliotheque/articles` → Le sous-menu "Articles" doit être surligné
   - Naviguer vers `/bibliotheque/articles?texte=xxx` → Le sous-menu "Articles" doit toujours être surligné
   - Naviguer vers `/bibliotheque/textes` → Le sous-menu "Textes réglementaires" doit être surligné

2. **Page versions :**
   - Les statistiques de version doivent s'afficher correctement
   - Les filtres doivent fonctionner

3. **Contraste visuel :**
   - L'élément actif doit être facilement identifiable visuellement

