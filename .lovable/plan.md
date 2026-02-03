
# Analyse Complète du Module Bibliothèque Réglementaire

## Synthèse Exécutive

L'analyse approfondie du module Bibliothèque Réglementaire révèle des **problèmes architecturaux critiques** causés par une migration incomplète du schéma, des fichiers de requêtes dupliqués, et des références à des colonnes inexistantes ou obsolètes.

---

## 1. Problèmes de Schéma de Base de Données

### 1.1 Tables Dupliquées (Articles)

La base de données contient **deux tables d'articles différentes** :

| Table | Colonnes | Usage Actuel | Recommandation |
|-------|----------|--------------|----------------|
| `articles` (NOUVELLE) | `texte_id`, `numero`, `titre`, `resume`, `porte_exigence`, `est_introductif` | Utilisée par la majorité du code | **À CONSERVER** |
| `textes_articles` (LEGACY) | `texte_id`, `acte_id`, `numero_article`, `titre`, `titre_court`, `contenu`, `is_exigence` | Encore référencée par `conformite-queries.ts`, `ConformiteEvaluation.tsx`, effets juridiques | **À SUPPRIMER** |

**Impact** : Les requêtes vers `textes_articles` échouent ou retournent des données incohérentes.

### 1.2 Tables Dupliquées (Sous-domaines-Articles)

| Table | Usage |
|-------|-------|
| `article_sous_domaines` | Utilisée par `textes-queries.ts` - **CORRECTE** |
| `articles_sous_domaines` | Utilisée par `ArticlesTab.tsx` - **LEGACY** |

**Impact** : Les sous-domaines d'articles sont stockés dans deux tables différentes.

### 1.3 Colonnes Référencées mais Inexistantes

| Colonne Référencée | Table Ciblée | Colonne Correcte |
|--------------------|--------------|------------------|
| `reference_officielle` | `textes_reglementaires` | `reference` |
| `intitule` | `textes_reglementaires` | `titre` |
| `date_publication_jort` | `textes_reglementaires` | `date_publication` |
| `type_acte` | `textes_reglementaires` | `type` |
| `statut_vigueur` | `textes_reglementaires` | N/A (supprimée) |
| `fichier_pdf_url` | `textes_reglementaires` | `pdf_url` |
| `numero_article` | `articles` | `numero` |
| `titre_court` | `articles` | `titre` |
| `is_exigence` | `articles` | `porte_exigence` |
| `contenu` | `articles` | N/A (dans `article_versions`) |
| `acte_id` | `articles` | `texte_id` |

---

## 2. Fichiers de Requêtes Dupliqués

### 2.1 Cartographie des Fichiers

```text
src/lib/
├── actes-queries.ts          ← Utilisé par 16 fichiers
├── textes-queries.ts         ← Utilisé par 19 fichiers  
├── textes-reglementaires-queries.ts  ← Utilisé par 6 fichiers
├── bibliotheque-queries.ts   ← Fonctions génériques
├── domaines-queries.ts       ← CRUD domaines/sous-domaines
└── client-bibliotheque-queries.ts ← Requêtes filtrées par site
```

### 2.2 Fonctions Dupliquées

| Fonction | actes-queries.ts | textes-queries.ts | textes-reglementaires-queries.ts |
|----------|------------------|-------------------|----------------------------------|
| `textesReglementairesQueries.getAll` | ✅ | ✅ | ✅ |
| `textesReglementairesQueries.getById` | ✅ | ✅ | ✅ |
| `textesReglementairesQueries.create` | ✅ | ✅ | ✅ |
| `domainesQueries.getActive` | ✅ | ✅ | ❌ |
| `sousDomainesQueries.getByDomaineId` | ✅ | ✅ | ❌ |
| `articlesQueries.getByTexteId` | ✅ (via `articlesQueries`) | ✅ (via `textesArticlesQueries`) | ✅ |
| `articleVersionsQueries` | ✅ | ✅ (via `textesArticlesVersionsQueries`) | ✅ |

**Impact** : Les composants importent des fonctions de fichiers différents qui ont des comportements légèrement différents (colonnes mappées différemment).

---

## 3. Bugs Identifiés par Composant

### 3.1 BibliothequeTexteDetail.tsx (Lignes 220-230)

```typescript
// BUG: Référence à textes_articles (table legacy) et colonnes inexistantes
textes_articles!articles_effets_juridiques_article_source_id_fkey(
  numero_article,  // ❌ Devrait être 'numero'
  textes_reglementaires!textes_articles_texte_id_fkey(reference_officielle)  // ❌ Devrait être 'reference'
)
```

### 3.2 BibliothequeTexteDetail.tsx (Lignes 383, 401, 416, 833-834)

