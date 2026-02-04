import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Search, FileText, X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BibliothequeHeader } from "@/components/bibliotheque/BibliothequeHeader";
import { ArticlesStatsCards } from "@/components/bibliotheque/ArticlesStatsCards";
import { ArticlesFilters } from "@/components/bibliotheque/ArticlesFilters";
import { ArticlesDataGrid } from "@/components/bibliotheque/ArticlesDataGrid";
import { ArticleQuickViewModal } from "@/components/bibliotheque/ArticleQuickViewModal";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { ArticleFormModal } from "@/components/ArticleFormModal";
import { articlesListQueries, type ArticleWithDetails } from "@/lib/articles-queries";
import { domainesQueries, sousDomainesQueries, textesArticlesQueries } from "@/lib/textes-queries";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function BibliothequeArticles() {
  const queryClient = useQueryClient();
  
  // URL params for texte filter
  const [searchParams, setSearchParams] = useSearchParams();
  const texteIdFromUrl = searchParams.get("texte");
  
  // State for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [texteFilter, setTexteFilter] = useState(texteIdFromUrl || "all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [domaineFilter, setDomaineFilter] = useState("all");
  const [sousDomaineFilter, setSousDomaineFilter] = useState("all");
  const [anneeFilter, setAnneeFilter] = useState("all");
  const [statutVersionFilter, setStatutVersionFilter] = useState("all");
  const [exigenceOnly, setExigenceOnly] = useState(false);
  
  // State for article quick view
  const [selectedArticle, setSelectedArticle] = useState<ArticleWithDetails | null>(null);
  const [introductifOnly, setIntroductifOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // CRUD state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<ArticleWithDetails | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<ArticleWithDetails | null>(null);

  // Sync texte filter with URL params
  useEffect(() => {
    if (texteIdFromUrl && texteIdFromUrl !== texteFilter) {
      setTexteFilter(texteIdFromUrl);
    }
  }, [texteIdFromUrl]);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch domaines for filter
  const { data: domaines = [] } = useQuery({
    queryKey: ["domaines-active"],
    queryFn: domainesQueries.getActive,
  });

  // Fetch sous-domaines for filter
  const { data: sousDomaines = [] } = useQuery({
    queryKey: ["sous-domaines-active", domaineFilter],
    queryFn: () => sousDomainesQueries.getActive(domaineFilter !== "all" ? domaineFilter : undefined),
  });

  // Fetch available years
  const { data: years = [] } = useQuery({
    queryKey: ["articles-years"],
    queryFn: articlesListQueries.getAvailableYears,
  });

  // Fetch texte info for display when filter is active
  const { data: texteInfo } = useQuery({
    queryKey: ["texte-info-filter", texteFilter],
    queryFn: async () => {
      if (!texteFilter || texteFilter === "all") return null;
      const { data } = await supabase
        .from("textes_reglementaires")
        .select("id, reference, titre, type")
        .eq("id", texteFilter)
        .single();
      return data;
    },
    enabled: !!texteFilter && texteFilter !== "all",
  });

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["articles-stats"],
    queryFn: articlesListQueries.getStats,
  });

  // Fetch articles with filters
  const { data: articlesResult, isLoading: articlesLoading } = useQuery({
    queryKey: [
      "articles-list",
      debouncedSearchTerm,
      texteFilter,
      typeFilter,
      domaineFilter,
      sousDomaineFilter,
      anneeFilter,
      statutVersionFilter,
      exigenceOnly,
      introductifOnly,
      page,
      pageSize,
    ],
    queryFn: () =>
      articlesListQueries.getAll({
        searchTerm: debouncedSearchTerm,
        texteId: texteFilter !== "all" ? texteFilter : undefined,
        typeTexteFilter: typeFilter,
        domaineFilter,
        sousDomaineFilter,
        anneeFilter,
        statutVersionFilter,
        exigenceOnly,
        introductifOnly,
        page,
        pageSize,
      }),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (articleId: string) => {
      // First delete related sous_domaines
      await supabase
        .from("article_sous_domaines")
        .delete()
        .eq("article_id", articleId);
      
      // Delete article versions
      await supabase
        .from("article_versions")
        .delete()
        .eq("article_id", articleId);
      
      // Delete article tags
      await supabase
        .from("article_tags")
        .delete()
        .eq("article_id", articleId);
      
      // Delete the article
      await textesArticlesQueries.delete(articleId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles-list"] });
      queryClient.invalidateQueries({ queryKey: ["articles-stats"] });
      queryClient.invalidateQueries({ queryKey: ["texte-articles"] });
      toast.success("Article supprimé avec succès");
      setDeleteDialogOpen(false);
      setArticleToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la suppression");
    },
  });

  // Clear texte filter
  const clearTexteFilter = () => {
    setTexteFilter("all");
    setSearchParams({});
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setTexteFilter("all");
    setSearchParams({});
    setTypeFilter("all");
    setDomaineFilter("all");
    setSousDomaineFilter("all");
    setAnneeFilter("all");
    setStatutVersionFilter("all");
    setExigenceOnly(false);
    setIntroductifOnly(false);
    setPage(1);
  };

  // CRUD handlers
  const handleCreateArticle = () => {
    setEditingArticle(null);
    setIsFormOpen(true);
  };

  const handleEditArticle = (article: ArticleWithDetails) => {
    setEditingArticle(article);
    setIsFormOpen(true);
  };

  const handleDeleteArticle = (article: ArticleWithDetails) => {
    setArticleToDelete(article);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (articleToDelete) {
      deleteMutation.mutate(articleToDelete.id);
    }
  };

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["articles-list"] });
    queryClient.invalidateQueries({ queryKey: ["articles-stats"] });
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Header with Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <BibliothequeHeader
          title="Articles réglementaires"
          breadcrumbs={[{ label: "Articles" }]}
        />
        <Button onClick={handleCreateArticle} className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden xs:inline">Créer un article</span>
          <span className="xs:hidden">Créer</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <ArticlesStatsCards stats={stats} isLoading={statsLoading} />

      {/* Texte Filter Badge (when filtering by specific texte) */}
      {texteInfo && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 bg-primary/5 border border-primary/20 rounded-lg px-3 sm:px-4 py-3">
          <FileText className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              <span className="hidden sm:inline">Articles du texte: </span>
              <span className="text-primary">{texteInfo.reference}</span>
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {texteInfo.titre}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearTexteFilter}
            className="h-8 w-8 p-0 shrink-0"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Effacer le filtre</span>
          </Button>
        </div>
      )}

      {/* Search */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par numéro, titre..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="pl-10 text-base"
          />
        </div>
      </div>

      {/* Filters */}
      <ArticlesFilters
        typeFilter={typeFilter}
        setTypeFilter={(v) => { setTypeFilter(v); setPage(1); }}
        domaineFilter={domaineFilter}
        setDomaineFilter={(v) => { setDomaineFilter(v); setPage(1); }}
        sousDomaineFilter={sousDomaineFilter}
        setSousDomaineFilter={(v) => { setSousDomaineFilter(v); setPage(1); }}
        anneeFilter={anneeFilter}
        setAnneeFilter={(v) => { setAnneeFilter(v); setPage(1); }}
        statutVersionFilter={statutVersionFilter}
        setStatutVersionFilter={(v) => { setStatutVersionFilter(v); setPage(1); }}
        exigenceOnly={exigenceOnly}
        setExigenceOnly={(v) => { setExigenceOnly(v); setPage(1); }}
        introductifOnly={introductifOnly}
        setIntroductifOnly={(v) => { setIntroductifOnly(v); setPage(1); }}
        domaines={domaines}
        sousDomaines={sousDomaines}
        years={years}
        onReset={handleResetFilters}
      />

      {/* Data Grid */}
      <ArticlesDataGrid
        articles={articlesResult?.data || []}
        isLoading={articlesLoading}
        onViewArticle={(article) => setSelectedArticle(article)}
        onEditArticle={handleEditArticle}
        onDeleteArticle={handleDeleteArticle}
      />

      {/* Article Quick View Modal */}
      <ArticleQuickViewModal
        open={!!selectedArticle}
        onOpenChange={(open) => !open && setSelectedArticle(null)}
        article={selectedArticle}
      />

      {/* Article Form Modal - for create/edit */}
      {isFormOpen && (
        <ArticleFormModal
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          texteId={editingArticle?.texte_id || texteFilter !== "all" ? (editingArticle?.texte_id || texteFilter) : ""}
          article={editingArticle}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'article ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'article "{articleToDelete?.numero} - {articleToDelete?.titre}" 
              sera définitivement supprimé avec toutes ses versions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pagination */}
      <PaginationControls
        currentPage={page}
        totalPages={articlesResult?.totalPages || 1}
        totalItems={articlesResult?.count || 0}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        hasNextPage={page < (articlesResult?.totalPages || 1)}
        hasPrevPage={page > 1}
      />
    </div>
  );
}
