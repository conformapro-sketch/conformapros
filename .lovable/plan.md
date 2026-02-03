
# Plan de Séparation: Interfaces Textes Réglementaires et Articles

## Objectif

Séparer l'entrée "Textes & articles" du menu de navigation en deux interfaces distinctes:
1. **Textes Réglementaires** - Navigation et recherche par textes (loi, décret, arrêté, circulaire)
2. **Articles** - Navigation et recherche par articles avec filtres spécifiques

Cette séparation permettra aux utilisateurs de:
- Rechercher rapidement par texte (référence, titre, type, année)
- OU rechercher directement dans les articles (numéro, contenu, sous-domaines, exigences)

---

## Architecture Actuelle

```text
BIBLIOTHÈQUE (menu)
├── Tableau de bord      → /bibliotheque/dashboard
├── Textes & articles    → /bibliotheque/           ← Page unique combinée
├── Codes juridiques     → /codes-juridiques
├── Recherche avancée    → /bibliotheque/recherche
└── Paramètres           → /bibliotheque/parametres
```

La page actuelle `/bibliotheque/` (BibliothequeReglementaire.tsx) affiche uniquement les **textes** avec un compteur d'articles par texte.

---

## Nouvelle Architecture

```text
BIBLIOTHÈQUE (menu)
├── Tableau de bord      → /bibliotheque/dashboard
├── Textes réglementaires→ /bibliotheque/textes     ← NOUVEAU (renommage)
├── Articles             → /bibliotheque/articles   ← NOUVELLE PAGE
├── Codes juridiques     → /codes-juridiques
├── Recherche avancée    → /bibliotheque/recherche
└── Paramètres           → /bibliotheque/parametres
```

---

## Modifications à Effectuer

### 1. Mise à jour de la Navigation

**Fichier: `src/lib/module-navigation-map.ts`**

Modifier la configuration du module BIBLIOTHEQUE:

```typescript
BIBLIOTHEQUE: {
  icon: Library,
  subItems: [
    { title: "Tableau de bord", url: "/bibliotheque/dashboard" },
    { title: "Textes réglementaires", url: "/bibliotheque/textes" },  // ← Renommé
    { title: "Articles", url: "/bibliotheque/articles" },             // ← NOUVEAU
    { title: "Codes juridiques", url: "/codes-juridiques" },
    { title: "Recherche avancée", url: "/bibliotheque/recherche" },
    { title: "Paramètres", url: "/bibliotheque/parametres" },
  ],
},
```

Même modification pour les clients (section non-staff):
```typescript
if (module.code === 'BIBLIOTHEQUE' && !isStaff) {
  config = {
    icon: config.icon,
    subItems: [
      { title: "Textes", url: "/client-bibliotheque/textes" },
      { title: "Articles", url: "/client-bibliotheque/articles" },
      { title: "Codes juridiques", url: "/client/codes-juridiques" },
      { title: "Recherche avancée", url: "/client/recherche-avancee" },
    ],
  };
}
```

### 2. Création de la Page Articles

**Nouveau fichier: `src/pages/BibliothequeArticles.tsx`**

Interface dédiée à la recherche et navigation par articles:

| Fonctionnalité | Description |
|----------------|-------------|
| **Recherche** | Par numéro d'article, titre, contenu (version en vigueur) |
| **Filtres** | Type de texte parent, Domaine, Sous-domaine, Année, Exigence (oui/non), Introductif (oui/non) |
| **Affichage** | Liste avec numéro, titre, résumé, texte parent (référence cliquable), statut version |
| **Actions** | Voir détail, voir texte parent, voir historique versions |
| **Export** | CSV/Excel des résultats filtrés |