```typescript
// BUG: Accès à des propriétés inexistantes
const statutInfo = getStatutBadge(texte.statut_vigueur);  // ❌ Colonne supprimée
<Badge variant="outline">{texte.reference_officielle}</Badge>  // ❌ Devrait être 'reference'
pdfUrl={texte?.pdf_url || texte?.fichier_pdf_url}  // ❌ 'fichier_pdf_url' n'existe pas
title={texte?.reference_officielle}  // ❌ Devrait être 'reference'
```

### 3.3 ConformiteEvaluation.tsx (Lignes 126-130, 418-424)

```typescript
// BUG: Utilise textes_articles et colonnes legacy
item.textes_articles?.numero  // ❌ Table legacy
item.textes_articles?.titre_court  // ❌ Colonne legacy
item.textes_reglementaires?.reference_officielle  // ❌ Colonne inexistante
```

### 3.4 conformite-queries.ts (Lignes 63, 287)

```typescript
// BUG: Requêtes vers table legacy
const { data: articles } = await supabase.from('textes_articles')
```

### 3.5 ArticlesTab.tsx (Lignes 89, 120, 154, 160)

```typescript
// BUG: Utilise articles_sous_domaines (table legacy)
.from("articles_sous_domaines")  // ❌ Devrait être article_sous_domaines
```

### 3.6 bibliotheque-queries.ts (Lignes 143-150)

```typescript
// BUG: Import CSV utilise colonnes legacy
if (!record.intitule || !record.reference_officielle || !record.type_acte)
// Devrait être: !record.titre || !record.reference || !record.type
```

### 3.7 ArticleQuickEffetModal.tsx, ArticleEffetsTimeline.tsx

```typescript
// BUG: Références à propriétés legacy
targetArticle?.numero_article  // ❌ Devrait être 'numero'
targetArticle?.texte?.reference_officielle  // ❌ Devrait être 'reference'
effet.texte_source.reference_officielle  // ❌ Devrait être 'reference'
```

---

## 4. Incohérences d'Import

### 4.1 Imports Mixtes dans le même fichier

**BibliothequeReglementaire.tsx** :
```typescript
import { textesReglementairesQueries, TexteReglementaire } from "@/lib/textes-queries";
import { domainesQueries, sousDomainesQueries } from "@/lib/actes-queries";  // ❌ MIXTE
```

**ArticleFormModal.tsx** :
```typescript
import { textesArticlesQueries, textesReglementairesQueries } from "@/lib/textes-queries";
import { articlesEffetsJuridiquesQueries } from "@/lib/actes-queries";  // ❌ MIXTE
```

---

## 5. Plan de Correction

### Phase 1 : Consolidation des Fichiers de Requêtes (Priorité HAUTE)

**Objectif** : Un seul fichier source de vérité

**Actions** :
1. Créer `src/lib/bibliotheque-unified-queries.ts` consolidant :
   - Toutes les requêtes textes (getAll, getById, create, update, delete)
   - Toutes les requêtes articles (CRUD + sous-domaines)
   - Toutes les requêtes versions
   - Toutes les requêtes domaines/sous-domaines
   - Requêtes effets juridiques
   - Requêtes changelog

2. Supprimer après migration :
   - `actes-queries.ts`
   - `textes-queries.ts`
   - `textes-reglementaires-queries.ts`

### Phase 2 : Correction des Colonnes (Priorité HAUTE)

**Mapping à appliquer dans tous les fichiers** :

| Legacy | Correct |
|--------|---------|
| `reference_officielle` | `reference` |
| `intitule` | `titre` |
| `date_publication_jort` | `date_publication` |
| `type_acte` | `type` |
| `statut_vigueur` | Supprimer (géré par `article_versions.statut`) |
| `fichier_pdf_url` | `pdf_url` |
| `numero_article` | `numero` |
| `titre_court` | `titre` |
| `is_exigence` | `porte_exigence` |
| `acte_id` | `texte_id` |

### Phase 3 : Migration des Tables Legacy (Priorité HAUTE)

**Actions** :
1. Migrer les données de `textes_articles` vers `articles`
2. Migrer les données de `articles_sous_domaines` vers `article_sous_domaines`
3. Mettre à jour les FK dans `articles_effets_juridiques` pour pointer vers `articles`
4. Supprimer les tables legacy après validation

### Phase 4 : Correction des Composants (Priorité MOYENNE)

**Fichiers à corriger** :

| Fichier | Corrections |
|---------|-------------|
| `BibliothequeTexteDetail.tsx` | Remplacer références `reference_officielle`, `statut_vigueur`, `fichier_pdf_url`, requête effets juridiques |
| `ConformiteEvaluation.tsx` | Remplacer `textes_articles` par `articles`, colonnes |
| `conformite-queries.ts` | Remplacer `textes_articles` par `articles` |
| `ArticlesTab.tsx` | Remplacer `articles_sous_domaines` par `article_sous_domaines` |
| `ArticleQuickEffetModal.tsx` | Remplacer `numero_article` par `numero` |
| `ArticleEffetsTimeline.tsx` | Remplacer colonnes legacy |
| `bibliotheque-queries.ts` | Corriger import CSV |
| `ImportCSVDialog.tsx` | Mettre à jour format attendu |

