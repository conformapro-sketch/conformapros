import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Building2, 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  Settings, 
  MapPin,
  Users,
  Eye,
  Archive,
  Power
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sitesQueryService } from "@/lib/sites-query-service";
import { siteModulesQueries } from "@/lib/multi-tenant-queries";
import { ClientAutocomplete } from "@/components/shared/ClientAutocomplete";
import { siteDomainQueries } from "@/lib/site-domains-queries";
import { useDebounce } from "@/hooks/useDebounce";
import { SiteFormModal } from "@/components/SiteFormModal";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import type { Database } from "@/types/db";
import { useNavigate } from "react-router-dom";

type SiteRow = Database["public"]["Tables"]["sites"]["Row"];

export default function SitesManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClient, setFilterClient] = useState<string>("all");
  const [siteFormOpen, setSiteFormOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<SiteRow | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: sites = [], isLoading: sitesLoading } = useQuery({
    queryKey: ["sites"],
    queryFn: sitesQueryService.fetchAll,
    staleTime: 2 * 60 * 1000,
  });


  const siteIds = sites?.map(s => s.id) || [];
  
  const { data: bulkModules = {} } = useQuery({
    queryKey: ["bulk-site-modules", siteIds],
    queryFn: () => siteModulesQueries.getBulkSiteModules(siteIds),
    enabled: siteIds.length > 0,
    staleTime: 2 * 60 * 1000,
  });

  const { data: domainCounts = {} } = useQuery({
    queryKey: ["site-domain-counts", siteIds],
    queryFn: () => siteDomainQueries.getDomainCounts(siteIds),
    enabled: siteIds.length > 0,
    staleTime: 2 * 60 * 1000,
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, actif }: { id: string; actif: boolean }) => {
      const { error } = await sitesQueryService.update(id, { actif });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      toast({ 
        title: "✓ Statut mis à jour",
        description: "Le statut du site a été modifié avec succès."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier le statut",
        variant: "destructive",
      });
    },
  });

  const handleToggleActive = (site: SiteRow) => {
    toggleActiveMutation.mutate({ id: site.id, actif: !(site as any).actif });
  };

  const deleteMutation = useMutation({
    mutationFn: sitesQueryService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({ 
        title: "✓ Site supprimé",
        description: "Le site a été supprimé avec succès."
      });
      setDeletingId(null);
    },
    onError: (error: any) => {
      const actionHint = error?.code === '23503' 
        ? "Ce site contient des données liées. Veuillez les supprimer d'abord." 
        : "Vérifiez vos permissions et réessayez.";
      
      toast({
        title: "Erreur lors de la suppression",
        description: `${error.message} ${actionHint}`,
        variant: "destructive",
      });
    },
  });

  const filteredSites = sites?.filter(site => {
    const matchesSearch = 
      site.nom_site.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      site.code_site.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (site.gouvernorat && site.gouvernorat.toLowerCase().includes(debouncedSearch.toLowerCase()));

    const matchesClient = filterClient === "all" || site.client_id === filterClient;

    return matchesSearch && matchesClient;
  }) || [];

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

  const handleViewSite = (siteId: string) => {
    navigate(`/sites/${siteId}`);
  };

  const isLoading = sitesLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion des Sites</h1>
          <p className="text-muted-foreground mt-2">
            Gérez tous les sites des clients
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingSite(undefined);
            setSiteFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau site
        </Button>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, code, gouvernorat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <ClientAutocomplete
              value={filterClient}
              onChange={setFilterClient}
              showAllOption={true}
              placeholder="Filtrer par client"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sites List */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredSites.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || filterClient !== "all" 
                  ? "Aucun site ne correspond aux critères de recherche"
                  : "Aucun site créé pour le moment"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Site</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-center">Modules</TableHead>
                    <TableHead className="text-center">Domaines</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSites.map((site) => {
                    const client = (site as any).clients;
                    const siteModules = bulkModules[site.id] || [];
                    const domainsCount = domainCounts[site.id] || 0;
                    const siteActif = (site as any).actif ?? true;
                    
                    return (
                      <TableRow key={site.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{site.nom_site}</div>
                            <div className="text-sm text-muted-foreground">{site.code_site}</div>
                            {site.gouvernorat && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <MapPin className="h-3 w-3" />
                                <span>{site.gouvernorat}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {client?.logo_url && (
                              <img 
                                src={client.logo_url} 
                                alt={client.nom}
                                className="h-6 w-6 object-contain rounded"
                              />
                            )}
                            <span className="text-sm">{client?.nom || "-"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {siteActif ? (
                              <Badge variant="default" className="bg-green-600">
                                Actif
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Inactif</Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleToggleActive(site)}
                              title={siteActif ? "Désactiver" : "Activer"}
                            >
                              <Power className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">
                            {siteModules.length}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">
                            {domainsCount}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Settings className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewSite(site.id)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Voir détails
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(site)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(site)}>
                                <Settings className="h-4 w-4 mr-2" />
                                Modules & Domaines
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(site.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Site Form Modal */}
      <SiteFormModal
        open={siteFormOpen}
        onOpenChange={setSiteFormOpen}
        site={editingSite}
      />

      {/* Delete Confirmation */}
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
    </div>
  );
}
