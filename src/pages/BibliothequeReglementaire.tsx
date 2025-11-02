import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Search, 
  Plus,
  Download,
  Upload,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Scale,
  Filter,
  X,
  Loader2
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { textesReglementairesQueries, TexteReglementaire } from "@/lib/textes-queries";
import { domainesQueries, sousDomainesQueries } from "@/lib/actes-queries";
import { searchQueries } from "@/lib/bibliotheque-queries";
import { toast } from "sonner";
import { TexteFormModal } from "@/components/TexteFormModal";
import { ImportCSVDialog } from "@/components/ImportCSVDialog";
import { BibliothequeStatsCards } from "@/components/bibliotheque/BibliothequeStatsCards";
import { BibliothequeViewToggle } from "@/components/bibliotheque/BibliothequeViewToggle";
import { BibliothequeTextCard } from "@/components/bibliotheque/BibliothequeTextCard";
import { BibliothequePreview } from "@/components/bibliotheque/BibliothequePreview";
import { BibliothequeEmptyState } from "@/components/bibliotheque/BibliothequeEmptyState";
import { BibliothequeActiveFilters } from "@/components/bibliotheque/BibliothequeActiveFilters";
import { BibliothequeTableSkeleton } from "@/components/bibliotheque/BibliothequeTableSkeleton";
import { BibliothequeQuickView } from "@/components/bibliotheque/BibliothequeQuickView";
import { BibliothequeFloatingActions } from "@/components/bibliotheque/BibliothequeFloatingActions";
import * as XLSX from 'xlsx';

const TYPE_LABELS = {
  loi: "Loi",
  arrete: "Arrêté",
  decret: "Décret",
  circulaire: "Circulaire",
};

const TYPE_ICONS = {
  loi: "⚖️",
  arrete: "📋",
  decret: "📜",
  circulaire: "📄",
};

