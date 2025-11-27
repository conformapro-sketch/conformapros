import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, Search, Building2, CheckCircle2, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { sitesQueryService } from "@/lib/sites-query-service";
import { siteModulesQueries } from "@/lib/multi-tenant-queries";
import { ClientAutocomplete } from "@/components/shared/ClientAutocomplete";
import { useDebounce } from "@/hooks/useDebounce";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function SiteModulesOverview() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClient, setFilterClient] = useState<string>("all");

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

  const filteredSites = sites?.filter(site => {
    const matchesSearch = 
      site.nom_site.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      site.code_site.toLowerCase().includes(debouncedSearch.toLowerCase());

    const matchesClient = filterClient === "all" || site.client_id === filterClient;

    return matchesSearch && matchesClient;
  }) || [];

  const isLoading = sitesLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Modules par Site</h1>
        <p className="text-muted-foreground mt-2">
          Visualisez les modules activés pour chaque site
        </p>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un site..."
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

      {/* Sites Modules List */}
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
                  : "Aucun site trouvé"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Site</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Modules activés</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSites.map((site) => {
                    const client = (site as any).clients;
                    const siteModules = bulkModules[site.id] || [];
                    
                    return (
                      <TableRow key={site.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{site.nom_site}</div>
                            <div className="text-sm text-muted-foreground">{site.code_site}</div>
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
                          {siteModules.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {siteModules.map((sm: any) => (
                                <Badge key={sm.id} variant="secondary" className="text-xs">
                                  <Settings className="h-3 w-3 mr-1" />
                                  {sm.code}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-muted-foreground text-sm">
                              <XCircle className="h-4 w-4" />
                              <span>Aucun module</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {siteModules.length > 0 ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span className="font-medium">{siteModules.length}</span>
                              </>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </div>
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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {filteredSites.length}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Sites totaux</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {filteredSites.filter(s => (bulkModules[s.id] || []).length > 0).length}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Sites avec modules</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {filteredSites.filter(s => (bulkModules[s.id] || []).length === 0).length}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Sites sans modules</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
