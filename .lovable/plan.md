
# Plan Complet de Correction des Modules Bibliothèque et Veille Réglementaire

## Contexte Technique du Versionnement Réglementaire Tunisien

### Hiérarchie des Normes Tunisiennes
Le système doit respecter la pyramide normative tunisienne où les textes de niveau supérieur ne peuvent être modifiés que par des textes de niveau égal ou supérieur:

```text
CONSTITUTION (2022)
    ↓ peut modifier/abroger
LOIS (قوانين) - votées par l'ARP
    ↓ peuvent modifier/abroger
DÉCRETS-LOIS (مراسيم) - période transitoire
    ↓ peuvent modifier/abroger
DÉCRETS (مراسيم حكومية) - application des lois
    ↓ peuvent modifier/abroger
ARRÊTÉS (قرارات وزارية) - détails techniques
    ↓ peuvent compléter
CIRCULAIRES (مناشير) - interprétatives, non-normatives
```

### Cycle de Vie d'un Article Réglementaire

Un article traverse plusieurs états selon les textes modificatifs publiés au JORT:

```text
┌─────────────────────────────────────────────────────────────────┐
│                    CYCLE DE VIE D'UN ARTICLE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   1. CRÉATION (Texte initial)                                   │
│      └─> Version 1 (en_vigueur)                                 │
│           └─> date_effet = date_publication du texte            │
│           └─> source_texte_id = texte créateur                  │
│                                                                 │
│   2. MODIFICATION (Décret/Loi modificatif)                      │
│      └─> Version 2 (en_vigueur)                                 │
│           └─> Version 1 passe à "remplacée"                     │
│           └─> source_texte_id = texte modificatif               │
│                                                                 │
│   3. REMPLACEMENT (Nouveau texte substitutif)                   │
│      └─> Version 3 (en_vigueur)                                 │
│           └─> Version 2 passe à "remplacée"                     │
│           └─> Traçabilité complète conservée                    │
│                                                                 │
│   4. ABROGATION (Texte abrogatoire)                             │
│      └─> Version 4 (en_vigueur, contenu=avis d'abrogation)      │
│           └─> Version 3 passe à "abrogée"                       │
│           └─> Article non applicable pour la veille             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Analyse de l'Architecture Actuelle

### Tables et Relations

```text
┌──────────────────────────────────────────────────────────────────┐
│                    ARCHITECTURE CORRECTE                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  textes_reglementaires                                           │
│  ├─ id, type, reference, titre, date_publication                 │
│  ├─ source_url, pdf_url, autorite_id                            │
│  └─ textes_domaines → domaines_reglementaires                    │
│           │                                                      │
│           ▼                                                      │
│       articles (TABLE CORRECTE - VIDE)                           │
│       ├─ id, texte_id, numero, titre, resume                     │
│       ├─ est_introductif, porte_exigence                         │
│       ├─ article_sous_domaines → sous_domaines_application       │
│       │                                                          │
│       └───────► article_versions                                 │
│                 ├─ id, article_id, numero_version                │
│                 ├─ contenu (texte complet)                       │
│                 ├─ date_effet (entrée en vigueur)                │
│                 ├─ statut (en_vigueur/remplacee/abrogee)        │
│                 ├─ source_texte_id → textes_reglementaires       │
│                 ├─ notes_modifications                           │
│                 └─ created_by → profiles                         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Problème Critique Identifié

**Deux tables d'articles coexistent avec des schémas différents:**

| Caractéristique | `articles` (CORRECTE) | `textes_articles` (LEGACY) |
|-----------------|----------------------|----------------------------|
| Enregistrements | **0** | **1** |
| Colonne titre | `titre` | `titre_court` + `titre` |
| Colonne numéro | `numero` | `numero_article` |
| Flag exigence | `porte_exigence` | `is_exigence` |
| Contenu | Dans `article_versions` | Directement dans la table |
| Utilisée par | Edge Function, textes-reglementaires-queries.ts | VeilleApplicabilite.tsx, textes-queries.ts (getAll) |

---

## Corrections Requises

