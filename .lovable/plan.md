
# Plan: Fix Bibliothèque Réglementaire Module - Comprehensive Audit

## Problems Identified

### 1. Article Deletion on `/bibliotheque/articles` Fails
**Root Cause:** The `deleteMutation` in `BibliothequeArticles.tsx` (line 140-174) manually deletes article dependencies but then calls `textesArticlesQueries.delete(articleId)` which performs a direct `DELETE FROM articles` query. This triggers the `prevent_article_deletion_with_versions` database trigger that blocks deletion if versions exist - even though versions were just deleted!

**Why it happens:** The trigger runs BEFORE each DELETE, but the JavaScript code deletes versions first, then tries to delete the article. However, the JavaScript deletions are separate queries, not a transaction. The trigger still sees versions in the database at check time.

### 2. Database Trigger Deadlock (Same as Textes)
The same deadlock pattern affects articles:
- Trigger `check_article_has_no_versions_before_delete` - blocks article deletion if versions exist
- Trigger `check_article_has_at_least_one_version` - blocks deleting the last version

### 3. No RPC Function for Article Cascade Delete
Unlike textes which now have `delete_texte_cascade`, articles have no equivalent bypass mechanism.

### 4. Client Users See CRUD Buttons
`/client-bibliotheque/articles` uses the same `BibliothequeArticles` component as staff, exposing edit/delete buttons to clients.

### 5. Legacy Code References
Several components still reference legacy columns and tables (`numero_article`, `titre_court`, `textes_articles`, `articles_sous_domaines`).

---

## Solution Architecture

### Phase 1: Database - Create `delete_article_cascade` RPC

Create a new RPC function that:
1. Sets the `app.cascade_delete = true` session variable
2. Deletes article dependencies (tags, sous_domaines, codes_liens)
3. Deletes all article_versions
4. Deletes the article itself
5. Resets the session variable

```sql
CREATE OR REPLACE FUNCTION delete_article_cascade(p_article_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Enable cascade delete bypass
  PERFORM set_config('app.cascade_delete', 'true', true);
  
  -- Delete junction table records
  DELETE FROM article_sous_domaines WHERE article_id = p_article_id;
  DELETE FROM article_tags WHERE article_id = p_article_id;
  DELETE FROM codes_liens_articles WHERE article_id = p_article_id;
  
  -- Delete all versions
  DELETE FROM article_versions WHERE article_id = p_article_id;
  
  -- Delete the article
  DELETE FROM articles WHERE id = p_article_id;
  
  -- Reset flag
  PERFORM set_config('app.cascade_delete', 'false', true);
END;
$$;

GRANT EXECUTE ON FUNCTION delete_article_cascade(UUID) TO authenticated;
```

### Phase 2: Frontend - Update Article Deletion Logic

**File: `src/lib/textes-queries.ts`**

Add `deleteWithCascade` method to `textesArticlesQueries`:

```typescript
async deleteWithCascade(articleId: string) {
  const { error } = await supabase.rpc('delete_article_cascade', {
    p_article_id: articleId
  });
  if (error) throw error;
}
```

**File: `src/pages/BibliothequeArticles.tsx`**

Replace the inline deletion logic with the RPC call:

```typescript
const deleteMutation = useMutation({
  mutationFn: (articleId: string) => textesArticlesQueries.deleteWithCascade(articleId),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["articles-list"] });
    queryClient.invalidateQueries({ queryKey: ["articles-stats"] });
    queryClient.invalidateQueries({ queryKey: ["texte-articles"] });
    toast.success("Article supprimé avec succès");
    setDeleteDialogOpen(false);
    setArticleToDelete(null);
  },
  onError: (error: any) => {
    toast.error("Échec de la suppression", {
      description: error.message || "Une erreur est survenue"
    });
  },
});
```

### Phase 3: Client Access - Hide CRUD for Client Users

**File: `src/pages/BibliothequeArticles.tsx`**

Add user type detection and conditionally pass CRUD handlers:

```typescript
import { useUserType } from "@/hooks/useUserType";

export default function BibliothequeArticles() {
  const userType = useUserType();
  const isStaff = userType === 'staff';
  
  // ... existing code ...
  
  return (
    <div>
      {/* Hide Create button for clients */}
      {isStaff && (
        <Button onClick={handleCreateArticle}>
          <Plus /> Créer un article
        </Button>
      )}
      
      {/* Pass CRUD handlers only for staff */}
      <ArticlesDataGrid
        articles={articlesResult?.data || []}
        isLoading={articlesLoading}
        onViewArticle={(article) => setSelectedArticle(article)}
        onEditArticle={isStaff ? handleEditArticle : undefined}
        onDeleteArticle={isStaff ? handleDeleteArticle : undefined}
      />
      
      {/* Only render form modal for staff */}
      {isStaff && isFormOpen && (
        <ArticleFormModal ... />
      )}
      
      {/* Only render delete dialog for staff */}
      {isStaff && (
        <AlertDialog open={deleteDialogOpen} ...>
          ...
        </AlertDialog>
      )}
    </div>
  );
}
```

