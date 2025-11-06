import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Plus, Search, MapPin, Factory, Eye, Pencil, Trash2, FileText, AlertTriangle, FileDown, Grid3x3, List, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClients, fetchSites, deleteClient } from "@/lib/multi-tenant-queries";
import { ClientFormModal } from "@/components/ClientFormModal";
import { SitesDrawer } from "@/components/SitesDrawer";
import { IntegrityCheckerModal } from "@/components/IntegrityCheckerModal";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import type { Database } from "@/types/db";

type ClientRow = Database["public"]["Tables"]["clients"]["Row"];

export default function Clients() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [secteurFilter, setSecteurFilter] = useState<string>("all");
  const [gouvernoratFilter, setGouvernoratFilter] = useState<string>("all");
  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRow | undefined>();
  const [sitesDrawerOpen, setSitesDrawerOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<{ id: string; name: string; color?: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [integrityCheckerOpen, setIntegrityCheckerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('clients-view-mode') as 'grid' | 'list') || 'grid';
  });

  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
  });

  const { data: allSites } = useQuery({
    queryKey: ["sites"],
    queryFn: fetchSites,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({ title: "Client supprimé avec succès" });
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

  const getSitesCount = (clientId: string) => {
    return allSites?.filter(site => site.client_id === clientId).length || 0;
  };

  const filteredClients = clients?.filter(client => {
    const matchesSearch = 
      client.nom_legal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.matricule_fiscale && client.matricule_fiscale.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (client.rne_rc && client.rne_rc.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatut = statutFilter === "all" || client.statut === statutFilter;
    const matchesSecteur = secteurFilter === "all" || client.secteur === secteurFilter;
    const matchesGouvernorat = gouvernoratFilter === "all" || client.gouvernorat === gouvernoratFilter;
    
    return matchesSearch && matchesStatut && matchesSecteur && matchesGouvernorat;
  }) || [];

  const handleEdit = (client: ClientRow) => {
    setEditingClient(client);
    setClientFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId);
    }
  };

  const handleViewSites = (client: ClientRow) => {
    setSelectedClient({
      id: client.id,
      name: client.nom_legal,
      color: client.couleur_primaire || undefined,
    });
    setSitesDrawerOpen(true);
  };

  const toggleViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('clients-view-mode', mode);
  };

  const billingModeLabels: Record<string, string> = {
    client: "Client",
    site: "Site",
    hybrid: "Hybride",
  };

  const handleExportCsv = () => {
    if (filteredClients.length === 0) {
      toast({
        title: "Export CSV",
        description: "Aucun client ne correspond aux filtres actuels.",
        variant: "destructive",
      });
      return;
    }

    const escapeValue = (value: string | number | null | undefined) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const headers = [
      "Nom",
      "Matricule fiscale",
      "RNE / RC",
      "Secteur",
      "Gouvernorat",
      "Sites",
      "Mode de facturation",
      "Statut",
    ].join(";");

    const rows = filteredClients.map((client) => {
      const siteCount = getSitesCount(client.id);
      const billingMode = billingModeLabels[client.billing_mode ?? "client"] ?? "Client";
      return [
        escapeValue(client.nom_legal || client.nom || ""),
        escapeValue(client.matricule_fiscale),
        escapeValue(client.rne_rc),
        escapeValue(client.secteur),
        escapeValue(client.gouvernorat),
        escapeValue(siteCount),
        escapeValue(billingMode),
        escapeValue(client.statut ?? "actif"),
      ].join(";");
    });

    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `clients_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    if (filteredClients.length === 0) {
      toast({
        title: "Export PDF",
        description: "Aucun client ne correspond aux filtres actuels.",
        variant: "destructive",
      });
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({
        title: "Export PDF",
        description: "Impossible d'ouvrir la fenêtre d'impression.",
        variant: "destructive",
      });
      return;
    }

    const tableRows = filteredClients
      .map((client) => {
        const siteCount = getSitesCount(client.id);
        const billingMode = billingModeLabels[client.billing_mode ?? "client"] ?? "Client";
        return `<tr>
          <td>${client.nom_legal ?? client.nom ?? ""}</td>
          <td>${client.matricule_fiscale ?? ""}</td>
          <td>${client.rne_rc ?? ""}</td>
          <td>${client.secteur ?? ""}</td>
          <td>${client.gouvernorat ?? ""}</td>
          <td>${siteCount}</td>
          <td>${billingMode}</td>
          <td>${client.statut ?? "actif"}</td>
        </tr>`;
      })
      .join("");

    printWindow.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Export clients</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; }
    h1 { font-size: 20px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
    th { background-color: #f7f7f7; text-align: left; }
  </style>
</head>
<body>
  <h1>Clients (${new Date().toLocaleDateString()})</h1>
  <table>
    <thead>
      <tr>
        <th>Nom</th>
        <th>Matricule fiscale</th>
        <th>RNE / RC</th>
        <th>Secteur</th>
        <th>Gouvernorat</th>
        <th>Sites</th>
        <th>Mode de facturation</th>
        <th>Statut</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>
</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };
  const activeClients = clients?.filter(c => c.statut === "actif").length || 0;
  const totalSites = allSites?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">Gestion des Clients</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Gérez vos clients et leurs sites
          </p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="outline" onClick={() => setIntegrityCheckerOpen(true)}>
            <AlertTriangle className="h-4 w-4 mr-2" />
            Vérifier l'intégrité
          </Button>
          <Button variant="outline" onClick={handleExportCsv}>
            <FileDown className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={handleExportPdf}>
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button 
            className="bg-gradient-primary shadow-medium"
            onClick={() => {
              setEditingClient(undefined);
              setClientFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau client
          </Button>
        </div>
      </div>

      {/* Search and filters */}
      <Card className="shadow-soft">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, MF ou RNE..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2 border-l pl-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleViewMode('grid')}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={gouvernoratFilter} onValueChange={setGouvernoratFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Gouvernorat" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border z-50 max-h-60 overflow-y-auto">
                  <SelectItem value="all">Tous les gouvernorats</SelectItem>
                  <SelectItem value="Ariana">Ariana</SelectItem>
                  <SelectItem value="Béja">Béja</SelectItem>
                  <SelectItem value="Ben Arous">Ben Arous</SelectItem>
                  <SelectItem value="Bizerte">Bizerte</SelectItem>
                  <SelectItem value="Gabès">Gabès</SelectItem>
                  <SelectItem value="Gafsa">Gafsa</SelectItem>
                  <SelectItem value="Jendouba">Jendouba</SelectItem>
                  <SelectItem value="Kairouan">Kairouan</SelectItem>
                  <SelectItem value="Kasserine">Kasserine</SelectItem>
                  <SelectItem value="Kébili">Kébili</SelectItem>
                  <SelectItem value="Le Kef">Le Kef</SelectItem>
                  <SelectItem value="Mahdia">Mahdia</SelectItem>
                  <SelectItem value="La Manouba">La Manouba</SelectItem>
                  <SelectItem value="Médenine">Médenine</SelectItem>
                  <SelectItem value="Monastir">Monastir</SelectItem>
                  <SelectItem value="Nabeul">Nabeul</SelectItem>
                  <SelectItem value="Sfax">Sfax</SelectItem>
                  <SelectItem value="Sidi Bouzid">Sidi Bouzid</SelectItem>
                  <SelectItem value="Siliana">Siliana</SelectItem>
                  <SelectItem value="Sousse">Sousse</SelectItem>
                  <SelectItem value="Tataouine">Tataouine</SelectItem>
                  <SelectItem value="Tozeur">Tozeur</SelectItem>
                  <SelectItem value="Tunis">Tunis</SelectItem>
                  <SelectItem value="Zaghouan">Zaghouan</SelectItem>
                </SelectContent>
              </Select>
              <Select value={secteurFilter} onValueChange={setSecteurFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Secteur" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border z-50">
                  <SelectItem value="all">Tous les secteurs</SelectItem>
                  <SelectItem value="Industriel">Industriel</SelectItem>
                  <SelectItem value="Services">Services</SelectItem>
                  <SelectItem value="Commerce">Commerce</SelectItem>
                  <SelectItem value="Administration">Administration</SelectItem>
                  <SelectItem value="Autre">Autre</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statutFilter} onValueChange={setStatutFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border z-50">
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="actif">Actif</SelectItem>
                  <SelectItem value="suspendu">Suspendu</SelectItem>
                  <SelectItem value="archivé">Archivé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <CardDescription>Total clients</CardDescription>
            <CardTitle className="text-3xl">{clients?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <CardDescription>Clients actifs</CardDescription>
            <CardTitle className="text-3xl text-success">{activeClients}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <CardDescription>Sites totaux</CardDescription>
            <CardTitle className="text-3xl">{totalSites}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <CardDescription>Résultats filtrés</CardDescription>
            <CardTitle className="text-3xl">{filteredClients.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Clients list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : filteredClients.length > 0 ? (
        viewMode === 'list' ? (
          <Card className="shadow-soft overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead>Secteur</TableHead>
                  <TableHead>Gouvernorat</TableHead>
                  <TableHead className="text-center">Sites</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => {
                  const brandColor = client.couleur_primaire || "#0066CC";
                  const sitesCount = getSitesCount(client.id);
                  
                  return (
                    <TableRow key={client.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/clients/${client.id}`)}>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {client.logo_url ? (
                          <div className="h-10 w-10 rounded flex items-center justify-center bg-background border border-border overflow-hidden">
                            <img src={client.logo_url} alt={client.nom_legal} className="h-full w-full object-contain" />
                          </div>
                        ) : (
                          <div 
                            className="h-10 w-10 rounded flex items-center justify-center"
                            style={{ backgroundColor: `${brandColor}20` }}
                          >
                            <Building2 className="h-5 w-5" style={{ color: brandColor }} />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{client.nom_legal}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {client.rne_rc || client.matricule_fiscale || "—"}
                      </TableCell>
                      <TableCell className="text-sm">{client.secteur || "—"}</TableCell>
                      <TableCell className="text-sm">{client.gouvernorat || "—"}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-mono">
                          {sitesCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={client.statut === "actif" ? "default" : "secondary"}>
                          {client.statut || "actif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="z-50">
                            <DropdownMenuItem onClick={() => navigate(`/clients/${client.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Voir détails
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(client)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewSites(client)}>
                              <Building2 className="h-4 w-4 mr-2" />
                              Voir sites ({sitesCount})
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/clients/utilisateurs?client=${client.id}`)}>
                              <Users className="h-4 w-4 mr-2" />
                              Utilisateurs client
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(client.id)} className="text-destructive">
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
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => {
            const brandColor = client.couleur_primaire || "#0066CC";
            const sitesCount = getSitesCount(client.id);
            
            return (
              <Card 
                key={client.id} 
                className="shadow-soft hover:shadow-medium transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {client.logo_url ? (
                        <div className="h-12 w-12 rounded-lg flex items-center justify-center bg-background border border-border overflow-hidden">
                          <img src={client.logo_url} alt={client.nom_legal} className="h-full w-full object-contain" />
                        </div>
                      ) : (
                        <div 
                          className="h-12 w-12 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${brandColor}20` }}
                        >
                          <Building2 className="h-6 w-6" style={{ color: brandColor }} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{client.nom_legal}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {client.rne_rc || client.matricule_fiscale || "Pas de référence"}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge 
                      variant={client.statut === "actif" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {client.statut || "actif"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {client.secteur && (
                      <div className="flex items-center gap-2 text-sm">
                        <Factory className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{client.secteur}</span>
                      </div>
                    )}
                    {client.gouvernorat && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{client.gouvernorat}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <span className="text-sm text-muted-foreground">
                        {sitesCount} site{sitesCount > 1 ? 's' : ''}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewSites(client)}
                          title="Voir les sites"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/clients/utilisateurs?client=${client.id}`)}
                          title="Utilisateurs client"
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(client)}
                          title="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(client.id)}
                          className="text-destructive hover:text-destructive"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          </div>
        )
      ) : (
        <Card className="shadow-soft">
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {searchQuery || statutFilter !== "all" || secteurFilter !== "all" || gouvernoratFilter !== "all"
                ? "Aucun client ne correspond aux filtres" 
                : "Aucun client enregistré"}
            </p>
            {!searchQuery && statutFilter === "all" && secteurFilter === "all" && gouvernoratFilter === "all" && (
              <Button 
                onClick={() => {
                  setEditingClient(undefined);
                  setClientFormOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer le premier client
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <ClientFormModal
        open={clientFormOpen}
        onOpenChange={(open) => {
          setClientFormOpen(open);
          if (!open) setEditingClient(undefined);
        }}
        client={editingClient}
      />

      {selectedClient && (
        <SitesDrawer
          open={sitesDrawerOpen}
          onOpenChange={setSitesDrawerOpen}
          clientId={selectedClient.id}
          clientName={selectedClient.name}
          brandColor={selectedClient.color}
        />
      )}

      <IntegrityCheckerModal
        open={integrityCheckerOpen}
        onOpenChange={setIntegrityCheckerOpen}
      />

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce client ? Tous les sites associés seront également supprimés. Cette action est irréversible.
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
