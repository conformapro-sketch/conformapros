import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  FileText, 
  Search, 
  Eye, 
  Plus,
  Download,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  ExternalLink,
  FileDown,
  Filter,
  X
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { textesReglementairesQueries } from "@/lib/textes-reglementaires-queries";
import { TexteReglementaireFormModal } from "@/components/TexteReglementaireFormModal";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const TYPE_LABELS: Record<string, string> = {
  loi: "Loi",
  decret: "Décret",
  arrete: "Arrêté",
  circulaire: "Circulaire"
};

export default function GestionTextesReglementaires() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedDomaines, setSelectedDomaines] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [hasPdf, setHasPdf] = useState<boolean | null>(null);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("date_publication");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showTexteModal, setShowTexteModal] = useState(false);
  const [editingTexte, setEditingTexte] = useState<any>(null);
  const [deleteConfirmTexte, setDeleteConfirmTexte] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const pageSize = 25;

  // Charger les domaines pour le filtre
  const { data: domaines = [] } = useQuery({
    queryKey: ["domaines-reglementaires"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("domaines_reglementaires")
        .select("id, code, libelle")
        .eq("actif", true)
        .order("libelle");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: result, isLoading } = useQuery({
    queryKey: ["textes-reglementaires", searchTerm, typeFilter, selectedDomaines, dateFrom, dateTo, hasPdf, page, sortBy, sortOrder],
    queryFn: () =>
      textesReglementairesQueries.getAll({
        searchTerm,
        typeFilter: typeFilter !== "all" ? typeFilter : undefined,
        domainesFilter: selectedDomaines.length > 0 ? selectedDomaines : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        hasPdf,
        page,
        pageSize,
        sortBy,
        sortOrder,
      }),
  });

  const textes = result?.data || [];
  const totalCount = result?.count || 0;
  const totalPages = result?.totalPages || 1;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => textesReglementairesQueries.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["textes-reglementaires"] });
      toast.success("Texte supprimé avec succès");
      setDeleteConfirmTexte(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la suppression");
    },
  });

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const handleEdit = (texte: any) => {
    setEditingTexte(texte);
    setShowTexteModal(true);
  };

  const handleDelete = (texte: any) => {
    setDeleteConfirmTexte(texte);
  };

  const confirmDelete = () => {
    if (deleteConfirmTexte) {
      deleteMutation.mutate(deleteConfirmTexte.id);
    }
  };

  const toggleDomaine = (domaineId: string) => {
    setSelectedDomaines((prev) =>
      prev.includes(domaineId)
        ? prev.filter((id) => id !== domaineId)
        : [...prev, domaineId]
    );
    setPage(1);
  };

  const clearAllFilters = () => {
    setTypeFilter("all");
    setSelectedDomaines([]);
    setDateFrom("");
    setDateTo("");
    setHasPdf(null);
    setSearchTerm("");
    setPage(1);
  };

  const hasActiveFilters = 
    typeFilter !== "all" ||
    selectedDomaines.length > 0 ||
    dateFrom ||
    dateTo ||
    hasPdf !== null ||
    searchTerm;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
            Gestion des textes réglementaires
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Administration des textes réglementaires - Staff uniquement
          </p>
        </div>
        <Button 
          size="sm" 
          onClick={() => {
            setEditingTexte(null);
            setShowTexteModal(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Créer un texte
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="shadow-soft">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* Barre de recherche */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par référence ou titre..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              <Button
                variant={showFilters ? "default" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtres
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2">
                    {[
                      typeFilter !== "all" ? 1 : 0,
                      selectedDomaines.length,
                      dateFrom ? 1 : 0,
                      dateTo ? 1 : 0,
                      hasPdf !== null ? 1 : 0,
                    ].reduce((a, b) => a + b, 0)}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Filtres avancés */}
            {showFilters && (
              <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Filtres avancés</h3>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                      <X className="h-3 w-3 mr-1" />
                      Réinitialiser
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Type de texte */}
                  <div className="space-y-2">
                    <Label>Type de texte</Label>
                    <Select value={typeFilter} onValueChange={(val) => { setTypeFilter(val); setPage(1); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Type de texte" />
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

                  {/* Date de début */}
                  <div className="space-y-2">
                    <Label>Date publication (depuis)</Label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => {
                        setDateFrom(e.target.value);
                        setPage(1);
                      }}
                    />
                  </div>

                  {/* Date de fin */}
                  <div className="space-y-2">
                    <Label>Date publication (jusqu'à)</Label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => {
                        setDateTo(e.target.value);
                        setPage(1);
                      }}
                    />
                  </div>
                </div>

                {/* Domaines (multi-sélection) */}
                <div className="space-y-2">
                  <Label>Domaines réglementaires</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        {selectedDomaines.length === 0
                          ? "Tous les domaines"
                          : `${selectedDomaines.length} domaine(s) sélectionné(s)`}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {domaines.map((domaine: any) => (
                          <div key={domaine.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`domaine-${domaine.id}`}
                              checked={selectedDomaines.includes(domaine.id)}
                              onCheckedChange={() => toggleDomaine(domaine.id)}
                            />
                            <label
                              htmlFor={`domaine-${domaine.id}`}
                              className="text-sm cursor-pointer flex-1"
                            >
                              {domaine.libelle} ({domaine.code})
                            </label>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Présence de PDF */}
                <div className="space-y-2">
                  <Label>Fichier PDF</Label>
                  <Select
                    value={hasPdf === null ? "all" : hasPdf ? "yes" : "no"}
                    onValueChange={(val) => {
                      setHasPdf(val === "all" ? null : val === "yes");
                      setPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="yes">Avec PDF</SelectItem>
                      <SelectItem value="no">Sans PDF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <FileText className="h-5 w-5 text-primary" />
            Textes réglementaires
          </CardTitle>
          <CardDescription className="text-sm">
            {totalCount} texte(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : textes.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50" 
                        onClick={() => handleSort("type")}
                      >
                        Type {sortBy === "type" && (sortOrder === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50" 
                        onClick={() => handleSort("reference")}
                      >
                        Référence {sortBy === "reference" && (sortOrder === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50" 
                        onClick={() => handleSort("titre")}
                      >
                        Titre {sortBy === "titre" && (sortOrder === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50" 
                        onClick={() => handleSort("date_publication")}
                      >
                        Date publication {sortBy === "date_publication" && (sortOrder === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50" 
                        onClick={() => handleSort("created_at")}
                      >
                        Date création {sortBy === "created_at" && (sortOrder === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead className="text-center">#Articles</TableHead>
                      <TableHead>Fichiers</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {textes.map((texte: any) => {
                      const articleCount = texte.articles?.[0]?.count || 0;
                      
                      return (
                        <TableRow key={texte.id}>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {TYPE_LABELS[texte.type] || texte.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {texte.reference}
                          </TableCell>
                          <TableCell>
                            <div className="max-w-md line-clamp-2">
                              {texte.titre}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {texte.date_publication
                              ? new Date(texte.date_publication).toLocaleDateString("fr-FR")
                              : "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(texte.created_at).toLocaleDateString("fr-FR")}
                          </TableCell>
                          <TableCell className="text-center text-sm font-medium">
                            {articleCount}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {texte.pdf_url && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => window.open(texte.pdf_url, '_blank')}
                                >
                                  <FileDown className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {texte.source_url && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => window.open(texte.source_url, '_blank')}
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => navigate(`/bibliotheque/textes/${texte.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEdit(texte)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDelete(texte)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page} sur {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Aucun texte réglementaire trouvé
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Modal */}
      <TexteReglementaireFormModal
        open={showTexteModal}
        onOpenChange={(open) => {
          setShowTexteModal(open);
          if (!open) setEditingTexte(null);
        }}
        texte={editingTexte}
        onSuccess={() => {
          setEditingTexte(null);
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmTexte} onOpenChange={() => setDeleteConfirmTexte(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce texte réglementaire ?
              <br />
              <strong className="text-foreground">{deleteConfirmTexte?.reference}</strong>
              <br />
              Cette action est irréversible. Tous les articles associés seront également supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
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