### Phase 1: Corrections du Code Frontend

#### 1.1 VeilleApplicabilite.tsx (Ligne 277)
**Problème**: Requête sur `textes_articles` avec colonnes legacy
**Solution**: Migrer vers `articles` + `article_versions` pour le contenu

| Avant | Après |
|-------|-------|
| `textes_articles` | `articles` |
| `numero_article` | `numero` |
| `titre_court` | `titre` |
| `contenu` | Via `article_versions` (statut='en_vigueur') |
| `is_exigence` | `porte_exigence` |

#### 1.2 ConformiteEvaluationNew.tsx (Ligne 168)
Même migration que VeilleApplicabilite

#### 1.3 PlanAction.tsx (Ligne 99)
Même migration que VeilleApplicabilite

#### 1.4 textes-queries.ts (Ligne 265)
**Problème**: `articles:textes_articles(count)` dans getAll
**Solution**: `articles:articles(count)`

### Phase 2: Correction de l'Edge Function

#### 2.1 recherche-reglementaire/index.ts (Ligne 113)
**Problème**: Référence `articles_sous_domaines` (table inexistante)
**Solution**: Corriger en `article_sous_domaines` (nom réel de la table)

### Phase 3: Migration des Données

#### 3.1 Migrer les données de textes_articles vers articles

La table legacy contient 1 enregistrement qui doit être migré:

```sql
INSERT INTO articles (texte_id, numero, titre, resume, porte_exigence, est_introductif)
SELECT 
  texte_id,
  COALESCE(numero, numero_article, 'Art. 1'),
  COALESCE(titre, titre_court, 'Sans titre'),
  NULL,
  COALESCE(is_exigence, true),
  false
FROM textes_articles
WHERE texte_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM articles a 
  WHERE a.texte_id = textes_articles.texte_id 
  AND a.numero = COALESCE(textes_articles.numero, textes_articles.numero_article)
);
```

#### 3.2 Créer les versions initiales

```sql
INSERT INTO article_versions (
  article_id, 
  numero_version, 
  contenu, 
  date_effet, 
  statut, 
  source_texte_id
)
SELECT 
  a.id,
  1,
  COALESCE(ta.contenu, '<p>Contenu à compléter</p>'),
  COALESCE(tr.date_publication, CURRENT_DATE),
  'en_vigueur',
  a.texte_id
FROM articles a
JOIN textes_articles ta ON ta.texte_id = a.texte_id
JOIN textes_reglementaires tr ON tr.id = a.texte_id
WHERE NOT EXISTS (
  SELECT 1 FROM article_versions av WHERE av.article_id = a.id
);
```

### Phase 4: Nettoyage et Validation

#### 4.1 Vérifier l'intégrité
- S'assurer que chaque article a au moins une version
- S'assurer que la contrainte unique `en_vigueur` par article est respectée
- Vérifier les FK entre article_versions et profiles

#### 4.2 Tester les fonctionnalités
- Créer un nouveau texte via /bibliotheque
- Ajouter des articles au texte
- Créer des versions avec texte source
- Vérifier que VeilleApplicabilite affiche les articles

---

## Résumé des Fichiers à Modifier

### Frontend (4 fichiers)

| Fichier | Ligne | Modification |
|---------|-------|-------------|
| `src/pages/VeilleApplicabilite.tsx` | 277 | `textes_articles` → `articles` + mapping colonnes |
| `src/pages/ConformiteEvaluationNew.tsx` | 168 | `textes_articles` → `articles` |
| `src/pages/PlanAction.tsx` | 99 | `textes_articles` → `articles` |
| `src/lib/textes-queries.ts` | 265 | `textes_articles(count)` → `articles(count)` |

### Edge Function (1 fichier)

| Fichier | Ligne | Modification |
|---------|-------|-------------|
| `supabase/functions/recherche-reglementaire/index.ts` | 113, 173, 182, 265 | `articles_sous_domaines` → `article_sous_domaines` |

### Base de données (via migration)

