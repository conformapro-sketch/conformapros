
# Plan de Correction: Champs Vides lors de la Modification d'un Article Réglementaire

## Analyse Approfondie

### 1. Problèmes Identifiés

#### 1.1 **BUG PRINCIPAL : Le contenu n'est PAS stocké dans l'article**

La table `articles` ne contient **PAS** de colonne `contenu`. Voici les colonnes disponibles :

| Colonne | Type |
|---------|------|
| id | uuid |
| texte_id | uuid |
| numero | text |
| titre | text |
| resume | text |
| est_introductif | boolean |
| porte_exigence | boolean |
| created_at | timestamp |
| created_by | uuid |
| updated_at | timestamp |

Le contenu est stocké dans `article_versions.contenu`, mais lors de l'édition, le formulaire tente de lire `article.contenu` qui est toujours **undefined** !

```typescript
// ArticleFormModal.tsx ligne 95
contenu: article.contenu || "",  // ❌ BUG: article.contenu n'existe jamais!
```

#### 1.2 **Flux de données incorrect**

```text
┌─────────────────────────────────────────────────────────────────┐
│                  FLUX ACTUEL (DÉFAILLANT)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  BibliothequeTexteDetail.tsx                                    │
│  ├── articles = articlesQueries.getByTexteId(id)                │
│  │   └── Retourne: numero, titre, resume, porte_exigence, etc.  │
│  │       (PAS de contenu!)                                      │
│  │                                                              │
│  └── activeVersionsMap = fetch article_versions                 │
│      └── Retourne: contenu, date_effet, statut                  │
│          (contenu est ICI, pas dans articles)                   │
│                                                                 │
│  handleEditArticle(article)                                     │
│  └── setEditingArticle(article)  ← Article SANS contenu         │
│                                                                 │
│  ArticleFormModal                                               │
│  └── useEffect: setFormData.contenu = article.contenu || ""     │
│      └── article.contenu = undefined → affiche champ vide       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 1.3 **Les champs 'numero' et 'titre' fonctionnent correctement**

La base de données confirme que l'article a bien :
- `numero`: "Article 13"
- `titre`: "définition"
- `porte_exigence`: false

Ces champs devraient s'afficher. Si ils sont vides également, c'est un problème **différent** :

##### Hypothèse A : La modal s'ouvre avant que `editingArticle` ne soit défini
##### Hypothèse B : Le useEffect ne se déclenche pas correctement

#### 1.4 **Conflit de modals**

Il existe **DEUX instances** de `ArticleFormModal` dans BibliothequeTexteDetail.tsx :

```typescript
// Ligne 755-763 - Modal pour AJOUTER (via showArticleModal)
<ArticleFormModal
  open={showArticleModal}
  onOpenChange={setShowArticleModal}
  article={editingArticle}  // ← Utilise editingArticle
/>

// Ligne 775-784 - Modal pour ÉDITER (via showEditArticleModal)
<ArticleFormModal
  open={showEditArticleModal}
  onOpenChange={setShowEditArticleModal}
  article={editingArticle}  // ← Utilise aussi editingArticle!
/>
```

Le problème : les deux modals partagent le même `editingArticle`. Lorsqu'on clique "Ajouter un article" après avoir édité, `editingArticle` n'est pas null, ce qui pollue le formulaire.

---

## 2. Corrections Requises

### 2.1 Charger le contenu de la version active lors de l'édition

Modifier `BibliothequeTexteDetail.tsx` pour inclure le contenu de la version active dans l'objet article :

```typescript
const handleEditArticle = (article: any) => {
  // Enrichir l'article avec le contenu de sa version active
  const activeVersion = activeVersionsMap[article.id];
  setEditingArticle({
    ...article,
    contenu: activeVersion?.contenu || "", // ← AJOUTER le contenu
    activeVersion: activeVersion, // ← Optionnel: pour référence
  });
  setShowEditArticleModal(true);
};
```

### 2.2 Corriger la logique du useEffect dans ArticleFormModal

```typescript
useEffect(() => {
  if (open && article) {
    // Article en mode édition - charger les données
    setFormData({
      numero: article.numero || article.numero_article || "",
      titre: article.titre || article.titre_court || "",
      contenu: article.contenu || "", // Maintenant fourni par handleEditArticle
      porte_exigence: article.porte_exigence ?? article.is_exigence ?? false,
      date_effet: new Date().toISOString().split('T')[0],
    });
    
    // ... reste du code
  } else if (open && !article) {
    // Nouveau article - réinitialiser
    resetForm();
    setSelectedSousDomaines([]);
    // ...
  }
}, [article, open]);
```

### 2.3 Séparer les états pour les deux modals

Créer deux états distincts pour éviter les conflits :

```typescript
const [articleToEdit, setArticleToEdit] = useState<any>(null);  // Pour édition
const [articleToCreate, setArticleToCreate] = useState(false);  // Pour création

// Modal création
<ArticleFormModal
  open={articleToCreate}
  onOpenChange={setArticleToCreate}
  article={null}  // Toujours null pour création
/>

// Modal édition  
<ArticleFormModal
  open={!!articleToEdit}
  onOpenChange={(open) => !open && setArticleToEdit(null)}
  article={articleToEdit}
