import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Plus, TrendingUp, CheckCircle, Clock, Filter, BarChart3, Repeat } from "lucide-react";
import { fetchIncidents, fetchIncidentStats } from "@/lib/incidents-queries";
import { IncidentFormModal } from "@/components/IncidentFormModal";
import { IncidentDetailDrawer } from "@/components/IncidentDetailDrawer";
import { IncidentExport } from "@/components/IncidentExport";
import { TYPE_INCIDENT_LABELS, GRAVITE_INCIDENT_COLORS, STATUT_INCIDENT_LABELS } from "@/types/incidents";
import { StatCard } from "@/components/StatCard";

export default function Incidents() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [siteFilter, setSiteFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [graviteFilter, setGraviteFilter] = useState<string>("all");
  const [statutFilter, setStatutFilter] = useState<string>("all");

  const { data: incidents, isLoading } = useQuery({
    queryKey: ["incidents"],
    queryFn: () => fetchIncidents(),
  });

  const { data: stats } = useQuery({
    queryKey: ["incident-stats"],
    queryFn: () => fetchIncidentStats(),
  });

  // Apply filters
  const filteredIncidents = incidents?.filter((incident) => {
    const matchSearch = 
      searchTerm === "" ||
      incident.numero_incident.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.personne_impliquee_nom?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchSite = siteFilter === "all" || incident.site_id === siteFilter;
    const matchType = typeFilter === "all" || incident.type_incident === typeFilter;
    const matchGravite = graviteFilter === "all" || incident.gravite === graviteFilter;
    const matchStatut = statutFilter === "all" || incident.statut === statutFilter;

    return matchSearch && matchSite && matchType && matchGravite && matchStatut;
  });

  const handleViewDetails = (id: string) => {
    setSelectedIncidentId(id);
    setIsDetailOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Incidents HSE</h1>
          <p className="text-muted-foreground mt-1">
            Gestion des incidents Hygiène, Sécurité, Environnement
          </p>
        </div>
        <div className="flex gap-2">
          <IncidentExport incidents={filteredIncidents || []} />
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Déclarer un incident
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <StatCard
          title="Total incidents"
          value={stats?.total || 0}
          icon={AlertCircle}
        />
        <StatCard
          title="En cours"
          value={stats?.en_cours || 0}
          icon={Clock}
        />
        <StatCard
          title="Clôturés"
          value={stats?.clotures || 0}
          icon={CheckCircle}
        />
        <StatCard
          title="Majeurs"
          value={stats?.majeurs || 0}
          icon={TrendingUp}
        />
        <StatCard
          title="Récurrents"
          value={stats?.recurrents || 0}
          icon={Repeat}
        />
      </div>

      {/* Additional Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Délai moyen de résolution</h3>
            </div>
            <p className="text-3xl font-bold">{stats.avgResolutionDays} jours</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Répartition par gravité</h3>
            </div>
            <div className="space-y-1 text-sm">
              {Object.entries(stats.byGravite).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="capitalize">{key}</span>
                  <span className="font-semibold">{value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5" />
          <h3 className="font-semibold">Filtres</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <Input
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {Object.entries(TYPE_INCIDENT_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={graviteFilter} onValueChange={setGraviteFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Gravité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes gravités</SelectItem>
              <SelectItem value="mineure">Mineure</SelectItem>
              <SelectItem value="moyenne">Moyenne</SelectItem>
              <SelectItem value="majeure">Majeure</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statutFilter} onValueChange={setStatutFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="en_cours">En cours</SelectItem>
              <SelectItem value="cloture">Clôturé</SelectItem>
            </SelectContent>
          </Select>
          {(searchTerm || typeFilter !== "all" || graviteFilter !== "all" || statutFilter !== "all") && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setTypeFilter("all");
                setGraviteFilter("all");
                setStatutFilter("all");
              }}
            >
              Réinitialiser
            </Button>
          )}
        </div>
      </Card>

      {/* Incidents List */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            Incidents ({filteredIncidents?.length || 0})
          </h2>
        </div>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Chargement...</div>
        ) : filteredIncidents && filteredIncidents.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">N° Incident</th>
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Type</th>
                <th className="text-left p-2">Site</th>
                <th className="text-left p-2">Gravité</th>
                <th className="text-left p-2">Statut</th>
                <th className="text-right p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.map((incident) => (
                <tr key={incident.id} className="border-b hover:bg-muted/50">
                  <td className="p-2 font-mono text-sm">
                    {incident.numero_incident}
                    {incident.est_recurrent && (
                      <Badge variant="outline" className="ml-2">
                        <Repeat className="h-3 w-3 mr-1" />
                        Récurrent
                      </Badge>
                    )}
                  </td>
                  <td className="p-2">
                    {new Date(incident.date_incident).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="p-2">{TYPE_INCIDENT_LABELS[incident.type_incident]}</td>
                  <td className="p-2">{incident.sites?.nom_site}</td>
                  <td className="p-2">
                    <span className={GRAVITE_INCIDENT_COLORS[incident.gravite]}>
                      {incident.gravite}
                    </span>
                  </td>
                  <td className="p-2">
                    <Badge
                      variant={incident.statut === "en_cours" ? "destructive" : "default"}
                    >
                      {STATUT_INCIDENT_LABELS[incident.statut]}
                    </Badge>
                  </td>
                  <td className="p-2 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(incident.id)}
                    >
                      Voir détails
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm || typeFilter !== "all" || graviteFilter !== "all" || statutFilter !== "all"
              ? "Aucun incident ne correspond aux filtres"
              : "Aucun incident enregistré"}
          </div>
        )}
      </Card>

      <IncidentFormModal open={isFormOpen} onOpenChange={setIsFormOpen} />
      <IncidentDetailDrawer
        incidentId={selectedIncidentId}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </div>
  );
}
