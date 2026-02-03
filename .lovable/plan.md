
# Plan de Correction Complète du Module Bibliothèque Réglementaire

## Diagnostic Complet

### 1. Conflits de Schéma Critiques

L'analyse révèle une **incohérence majeure** entre le code et la base de données :

| Aspect | Base de Données (Réel) | Code (Utilisé) | Impact |
|--------|------------------------|----------------|--------|
| **Table textes** | `textes_reglementaires` | Correct | OK |
| Colonne titre | `titre` | `titre`, `intitule` (mixte) | Erreurs partielles |
| Colonne référence | `reference` | `reference`, `reference_officielle` (mixte) | Erreurs partielles |
| **Table articles** | `articles` | `articles`, `textes_articles` (mixte) | **CRITIQUE** |
| Colonne numéro article | `numero` | `numero`, `numero_article` (mixte) | Erreurs |
| Colonne titre article | `titre` | `titre`, `titre_court` (mixte) | Erreurs |
| Colonne exigence | `porte_exigence` | `porte_exigence`, `is_exigence` (mixte) | Erreurs |
| Colonne contenu | Dans `article_versions` | `contenu` directement dans article | **INCORRECT** |
| **Table domaines** | `domaines_reglementaires` | `domaines_reglementaires`, `domaines_application` (mixte) | Erreurs |

### 2. Fichiers avec Erreurs Identifiées

#### Fichiers Critiques (Erreurs de Table)

| Fichier | Ligne | Problème |
|---------|-------|----------|
| `src/lib/actes-queries.ts` | 41-43 | Recherche sur `intitule` au lieu de `titre` |
| `src/lib/actes-queries.ts` | 97-124 | Validation duplicat sur `intitule` (inexistant) |
| `src/lib/actes-queries.ts` | 163-210 | Utilise `acte_id` au lieu de `texte_id` pour articles |
| `src/lib/actes-queries.ts` | 316-365 | Utilise `domaines_application` (table inexistante) |
| `src/lib/actes-queries.ts` | 426-465 | Utilise `articles_versions` au lieu de `article_versions` |
| `src/lib/actes-queries.ts` | 502-633 | FK vers `actes_reglementaires` et `textes_articles` (tables inexistantes) |
| `src/components/ArticleFormModal.tsx` | 41-46 | Form utilise `numero`, `titre_court`, `contenu`, `is_exigence` |
| `src/components/ArticleFormModal.tsx` | 360-366 | Envoie `numero_article`, `titre_court`, `is_exigence` |
| `src/pages/BibliothequeTexteDetail.tsx` | 130-145 | Utilise `numero_article`, `titre_court`, `resume`, `contenu` |
| `src/pages/BibliothequeTexteDetail.tsx` | 183-197 | FK vers `textes_articles` |
| `src/types/textes.ts` | 64-100 | Type `ActeReglementaire` avec colonnes inexistantes |
| `src/types/textes.ts` | 126-141 | Type `Article` avec `acte_id`, `titre_court`, `contenu_ar/fr` |
| `src/types/textes.ts` | 151-180 | Type `ArticleVersion` avec colonnes incorrectes |

#### Fichiers avec Colonnes Incorrectes (10+ fichiers)

- `AbrogationModal.tsx` : `numero_article`
- `ArticleAutocomplete.tsx` : `numero_article`, `titre_court`
- `ArticleVersionWizard.tsx` : `numero_article`
- `ArticleEffetsTimeline.tsx` : `numero_article`, `titre_court`
- `EffetsCreesTab.tsx` : `numero_article`, `titre_court`
- `ArticleQuickEffetModal.tsx` : `numero_article`

### 3. Tables Réelles vs Tables Référencées