### Phase 4: Update All Article Delete Call Sites

Other files that call `articlesQueries.delete()` need updating:

| File | Change |
|------|--------|
| `src/pages/GestionTexteDetail.tsx` | Use `deleteWithCascade` |
| `src/pages/BibliothequeTexteDetail.tsx` | Use `deleteWithCascade` |
| `src/components/ArticlesTab.tsx` | Use `deleteWithCascade` |
| `src/components/ArticleManager.tsx` | Use `deleteWithCascade` |
| `src/lib/bibliotheque-unified-queries.ts` | Update export alias |

### Phase 5: Improve Error Messages

**File: `src/components/TexteFormModal.tsx`**

Already has validation - verify error toast descriptions are clear.

**File: `src/pages/BibliothequeArticles.tsx`**

Improve delete error display:

```typescript
onError: (error: any) => {
  const message = error?.message || "Une erreur est survenue";
  
  // Parse known error patterns for user-friendly messages
  if (message.includes("versions")) {
    toast.error("Impossible de supprimer l'article", {
      description: "Veuillez réessayer. Si le problème persiste, contactez le support."
    });
  } else {
    toast.error("Échec de la suppression", { description: message });
  }
}
```

---

## Files to Modify

| # | File | Changes |
|---|------|---------|
| 1 | **Migration** | Create `delete_article_cascade` RPC function |
| 2 | `src/lib/textes-queries.ts` | Add `deleteWithCascade` to `textesArticlesQueries` |
| 3 | `src/lib/bibliotheque-unified-queries.ts` | Add `deleteWithCascade` to `articlesQueries` export |
| 4 | `src/pages/BibliothequeArticles.tsx` | Use RPC for deletion, hide CRUD for clients, improve errors |
| 5 | `src/pages/GestionTexteDetail.tsx` | Update to use `deleteWithCascade` |
| 6 | `src/pages/BibliothequeTexteDetail.tsx` | Update to use `deleteWithCascade` |
| 7 | `src/components/ArticlesTab.tsx` | Update to use `deleteWithCascade` |
| 8 | `src/components/ArticleManager.tsx` | Update to use `deleteWithCascade` |

---

## Technical Details

### Migration SQL

```sql
-- Create cascade delete function for articles
CREATE OR REPLACE FUNCTION delete_article_cascade(p_article_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Enable cascade delete bypass for trigger validation
  PERFORM set_config('app.cascade_delete', 'true', true);
  
  -- Delete article junction tables
  DELETE FROM article_sous_domaines WHERE article_id = p_article_id;
  DELETE FROM article_tags WHERE article_id = p_article_id;
  DELETE FROM codes_liens_articles WHERE article_id = p_article_id;
  
  -- Delete all versions of this article
  DELETE FROM article_versions WHERE article_id = p_article_id;
  
  -- Delete the article itself
  DELETE FROM articles WHERE id = p_article_id;
  
  -- Reset cascade delete flag
  PERFORM set_config('app.cascade_delete', 'false', true);
END;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION delete_article_cascade(UUID) TO authenticated;
```

### TypeScript Changes

**textes-queries.ts - Add method:**
```typescript
// Inside textesArticlesQueries object, after line 517:
async deleteWithCascade(articleId: string) {
  const { error } = await supabase.rpc('delete_article_cascade', {
    p_article_id: articleId
  });
  if (error) throw error;
}
```

**BibliothequeArticles.tsx - Key changes:**
```typescript
// Add import
import { useUserType } from "@/hooks/useUserType";

// Add hook usage inside component
const userType = useUserType();
const isStaff = userType === 'staff';

// Update deleteMutation
const deleteMutation = useMutation({
  mutationFn: (articleId: string) => textesArticlesQueries.deleteWithCascade(articleId),
  // ... rest unchanged
});

// Conditionally render Create button
{isStaff && (
  <Button onClick={handleCreateArticle} className="gap-2">
    <Plus className="h-4 w-4" />
    <span>Créer un article</span>
  </Button>
)}

// Pass undefined for CRUD callbacks for clients
<ArticlesDataGrid
  onEditArticle={isStaff ? handleEditArticle : undefined}
  onDeleteArticle={isStaff ? handleDeleteArticle : undefined}
/>
```

---

## Expected Behavior After Fix

1. Staff can delete any article - RPC bypasses triggers and cleanly removes all related data
2. Client users see the articles list but no Create/Edit/Delete buttons
3. Error messages are clear and actionable
4. All deletion call sites use the same reliable RPC method
5. No orphaned records in junction tables after deletion

---

## Testing Checklist

After implementation, verify:
- [ ] Staff can delete an article with multiple versions
- [ ] Staff can delete an article with tags and sous-domaines
- [ ] Staff can create/edit articles normally
- [ ] Client users on `/client-bibliotheque/articles` see no CRUD buttons
- [ ] Client users cannot access article creation/editing modals
- [ ] Error toasts display meaningful messages on failure
- [ ] Texte deletion still works correctly (regression test)
