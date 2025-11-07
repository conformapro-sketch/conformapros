import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, ChevronDown, ChevronRight, Pencil, Trash2, FolderOpen } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  fetchDomaines, 
  fetchSousDomainesByDomaine,
  softDeleteDomaine, 
  softDeleteSousDomaine,
  toggleDomaineActif,
  toggleSousDomaineActif
} from "@/lib/domaines-queries";
import { DomaineFormModal } from "@/components/DomaineFormModal";
import { SousDomaineFormModal } from "@/components/SousDomaineFormModal";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { Database } from "@/types/db";

type DomaineRow = Database["public"]["Tables"]["domaines_application"]["Row"];
type SousDomaineRow = Database["public"]["Tables"]["sous_domaines_application"]["Row"];

export default function DomainesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [domaineFormOpen, setDomaineFormOpen] = useState(false);
  const [sousDomaineFormOpen, setSousDomaineFormOpen] = useState(false);
  const [editingDomaine, setEditingDomaine] = useState<DomaineRow | undefined>();
  const [editingSousDomaine, setEditingSousDomaine] = useState<SousDomaineRow | undefined>();
  const [deletingDomaine, setDeletingDomaine] = useState<string | null>(null);
  const [deletingSousDomaine, setDeleteingSousDomaine] = useState<string | null>(null);
  const [expandedDomaines, setExpandedDomaines] = useState<Set<string>>(new Set());
  const [selectedDomaineForSousDomaine, setSelectedDomaineForSousDomaine] = useState<string | undefined>();

  const { data: domaines, isLoading } = useQuery({
    queryKey: ["domaines-reglementaires"],
    queryFn: fetchDomaines,
  });

  const deleteDomaineMutation = useMutation({
    mutationFn: softDeleteDomaine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domaines-reglementaires"] });
      toast({ title: "Domaine supprimé avec succès" });
      setDeletingDomaine(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur lors de la suppression",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteSousDomaineMutation = useMutation({
    mutationFn: softDeleteSousDomaine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sous-domaines"] });
      queryClient.invalidateQueries({ queryKey: ["domaines-reglementaires"] });
      toast({ title: "Sous-domaine supprimé avec succès" });
      setDeleteingSousDomaine(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur lors de la suppression",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleActifMutation = useMutation({
    mutationFn: ({ id, actif, type }: { id: string; actif: boolean; type: 'domaine' | 'sousDomaine' }) => {
      return type === 'domaine' ? toggleDomaineActif(id, actif) : toggleSousDomaineActif(id, actif);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domaines-reglementaires"] });
      queryClient.invalidateQueries({ queryKey: ["sous-domaines"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredDomaines = domaines?.filter(domaine =>
    domaine.libelle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    domaine.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (domaine.description && domaine.description.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  const toggleExpandDomaine = (domaineId: string) => {
    setExpandedDomaines(prev => {
      const newSet = new Set(prev);
      if (newSet.has(domaineId)) {
        newSet.delete(domaineId);
      } else {
        newSet.add(domaineId);
      }
      return newSet;
    });
  };

  const handleEditDomaine = (domaine: DomaineRow) => {
    setEditingDomaine(domaine);
    setDomaineFormOpen(true);
  };

  const handleEditSousDomaine = (sousDomaine: SousDomaineRow) => {
    setEditingSousDomaine(sousDomaine);
    setSousDomaineFormOpen(true);
  };

  const handleAddSousDomaine = (domaineId: string) => {
    setSelectedDomaineForSousDomaine(domaineId);
    setEditingSousDomaine(undefined);
    setSousDomaineFormOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">Domaines d'application</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Gérez les domaines et sous-domaines réglementaires
          </p>
        </div>
        <Button 
          className="bg-gradient-primary shadow-medium"
          onClick={() => {
            setEditingDomaine(undefined);
            setDomaineFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau domaine
        </Button>
      </div>

      {/* Search */}
      <Card className="shadow-soft">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, code ou description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : filteredDomaines.length > 0 ? (
        <Card className="shadow-soft">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Actif</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDomaines.map((domaine) => (
                  <DomaineRow
                    key={domaine.id}
                    domaine={domaine}
                    expanded={expandedDomaines.has(domaine.id)}
                    onToggleExpand={() => toggleExpandDomaine(domaine.id)}
                    onEdit={() => handleEditDomaine(domaine)}
                    onDelete={() => setDeletingDomaine(domaine.id)}
                    onToggleActif={(actif) => toggleActifMutation.mutate({ id: domaine.id, actif, type: 'domaine' })}
                    onAddSousDomaine={() => handleAddSousDomaine(domaine.id)}
                    onEditSousDomaine={handleEditSousDomaine}
                    onDeleteSousDomaine={(id) => setDeleteingSousDomaine(id)}
                    onToggleSousDomaineActif={(id, actif) => toggleActifMutation.mutate({ id, actif, type: 'sousDomaine' })}
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-soft">
          <CardContent className="py-12 text-center">
            <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "Aucun domaine ne correspond à la recherche" : "Aucun domaine enregistré"}
            </p>
          </CardContent>
        </Card>
      )}

      <DomaineFormModal
        open={domaineFormOpen}
        onOpenChange={(open) => {
          setDomaineFormOpen(open);
          if (!open) setEditingDomaine(undefined);
        }}
        domaine={editingDomaine}
      />

      <SousDomaineFormModal
        open={sousDomaineFormOpen}
        onOpenChange={(open) => {
          setSousDomaineFormOpen(open);
          if (!open) {
            setEditingSousDomaine(undefined);
            setSelectedDomaineForSousDomaine(undefined);
          }
        }}
        sousDomaine={editingSousDomaine}
        defaultDomaineId={selectedDomaineForSousDomaine}
      />

      <AlertDialog open={!!deletingDomaine} onOpenChange={() => setDeletingDomaine(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce domaine ? Tous les sous-domaines associés seront également supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletingDomaine && deleteDomaineMutation.mutate(deletingDomaine)}
              className="bg-destructive text-destructive-foreground"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingSousDomaine} onOpenChange={() => setDeleteingSousDomaine(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce sous-domaine ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletingSousDomaine && deleteSousDomaineMutation.mutate(deletingSousDomaine)}
              className="bg-destructive text-destructive-foreground"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface DomaineRowProps {
  domaine: DomaineRow;
  expanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActif: (actif: boolean) => void;
  onAddSousDomaine: () => void;
  onEditSousDomaine: (sousDomaine: SousDomaineRow) => void;
  onDeleteSousDomaine: (id: string) => void;
  onToggleSousDomaineActif: (id: string, actif: boolean) => void;
}

function DomaineRow({
  domaine,
  expanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onToggleActif,
  onAddSousDomaine,
  onEditSousDomaine,
  onDeleteSousDomaine,
  onToggleSousDomaineActif,
}: DomaineRowProps) {
  const { data: sousDomaines } = useQuery({
    queryKey: ["sous-domaines", domaine.id],
    queryFn: () => fetchSousDomainesByDomaine(domaine.id),
    enabled: expanded,
  });

  return (
    <Collapsible asChild open={expanded} onOpenChange={onToggleExpand}>
      <>
        <TableRow className="cursor-pointer">
          <TableCell>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="p-0 h-6 w-6">
                {expanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </TableCell>
          <TableCell>
            <Badge variant="outline" className="font-mono">{domaine.code}</Badge>
          </TableCell>
          <TableCell className="font-medium">{domaine.libelle}</TableCell>
          <TableCell className="text-muted-foreground text-sm">
            {domaine.description || "-"}
          </TableCell>
          <TableCell className="text-center">
            <Switch
              checked={domaine.actif ?? false}
              onCheckedChange={onToggleActif}
              onClick={(e) => e.stopPropagation()}
            />
          </TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddSousDomaine();
                }}
                title="Ajouter un sous-domaine"
              >
                <Plus className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                title="Modifier"
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-destructive hover:text-destructive"
                title="Supprimer"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
        
        <CollapsibleContent asChild>
          <TableRow>
            <TableCell colSpan={6} className="bg-muted/50 p-0">
              {sousDomaines && sousDomaines.length > 0 ? (
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-px flex-1 bg-border"></div>
                    <span className="text-xs text-muted-foreground font-medium">
                      Sous-domaines ({sousDomaines.length})
                    </span>
                    <div className="h-px flex-1 bg-border"></div>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Ordre</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Nom</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-center">Actif</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sousDomaines.map((sousDomaine) => (
                        <TableRow key={sousDomaine.id}>
                          <TableCell className="text-muted-foreground">{sousDomaine.ordre}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-mono text-xs">
                              {sousDomaine.code}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{sousDomaine.libelle}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {sousDomaine.description || "-"}
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={sousDomaine.actif ?? false}
                              onCheckedChange={(actif) => onToggleSousDomaineActif(sousDomaine.id, actif)}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEditSousDomaine(sousDomaine)}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDeleteSousDomaine(sousDomaine.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  <p>Aucun sous-domaine</p>
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={onAddSousDomaine}
                    className="mt-2"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Ajouter un sous-domaine
                  </Button>
                </div>
              )}
            </TableCell>
          </TableRow>
        </CollapsibleContent>
      </>
    </Collapsible>
  );
}
