import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Edit, Trash2, BookOpen, FileText } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import { CodeFormModal } from "@/components/CodeFormModal";
import { codesQueries } from "@/lib/codes-queries";
import type { CodeJuridique } from "@/types/codes";

export default function CodesJuridiques() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCode, setSelectedCode] = useState<CodeJuridique | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [codeToDelete, setCodeToDelete] = useState<CodeJuridique | null>(null);

  const { data: codes, isLoading } = useQuery({
    queryKey: ["codes-juridiques"],
    queryFn: () => codesQueries.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => codesQueries.deleteCode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["codes-juridiques"] });
      toast.success("Code juridique supprimé avec succès");
      setDeleteDialogOpen(false);
      setCodeToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la suppression du code");
    },
  });

  const filteredCodes = codes?.filter((code) => {
    const searchLower = searchTerm.toLowerCase();
    
    const domaineMatch = code.codes_domaines?.some(cd => 
      cd.domaines_reglementaires.libelle.toLowerCase().includes(searchLower)
    );
    
    return (
      code.nom_officiel.toLowerCase().includes(searchLower) ||
      code.abreviation.toLowerCase().includes(searchLower) ||
      domaineMatch
    );
  });

  const handleEdit = (code: CodeJuridique) => {
    setSelectedCode(code);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedCode(undefined);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (code: CodeJuridique) => {
    setCodeToDelete(code);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (codeToDelete) {
      deleteMutation.mutate(codeToDelete.id);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Codes Juridiques</h1>
          <p className="text-muted-foreground mt-1">
            Gérez les codes juridiques tunisiens et leurs textes associés
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau code
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des codes juridiques</CardTitle>
          <CardDescription>
            Organisez vos textes réglementaires par codes nationaux
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, abréviation ou domaine..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement...
            </div>
          ) : filteredCodes && filteredCodes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Abréviation</TableHead>
                  <TableHead>Nom officiel</TableHead>
                  <TableHead>Domaine</TableHead>
                  <TableHead>Référence JORT</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCodes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono">
                        {code.abreviation}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link
                        to={`/codes-juridiques/${code.id}`}
                        className="hover:underline flex items-center gap-2"
                      >
                        <BookOpen className="w-4 h-4" />
                        {code.nom_officiel}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {code.codes_domaines && code.codes_domaines.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {code.codes_domaines.map((cd) => (
                            <Badge key={cd.id} variant="outline" className="text-xs">
                              {cd.domaines_reglementaires.libelle}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {code.reference_jort || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(code)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(code)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm
                  ? "Aucun code ne correspond à votre recherche"
                  : "Aucun code juridique créé pour le moment"}
              </p>
              {!searchTerm && (
                <Button onClick={handleCreate} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Créer le premier code
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <CodeFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        code={selectedCode}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le code "{codeToDelete?.nom_officiel}" ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