### Phase 5 : Mise à jour des Types (Priorité MOYENNE)

**Actions** :
1. Nettoyer `src/types/textes.ts` :
   - Supprimer les alias @deprecated inutilisés
   - Supprimer `ActeReglementaire` (utiliser `TexteReglementaire`)
   - Supprimer les propriétés legacy des interfaces

2. Mettre à jour `src/types/codes.ts` avec les bonnes colonnes

### Phase 6 : Tests et Validation (Priorité HAUTE)

**Checklist** :
- [ ] Créer un texte réglementaire → Vérifier insertion correcte
- [ ] Ajouter un article → Vérifier insertion dans `articles`
- [ ] Ajouter du contenu → Vérifier insertion dans `article_versions`
- [ ] Assigner des domaines → Vérifier `textes_domaines`
- [ ] Assigner des sous-domaines à un article → Vérifier `article_sous_domaines`
- [ ] Rechercher par référence → Vérifier la colonne `reference`
- [ ] Afficher le détail d'un texte → Vérifier affichage correct
- [ ] Créer une nouvelle version → Vérifier workflow complet
- [ ] Tester l'import CSV → Vérifier mapping colonnes

---

## 6. Fichiers à Modifier (Ordre de Priorité)

| # | Fichier | Type | Complexité |
|---|---------|------|------------|
| 1 | `src/lib/actes-queries.ts` | Supprimer après migration | Basse |
| 2 | `src/lib/textes-reglementaires-queries.ts` | Fusionner + supprimer | Basse |
| 3 | `src/lib/textes-queries.ts` | Devenir source unique | Haute |
| 4 | `src/pages/BibliothequeTexteDetail.tsx` | Corriger colonnes + requêtes | Haute |
| 5 | `src/pages/ConformiteEvaluation.tsx` | Migrer vers `articles` | Haute |
| 6 | `src/lib/conformite-queries.ts` | Migrer vers `articles` | Moyenne |
| 7 | `src/components/ArticlesTab.tsx` | Corriger table sous-domaines | Moyenne |
| 8 | `src/components/ArticleQuickEffetModal.tsx` | Corriger colonnes | Basse |
| 9 | `src/components/ArticleEffetsTimeline.tsx` | Corriger colonnes | Basse |
| 10 | `src/lib/bibliotheque-queries.ts` | Corriger import CSV | Basse |
| 11 | `src/types/textes.ts` | Nettoyer types deprecated | Moyenne |
| 12 | `src/components/ImportCSVDialog.tsx` | Mettre à jour format | Basse |

---

## 7. Migrations SQL Requises

### 7.1 Copier les données des tables legacy (si nécessaire)

```sql
-- Vérifier les données dans textes_articles non migrées
SELECT ta.* FROM textes_articles ta
LEFT JOIN articles a ON ta.texte_id = a.texte_id AND ta.numero_article = a.numero
WHERE a.id IS NULL;

-- Migrer si nécessaire
INSERT INTO articles (texte_id, numero, titre, resume, porte_exigence, est_introductif)
SELECT texte_id, numero_article, COALESCE(titre_court, titre), NULL, COALESCE(is_exigence, false), false
FROM textes_articles ta
WHERE NOT EXISTS (SELECT 1 FROM articles a WHERE a.texte_id = ta.texte_id AND a.numero = ta.numero_article);
```

### 7.2 Mettre à jour les FK des effets juridiques

```sql
-- Mettre à jour articles_effets_juridiques pour pointer vers articles
-- (À exécuter après vérification de la correspondance des IDs)
```

### 7.3 Nettoyer les tables legacy (après validation)

```sql
-- NE PAS EXÉCUTER AVANT VALIDATION COMPLÈTE
-- DROP TABLE IF EXISTS textes_articles CASCADE;
-- DROP TABLE IF EXISTS articles_sous_domaines CASCADE;
```

---

## 8. Estimation du Travail

| Phase | Durée Estimée |
|-------|--------------|
| Phase 1 (Consolidation) | 3-4 heures |
| Phase 2 (Colonnes) | 2 heures |
| Phase 3 (Migration DB) | 1-2 heures |
| Phase 4 (Composants) | 3-4 heures |
| Phase 5 (Types) | 1 heure |
| Phase 6 (Tests) | 2 heures |

**Total estimé : 12-15 heures**

---

## 9. Risques et Mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Perte de données lors de migration | Critique | Backup complet avant migration |
| FK cassées après suppression tables | Critique | Vérifier toutes les FK avant suppression |
| Régression fonctionnelle | Moyen | Tests complets après chaque phase |
| Incohérence query cache | Moyen | Invalider toutes les queries après migration |
