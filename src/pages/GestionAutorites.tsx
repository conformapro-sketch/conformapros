import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { autoritesQueries, AutoriteEmettrice } from "@/lib/autorites-queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AutoriteFormModal } from "@/components/AutoriteFormModal";
import { Landmark, MoreVertical, Plus, Search, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
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

const TYPE_LABELS = {
  legislatif: "Législatif",
  executif: "Exécutif",
  ministeriel: "Ministériel",
  agence: "Agence",
  autre: "Autre",
};

const TYPE_COLORS = {
  legislatif: "bg-blue-100 text-blue-800",
  executif: "bg-purple-100 text-purple-800",
  ministeriel: "bg-green-100 text-green-800",
  agence: "bg-orange-100 text-orange-800",
  autre: "bg-gray-100 text-gray-800",
};

export default function GestionAutorites() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [formOpen, setFormOpen] = useState(false);
  const [editingAutorite, setEditingAutorite] = useState<AutoriteEmettrice | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [autoriteToDelete, setAutoriteToDelete] = useState<AutoriteEmettrice | null>(null);

  const { data: autorites = [], isLoading } = useQuery({
    queryKey: ['autorites-management', debouncedSearch],
    queryFn: () => autoritesQueries.fetchAllForManagement(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => autoritesQueries.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autorites'] });
      queryClient.invalidateQueries({ queryKey: ['autorites-management'] });
      toast.success("Autorité supprimée avec succès");
      setDeleteDialogOpen(false);
      setAutoriteToDelete(null);
    },
    onError: (error: any) => {
      toast.error("Erreur lors de la suppression", {
        description: error.message,
      });
    },
  });

  const filteredAutorites = autorites.filter((autorite) => {
    if (!debouncedSearch) return true;
    const searchLower = debouncedSearch.toLowerCase();
    return (
      autorite.nom.toLowerCase().includes(searchLower) ||
      autorite.nom_court?.toLowerCase().includes(searchLower)
    );
  });

  const handleEdit = (autorite: AutoriteEmettrice) => {
    setEditingAutorite(autorite);
    setFormOpen(true);
  };

  const handleDelete = (autorite: AutoriteEmettrice) => {
    setAutoriteToDelete(autorite);
    setDeleteDialogOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingAutorite(undefined);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="h-5 w-5" />
                Gestion des Autorités Émettrices
              </CardTitle>
              <CardDescription>
                Gérez les autorités qui publient les textes réglementaires
              </CardDescription>
            </div>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle autorité
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une autorité..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement...
            </div>
          ) : filteredAutorites.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune autorité trouvée
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Abréviation</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Pays</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAutorites.map((autorite) => (
                  <TableRow key={autorite.id}>
                    <TableCell className="font-medium">{autorite.nom}</TableCell>
                    <TableCell>
                      {autorite.nom_court && (
                        <Badge variant="outline">{autorite.nom_court}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {autorite.type && (
                        <Badge className={TYPE_COLORS[autorite.type]}>
                          {TYPE_LABELS[autorite.type]}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{autorite.pays}</TableCell>
                    <TableCell>
                      {autorite.actif ? (
                        <Badge variant="outline" className="text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-600">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(autorite)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(autorite)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AutoriteFormModal
        open={formOpen}
        onOpenChange={handleFormClose}
        autorite={editingAutorite}
        onSuccess={handleFormClose}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'autorité "{autoriteToDelete?.nom}" ?
              Cette action marquera l'autorité comme inactive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => autoriteToDelete && deleteMutation.mutate(autoriteToDelete.id)}
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