export default function BibliothequeReglementaire() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [domaineFilter, setDomaineFilter] = useState<string>("all");
  const [sousDomaineFilter, setSousDomaineFilter] = useState<string>("all");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [anneeFilter, setAnneeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("date_publication");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showFormModal, setShowFormModal] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [editingTexte, setEditingTexte] = useState<TexteReglementaire | null>(null);
  const [deleteTexteId, setDeleteTexteId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [view, setView] = useState<"table" | "grid">("table");
  const [pageSize, setPageSize] = useState(25);
  const [selectedTextes, setSelectedTextes] = useState<string[]>([]);
  const [quickViewTexte, setQuickViewTexte] = useState<any | null>(null);

  const { data: domainesList } = useQuery({
    queryKey: ["domaines"],
    queryFn: () => domainesQueries.getActive(),
  });

  const { data: sousDomainesList } = useQuery({
    queryKey: ["sous-domaines", domaineFilter],
    queryFn: () => domaineFilter !== "all" ? sousDomainesQueries.getActive(domaineFilter) : Promise.resolve([]),
    enabled: domaineFilter !== "all",
  });

  const { data: result, isLoading, error } = useQuery({
    queryKey: ["textes-reglementaires", searchTerm, typeFilter, domaineFilter, sousDomaineFilter, statutFilter, anneeFilter, page, sortBy, sortOrder],
    queryFn: () =>
      textesReglementairesQueries.getAll({
        searchTerm,
        typeFilter: typeFilter !== "all" ? typeFilter : undefined,
        statutFilter: statutFilter !== "all" ? statutFilter : undefined,
        domaineFilter: domaineFilter !== "all" ? domaineFilter : undefined,
        sousDomaineFilter: sousDomaineFilter !== "all" ? sousDomaineFilter : undefined,
        anneeFilter: anneeFilter !== "all" ? anneeFilter : undefined,
        page,
        pageSize,
        sortBy,
        sortOrder,
      }),
  });

  if (error) {
    toast.error("Erreur lors du chargement des textes réglementaires");
  }

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
  const totalPages = result?.totalPages || 1;

  // Calculate statistics
  const stats = useMemo(() => {
    const enVigueur = textes.filter((t: any) => t.statut_vigueur === "en_vigueur").length;
    const modifies = textes.filter((t: any) => t.statut_vigueur === "modifie").length;
    const abroges = textes.filter((t: any) => t.statut_vigueur === "abroge").length;
    
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
      parType,
    };
  }, [textes, totalCount]);

  // Check if texte is new (created in last 7 days)
  const isNewTexte = (texte: any) => {
    if (!texte.created_at) return false;
    const createdDate = new Date(texte.created_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  const uniqueYears = Array.from(
    new Set(
      textes
        .map((t: any) => t.annee)
        .filter((y): y is number => y !== null)
    )
  ).sort((a, b) => (b as number) - (a as number));

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "en_vigueur":
        return { 
          label: "En vigueur", 
          className: "bg-success/10 text-success border border-success/20 font-medium",
          icon: "✓"
        };
      case "modifie":
        return { 
          label: "Modifié", 
          className: "bg-warning/10 text-warning border border-warning/20 font-medium",
          icon: "⚠"
        };
      case "abroge":
        return { 
          label: "Abrogé", 
          className: "bg-destructive/10 text-destructive border border-destructive/20 font-medium",
          icon: "✕"
        };
      case "suspendu":
        return { 
          label: "Suspendu", 
          className: "bg-muted text-muted-foreground border border-border font-medium",
          icon: "⏸"
        };
      default:
        return { label: statut, className: "", icon: "" };
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const handleEdit = (texte: TexteReglementaire) => {
    setEditingTexte(texte);
    setShowFormModal(true);
  };

  const handleExportExcel = () => {
    const exportData = textes.map((t: any) => ({
      Type: TYPE_LABELS[t.type_acte as keyof typeof TYPE_LABELS],
      Référence: t.reference_officielle,
      Titre: t.intitule,
      Autorité: t.autorite_emettrice || "",
      "Date de publication": t.date_publication || "",
      Statut: getStatutBadge(t.statut_vigueur).label,
      "Nombre d'articles": t.articles?.[0]?.count || 0,
      Année: t.annee || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Textes");
    XLSX.writeFile(wb, `textes_reglementaires_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Export Excel effectué");
  };

  const activeFiltersCount = [typeFilter, domaineFilter, sousDomaineFilter, statutFilter, anneeFilter]
    .filter(f => f !== "all").length;

  const clearAllFilters = () => {
    setTypeFilter("all");
    setDomaineFilter("all");
    setSousDomaineFilter("all");
    setStatutFilter("all");
    setAnneeFilter("all");
    setSearchTerm("");
    setPage(1);
  };

  const handleFilterByStatus = (status: string) => {
    setStatutFilter(status);
    setPage(1);
  };

  const handleSelectTexte = (id: string, selected: boolean) => {
    setSelectedTextes(prev => 
      selected ? [...prev, id] : prev.filter(texteId => texteId !== id)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedTextes(selected ? textes.map((t: any) => t.id) : []);
  };

  const handleBulkDelete = () => {
    if (selectedTextes.length === 0) return;
    
    toast.promise(
      Promise.all(selectedTextes.map(id => textesReglementairesQueries.softDelete(id))),
      {
        loading: `Suppression de ${selectedTextes.length} texte${selectedTextes.length > 1 ? 's' : ''}...`,
        success: () => {
          queryClient.invalidateQueries({ queryKey: ["textes-reglementaires"] });
          setSelectedTextes([]);
          return `${selectedTextes.length} texte${selectedTextes.length > 1 ? 's supprimés' : ' supprimé'}`;
        },
        error: "Erreur lors de la suppression",
      }
    );
  };

  const handleBulkExport = () => {
    const selectedData = textes.filter((t: any) => selectedTextes.includes(t.id));
    const exportData = selectedData.map((t: any) => ({
      Type: TYPE_LABELS[t.type_acte as keyof typeof TYPE_LABELS],
      Référence: t.reference_officielle,
      Titre: t.intitule,
      Autorité: t.autorite_emettrice || "",
      "Date de publication": t.date_publication || "",
      Statut: getStatutBadge(t.statut_vigueur).label,
      "Nombre d'articles": t.articles?.[0]?.count || 0,
      Année: t.annee || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Textes sélectionnés");
    XLSX.writeFile(wb, `textes_selectionnes_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success(`${selectedTextes.length} texte${selectedTextes.length > 1 ? 's exportés' : ' exporté'}`);
  };

  // Active filters for the badge display
  const activeFilters = useMemo(() => {
    const filters = [];
    if (typeFilter !== "all") {
      filters.push({
        id: "type",
        label: `Type: ${TYPE_LABELS[typeFilter as keyof typeof TYPE_LABELS]}`,
        value: typeFilter,
        onRemove: () => setTypeFilter("all"),
      });
    }
    if (statutFilter !== "all") {
      filters.push({
        id: "statut",
        label: `Statut: ${getStatutBadge(statutFilter).label}`,
        value: statutFilter,
        onRemove: () => setStatutFilter("all"),
      });
    }
    if (domaineFilter !== "all") {
      const domaine = domainesList?.find(d => d.id === domaineFilter);
      filters.push({
        id: "domaine",
        label: `Domaine: ${domaine?.libelle || domaineFilter}`,
        value: domaineFilter,
        onRemove: () => setDomaineFilter("all"),
      });
    }
    if (anneeFilter !== "all") {
      filters.push({
        id: "annee",
        label: `Année: ${anneeFilter}`,
        value: anneeFilter,
        onRemove: () => setAnneeFilter("all"),
      });
    }
    if (searchTerm) {
      filters.push({
        id: "search",
        label: `Recherche: "${searchTerm}"`,
        value: searchTerm,
        onRemove: () => setSearchTerm(""),
      });
    }
    return filters;
  }, [typeFilter, statutFilter, domaineFilter, anneeFilter, searchTerm, domainesList]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Statistics Cards */}
        <BibliothequeStatsCards stats={stats} onFilterByStatus={handleFilterByStatus} />

        {/* Header avec gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-primary p-8 shadow-strong">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-accent/10 backdrop-blur-sm">
                <Scale className="h-8 w-8 text-accent" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-2">
                  Bibliothèque Réglementaire
                </h1>
                <p className="text-primary-foreground/80 text-sm sm:text-base">
                  Gestion centralisée des textes juridiques HSE
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => setShowImportDialog(true)}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Upload className="h-4 w-4 mr-2" />
                Importer
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={handleExportExcel}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
              <Button 
                size="sm" 
                onClick={() => { setEditingTexte(null); setShowFormModal(true); }}
                className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-gold"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau texte
              </Button>
            </div>
          </div>
        </div>

        {/* Barre de recherche et filtres améliorés */}
        <Card className="shadow-medium border-2 border-border/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Recherche et filtres</CardTitle>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFiltersCount} filtre{activeFiltersCount > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Réinitialiser
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowFilters(!showFilters)}
                >
                  {showFilters ? "Masquer" : "Afficher"}
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Recherche principale */}
            <div className="relative">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher par titre, référence, autorité..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="pl-12 h-12 text-base border-2 focus:border-accent focus:ring-accent"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              {isLoading && (
                <div className="absolute right-12 top-3.5">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Active Filters */}
            <BibliothequeActiveFilters 
              filters={activeFilters}
              resultCount={totalCount}
              onClearAll={clearAllFilters}
            />

            {/* Filtres avancés */}
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Type
                  </label>
                  <Select value={typeFilter} onValueChange={(val) => { setTypeFilter(val); setPage(1); }}>
                    <SelectTrigger className="border-2">
                      <SelectValue placeholder="Tous les types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      {Object.entries(TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Statut
                  </label>
                  <Select value={statutFilter} onValueChange={(val) => { setStatutFilter(val); setPage(1); }}>
                    <SelectTrigger className="border-2">
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="en_vigueur">✓ En vigueur</SelectItem>
                      <SelectItem value="modifie">⚠ Modifié</SelectItem>
                      <SelectItem value="abroge">✕ Abrogé</SelectItem>
                      <SelectItem value="suspendu">⏸ Suspendu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Domaine
                  </label>
                  <Select value={domaineFilter} onValueChange={(val) => { 
                    setDomaineFilter(val); 
                    setSousDomaineFilter("all");
                    setPage(1); 
                  }}>
                    <SelectTrigger className="border-2">
                      <SelectValue placeholder="Tous les domaines" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les domaines</SelectItem>
                      {domainesList?.map((domaine) => (
                        <SelectItem key={domaine.id} value={domaine.id}>
                          {domaine.libelle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Sous-domaine
                  </label>
                  <Select 
                    value={sousDomaineFilter} 
                    onValueChange={(val) => { setSousDomaineFilter(val); setPage(1); }}
                    disabled={domaineFilter === "all"}
                  >
                    <SelectTrigger className="border-2">
                      <SelectValue placeholder="Sous-domaine" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      {sousDomainesList?.map((sd) => (
                        <SelectItem key={sd.id} value={sd.id}>
                          {sd.libelle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Année
                  </label>
                  <Select value={anneeFilter} onValueChange={(val) => { setAnneeFilter(val); setPage(1); }}>
                    <SelectTrigger className="border-2">
                      <SelectValue placeholder="Toutes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les années</SelectItem>
                      {uniqueYears.map((year: any) => (
                        <SelectItem key={year} value={String(year)}>
                          {year as number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tableau des résultats */}
        <Card className="shadow-medium">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-xl">Textes réglementaires</CardTitle>
                  <CardDescription className="mt-1">
                    {totalCount} texte{totalCount > 1 ? 's' : ''} trouvé{totalCount > 1 ? 's' : ''}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Select value={String(pageSize)} onValueChange={(val) => { setPageSize(Number(val)); setPage(1); }}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25 par page</SelectItem>
                    <SelectItem value="50">50 par page</SelectItem>
                    <SelectItem value="100">100 par page</SelectItem>
                  </SelectContent>
                </Select>
                {view === "grid" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectAll(selectedTextes.length !== textes.length)}
                  >
                    <Checkbox 
                      checked={selectedTextes.length === textes.length && textes.length > 0}
                      className="mr-2"
                    />
                    Tout sélectionner
                  </Button>
                )}
                <BibliothequeViewToggle view={view} onViewChange={setView} />
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {isLoading ? (
              <BibliothequeTableSkeleton view={view} count={pageSize} />
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="p-4 rounded-full bg-destructive/10">
                  <FileText className="h-12 w-12 text-destructive" />
                </div>
                <div className="text-center">
                  <p className="text-destructive font-semibold mb-2">Erreur de chargement</p>
                  <p className="text-sm text-muted-foreground">Impossible de charger les textes réglementaires</p>
                </div>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Réessayer
                </Button>
              </div>
            ) : textes.length > 0 ? (
              <>
                {view === "table" ? (
                  <div className="overflow-x-auto">
                    <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="font-semibold cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort("type")}>
                          <div className="flex items-center gap-1">
                            Type
                            {sortBy === "type" && (
                              <span className="text-accent">{sortOrder === "asc" ? "↑" : "↓"}</span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort("reference_officielle")}>
                          <div className="flex items-center gap-1">
                            Référence
                            {sortBy === "reference_officielle" && (
                              <span className="text-accent">{sortOrder === "asc" ? "↑" : "↓"}</span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort("titre")}>
                          <div className="flex items-center gap-1">
                            Titre
                            {sortBy === "titre" && (
                              <span className="text-accent">{sortOrder === "asc" ? "↑" : "↓"}</span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort("autorite")}>
                          <div className="flex items-center gap-1">
                            Autorité
                            {sortBy === "autorite" && (
                              <span className="text-accent">{sortOrder === "asc" ? "↑" : "↓"}</span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort("date_publication")}>
                          <div className="flex items-center gap-1">
                            Date
                            {sortBy === "date_publication" && (
                              <span className="text-accent">{sortOrder === "asc" ? "↑" : "↓"}</span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold">Statut</TableHead>
                        <TableHead className="font-semibold text-center">Articles</TableHead>
                        <TableHead className="font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                      <TableBody>
                        {textes.map((texte: any) => {
                          const statutInfo = getStatutBadge(texte.statut_vigueur);
                          const articleCount = texte.articles?.[0]?.count || 0;
                          const isNew = isNewTexte(texte);
                          
                          return (
                            <BibliothequePreview key={texte.id} texte={texte} getStatutBadge={getStatutBadge}>
                              <TableRow 
                                className="hover:bg-accent/5 transition-colors cursor-pointer"
                                onClick={() => navigate(`/veille/bibliotheque/textes/${texte.id}`)}
                              >
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs font-medium">
                                      <span className="mr-1.5">{TYPE_ICONS[texte.type_acte as keyof typeof TYPE_ICONS]}</span>
                                      {TYPE_LABELS[texte.type_acte as keyof typeof TYPE_LABELS]}
                                    </Badge>
                                    {isNew && (
                                      <Badge className="bg-accent text-accent-foreground text-xs">Nouveau</Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="font-semibold text-sm">
                                  {texte.reference_officielle}
                                </TableCell>
                                <TableCell>
                                  <div className="max-w-md">
                                    <div className="font-medium text-foreground line-clamp-2 mb-1">
                                      {texte.intitule}
                                    </div>
                                    {texte.resume && (
                                      <div className="text-xs text-muted-foreground line-clamp-1">
                                        {texte.resume}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {texte.autorite_emettrice || "—"}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                  {texte.date_publication
                                    ? new Date(texte.date_publication).toLocaleDateString("fr-FR")
                                    : "—"}
                                </TableCell>
                                <TableCell>
                                  <Badge className={statutInfo.className}>
                                    <span className="mr-1">{statutInfo.icon}</span>
                                    {statutInfo.label}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-primary/5 text-primary font-semibold text-sm">
                                    {articleCount}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex justify-end gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/veille/bibliotheque/textes/${texte.id}`);
                                      }}
                                      className="h-8 w-8 p-0"
                                    >
                                      <FileText className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEdit(texte);
                                      }}
                                      className="h-8 w-8 p-0 hover:text-accent"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteTexteId(texte.id);
                                      }}
                                      className="h-8 w-8 p-0 hover:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            </BibliothequePreview>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-6">
                    {textes.map((texte: any) => (
                      <BibliothequeTextCard
                        key={texte.id}
                        texte={texte}
                        onEdit={handleEdit}
                        onDelete={setDeleteTexteId}
                        onQuickView={setQuickViewTexte}
                        getStatutBadge={getStatutBadge}
                        isNew={isNewTexte(texte)}
                        isSelected={selectedTextes.includes(texte.id)}
                        onSelect={handleSelectTexte}
                      />
                    ))}
                  </div>
                )}

                {/* Pagination améliorée */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/20">
                    <div className="text-sm text-muted-foreground">
                      Page <span className="font-semibold text-foreground">{page}</span> sur{" "}
                      <span className="font-semibold text-foreground">{totalPages}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(1)}
                        disabled={page === 1}
                        className="hidden sm:flex"
                      >
                        Première
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="hidden sm:inline ml-1">Précédent</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                      >
                        <span className="hidden sm:inline mr-1">Suivant</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(totalPages)}
                        disabled={page === totalPages}
                        className="hidden sm:flex"
                      >
                        Dernière
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <BibliothequeEmptyState
                hasFilters={activeFiltersCount > 0}
                hasSearch={!!searchTerm}
                onClearFilters={clearAllFilters}
                onAddNew={() => { setEditingTexte(null); setShowFormModal(true); }}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions Floating Bar */}
      <BibliothequeFloatingActions
        selectedCount={selectedTextes.length}
        onExport={handleBulkExport}
        onDelete={handleBulkDelete}
        onClear={() => setSelectedTextes([])}
      />

      {/* Quick View Drawer */}
      <BibliothequeQuickView
        open={!!quickViewTexte}
        onOpenChange={(open) => !open && setQuickViewTexte(null)}
        texte={quickViewTexte}
        onEdit={handleEdit}
        onDelete={setDeleteTexteId}
        getStatutBadge={getStatutBadge}
      />

      {/* Modals */}
      <TexteFormModal
        open={showFormModal}
        onOpenChange={(open) => {
          setShowFormModal(open);
          if (!open) setEditingTexte(null);
        }}
        texte={editingTexte}
      />

      <ImportCSVDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["textes-reglementaires"] });
        }}
      />

      <AlertDialog open={!!deleteTexteId} onOpenChange={() => setDeleteTexteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce texte réglementaire ? Cette action ne peut pas être annulée.
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