```text
┌─────────────────────────────────────────────────────────────────────┐
│ TABLES RÉELLES (Database)          │ TABLES RÉFÉRENCÉES (Code)     │
├─────────────────────────────────────────────────────────────────────┤
│ textes_reglementaires              │ textes_reglementaires ✅      │
│   - type (enum)                    │   - type ✅                   │
│   - reference                      │   - reference_officielle ❌   │
│   - titre                          │   - intitule ❌               │
│   - date_publication               │   - date_publication_jort ❌  │
│   - autorite_emettrice             │   - autorite_emettrice ✅     │
│   - autorite_emettrice_id          │   - autorite_emettrice_id ✅  │
│   - annee                          │   - annee ✅                  │
│   - source_url                     │   - source_url ✅             │
│   - pdf_url                        │   - pdf_url ✅                │
├─────────────────────────────────────────────────────────────────────┤
│ articles                           │ textes_articles ❌            │
│   - texte_id                       │   - acte_id ❌               │
│   - numero                         │   - numero_article ❌        │
│   - titre                          │   - titre_court ❌           │
│   - resume                         │   - resume ✅                │
│   - porte_exigence                 │   - is_exigence ❌           │
│   - est_introductif                │   - est_introductif ✅       │
│   (pas de contenu)                 │   - contenu ❌               │
├─────────────────────────────────────────────────────────────────────┤
│ article_versions                   │ articles_versions ❌          │
│   - numero_version                 │   - version_numero ❌        │
│   - date_effet                     │   - date_version ❌          │
│   - statut                         │   - is_active ❌             │
│   - source_texte_id                │   - source_text_id ❌        │
│   - contenu                        │   - contenu ✅               │
│   - notes_modifications            │   - notes_modification ❌    │
├─────────────────────────────────────────────────────────────────────┤
│ domaines_reglementaires            │ domaines_application ❌       │
│ sous_domaines_application          │ sous_domaines_application ✅  │
│ article_sous_domaines              │ articles_sous_domaines ❌     │
└─────────────────────────────────────────────────────────────────────┘
```

### 4. Problèmes UX/UI Identifiés

1. **Formulaire Article** : Contient un champ `contenu` alors que le contenu devrait être dans `article_versions`
2. **Liste Articles** : Affiche `contenu` depuis l'article alors qu'il devrait être chargé depuis la version active
3. **Double source de données** : `textes-queries.ts` et `actes-queries.ts` gèrent les mêmes données différemment

---

## Plan de Correction

### Phase 1 : Mise à Jour des Types TypeScript

Corriger `src/types/textes.ts` pour correspondre au schéma réel de la base de données.

**Modifications :**
- `ActeReglementaire` → Renommer en `TexteReglementaire` avec colonnes correctes
- `Article` → Supprimer `acte_id`, `titre_court`, `contenu_ar/fr`, ajouter `texte_id`
- `ArticleVersion` → Corriger les noms de colonnes

### Phase 2 : Consolidation des Query Files

**Supprimer/Refactorer :**
- `src/lib/actes-queries.ts` → Migrer vers `src/lib/textes-queries.ts`
- `src/lib/textes-reglementaires-queries.ts` → Fusionner avec `textes-queries.ts`

**Fichier unique :** `src/lib/bibliotheque-queries.ts` avec :
- `textesQueries` (CRUD textes_reglementaires)
- `articlesQueries` (CRUD articles)
- `versionsQueries` (CRUD article_versions)
- `domainesQueries` (CRUD domaines_reglementaires)
- `sousDomainesQueries` (CRUD sous_domaines_application)

### Phase 3 : Correction des Composants de Formulaire

#### 3.1 TexteFormModal.tsx
- Vérifier les colonnes utilisées correspondent au schéma
- Colonnes correctes : `type`, `reference`, `titre`, `date_publication`, `source_url`, `pdf_url`, `autorite_emettrice_id`, `annee`

#### 3.2 ArticleFormModal.tsx
**Corrections majeures :**
- Supprimer le champ `contenu` du formulaire
- Mapper correctement : `numero` (pas `numero_article`), `titre` (pas `titre_court`), `porte_exigence` (pas `is_exigence`)
- À la création, créer automatiquement une première version

#### 3.3 ArticleVersionManagerModal (nouveau)
- Créer un composant dédié pour gérer les versions
- Champs : `contenu`, `date_effet`, `source_texte_id`, `notes_modifications`

### Phase 4 : Correction des Pages

#### 4.1 BibliothequeReglementaire.tsx
- Vérifier les imports de queries
- Corriger les accès aux colonnes (`reference` pas `reference_officielle`)

