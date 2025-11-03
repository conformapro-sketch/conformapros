import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
  Plus,
  Upload,
  Scale,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { textesReglementairesQueries, TexteReglementaire } from "@/lib/textes-queries";
import { domainesQueries, sousDomainesQueries } from "@/lib/actes-queries";
import { toast } from "sonner";
import { TexteFormModal } from "@/components/TexteFormModal";
import { ImportCSVDialog } from "@/components/ImportCSVDialog";
import { BibliothequeStatsCards } from "@/components/bibliotheque/BibliothequeStatsCards";
import { BibliothequeActiveFilters } from "@/components/bibliotheque/BibliothequeActiveFilters";
import { BibliothequeDataGrid } from "@/components/bibliotheque/BibliothequeDataGrid";
import { BibliothequeCardView } from "@/components/bibliotheque/BibliothequeCardView";
import { BibliothequeHorizontalFilters } from "@/components/bibliotheque/BibliothequeHorizontalFilters";
import { BibliothequeQuickFilters } from "@/components/bibliotheque/BibliothequeQuickFilters";
import { BibliothequeTableSkeleton } from "@/components/bibliotheque/BibliothequeTableSkeleton";
import { BibliothequeViewToggle } from "@/components/bibliotheque/BibliothequeViewToggle";
import { PDFViewerModal } from "@/components/PDFViewerModal";
import { BibliothequePreferencesProvider, useBibliothequePreferences } from "@/contexts/BibliothequePreferencesContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

function BibliothequeReglementaireContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isMobile, isDesktop } = useMediaQuery();
  const { toggleFavorite, isFavorite, preferences, setView } = useBibliothequePreferences();
  
  // View state from preferences
  const view = preferences.view;
  
  // États des filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [domaineFilter, setDomaineFilter] = useState<string>("all");
  const [sousDomaineFilter, setSousDomaineFilter] = useState<string>("all");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [anneeFilter, setAnneeFilter] = useState<string>("all");
  const [withPdfFilter, setWithPdfFilter] = useState<boolean>(false);
  const [favoritesFilter, setFavoritesFilter] = useState<boolean>(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  // États UI
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [editingTexte, setEditingTexte] = useState<TexteReglementaire | null>(null);
  const [deleteTexteId, setDeleteTexteId] = useState<string | null>(null);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
  const [selectedPdfTitle, setSelectedPdfTitle] = useState<string>("");
  
  // Navigation clavier
  useKeyboardNavigation({
    onToggleFilters: () => setFiltersOpen(!filtersOpen),
    onEscape: () => {
      if (pdfViewerOpen) setPdfViewerOpen(false);
      if (showFormModal) setShowFormModal(false);
      if (filtersOpen) setFiltersOpen(false);
    },
  });

  const { data: domainesList } = useQuery({
    queryKey: ["domaines"],
    queryFn: () => domainesQueries.getActive(),
  });

  const { data: sousDomainesList } = useQuery({
    queryKey: ["sous-domaines", domaineFilter],
    queryFn: () => sousDomainesQueries.getByDomaineId(domaineFilter),
    enabled: domaineFilter !== "all",
  });

  const { data: result, isLoading, error } = useQuery({
    queryKey: ["textes-reglementaires", typeFilter, domaineFilter, sousDomaineFilter, statutFilter, anneeFilter, searchTerm, page, pageSize],
    queryFn: async () => {
      const data = await textesReglementairesQueries.getAll({
        searchTerm,
        typeFilter: typeFilter !== "all" ? typeFilter : undefined,
        statutFilter: statutFilter !== "all" ? statutFilter : undefined,
        domaineFilter: domaineFilter !== "all" ? domaineFilter : undefined,
        sousDomaineFilter: sousDomaineFilter !== "all" ? sousDomaineFilter : undefined,
        anneeFilter: anneeFilter !== "all" ? anneeFilter : undefined,
        page,
        pageSize,
      });
      
      // Client-side filtering for PDF and favorites
      let filteredData = data.data;
      if (withPdfFilter) {
        filteredData = filteredData.filter((t: any) => t.pdf_url);
      }
      if (favoritesFilter) {
        filteredData = filteredData.filter((t: any) => isFavorite(t.id));
      }
      
      return {
        ...data,
        data: filteredData,
        count: filteredData.length,
      };
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => textesReglementairesQueries.softDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["textes-reglementaires"] });
      toast.success("Texte supprimé avec succès");
      setDeleteTexteId(null);
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });

  const textes = result?.data || [];
  const totalCount = result?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Calculate statistics
  const stats = useMemo(() => {
    const enVigueur = textes.filter((t: any) => t.statut_vigueur === "en_vigueur").length;
    const modifies = textes.filter((t: any) => t.statut_vigueur === "modifie").length;
    const abroges = textes.filter((t: any) => t.statut_vigueur === "abroge").length;
    const withPdf = textes.filter((t: any) => t.pdf_url).length;
    const favorites = textes.filter((t: any) => isFavorite(t.id)).length;
    
    const parType = {
      loi: textes.filter((t: any) => t.type_acte === "loi").length,
      decret: textes.filter((t: any) => t.type_acte === "decret").length,
      arrete: textes.filter((t: any) => t.type_acte === "arrete").length,
      circulaire: textes.filter((t: any) => t.type_acte === "circulaire").length,
    };
    
    return {
      total: totalCount,
      enVigueur,
      modifies,
      abroges,
      withPdf,
      favorites,
      parType,
    };
  }, [textes, totalCount, isFavorite]);

  const activeFiltersCount = [typeFilter, domaineFilter, sousDomaineFilter, statutFilter, anneeFilter]
    .filter(f => f !== "all").length + (withPdfFilter ? 1 : 0) + (favoritesFilter ? 1 : 0);

  const clearAllFilters = () => {
    setTypeFilter("all");
    setDomaineFilter("all");
    setSousDomaineFilter("all");
    setStatutFilter("all");
    setAnneeFilter("all");
    setWithPdfFilter(false);
    setFavoritesFilter(false);
    setSearchTerm("");
    setPage(1);
  };

  const handleView = (texte: any) => {
    navigate(`/bibliotheque/textes/${texte.id}`);
  };

  const handleEdit = (texte: TexteReglementaire) => {
    setEditingTexte(texte);
    setShowFormModal(true);
  };

  const handleDelete = (texte: any) => {
    setDeleteTexteId(texte.id);
  };

  const handleViewPdf = (texte: any) => {
    if (texte.pdf_url) {
      setSelectedPdfUrl(texte.pdf_url);
      setSelectedPdfTitle(texte.reference_officielle);
      setPdfViewerOpen(true);
    }
  };

  const activeFilters = useMemo(() => {
    const filters = [];
    if (typeFilter !== "all") {
      filters.push({
        id: "type",
        label: `Type: ${typeFilter}`,
        value: typeFilter,
        onRemove: () => setTypeFilter("all"),
      });
    }
    if (statutFilter !== "all") {
      filters.push({
        id: "statut",
        label: `Statut: ${statutFilter}`,
        value: statutFilter,
        onRemove: () => setStatutFilter("all"),
      });
    }
    if (domaineFilter !== "all") {
      const domaine = domainesList?.find((d: any) => d.id === domaineFilter);
      filters.push({
        id: "domaine",
        label: `Domaine: ${domaine?.libelle || domaineFilter}`,
        value: domaineFilter,
        onRemove: () => setDomaineFilter("all"),
      });
    }
    if (withPdfFilter) {
      filters.push({
        id: "pdf",
        label: "Avec PDF",
        value: "true",
        onRemove: () => setWithPdfFilter(false),
      });
    }
    if (favoritesFilter) {
      filters.push({
        id: "favorites",
        label: "Favoris",
        value: "true",
        onRemove: () => setFavoritesFilter(false),
      });
    }
    return filters;
  }, [typeFilter, statutFilter, domaineFilter, withPdfFilter, favoritesFilter, domainesList]);

  return (
    <div className="container mx-auto p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-primary shadow-elegant">
            <Scale className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Bibliothèque Réglementaire</h1>
            <p className="text-muted-foreground">
              {totalCount} texte{totalCount > 1 ? 's' : ''} réglementaire{totalCount > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isMobile && <BibliothequeViewToggle view={view} onViewChange={setView} />}
          <Button
            variant="outline"
            onClick={() => setShowImportDialog(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Importer
          </Button>
          <Button onClick={() => { setEditingTexte(null); setShowFormModal(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un texte
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <BibliothequeStatsCards stats={stats} />

      {/* Horizontal Filters */}
      <BibliothequeHorizontalFilters
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        statutFilter={statutFilter}
        setStatutFilter={setStatutFilter}
        domaineFilter={domaineFilter}
        setDomaineFilter={setDomaineFilter}
        sousDomaineFilter={sousDomaineFilter}
        setSousDomaineFilter={setSousDomaineFilter}
        anneeFilter={anneeFilter}
        setAnneeFilter={setAnneeFilter}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        domaines={domainesList?.map((d: any) => ({ id: d.id, nom: d.libelle })) || []}
        sousDomaines={sousDomainesList?.map((sd: any) => ({ id: sd.id, nom: sd.libelle })) || []}
        onApply={() => setPage(1)}
        onReset={clearAllFilters}
        isOpen={filtersOpen}
        setIsOpen={setFiltersOpen}
        activeFiltersCount={activeFiltersCount}
      />

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <BibliothequeActiveFilters
          filters={activeFilters}
          resultCount={totalCount}
          onClearAll={clearAllFilters}
        />
      )}

      {/* Data Grid / Card View */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Résultats</CardTitle>
            <div className="text-sm text-muted-foreground">
              {totalCount} résultat{totalCount > 1 ? 's' : ''}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground">Chargement...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="text-center">
                <p className="text-destructive font-semibold mb-2">Erreur de chargement</p>
                <p className="text-sm text-muted-foreground">Impossible de charger les textes réglementaires</p>
              </div>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Réessayer
              </Button>
            </div>
          ) : textes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="text-center">
                <p className="text-lg font-semibold mb-2">Aucun résultat</p>
                <p className="text-sm text-muted-foreground">Essayez de modifier vos filtres</p>
              </div>
              <Button variant="outline" onClick={clearAllFilters}>
                Réinitialiser les filtres
              </Button>
            </div>
          ) : (
            <>
              {isMobile || view === "grid" ? (
                <BibliothequeCardView
                  data={textes}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onViewPdf={handleViewPdf}
                  onToggleFavorite={toggleFavorite}
                />
              ) : (
                <BibliothequeDataGrid
                  data={textes}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onViewPdf={handleViewPdf}
                  onToggleFavorite={toggleFavorite}
                />
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Affichage {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalCount)} sur {totalCount}
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => page > 1 && setPage(page - 1)}
                          className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => setPage(pageNum)}
                              isActive={page === pageNum}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => page < totalPages && setPage(page + 1)}
                          className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <TexteFormModal
        open={showFormModal}
        onOpenChange={setShowFormModal}
        texte={editingTexte}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["textes-reglementaires"] });
          setShowFormModal(false);
          setEditingTexte(null);
        }}
      />

      <ImportCSVDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["textes-reglementaires"] });
          setShowImportDialog(false);
        }}
      />

      <PDFViewerModal
        open={pdfViewerOpen}
        onOpenChange={setPdfViewerOpen}
        pdfUrl={selectedPdfUrl || ""}
        title={selectedPdfTitle}
      />

      <AlertDialog open={!!deleteTexteId} onOpenChange={() => setDeleteTexteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce texte ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTexteId && deleteMutation.mutate(deleteTexteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function BibliothequeReglementaire() {
  return (
    <BibliothequePreferencesProvider>
      <BibliothequeReglementaireContent />
    </BibliothequePreferencesProvider>
  );
}
