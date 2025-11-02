import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, AlertCircle, CheckCircle, Clock, Download, Plus, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

export default function PlanAction() {
  const [searchTerm, setSearchTerm] = useState("");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [siteFilter, setSiteFilter] = useState<string>("all");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [prioriteFilter, setPrioriteFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  // Récupérer la liste des clients
  const { data: clients = [] } = useQuery({
    queryKey: ['clients-for-actions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, nom, nom_legal')
        .order('nom');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Récupérer la liste des sites pour le client sélectionné
  const { data: sites = [] } = useQuery({
    queryKey: ['sites-for-actions', clientFilter],
    queryFn: async () => {
      if (clientFilter === "all") return [];
      
      const { data, error } = await supabase
        .from('sites')
        .select('id, nom_site, code_site')
        .eq('client_id', clientFilter)
        .order('nom_site');
      
      if (error) throw error;
      return data || [];
    },
    enabled: clientFilter !== "all",
  });

  // Récupérer les actions correctives avec toutes les informations nécessaires
  const { data: actionsData, isLoading } = useQuery({
    queryKey: ['actions-correctives', searchTerm, clientFilter, siteFilter, statutFilter, prioriteFilter, page],
    queryFn: async () => {
      let query = supabase
        .from('actions_correctives')
        .select(`
          id,
          titre,
          manquement,
          description,
          statut,
          priorite,
          date_echeance,
          cout_estime,
          created_at,
          responsable:responsable_id!employes (
            id,
            nom,
            prenom,
            email
          ),
          conformite:conformite_id (
            id,
            etat,
            commentaire,
            status:status_id (
              id,
              site_id,
              article_id,
              sites (
                id,
                nom_site,
                code_site,
                client_id,
                clients (id, nom, nom_legal)
              ),
              textes_articles!inner (
                numero,
                titre_court,
                texte_id
              )
            )
          )
        `, { count: 'exact' });

      // Filtres
      if (statutFilter !== "all") {
        query = query.eq('statut', statutFilter);
      }

      if (prioriteFilter !== "all") {
        query = query.eq('priorite', prioriteFilter);
      }

      // Pagination
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching actions:', error);
        throw error;
      }

      // Filtrage côté client pour les recherches complexes
      let filteredData = data || [];

      // Filtre par client
      if (clientFilter !== "all") {
        filteredData = filteredData.filter(action => 
          action.conformite?.status?.sites?.client_id === clientFilter
        );
      }

      // Filtre par site
      if (siteFilter !== "all") {
        filteredData = filteredData.filter(action => 
          action.conformite?.status?.site_id === siteFilter
        );
      }

      // Filtre par recherche textuelle
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        filteredData = filteredData.filter(action => {
          const texte = action.conformite?.status?.textes_articles?.textes_reglementaires;
          const article = action.conformite?.status?.textes_articles;
          const site = action.conformite?.status?.sites;
          const client = site?.clients;

          return (
            action.titre?.toLowerCase().includes(lowerSearch) ||
            action.manquement?.toLowerCase().includes(lowerSearch) ||
            texte?.reference_officielle?.toLowerCase().includes(lowerSearch) ||
            texte?.titre?.toLowerCase().includes(lowerSearch) ||
            article?.numero?.toLowerCase().includes(lowerSearch) ||
            site?.nom_site?.toLowerCase().includes(lowerSearch) ||
            client?.nom?.toLowerCase().includes(lowerSearch)
          );
        });
      }

      return {
        actions: filteredData,
        count: count || 0,
      };
    },
  });

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'a_faire':
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> À faire</Badge>;
      case 'en_cours':
        return <Badge variant="secondary" className="gap-1"><AlertCircle className="h-3 w-3" /> En cours</Badge>;
      case 'termine':
        return <Badge variant="default" className="gap-1 bg-green-500"><CheckCircle className="h-3 w-3" /> Terminé</Badge>;
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const getPrioriteBadge = (priorite: string) => {
    switch (priorite) {
      case 'haute':
        return <Badge variant="destructive">Haute</Badge>;
      case 'moyenne':
        return <Badge variant="secondary">Moyenne</Badge>;
      case 'basse':
        return <Badge variant="outline">Basse</Badge>;
      default:
        return <Badge variant="outline">{priorite}</Badge>;
    }
  };

  const handleExport = () => {
    toast.info("Fonctionnalité d'export en cours de développement");
  };

  const resetFilters = () => {
    setSearchTerm("");
    setClientFilter("all");
    setSiteFilter("all");
    setStatutFilter("all");
    setPrioriteFilter("all");
    setPage(1);
  };

  const hasActiveFilters = 
    searchTerm !== "" || 
    clientFilter !== "all" || 
    siteFilter !== "all" || 
    statutFilter !== "all" || 
    prioriteFilter !== "all";

  const actions = actionsData?.actions || [];
  const totalCount = actionsData?.count || 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plan d'action</h1>
          <p className="text-muted-foreground">
            Gérez et suivez toutes les actions correctives
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle action
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              <CardTitle>Filtres</CardTitle>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <X className="mr-2 h-4 w-4" />
                Réinitialiser
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Recherche</label>
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Client</label>
              <Select value={clientFilter} onValueChange={(value) => {
                setClientFilter(value);
                setSiteFilter("all");
                setPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les clients</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.nom || client.nom_legal}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Site</label>
              <Select 
                value={siteFilter} 
                onValueChange={(value) => {
                  setSiteFilter(value);
                  setPage(1);
                }}
                disabled={clientFilter === "all"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les sites" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les sites</SelectItem>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.nom_site}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Statut</label>
              <Select value={statutFilter} onValueChange={(value) => {
                setStatutFilter(value);
                setPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="a_faire">À faire</SelectItem>
                  <SelectItem value="en_cours">En cours</SelectItem>
                  <SelectItem value="termine">Terminé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Priorité</label>
              <Select value={prioriteFilter} onValueChange={(value) => {
                setPrioriteFilter(value);
                setPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les priorités" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les priorités</SelectItem>
                  <SelectItem value="haute">Haute</SelectItem>
                  <SelectItem value="moyenne">Moyenne</SelectItem>
                  <SelectItem value="basse">Basse</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des actions */}
      <Card>
        <CardHeader>
          <CardDescription>
            {totalCount} action{totalCount > 1 ? 's' : ''} corrective{totalCount > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : actions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune action trouvée</h3>
              <p className="text-muted-foreground mb-4">
                {hasActiveFilters 
                  ? "Essayez de modifier les filtres" 
                  : "Les actions correctives apparaîtront ici lorsque des non-conformités seront détectées"}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Non-conformité</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Référence texte</TableHead>
                    <TableHead>Responsable</TableHead>
                    <TableHead>Échéance</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Coût</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actions.map((action) => {
                    const site = action.conformite?.status?.sites;
                    const client = site?.clients;
                    const article = action.conformite?.status?.textes_articles;
                    const texte = article?.textes_reglementaires;

                    return (
                      <TableRow key={action.id}>
                        <TableCell className="font-medium">
                          {client?.nom || client?.nom_legal || '-'}
                        </TableCell>
                        <TableCell>
                          {site?.nom_site || '-'}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate" title={action.manquement || ''}>
                            {action.manquement || '-'}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate font-medium" title={action.titre}>
                            {action.titre}
                          </div>
                        </TableCell>
                        <TableCell>
                          {texte?.reference_officielle ? (
                            <div className="text-sm">
                              <div className="font-medium">{texte.reference_officielle}</div>
                              <div className="text-muted-foreground">Art. {article?.numero}</div>
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {action.responsable ? (
                            <div className="text-sm">
                              {action.responsable.prenom} {action.responsable.nom}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Non assigné</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {action.date_echeance ? (
                            format(new Date(action.date_echeance), 'dd MMM yyyy', { locale: fr })
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getPrioriteBadge(action.priorite)}</TableCell>
                        <TableCell>{getStatutBadge(action.statut)}</TableCell>
                        <TableCell>
                          {action.cout_estime ? (
                            `${action.cout_estime.toLocaleString('fr-FR')} DT`
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

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
                      Précédent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
