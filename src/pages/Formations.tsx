import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Plus, Search, Users, Calendar, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { fetchFormations, fetchFormationStats } from "@/lib/formations-queries";
import { fetchSitesByClient } from "@/lib/multi-tenant-queries";
import { FORMATION_STATUS_COLORS, FORMATION_STATUS_LABELS } from "@/types/formations";
import { FormationFormDrawer } from "@/components/FormationFormDrawer";
import { FormationDetailDrawer } from "@/components/FormationDetailDrawer";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { StatCard } from "@/components/StatCard";

export default function Formations() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSite, setSelectedSite] = useState<string>("all");
  const [selectedStatut, setSelectedStatut] = useState<string>("all");
  const [selectedDomaine, setSelectedDomaine] = useState<string>("all");
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedFormation, setSelectedFormation] = useState<any>(null);

  // Fetch sites
  const { data: sites = [] } = useQuery({
    queryKey: ["sites-all"],
    queryFn: () => fetchSitesByClient("all"),
  });

  // Fetch formations
  const { data: formations = [], isLoading } = useQuery({
    queryKey: ["formations", selectedSite === "all" ? undefined : selectedSite],
    queryFn: () => fetchFormations(selectedSite === "all" ? undefined : selectedSite),
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["formations-stats", selectedSite === "all" ? undefined : selectedSite],
    queryFn: () => fetchFormationStats(selectedSite === "all" ? undefined : selectedSite),
  });

  // Filter formations
  const filteredFormations = formations.filter((formation) => {
    const matchesSearch =
      searchTerm === "" ||
      formation.intitule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formation.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formation.formateur_nom?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatut = selectedStatut === "all" || formation.statut === selectedStatut;
    const matchesDomaine = selectedDomaine === "all" || formation.domaine === selectedDomaine;

    return matchesSearch && matchesStatut && matchesDomaine;
  });

  const handleEditFormation = (formation: any) => {
    setSelectedFormation(formation);
    setFormDrawerOpen(true);
  };

  const handleViewDetails = (formation: any) => {
    setSelectedFormation(formation);
    setDetailDrawerOpen(true);
  };

  const handleCloseFormDrawer = () => {
    setFormDrawerOpen(false);
    setSelectedFormation(null);
  };

  const handleCloseDetailDrawer = () => {
    setDetailDrawerOpen(false);
    setSelectedFormation(null);
  };

  // Extract unique domains
  const uniqueDomaines = Array.from(new Set(formations.map((f) => f.domaine)));

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Formations HSE</h1>
            <p className="text-muted-foreground">
              Gestion des formations obligatoires et internes
            </p>
          </div>
        </div>
        <Button onClick={() => setFormDrawerOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle formation
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total formations"
          value={stats?.total || 0}
          icon={GraduationCap}
          trend="Toutes formations"
        />
        <StatCard
          title="Planifiées"
          value={stats?.planifiees || 0}
          icon={Clock}
          trend="À venir"
        />
        <StatCard
          title="Réalisées"
          value={stats?.realisees || 0}
          icon={CheckCircle2}
          trend="Terminées"
        />
        <StatCard
          title="Expirées"
          value={stats?.expirees || 0}
          icon={AlertCircle}
          trend="À renouveler"
          variant={stats?.expirees && stats.expirees > 0 ? "warning" : "default"}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une formation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={selectedSite} onValueChange={setSelectedSite}>
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

            <Select value={selectedDomaine} onValueChange={setSelectedDomaine}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les domaines" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les domaines</SelectItem>
                {uniqueDomaines.map((domaine) => (
                  <SelectItem key={domaine} value={domaine}>
                    {domaine}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatut} onValueChange={setSelectedStatut}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="planifiee">Planifiée</SelectItem>
                <SelectItem value="realisee">Réalisée</SelectItem>
                <SelectItem value="expiree">Expirée</SelectItem>
                <SelectItem value="annulee">Annulée</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead>Intitulé</TableHead>
                <TableHead>Domaine</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Formateur</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Participants</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : filteredFormations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <GraduationCap className="h-12 w-12 opacity-50" />
                      <p>Aucune formation trouvée</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredFormations.map((formation) => (
                  <TableRow
                    key={formation.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleViewDetails(formation)}
                  >
                    <TableCell className="font-mono text-sm">
                      {formation.reference}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formation.intitule}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{formation.domaine}</Badge>
                    </TableCell>
                    <TableCell>{formation.sites?.nom_site}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formation.formateur_nom || formation.organisme_formation || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {formation.date_realisee
                            ? format(new Date(formation.date_realisee), "dd MMM yyyy", { locale: fr })
                            : formation.date_prevue
                            ? format(new Date(formation.date_prevue), "dd MMM yyyy", { locale: fr })
                            : "-"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{formation.participants_count || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={FORMATION_STATUS_COLORS[formation.statut as keyof typeof FORMATION_STATUS_COLORS]}>
                        {FORMATION_STATUS_LABELS[formation.statut as keyof typeof FORMATION_STATUS_LABELS]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(formation);
                        }}
                      >
                        Détails
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Drawers */}
      <FormationFormDrawer
        open={formDrawerOpen}
        onOpenChange={handleCloseFormDrawer}
        formation={selectedFormation}
      />

      <FormationDetailDrawer
        open={detailDrawerOpen}
        onOpenChange={handleCloseDetailDrawer}
        formationId={selectedFormation?.id}
      />
    </div>
  );
}
