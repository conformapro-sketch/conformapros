import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  FileDown
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { textesReglementairesQueries } from "@/lib/textes-reglementaires-queries";
import { TexteReglementaireFormModal } from "@/components/TexteReglementaireFormModal";
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
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("date_publication");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showTexteModal, setShowTexteModal] = useState(false);
  const [editingTexte, setEditingTexte] = useState<any>(null);
  const [deleteConfirmTexte, setDeleteConfirmTexte] = useState<any>(null);
  const pageSize = 25;

  const { data: result, isLoading } = useQuery({
    queryKey: ["textes-reglementaires", searchTerm, typeFilter, page, sortBy, sortOrder],
    queryFn: () =>
      textesReglementairesQueries.getAll({
        searchTerm,
        typeFilter: typeFilter !== "all" ? typeFilter : undefined,
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
            
            <div className="flex gap-3">
              <Select value={typeFilter} onValueChange={(val) => { setTypeFilter(val); setPage(1); }}>
                <SelectTrigger className="w-[200px]">
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
                        className="cursor-pointer" 
                        onClick={() => handleSort("type")}
                      >
                        Type {sortBy === "type" && (sortOrder === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer" 
                        onClick={() => handleSort("reference")}
                      >
                        Référence {sortBy === "reference" && (sortOrder === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer" 
                        onClick={() => handleSort("titre")}
                      >
                        Titre {sortBy === "titre" && (sortOrder === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer" 
                        onClick={() => handleSort("date_publication")}
                      >
                        Date publication {sortBy === "date_publication" && (sortOrder === "asc" ? "↑" : "↓")}
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