/>
```

---

## 3. Fichiers à Modifier

| Fichier | Modifications | Priorité |
|---------|---------------|----------|
| `src/pages/BibliothequeTexteDetail.tsx` | 1. Enrichir article avec contenu dans `handleEditArticle`, 2. Séparer états modals | HAUTE |
| `src/components/ArticleFormModal.tsx` | 1. Améliorer useEffect pour gérer `open` correctement, 2. Ajouter logs debug temporaires | HAUTE |

---

## 4. Détails des Modifications

### 4.1 BibliothequeTexteDetail.tsx

#### Modification de handleEditArticle (ligne 302-305)

```typescript
const handleEditArticle = (article: any) => {
  // Récupérer le contenu de la version active
  const activeVersion = activeVersionsMap[article.id];
  
  setEditingArticle({
    ...article,
    contenu: activeVersion?.contenu || "",
    _activeVersionId: activeVersion?.id,
    _activeVersionNumero: activeVersion?.numero_version,
  });
  setShowEditArticleModal(true);
};
```

#### Supprimer la duplication de modals (ligne 755-784)

Conserver **uniquement** la modal d'édition et utiliser `editingArticle === null` pour distinguer création vs édition :

```typescript
{/* Single ArticleFormModal for both create and edit */}
<ArticleFormModal
  open={showArticleModal || showEditArticleModal}
  onOpenChange={(open) => {
    if (!open) {
      setShowArticleModal(false);
      setShowEditArticleModal(false);
      setEditingArticle(null);
    }
  }}
  texteId={id!}
  article={showEditArticleModal ? editingArticle : null}
  onSuccess={() => {
    setEditingArticle(null);
    setShowArticleModal(false);
    setShowEditArticleModal(false);
    queryClient.invalidateQueries({ queryKey: ["texte-articles", id] });
    queryClient.invalidateQueries({ queryKey: ["article-active-versions", id] });
  }}
/>
```

### 4.2 ArticleFormModal.tsx

#### Améliorer le useEffect (ligne 90-126)

```typescript
useEffect(() => {
  // Ne rien faire si la modal n'est pas ouverte
  if (!open) return;
  
  if (article) {
    console.log("[ArticleFormModal] Loading article data:", article);
    
    setFormData({
      numero: article.numero || article.numero_article || "",
      titre: article.titre || article.titre_court || "",
      contenu: article.contenu || "", // Contenu depuis version active (enrichi par parent)
      porte_exigence: article.porte_exigence ?? article.is_exigence ?? false,
      date_effet: new Date().toISOString().split('T')[0],
    });
    
    // Load existing sous-domaines
    if (article.sous_domaines) {
      const sousDomaineIds = article.sous_domaines
        .map((sd: any) => sd.sous_domaine?.id)
        .filter(Boolean);
      setSelectedSousDomaines(sousDomaineIds);
    } else {
      setSelectedSousDomaines([]);
    }
  } else {
    // Mode création - réinitialiser le formulaire
    console.log("[ArticleFormModal] New article mode - resetting form");
    resetForm();
    setSelectedSousDomaines([]);
    setHasEffet(false);
    setEffetData({
      type_effet: "MODIFIE" as TypeEffet,
      texte_cible_id: "",
      article_cible_id: "",
      nouvelle_numerotation: "",
      date_effet: "",
      date_fin_effet: "",
      reference_citation: "",
      notes: "",
      portee: "article" as PorteeEffet,
      portee_detail: "",
    });
    setHierarchyValidation(null);
  }
}, [article, open]);
```

---

## 5. Flux Corrigé

```text
┌─────────────────────────────────────────────────────────────────┐
│                  FLUX CORRIGÉ                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  BibliothequeTexteDetail.tsx                                    │
│  ├── articles = articlesQueries.getByTexteId(id)                │
│  │   └── Retourne: numero, titre, resume, porte_exigence        │
│  │                                                              │
│  ├── activeVersionsMap[articleId] = { contenu, ... }            │
│  │                                                              │
│  └── handleEditArticle(article)                                 │
│      └── setEditingArticle({                                    │
│            ...article,                                          │
│            contenu: activeVersionsMap[article.id]?.contenu      │
│          })                                                     │
│                                                                 │
│  ArticleFormModal                                               │
│  └── useEffect: formData.contenu = article.contenu              │
│      └── article.contenu = "contenu réel" → Affiché!            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Tests de Validation

- [ ] Créer un nouvel article avec contenu → vérifier sauvegarde
- [ ] Modifier un article existant → vérifier que les champs sont pré-remplis
- [ ] Modifier le contenu d'un article → vérifier que les changements sont sauvegardés
- [ ] Créer un article après avoir édité → vérifier que le formulaire est vide
- [ ] Vérifier les sous-domaines lors de l'édition
- [ ] Vérifier la checkbox "porte_exigence" lors de l'édition

---

## 7. Résumé des Bugs Corrigés

| Bug | Cause | Solution |
|-----|-------|----------|
| Champ contenu vide | Le contenu est dans `article_versions`, pas dans `articles` | Enrichir l'objet article avec le contenu de sa version active |
| Potentiels champs metadata vides | useEffect peut ne pas se déclencher correctement | Ajouter condition `if (!open) return` |
| Conflits entre modals | Deux instances de modal partageant le même état | Unifier en une seule modal avec logique conditionnelle |
| État résiduel après édition | `editingArticle` non réinitialisé | Reset explicite dans onOpenChange |