#### 4.2 BibliothequeTexteDetail.tsx
- Corriger `numero_article` → `numero`
- Corriger `titre_court` → `titre`
- Charger le contenu depuis `article_versions` avec `statut = 'en_vigueur'`
- Supprimer référence à `articles_effets_juridiques` vers `textes_articles`

#### 4.3 BibliothequeTextes.tsx
- Corriger les colonnes affichées dans la table

### Phase 5 : Correction des Composants Auxiliaires

| Composant | Corrections |
|-----------|-------------|
| `ArticleAutocomplete.tsx` | `numero_article` → `numero` |
| `AbrogationModal.tsx` | `numero_article` → `numero` |
| `ArticleVersionWizard.tsx` | `numero_article` → `numero` |
| `ArticleEffetsTimeline.tsx` | `numero_article` → `numero` |
| `EffetsCreesTab.tsx` | `numero_article` → `numero` |
| `ArticleQuickEffetModal.tsx` | `numero_article` → `numero` |
| `BibliothequeCardView.tsx` | `reference` au lieu de potentiellement autres |
| `BibliothequeDataGrid.tsx` | Vérifier les colonnes |

### Phase 6 : Nettoyage et Optimisation

1. **Supprimer les fichiers redondants :**
   - `src/lib/actes-queries.ts` → Migrer et supprimer
   - `src/lib/textes-reglementaires-queries.ts` → Fusionner et supprimer

2. **Mettre à jour les imports :**
   - Tous les fichiers utilisant `actes-queries` → `bibliotheque-queries`

3. **Ajouter la validation côté client :**
   - Schémas Zod alignés avec la base de données

### Phase 7 : Tests et Validation

1. Créer un texte réglementaire via le formulaire
2. Ajouter un article au texte
3. Créer une version pour l'article
4. Vérifier l'affichage dans la liste
5. Modifier l'article
6. Modifier la version
7. Tester la recherche et les filtres

---

## Résumé des Fichiers à Modifier

| Catégorie | Fichiers | Priorité |
|-----------|----------|----------|
| Types | `src/types/textes.ts` | HAUTE |
| Queries | `src/lib/textes-queries.ts` (refactoring complet) | HAUTE |
| Queries | `src/lib/actes-queries.ts` (supprimer après migration) | HAUTE |
| Formulaires | `src/components/TexteFormModal.tsx` | HAUTE |
| Formulaires | `src/components/ArticleFormModal.tsx` | HAUTE |
| Pages | `src/pages/BibliothequeTexteDetail.tsx` | HAUTE |
| Pages | `src/pages/BibliothequeReglementaire.tsx` | MOYENNE |
| Pages | `src/pages/BibliothequeTextes.tsx` | MOYENNE |
| Composants | `src/components/bibliotheque/BibliothequeDataGrid.tsx` | MOYENNE |
| Composants | `src/components/bibliotheque/BibliothequeCardView.tsx` | MOYENNE |
| Composants | 6 composants auxiliaires (Autocomplete, Timeline, etc.) | MOYENNE |

---

## Estimations

| Phase | Durée Estimée | Complexité |
|-------|--------------|------------|
| Phase 1 (Types) | 30 min | Moyenne |
| Phase 2 (Queries) | 2h | Haute |
| Phase 3 (Formulaires) | 1h30 | Haute |
| Phase 4 (Pages) | 1h30 | Haute |
| Phase 5 (Composants) | 1h | Moyenne |
| Phase 6 (Nettoyage) | 30 min | Basse |
| Phase 7 (Tests) | 30 min | Basse |

**Total estimé : 7-8 heures de développement**

---

## Architecture Cible

Après correction, l'architecture sera :

```text
src/lib/bibliotheque-queries.ts    ← Source unique pour toutes les requêtes
    ├── textesQueries              ← CRUD textes_reglementaires
    ├── articlesQueries            ← CRUD articles
    ├── versionsQueries            ← CRUD article_versions
    ├── domainesQueries            ← CRUD domaines_reglementaires
    └── sousDomainesQueries        ← CRUD sous_domaines_application

src/types/bibliotheque.ts          ← Types alignés avec la BDD
    ├── TexteReglementaire
    ├── Article
    ├── ArticleVersion
    ├── DomaineReglementaire
    └── SousDomaineApplication
```
