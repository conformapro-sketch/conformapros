import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Plus, Filter, TrendingDown, Eye } from "lucide-react";
import { AlertBadge } from "@/components/AlertBadge";
import { IncidentFormModal } from "@/components/IncidentFormModal";
import { IncidentDetailDrawer } from "@/components/IncidentDetailDrawer";
import { useQuery } from "@tanstack/react-query";
import { fetchIncidents, fetchIncidentStats } from "@/lib/incidents-queries";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { TYPE_INCIDENT_LABELS, GRAVITE_INCIDENT_COLORS, GRAVITE_INCIDENT_LABELS } from "@/types/incidents";

export default function Incidents() {
  const [formOpen, setFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ["incidents"],
    queryFn: () => fetchIncidents(),
  });

  const { data: stats } = useQuery({
    queryKey: ["incident-stats"],
    queryFn: () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      return fetchIncidentStats(undefined, startOfMonth);
    },
  });

  const handleViewDetails = (id: string) => {
    setSelectedIncidentId(id);
    setDetailsOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">Incidents HSE</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">Déclaration et suivi des incidents, accidents et presqu'accidents</p>
        </div>
        <Button className="bg-gradient-primary shadow-medium w-full sm:w-auto" onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Déclarer
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-soft border-l-4 border-l-destructive">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-destructive">{stats?.total || 0}</div>
            <p className="text-sm text-muted-foreground mt-1">Incidents ce mois</p>
          </CardContent>
        </Card>
        <Card className="shadow-soft border-l-4 border-l-warning">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-warning">{stats?.en_cours || 0}</div>
            <p className="text-sm text-muted-foreground mt-1">En cours</p>
          </CardContent>
        </Card>
        <Card className="shadow-soft border-l-4 border-l-success">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-success">{stats?.clotures || 0}</div>
            <p className="text-sm text-muted-foreground mt-1">Clôturés</p>
          </CardContent>
        </Card>
        <Card className="shadow-soft border-l-4 border-l-destructive">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-destructive">{stats?.majeurs || 0}</div>
            <p className="text-sm text-muted-foreground mt-1">Incidents majeurs</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des incidents */}
      <Card className="shadow-medium">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Incidents récents
              </CardTitle>
              <CardDescription>Suivi des déclarations et actions correctives</CardDescription>
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtrer
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : incidents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun incident enregistré
            </div>
          ) : (
            <div className="space-y-4">
              {incidents.map((incident) => (
                <div
                  key={incident.id}
                  className="flex items-center justify-between p-6 rounded-lg border border-border hover:bg-muted/50 transition-all shadow-soft"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 rounded-lg bg-destructive/10">
                      <AlertTriangle className="h-6 w-6 text-destructive" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg text-foreground">{incident.numero_incident}</h3>
                        <AlertBadge status={incident.statut === "en_cours" ? "en-cours" : "conforme"}>
                          {incident.statut === "en_cours" ? "En cours" : "Clôturé"}
                        </AlertBadge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1 line-clamp-2">{incident.description}</p>
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        <span className="text-sm text-muted-foreground">
                          {TYPE_INCIDENT_LABELS[incident.type_incident]}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          📍 {incident.sites?.nom_site}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          📅 {format(new Date(incident.date_incident), "dd/MM/yyyy", { locale: fr })}
                        </span>
                        <span className={`text-sm font-medium ${GRAVITE_INCIDENT_COLORS[incident.gravite]}`}>
                          Gravité : {GRAVITE_INCIDENT_LABELS[incident.gravite]}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewDetails(incident.id)}>
                      <Eye className="h-4 w-4 mr-1" />
                      Voir détails
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <IncidentFormModal open={formOpen} onOpenChange={setFormOpen} />
      <IncidentDetailDrawer
        incidentId={selectedIncidentId}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  );
}
