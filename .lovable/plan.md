
# Plan: Fix Texte Réglementaire Deletion - Database Trigger Conflict

## Problem Identified

The deletion fails due to **two conflicting database triggers** that create an impossible situation:

### Trigger 1: `check_article_has_no_versions_before_delete`
```sql
-- Prevents deleting an article if it has versions
RAISE EXCEPTION 'Impossible de supprimer cet article car il possède des versions...'
```

### Trigger 2: `check_article_has_at_least_one_version`
```sql
-- Prevents deleting the last version of an article  
RAISE EXCEPTION 'Impossible de supprimer la dernière version d''un article...'
```

### Why It Fails
When `deleteWithCascade()` runs:
1. Tries to delete versions → **BLOCKED** by trigger 2 (can't delete last version)
2. Tries to delete articles → **BLOCKED** by trigger 1 (articles still have versions)

**Result:** Deadlock - nothing can be deleted

---

## Solution

Create a **database RPC function** with `SECURITY DEFINER` that can properly cascade delete while temporarily bypassing the validation triggers using a session variable flag.

### Step 1: New Database Migration

Create an RPC function `delete_texte_cascade(texte_id UUID)` that:
1. Sets a session variable `app.cascade_delete = true`
2. Deletes in the correct order without trigger interference
3. Resets the session variable

```sql
-- Add bypass check to prevent_last_version_deletion trigger
CREATE OR REPLACE FUNCTION prevent_last_version_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip validation during cascade delete operations
  IF current_setting('app.cascade_delete', true) = 'true' THEN
    RETURN OLD;
  END IF;
  
  -- Original logic...
END;
$$ LANGUAGE plpgsql;

-- Add bypass check to prevent_article_deletion_with_versions trigger
CREATE OR REPLACE FUNCTION prevent_article_deletion_with_versions()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip validation during cascade delete operations
  IF current_setting('app.cascade_delete', true) = 'true' THEN
    RETURN OLD;
  END IF;
  
  -- Original logic...
END;
$$ LANGUAGE plpgsql;

-- Create cascade delete RPC function
CREATE OR REPLACE FUNCTION delete_texte_cascade(p_texte_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_article_ids UUID[];
BEGIN
  -- Enable cascade delete mode
  PERFORM set_config('app.cascade_delete', 'true', true);
  
  -- Get all article IDs for this texte
  SELECT ARRAY_AGG(id) INTO v_article_ids
  FROM articles WHERE texte_id = p_texte_id;
  
  IF v_article_ids IS NOT NULL THEN
    -- Delete article dependencies
    DELETE FROM article_sous_domaines WHERE article_id = ANY(v_article_ids);
    DELETE FROM article_tags WHERE article_id = ANY(v_article_ids);
    DELETE FROM article_versions WHERE article_id = ANY(v_article_ids);
    DELETE FROM articles WHERE id = ANY(v_article_ids);
  END IF;
  
  -- Delete texte dependencies
  DELETE FROM textes_domaines WHERE texte_id = p_texte_id;
  DELETE FROM textes_sous_domaines WHERE texte_id = p_texte_id;
  DELETE FROM texte_tags WHERE texte_id = p_texte_id;
  DELETE FROM textes_codes WHERE texte_id = p_texte_id;
  DELETE FROM changelog_reglementaire WHERE acte_id = p_texte_id;
  DELETE FROM textes_articles WHERE texte_id = p_texte_id;
  
  -- Delete the texte itself
  DELETE FROM textes_reglementaires WHERE id = p_texte_id;
  
  -- Disable cascade delete mode (auto-reset at end of transaction)
  PERFORM set_config('app.cascade_delete', 'false', true);
END;
$$;
```

### Step 2: Update Frontend Code

Update `textes-queries.ts` to call the RPC function instead of individual deletes:

```typescript
async deleteWithCascade(texteId: string) {
  const { error } = await supabase.rpc('delete_texte_cascade', {
    p_texte_id: texteId
  });
  
  if (error) throw error;
}
```

---

## Files to Modify

| # | File | Changes |
|---|------|---------|
| 1 | **New Migration** | Create `delete_texte_cascade` RPC function + update trigger functions |
| 2 | `src/lib/textes-queries.ts` | Update `deleteWithCascade` to use RPC |

---

## Technical Details

### Migration SQL

```sql
-- 1. Update trigger function to respect cascade delete flag
CREATE OR REPLACE FUNCTION prevent_last_version_deletion()
RETURNS TRIGGER AS $$
DECLARE
  version_count INTEGER;
BEGIN
  -- Skip validation during cascade delete operations
  IF current_setting('app.cascade_delete', true) = 'true' THEN
    RETURN OLD;
  END IF;

  SELECT COUNT(*) INTO version_count
  FROM article_versions
  WHERE article_id = OLD.article_id;
  
  IF version_count = 1 THEN
    RAISE EXCEPTION 'Impossible de supprimer la dernière version d''un article. Un article doit avoir au moins une version.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 2. Update trigger function to respect cascade delete flag  
CREATE OR REPLACE FUNCTION prevent_article_deletion_with_versions()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip validation during cascade delete operations
  IF current_setting('app.cascade_delete', true) = 'true' THEN
    RETURN OLD;
  END IF;

  IF EXISTS (
    SELECT 1 FROM article_versions 
    WHERE article_id = OLD.id
  ) THEN
    RAISE EXCEPTION 'Impossible de supprimer cet article car il possède des versions. Supprimez d''abord toutes les versions.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 3. Create the cascade delete RPC function
CREATE OR REPLACE FUNCTION delete_texte_cascade(p_texte_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_article_ids UUID[];
BEGIN
  -- Enable cascade delete mode (transaction-local)
  PERFORM set_config('app.cascade_delete', 'true', true);
  
  -- Get all article IDs for this texte
  SELECT ARRAY_AGG(id) INTO v_article_ids
  FROM articles WHERE texte_id = p_texte_id;
  
  IF v_article_ids IS NOT NULL AND array_length(v_article_ids, 1) > 0 THEN
    -- Delete article dependencies first
    DELETE FROM article_sous_domaines WHERE article_id = ANY(v_article_ids);
    DELETE FROM article_tags WHERE article_id = ANY(v_article_ids);
    DELETE FROM article_versions WHERE article_id = ANY(v_article_ids);
    DELETE FROM articles WHERE id = ANY(v_article_ids);
  END IF;
  
  -- Delete texte junction tables
  DELETE FROM textes_domaines WHERE texte_id = p_texte_id;
  DELETE FROM textes_sous_domaines WHERE texte_id = p_texte_id;
  DELETE FROM texte_tags WHERE texte_id = p_texte_id;
  DELETE FROM textes_codes WHERE texte_id = p_texte_id;
  DELETE FROM changelog_reglementaire WHERE acte_id = p_texte_id;
  DELETE FROM textes_articles WHERE texte_id = p_texte_id;
  
  -- Finally delete the texte
  DELETE FROM textes_reglementaires WHERE id = p_texte_id;
  
  -- Reset flag (auto-resets at transaction end anyway)
  PERFORM set_config('app.cascade_delete', 'false', true);
END;
$$;

-- 4. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_texte_cascade(UUID) TO authenticated;
```

### TypeScript Update

```typescript
// src/lib/textes-queries.ts - Replace lines 397-429

async deleteWithCascade(texteId: string) {
  const { error } = await supabase.rpc('delete_texte_cascade', {
    p_texte_id: texteId
  });
  
  if (error) throw error;
}
```

---

## Why This Solution Works

1. **Session Variable Flag**: `app.cascade_delete` is set only for the duration of the transaction
2. **Trigger Bypass**: Both validation triggers check this flag and skip validation when true
3. **Security**: The RPC function uses `SECURITY DEFINER` to ensure proper permissions
4. **Atomic Transaction**: Everything happens in a single database transaction - if any part fails, everything rolls back
5. **No Breaking Changes**: Normal delete operations (single article, single version) still go through validation

---

## Expected Behavior After Fix

1. Click delete on a texte réglementaire → Confirmation dialog appears
2. Confirm deletion → RPC function executes
3. All articles, versions, and junction records are deleted atomically
4. Success toast appears
5. List refreshes without the deleted texte