Structure de la page:
```text
┌─────────────────────────────────────────────────────────────────┐
│  [Header] Articles réglementaires          [Export] [Recherche] │
├─────────────────────────────────────────────────────────────────┤
│  [Stats Cards] Total | Exigences | Introductifs | En vigueur   │
├─────────────────────────────────────────────────────────────────┤
│  [Filtres]                                                      │
│  Type texte ▾ | Domaine ▾ | Sous-domaine ▾ | Année ▾           │
│  □ Exigences uniquement  □ Introductifs uniquement             │
├─────────────────────────────────────────────────────────────────┤
│  [Résultats]                                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Art. 1 - Champ d'application                  [En vigueur]  │
│  │ Décret n°2024-123 du 15 janvier 2024          [Exigence]    │
│  │ Domaine: SST > Équipements                                  │
│  │ Résumé: Lorem ipsum dolor sit amet...                       │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Art. 2 - Obligations générales                [En vigueur]  │
│  │ ...                                                          │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  [Pagination] ◀ 1 2 3 ... 10 ▶     Affichage: 25 ▾             │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Création des Requêtes Articles

**Fichier: `src/lib/textes-queries.ts`**

Ajouter de nouvelles fonctions de requête:

```typescript
export const articlesListQueries = {
  // Liste paginée avec filtres
  async getAll(filters?: {
    searchTerm?: string;
    typeTexteFilter?: string;      // loi, decret, arrete, circulaire
    domaineFilter?: string;
    sousDomaineFilter?: string;
    anneeFilter?: string;
    exigenceOnly?: boolean;        // porte_exigence = true
    introductifOnly?: boolean;     // est_introductif = true
    page?: number;
    pageSize?: number;
  }) {
    // Requête optimisée avec jointures
  },
  
  // Récupérer les statistiques
  async getStats() {
    // Total, exigences, introductifs, en_vigueur
  }
};
```

### 4. Création du Composant DataGrid Articles

**Nouveau fichier: `src/components/bibliotheque/ArticlesDataGrid.tsx`**

Colonnes du tableau:

| Colonne | Description |
|---------|-------------|
| Numéro | Numéro de l'article |
| Titre | Titre de l'article |
| Texte parent | Référence cliquable vers le texte |
| Domaines | Badges des domaines/sous-domaines |
| Statut | Badge en_vigueur/modifié/abrogé |
| Type | Badge Exigence ou Introductif |
| Actions | Voir, Historique, Éditer (staff) |

### 5. Mise à jour des Routes

**Fichier: `src/App.tsx`**

Ajouter les nouvelles routes:

```typescript
// Route existante redirigée
<Route path="bibliotheque" element={<Navigate to="/bibliotheque/textes" replace />} />

// Nouvelles routes
<Route path="bibliotheque/textes" element={<BibliothequeReglementaire />} />
<Route path="bibliotheque/articles" element={<BibliothequeArticles />} />

// Routes client
<Route path="client-bibliotheque" element={<Navigate to="/client-bibliotheque/textes" replace />} />
<Route path="client-bibliotheque/textes" element={<ClientBibliotheque />} />
<Route path="client-bibliotheque/articles" element={<ClientBibliothequeArticles />} />
```

### 6. Renommage de la Page Textes

**Fichier: `src/pages/BibliothequeReglementaire.tsx`**

Modifications mineures:
- Titre: "Textes Réglementaires" (au lieu de "Bibliothèque Réglementaire")
- Breadcrumb: Bibliothèque > Textes réglementaires
- Bouton retour: vers /bibliotheque/dashboard

---

## Détails Techniques

### Requête Articles avec Jointures

```sql
SELECT 
  a.id,
  a.numero,
  a.titre,
  a.resume,
  a.est_introductif,
  a.porte_exigence,
  av.contenu,
  av.statut,
  av.date_effet,
  t.id as texte_id,
  t.reference,
  t.type,
  t.annee,
  ARRAY_AGG(DISTINCT sd.libelle) as sous_domaines,
  ARRAY_AGG(DISTINCT d.libelle) as domaines
