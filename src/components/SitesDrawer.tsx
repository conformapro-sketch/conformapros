import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, MapPin, Users, Factory, Pencil, Trash2, FileText } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchSitesByClient, deleteSite } from "@/lib/multi-tenant-queries";
import { SiteFormModal } from "./SiteFormModal";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { Database } from "@/types/db";

type SiteRow = Database["public"]["Tables"]["sites"]["Row"];

interface SitesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  brandColor?: string;
}

export function SitesDrawer({ open, onOpenChange, clientId, clientName, brandColor = "#0066CC" }: SitesDrawerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [siteFormOpen, setSiteFormOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<SiteRow | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: sites, isLoading } = useQuery({
    queryKey: ["sites", clientId],
    queryFn: () => fetchSitesByClient(clientId),
    enabled: open,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites", clientId] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({ title: "Site supprimé avec succès" });
      setDeletingId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur lors de la suppression",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (site: SiteRow) => {
    setEditingSite(site);
    setSiteFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId);
    }
  };

  const handleExportPDF = () => {
    toast({ title: "Export PDF en cours...", description: "Fonctionnalité à venir" });
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-4xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5" style={{ color: brandColor }} />
              Sites de {clientName}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {sites?.length || 0} site{(sites?.length || 0) > 1 ? 's' : ''} enregistré{(sites?.length || 0) > 1 ? 's' : ''}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExportPDF}>
                  <FileText className="h-4 w-4 mr-2" />
                  Exporter PDF
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => {
                    setEditingSite(undefined);
                    setSiteFormOpen(true);
                  }}
                  style={{ backgroundColor: brandColor }}
                  className="text-white hover:opacity-90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau site
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: brandColor }}></div>
              </div>
            ) : sites && sites.length > 0 ? (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Adresse</TableHead>
                      <TableHead>Gouvernorat</TableHead>
                      <TableHead>Classification</TableHead>
                      <TableHead>Effectif</TableHead>
                      <TableHead>Activité</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sites.map((site) => (
                      <TableRow key={site.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{site.nom_site}</div>
                            <div className="text-xs text-muted-foreground font-mono">{site.code_site}</div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{site.adresse || "-"}</TableCell>
                        <TableCell>
                          {site.gouvernorat ? (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {site.gouvernorat}
                            </div>
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          {site.classification ? (
                            <Badge variant="outline" className="text-xs">{site.classification}</Badge>
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          {site.effectif ? (
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {site.effectif}
                            </div>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{site.activite || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(site)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(site.id)}
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
              <div className="border rounded-lg p-12 text-center">
                <Factory className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Aucun site enregistré pour ce client</p>
                <Button 
                  className="mt-4" 
                  onClick={() => {
                    setEditingSite(undefined);
                    setSiteFormOpen(true);
                  }}
                  style={{ backgroundColor: brandColor }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer le premier site
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <SiteFormModal
        open={siteFormOpen}
        onOpenChange={(open) => {
          setSiteFormOpen(open);
          if (!open) setEditingSite(undefined);
        }}
        site={editingSite}
        clientId={clientId}
      />

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce site ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
