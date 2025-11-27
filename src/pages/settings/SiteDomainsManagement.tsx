import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe, Search, Building2, Save, AlertCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sitesQueryService } from "@/lib/sites-query-service";
import { listDomaines, listSiteVeilleDomaines, toggleSiteVeilleDomaine } from "@/lib/multi-tenant-queries";
import { ClientAutocomplete } from "@/components/shared/ClientAutocomplete";
import { useDebounce } from "@/hooks/useDebounce";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SiteDomainsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClient, setFilterClient] = useState<string>("all");
  const [selectedSite, setSelectedSite] = useState<string>("");
  const [enabledDomains, setEnabledDomains] = useState<Set<string>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: sites = [], isLoading: sitesLoading } = useQuery({
    queryKey: ["sites"],
    queryFn: sitesQueryService.fetchAll,
    staleTime: 2 * 60 * 1000,
  });


  const { data: domaines = [], isLoading: domainesLoading } = useQuery({
    queryKey: ["domaines"],
    queryFn: listDomaines,
    staleTime: 5 * 60 * 1000,
  });

  const { data: siteVeilleDomaines = [], refetch: refetchSiteVeilleDomaines } = useQuery({
    queryKey: ["site-veille-domaines", selectedSite],
    queryFn: () => selectedSite ? listSiteVeilleDomaines(selectedSite) : Promise.resolve([]),
    enabled: !!selectedSite,
  });

  // Update enabled domains when site or site veille domaines changes
  useEffect(() => {
    if (selectedSite && siteVeilleDomaines) {
      const enabledIds = new Set<string>(
        siteVeilleDomaines
          .filter((svd: any) => svd.actif)
          .map((svd: any) => svd.domaine_id)
      );
      setEnabledDomains(enabledIds);
      setHasChanges(false);
    } else {
      setEnabledDomains(new Set());
      setHasChanges(false);
    }
  }, [selectedSite, siteVeilleDomaines]);

  const saveMutation = useMutation({
    mutationFn: async (domaineId: string) => {
      if (!selectedSite) throw new Error("Aucun site sélectionné");
      
      const isEnabled = enabledDomains.has(domaineId);
      
      await toggleSiteVeilleDomaine(selectedSite, domaineId, isEnabled);
    },
    onSuccess: () => {
      refetchSiteVeilleDomaines();
      toast({ title: "✓ Domaines mis à jour avec succès" });
      setHasChanges(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur lors de la mise à jour",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleToggleDomain = (domaineId: string) => {
    setEnabledDomains(prev => {
      const newSet = new Set(prev);
      if (newSet.has(domaineId)) {
        newSet.delete(domaineId);
      } else {
        newSet.add(domaineId);
      }
      return newSet;
    });
    setHasChanges(true);
  };

  const handleSaveChanges = async () => {
    if (!selectedSite) return;
    
    // Save all domain toggles
    for (const domaine of domaines) {
      await saveMutation.mutateAsync(domaine.id);
    }
  };

  const filteredSites = sites?.filter(site => {
    const matchesSearch = 
      site.nom_site.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      site.code_site.toLowerCase().includes(debouncedSearch.toLowerCase());

    const matchesClient = filterClient === "all" || site.client_id === filterClient;

    return matchesSearch && matchesClient;
  }) || [];

  const selectedSiteData = sites.find(s => s.id === selectedSite);

  const isLoading = sitesLoading || domainesLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Domaines Autorisés par Site</h1>
        <p className="text-muted-foreground mt-2">
          Configurez les domaines réglementaires accessibles pour chaque site
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ClientAutocomplete
              value={filterClient}
              onChange={setFilterClient}
              showAllOption={true}
              placeholder="Filtrer par client"
            />

            <Select value={selectedSite} onValueChange={setSelectedSite}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un site" />
              </SelectTrigger>
              <SelectContent>
                {filteredSites.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    Aucun site disponible
                  </div>
                ) : (
                  filteredSites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.nom_site} ({site.code_site})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un site..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Site Info */}
      {selectedSite && selectedSiteData && (
        <Alert>
          <Building2 className="h-4 w-4" />
          <AlertDescription>
            Configuration des domaines pour <strong>{selectedSiteData.nom_site}</strong>
            {(selectedSiteData as any).clients && (
              <span className="text-muted-foreground ml-2">
                ({(selectedSiteData as any).clients.nom})
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Domains List */}
      {selectedSite ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Domaines Réglementaires</CardTitle>
            {hasChanges && (
              <Button onClick={handleSaveChanges} disabled={saveMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer les modifications
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : domaines.length === 0 ? (
              <div className="text-center py-12">
                <Globe className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucun domaine disponible</p>
              </div>
            ) : (
              <div className="space-y-3">
                {domaines.map((domaine: any) => (
                  <div
                    key={domaine.id}
                    className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <Checkbox
                      id={domaine.id}
                      checked={enabledDomains.has(domaine.id)}
                      onCheckedChange={() => handleToggleDomain(domaine.id)}
                    />
                    <label
                      htmlFor={domaine.id}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" style={{ borderColor: domaine.couleur }}>
                          {domaine.code}
                        </Badge>
                        <div>
                          <div className="font-medium">{domaine.libelle}</div>
                          {domaine.description && (
                            <div className="text-sm text-muted-foreground">
                              {domaine.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Veuillez sélectionner un site pour configurer ses domaines autorisés
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {selectedSite && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {enabledDomains.size}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Domaines autorisés
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {domaines.length - enabledDomains.size}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Domaines non autorisés
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
