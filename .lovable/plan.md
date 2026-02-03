
# Plan de Correction: Sauvegarde du Contenu des Articles Réglementaires

## Diagnostic Confirmé

### Problème Identifié
L'article `3bf23534-cb6b-46a9-b331-94a67a9e5253` existe dans la table `articles` mais n'a **aucune version correspondante** dans la table `article_versions`. Le contenu ne s'affiche pas car il n'a jamais été sauvegardé.

### Cause Racine

1. **Validation du contenu défaillante** : Le code utilise `formData.contenu.trim()` pour vérifier si le contenu est vide, mais le RichTextEditor (TipTap) retourne du HTML même quand l'éditeur est "vide" (ex: `<p></p>`). Cette chaîne n'est pas considérée comme vide après `.trim()`.

2. **Condition de sauvegarde** : Dans `ArticleFormModal.tsx` ligne 209, la création de version initiale est conditionnée par:
```typescript
if (data.contenu && data.contenu.trim()) {
```
Cette condition passe même pour `<p></p>`, mais le contenu est effectivement vide visuellement.

3. **Incohérence entre création et édition** : 
   - La création d'article tente de créer une version initiale (ligne 209-226)
   - L'édition d'article ne crée PAS de nouvelle version - elle ne modifie que les métadonnées (ligne 336-346)
   - Si l'article a été créé sans contenu (ou avec un contenu HTML vide), il reste sans version

4. **Article existant sans version** : L'article actuel a été créé le `2026-02-03 12:51:17` probablement avec un contenu vide ou via un ancien code qui ne créait pas de version initiale.

## Corrections Requises

### 1. Améliorer la validation du contenu vide

Créer une fonction utilitaire pour détecter si le contenu HTML est réellement vide:

```typescript
// Détecte si le contenu HTML est visuellement vide
function isHtmlContentEmpty(html: string): boolean {
  if (!html) return true;
  // Supprimer les balises HTML et les espaces
  const textContent = html
    .replace(/<[^>]*>/g, '') // Supprimer les balises
    .replace(/&nbsp;/g, ' ') // Remplacer les espaces insécables
    .trim();
  return textContent.length === 0;
}
```

### 2. Corriger ArticleFormModal.tsx

| Ligne | Modification |
|-------|-------------|
| 209 | Utiliser `isHtmlContentEmpty()` au lieu de `.trim()` |
| 370-372 | Mettre à jour la validation pour utiliser `isHtmlContentEmpty()` |
| 336-346 | Ajouter la logique pour créer/mettre à jour la version lors de l'édition |

### 3. Ajouter la création de version lors de l'édition d'article

Actuellement, l'édition (`updateMutation`) ne gère pas le contenu du tout. Il faut:
1. Permettre l'édition du contenu dans le formulaire (déjà présent visuellement)
2. Si le contenu est modifié ET non-vide, créer une nouvelle version
3. Ou permettre de créer une version initiale si l'article n'en a pas

### 4. Invalider les queries correctement

Ajouter les invalidations pour les queries de versions après les mutations.

## Fichiers à Modifier

| Fichier | Modifications |
|---------|---------------|
| `src/lib/utils.ts` | Ajouter fonction `isHtmlContentEmpty()` |
| `src/components/ArticleFormModal.tsx` | 1. Importer `isHtmlContentEmpty`, 2. Corriger validation ligne 370, 3. Corriger condition ligne 209, 4. Ajouter logique de version dans `updateMutation` |
| `src/pages/BibliothequeTexteDetail.tsx` | Afficher un indicateur si l'article n'a pas de version (pour diagnostic) |

## Détails Techniques

### Modification de la validation du contenu (ArticleFormModal.tsx)

```typescript
// Avant (ligne 370)
if (!article && !formData.contenu.trim()) {

// Après
if (!article && isHtmlContentEmpty(formData.contenu)) {
```

### Modification de la création de version (ArticleFormModal.tsx)

```typescript
// Avant (ligne 209)
if (data.contenu && data.contenu.trim()) {

// Après
if (data.contenu && !isHtmlContentEmpty(data.contenu)) {
```

### Ajout de la gestion des versions lors de l'édition

Dans `updateMutation`, ajouter:

```typescript
// Si contenu fourni et article n'a pas de version active, créer une version initiale
if (data.contenu && !isHtmlContentEmpty(data.contenu)) {
  // Vérifier si une version existe
  const { data: existingVersion } = await supabase
    .from("article_versions")
    .select("id")
    .eq("article_id", id)
    .eq("statut", "en_vigueur")
    .limit(1)
    .maybeSingle();
  
  if (!existingVersion) {
    // Créer une version initiale
    await supabase.from("article_versions").insert({
      article_id: id,
      numero_version: 1,
      contenu: data.contenu,
      date_effet: new Date().toISOString().split('T')[0],
      statut: "en_vigueur",
      source_texte_id: texteId,
      notes_modifications: "Version initiale",
    });
  }
}
```

### Migration de données pour l'article existant

Exécuter une requête SQL pour créer une version initiale pour les articles orphelins:

```sql
INSERT INTO article_versions (
  article_id,
  numero_version,
  contenu,
  date_effet,
  statut,
  source_texte_id,
  notes_modifications
)
SELECT 
  a.id,
  1,
  '<p>Contenu à compléter</p>',
  COALESCE(t.date_publication, CURRENT_DATE),
  'en_vigueur',
  a.texte_id,
  'Version initiale créée automatiquement'
FROM articles a
JOIN textes_reglementaires t ON a.texte_id = t.id
WHERE NOT EXISTS (
  SELECT 1 FROM article_versions av WHERE av.article_id = a.id
);
```

## Résumé des Changements

```text
┌──────────────────────────────────────────────────────────────────┐
│                    FLUX DE SAUVEGARDE CORRIGÉ                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. CRÉATION D'ARTICLE (Nouveau)                                 │
│     ├─ Créer article dans `articles`                             │
│     ├─ SI contenu non-vide (via isHtmlContentEmpty)              │
│     │   └─ Créer version 1 dans `article_versions`               │
│     └─ Lier sous-domaines                                        │
│                                                                  │
│  2. ÉDITION D'ARTICLE                                            │
│     ├─ Mettre à jour métadonnées dans `articles`                 │
│     ├─ SI contenu fourni ET pas de version active                │
│     │   └─ Créer version 1 dans `article_versions`               │
│     └─ Mettre à jour sous-domaines                               │
│                                                                  │
│  3. AJOUT DE VERSION (ArticleVersionWizard)                      │
│     ├─ Créer nouvelle version avec statut "en_vigueur"           │
│     └─ Passer ancienne version à "remplacée"                     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Ordre d'Implémentation

1. **Étape 1** : Ajouter la fonction `isHtmlContentEmpty` dans `src/lib/utils.ts`
2. **Étape 2** : Corriger les validations dans `ArticleFormModal.tsx`
3. **Étape 3** : Corriger la création de version dans `createMutation`
4. **Étape 4** : Ajouter la création de version dans `updateMutation`
5. **Étape 5** : Migrer les articles orphelins via SQL
6. **Étape 6** : Tester le flux complet (création, édition, versions)