FROM articles a
JOIN article_versions av ON av.article_id = a.id AND av.statut = 'en_vigueur'
JOIN textes_reglementaires t ON t.id = a.texte_id
LEFT JOIN article_sous_domaines asd ON asd.article_id = a.id
LEFT JOIN sous_domaines_application sd ON sd.id = asd.sous_domaine_id
LEFT JOIN domaines_reglementaires d ON d.id = sd.domaine_id
WHERE t.deleted_at IS NULL
GROUP BY a.id, av.id, t.id
ORDER BY t.date_publication DESC, a.numero
```

### Filtres Spécifiques Articles

| Filtre | Type | Source |
|--------|------|--------|
| Type texte | Select | textes_reglementaires.type |
| Domaine | Select | domaines_reglementaires |
| Sous-domaine | Select (dépendant) | sous_domaines_application |
| Année | Select | textes_reglementaires.annee |
| Exigences uniquement | Checkbox | articles.porte_exigence |
| Introductifs uniquement | Checkbox | articles.est_introductif |
| Statut version | Select | article_versions.statut |

---

## Fichiers à Créer/Modifier

| # | Fichier | Action | Description |
|---|---------|--------|-------------|
| 1 | `src/lib/module-navigation-map.ts` | Modifier | Séparer navigation Textes/Articles |
| 2 | `src/pages/BibliothequeArticles.tsx` | Créer | Nouvelle page liste articles |
| 3 | `src/components/bibliotheque/ArticlesDataGrid.tsx` | Créer | Tableau articles |
| 4 | `src/components/bibliotheque/ArticlesCardView.tsx` | Créer | Vue cartes articles (mobile) |
| 5 | `src/components/bibliotheque/ArticlesFilters.tsx` | Créer | Filtres spécifiques articles |
| 6 | `src/components/bibliotheque/ArticlesStatsCards.tsx` | Créer | Statistiques articles |
| 7 | `src/lib/textes-queries.ts` | Modifier | Ajouter articlesListQueries |
| 8 | `src/App.tsx` | Modifier | Ajouter routes articles |
| 9 | `src/pages/BibliothequeReglementaire.tsx` | Modifier | Renommer titre |
| 10 | `src/pages/ClientBibliothequeArticles.tsx` | Créer | Version client de la page articles |

---

## Comportement des Filtres

### Page Textes (existante)

- Type de texte (loi, décret, arrêté, circulaire)
- Domaine
- Sous-domaine
- Année de publication
- Avec PDF (checkbox)
- Favoris (checkbox)

### Page Articles (nouvelle)

- Type de texte parent
- Domaine (via article_sous_domaines)
- Sous-domaine (via article_sous_domaines)
- Année du texte parent
- **Exigences uniquement** (nouveau) - filtre articles.porte_exigence = true
- **Introductifs uniquement** (nouveau) - filtre articles.est_introductif = true
- **Statut version** (nouveau) - en_vigueur, modifié, abrogé

---

## Navigation Entre les Deux Vues

### Depuis la page Textes

- Clic sur un texte → Page détail texte (`/bibliotheque/textes/:id`)
- La page détail affiche les articles du texte (comportement actuel conservé)

### Depuis la page Articles

- Clic sur un article → Modal de prévisualisation rapide (QuickView)
- Bouton "Voir le texte" → Page détail texte
- Bouton "Historique" → Modal versions ou page versions

---

## Impact Utilisateur

### Avant

L'utilisateur doit:
1. Aller dans "Textes & articles"
2. Trouver le texte qui l'intéresse
3. Cliquer pour voir les articles
4. Chercher l'article spécifique

### Après

L'utilisateur peut:
- **Option A**: Chercher par texte (si connaît la référence/loi)
- **Option B**: Chercher directement l'article (par mot-clé, domaine, exigence)

---

## Priorité d'Implémentation

1. **HAUTE** - Navigation et routes (navigation-map, App.tsx)
2. **HAUTE** - Page BibliothequeArticles avec requêtes
3. **MOYENNE** - Composants DataGrid et filtres
4. **MOYENNE** - Stats cards et export
5. **BASSE** - Version client (ClientBibliothequeArticles)

