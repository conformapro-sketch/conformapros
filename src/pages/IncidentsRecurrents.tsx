import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { fetchIncidents } from "@/lib/incidents-queries";
import { RotateCcw, Plus, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { TYPE_INCIDENT_LABELS, GRAVITE_INCIDENT_LABELS } from "@/types/incidents";
import { useState } from "react";
import { toast } from "sonner";

export default function IncidentsRecurrents() {
  const { data: allIncidents = [] } = useQuery({
    queryKey: ["incidents"],
    queryFn: () => fetchIncidents(),
  });

  // Détection automatique des incidents récurrents (similaires)
  const recurrentIncidents = allIncidents.filter(i => i.est_recurrent);

  // Groupement par type et site
  const groupedIncidents = recurrentIncidents.reduce((acc, incident) => {
    const key = `${incident.type_incident}_${incident.site_id}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(incident);
    return acc;
  }, {} as Record<string, typeof allIncidents>);

  const groups = Object.entries(groupedIncidents).map(([key, incidents]) => {
    const [type, siteId] = key.split('_');
    return {
      id: key,
      type,
      siteId,
      siteName: incidents[0]?.sites?.nom_site || "Site inconnu",
      incidents,
      count: incidents.length,
      lastOccurrence: incidents.sort((a, b) => 
        new Date(b.date_incident).getTime() - new Date(a.date_incident).getTime()
      )[0],
    };
  }).sort((a, b) => b.count - a.count);

  const handleCreatePreventiveAction = (groupId: string) => {
    toast.info("Création d'action préventive en cours de développement");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Incidents récurrents</h1>
          <p className="text-muted-foreground mt-1">
            Identification et suivi des incidents qui se répètent
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Créer un groupe
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <RotateCcw className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{recurrentIncidents.length}</div>
              <div className="text-sm text-muted-foreground">Incidents récurrents</div>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-warning/10 rounded-lg">
              <AlertCircle className="h-6 w-6 text-warning" />
            </div>
            <div>
              <div className="text-2xl font-bold">{groups.length}</div>
              <div className="text-sm text-muted-foreground">Groupes identifiés</div>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-destructive/10 rounded-lg">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {groups.filter(g => g.count >= 3).length}
              </div>
              <div className="text-sm text-muted-foreground">Groupes critiques (≥3)</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Liste des groupes d'incidents récurrents */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Groupes d'incidents récurrents</h2>
        {groups.length === 0 ? (
          <Card className="p-12 text-center">
            <RotateCcw className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              Aucun incident récurrent identifié pour le moment
            </p>
          </Card>
        ) : (
          groups.map(group => (
            <Card key={group.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">
                      {TYPE_INCIDENT_LABELS[group.type as keyof typeof TYPE_INCIDENT_LABELS] || group.type}
                    </h3>
                    <Badge variant={group.count >= 3 ? "destructive" : "secondary"}>
                      {group.count} occurrence{group.count > 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Site : {group.siteName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Dernière occurrence : {format(new Date(group.lastOccurrence.date_incident), "dd MMMM yyyy", { locale: fr })}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCreatePreventiveAction(group.id)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Action préventive
                </Button>
              </div>

              {/* Timeline des occurrences */}
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium">Historique des occurrences :</h4>
                <div className="space-y-2">
                  {group.incidents.slice(0, 5).map(incident => (
                    <div key={incident.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded">
                      <Badge variant="outline" className="text-xs">
                        {incident.numero_incident}
                      </Badge>
                      <span className="text-sm">
                        {format(new Date(incident.date_incident), "dd/MM/yyyy", { locale: fr })}
                      </span>
                      <Badge variant={incident.gravite === "majeure" ? "destructive" : "secondary"}>
                        {GRAVITE_INCIDENT_LABELS[incident.gravite]}
                      </Badge>
                      {incident.zone && (
                        <span className="text-sm text-muted-foreground">
                          {incident.zone}
                        </span>
                      )}
                    </div>
                  ))}
                  {group.incidents.length > 5 && (
                    <div className="text-sm text-muted-foreground text-center">
                      ... et {group.incidents.length - 5} autre(s) occurrence(s)
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
