
# Plan: Fix CRUD Operations for Textes Réglementaires on /bibliotheque/textes

## Problem Analysis

The `/bibliotheque/textes` page currently has incomplete CRUD functionality:

1. **Missing Delete Feature**: No delete button, no delete confirmation dialog, no delete mutation
2. **Missing Edit Access in Table**: Only a "View" button exists, no edit/delete row actions
3. **Foreign Key Constraints**: When deletion is attempted, it fails because the delete function doesn't handle dependent records in the correct order

### Database Dependencies

When deleting a `textes_reglementaires` record, these dependent tables must be cleaned first (in order):

```text
textes_reglementaires
├── article_versions (via articles.texte_id → source_texte_id)
├── article_sous_domaines (via articles.texte_id → article_id)
├── articles (texte_id)
├── textes_domaines (texte_id)
├── textes_sous_domaines (texte_id)
├── texte_tags (texte_id)
├── textes_articles (legacy table, texte_id)
└── changelog_reglementaire (acte_id)
```

---

## Solution

### 1. Create Cascading Delete Function in textes-queries.ts

Add a new function `deleteWithCascade` that properly handles all dependencies:

```typescript
async deleteWithCascade(texteId: string) {
  // 1. Get all article IDs for this texte
  const { data: articles } = await supabase
    .from("articles")
    .select("id")
    .eq("texte_id", texteId);
  
  const articleIds = articles?.map(a => a.id) || [];
  
  if (articleIds.length > 0) {
    // 2. Delete article_sous_domaines for these articles
    await supabase
      .from("article_sous_domaines")
      .delete()
      .in("article_id", articleIds);
    
    // 3. Delete article_versions for these articles
    await supabase
      .from("article_versions")
      .delete()
      .in("article_id", articleIds);
    
    // 4. Delete articles
    await supabase
      .from("articles")
      .delete()
      .in("id", articleIds);
  }
  
  // 5. Delete textes_domaines junction
  await supabase
    .from("textes_domaines")
    .delete()
    .eq("texte_id", texteId);
  
  // 6. Delete textes_sous_domaines junction
  await supabase
    .from("textes_sous_domaines")
    .delete()
    .eq("texte_id", texteId);
  
  // 7. Delete texte_tags junction
  await supabase
    .from("texte_tags")
    .delete()
    .eq("texte_id", texteId);
  
  // 8. Delete changelog entries
  await supabase
    .from("changelog_reglementaire")
    .delete()
    .eq("acte_id", texteId);
  
  // 9. Delete legacy textes_articles (if any)
  await supabase
    .from("textes_articles")
    .delete()
    .eq("texte_id", texteId);
  
  // 10. Finally delete the texte itself
  const { error } = await supabase
    .from("textes_reglementaires")
    .delete()
    .eq("id", texteId);
  
  if (error) throw error;
}
```

### 2. Update BibliothequeTextes.tsx Page

Add complete CRUD functionality:

**New State Variables:**
```typescript
const [editingTexte, setEditingTexte] = useState<any>(null);
const [deleteConfirmTexte, setDeleteConfirmTexte] = useState<any>(null);
```

**Add Delete Mutation:**
```typescript
const deleteMutation = useMutation({
  mutationFn: (id: string) => textesReglementairesQueries.deleteWithCascade(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["textes-reglementaires"] });
    toast.success("Texte supprimé avec succès");
    setDeleteConfirmTexte(null);
  },
  onError: (error: any) => {
    toast.error(error.message || "Erreur lors de la suppression");
  },
});
```

**Add Handler Functions:**
```typescript
const handleEdit = (texte: any) => {
  setEditingTexte(texte);
  setShowTexteModal(true);
};

const handleDelete = (texte: any) => {
  setDeleteConfirmTexte(texte);
};
```

**Add Row Actions Menu**: Replace the simple "View" button with a dropdown menu containing:
- View Articles
- Edit (opens TexteFormModal)
- Delete (opens confirmation dialog)

**Add AlertDialog for Delete Confirmation:**
```tsx
<AlertDialog open={!!deleteConfirmTexte} onOpenChange={() => setDeleteConfirmTexte(null)}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
      <AlertDialogDescription>
        Êtes-vous sûr de vouloir supprimer ce texte réglementaire ?
        <br /><br />
        <strong>{deleteConfirmTexte?.reference}</strong>
        <br /><br />
        Cette action supprimera également tous les articles associés et est irréversible.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Annuler</AlertDialogCancel>
      <AlertDialogAction
        onClick={() => deleteMutation.mutate(deleteConfirmTexte?.id)}
        className="bg-destructive text-destructive-foreground"
        disabled={deleteMutation.isPending}
      >
        {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### 3. Add Row Actions Component

Create a reusable dropdown menu for table rows with actions:
- View Articles (navigates to detail page)
- View PDF (if available)
- Edit
- Delete

---

## Files to Modify

| # | File | Changes |
|---|------|---------|
| 1 | `src/lib/textes-queries.ts` | Add `deleteWithCascade` function with proper dependency cleanup |
| 2 | `src/pages/BibliothequeTextes.tsx` | Add delete mutation, edit/delete handlers, row actions menu, AlertDialog confirmation |

---

## Technical Details

### textes-queries.ts Changes

Add new function after line 395:

```typescript
async deleteWithCascade(texteId: string) {
  // Get all articles for this texte
  const { data: articles } = await supabase
    .from("articles")
    .select("id")
    .eq("texte_id", texteId);
  
  const articleIds = articles?.map(a => a.id) || [];
  
  // Delete article dependencies first
  if (articleIds.length > 0) {
    await supabase.from("article_sous_domaines").delete().in("article_id", articleIds);
    await supabase.from("article_versions").delete().in("article_id", articleIds);
    await supabase.from("articles").delete().in("id", articleIds);
  }
  
  // Delete texte dependencies
  await supabase.from("textes_domaines").delete().eq("texte_id", texteId);
  await supabase.from("textes_sous_domaines").delete().eq("texte_id", texteId);
  await supabase.from("texte_tags").delete().eq("texte_id", texteId);
  await supabase.from("changelog_reglementaire").delete().eq("acte_id", texteId);
  await supabase.from("textes_articles").delete().eq("texte_id", texteId);
  
  // Delete the texte
  const { error } = await supabase
    .from("textes_reglementaires")
    .delete()
    .eq("id", texteId);
  
  if (error) throw error;
}
```

### BibliothequeTextes.tsx Changes

1. **Add imports**:
```typescript
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2, FileSearch } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
```

2. **Add state and mutation** after existing useState declarations

3. **Replace View button** with dropdown menu in both table and mobile cards

4. **Add AlertDialog** before closing `</div>` of the component

---

## Implementation Order

1. First: Add `deleteWithCascade` to `textes-queries.ts`
2. Second: Update `BibliothequeTextes.tsx` with:
   - New imports
   - State for delete confirmation
   - Delete mutation
   - Handler functions
   - Row actions dropdown menu (replacing View button)
   - AlertDialog component

---

## Expected Behavior After Fix

1. Each row shows a "..." menu with View, Edit, and Delete options
2. Clicking Delete opens a confirmation dialog showing the texte reference
3. Confirming deletion properly removes:
   - All articles and their versions/sous-domaines
   - All junction table records (domaines, sous-domaines, tags)
   - Changelog entries
   - The texte itself
4. Success toast appears after deletion
5. List automatically refreshes
6. Edit opens the TexteFormModal with pre-filled data

