# Plan Complet de Correction des Modules Bibliothèque et Veille Réglementaire

## ✅ IMPLEMENTATION COMPLETE - 2026-02-02

---

## Résumé de l'Implémentation

### Phase 1: Corrections du Code Frontend ✅

| Fichier | Statut | Modification |
|---------|--------|-------------|
| `src/pages/VeilleApplicabilite.tsx` | ✅ DONE | Migré `textes_articles` → `articles` + `article_versions` |
| `src/pages/ConformiteEvaluationNew.tsx` | ✅ DONE | Migré vers `articles` avec jointure versions |
| `src/pages/PlanAction.tsx` | ✅ DONE | Migré `textes_articles` → `articles` |
| `src/lib/textes-queries.ts` | ✅ DONE | Corrigé count et getById vers `articles` |

### Phase 2: Correction Edge Function ✅

| Fichier | Statut | Modification |
|---------|--------|-------------|
| `supabase/functions/recherche-reglementaire/index.ts` | ✅ DONE | `articles_sous_domaines` → `article_sous_domaines` |

### Phase 3: Migration des Données ✅

- ✅ 1 article migré de `textes_articles` vers `articles`
- ✅ 1 version créée dans `article_versions` avec statut `en_vigueur`

### Mapping de Colonnes Appliqué

| Ancien (textes_articles) | Nouveau (articles) |
|--------------------------|-------------------|
| `numero_article` | `numero` |
| `titre_court` | `titre` |
| `is_exigence` | `porte_exigence` |
| `contenu` (direct) | Via `article_versions.contenu` |

---

## Contexte Technique du Versionnement Réglementaire Tunisien

### Hiérarchie des Normes Tunisiennes
Le système respecte la pyramide normative tunisienne:

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

```text
┌─────────────────────────────────────────────────────────────────┐
│                    CYCLE DE VIE D'UN ARTICLE                    │
├─────────────────────────────────────────────────────────────────┤
│   1. CRÉATION → Version 1 (en_vigueur)                          │
│   2. MODIFICATION → Version 2 (en_vigueur), V1 → remplacée      │
│   3. REMPLACEMENT → Version 3 (en_vigueur), V2 → remplacée      │
│   4. ABROGATION → Version 4 (avis), V3 → abrogée                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Architecture Actuelle Corrigée

```text
textes_reglementaires (2 enregistrements)
    └─> articles (1 enregistrement - migré)
         └─> article_versions (1 enregistrement - en_vigueur)
         └─> article_sous_domaines (à configurer)
```

---

## Prochaines Étapes Recommandées

1. **Créer plus de données de test** via l'interface `/bibliotheque/textes`
2. **Configurer les domaines Veille** pour les sites clients (`/settings/domains`)
3. **Assigner des sous-domaines** aux articles via l'interface de gestion
4. **Tester le workflow complet** Veille Applicabilité → Conformité → Plan d'action

---

## Notes de Sécurité (à traiter ultérieurement)

- 4 vues avec `SECURITY DEFINER` détectées (risque RLS bypass)
- 14 fonctions sans `search_path` fixé

Ces problèmes de sécurité sont préexistants et non liés à cette migration.

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