1. Migrer données `textes_articles` → `articles`
2. Créer versions initiales dans `article_versions`
3. (Optionnel) Supprimer `textes_articles` après validation

---

## Ordre d'Implémentation Recommandé

1. **Phase 1**: Corrections frontend (VeilleApplicabilite, ConformiteEvaluation, PlanAction, textes-queries)
2. **Phase 2**: Correction Edge Function (recherche-reglementaire)
3. **Phase 3**: Migration de données (articles + versions)
4. **Phase 4**: Tests end-to-end
5. **Phase 5**: Nettoyage optionnel (suppression textes_articles)

---

## Architecture de Versionnement - Récapitulatif

### Modèle Conceptuel

```text
┌────────────────────────────────────────────────────────────────────────────┐
│  TEXTE RÉGLEMENTAIRE (Source officielle - JORT)                            │
│  - Décret n°2000-1985 du 12 septembre 2000                                 │
│  - Relatif aux EPI dans les établissements industriels                     │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ARTICLES (Subdivisions normatives)                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Art. 1 - Définitions                                                │   │
│  │ ├─ Version 1 (en_vigueur depuis 12/09/2000)                         │   │
│  │ │    Source: Décret n°2000-1985                                     │   │
│  │ │    Contenu: "Au sens du présent décret..."                        │   │
│  │ └─ Sous-domaines: SST-01 (EPI)                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Art. 2 - Obligations de l'employeur                                 │   │
│  │ ├─ Version 1 (remplacée depuis 15/03/2015)                          │   │
│  │ │    Source: Décret n°2000-1985                                     │   │
│  │ ├─ Version 2 (en_vigueur depuis 15/03/2015)                         │   │
│  │ │    Source: Décret n°2015-456 modifiant le décret n°2000-1985      │   │
│  │ │    Contenu: "L'employeur doit fournir..."                         │   │
│  │ │    Notes: Ajout d'obligations de formation                        │   │
│  │ └─ Sous-domaines: SST-01 (EPI), SST-07 (Formation)                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Art. 5 - Sanctions (ABROGÉ)                                         │   │
│  │ ├─ Version 1 (abrogée depuis 01/01/2020)                            │   │
│  │ │    Source: Décret n°2000-1985                                     │   │
│  │ └─ Version 2 (en_vigueur - avis d'abrogation)                       │   │
│  │      Source: Loi n°2019-12 abrogeant l'art. 5                       │   │
│  │      Contenu: "Article abrogé par Loi n°2019-12"                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Champs Clés de la Version

| Champ | Description | Exemple |
|-------|-------------|---------|
| `article_id` | Lien vers l'article parent | UUID |
| `numero_version` | Numéro séquentiel (1, 2, 3...) | 2 |
| `contenu` | Texte intégral HTML | `<p>L'employeur doit...</p>` |
| `date_effet` | Date d'entrée en vigueur | 2015-03-15 |
| `statut` | État actuel | en_vigueur / remplacee / abrogee |
| `source_texte_id` | Texte ayant créé cette version | UUID du décret modificatif |
| `notes_modifications` | Explication des changements | "Ajout obligations formation" |
| `created_by` | Staff ayant saisi la version | UUID profil |

---

## Workflow Complet de Mise à Jour Réglementaire

1. **Publication au JORT** d'un texte modificatif
2. **Staff Bibliothèque** crée le nouveau texte dans `/bibliotheque/textes`
3. **Staff Bibliothèque** ouvre l'article impacté via `/bibliotheque/textes/{id}`
4. **Staff Bibliothèque** clique "Nouvelle version" dans ArticleVersionManagerModal
5. Le système:
   - Sélectionne le texte source (modificatif)
   - Définit la date d'effet
   - Saisit le nouveau contenu
   - Ajoute des notes de modification
6. À la sauvegarde:
   - Nouvelle version créée avec statut `en_vigueur`
   - Ancienne version passe à `remplacée` automatiquement
   - Alertes générées pour les sites ayant marqué l'article comme "obligatoire"
7. **Client Veille** voit les alertes dans son tableau de bord
8. **Client Veille** réévalue la conformité si nécessaire

