import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchFormations } from "@/lib/formations-queries";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FORMATION_STATUS_COLORS, FORMATION_STATUS_LABELS } from "@/types/formations";

export default function FormationsPlanning() {
  const [selectedMonth] = useState(new Date());

  const { data: formations, isLoading } = useQuery({
    queryKey: ["formations"],
    queryFn: () => fetchFormations(),
  });

  const plannedFormations = formations?.filter(
    (f) => f.statut === "planifiee"
  ) || [];

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Planification des formations</h1>
          <p className="text-muted-foreground">
            Calendrier et sessions à venir
          </p>
        </div>
        <Button>
          <Calendar className="h-4 w-4 mr-2" />
          Vue calendrier
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Formations planifiées - {format(selectedMonth, "MMMM yyyy", { locale: fr })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {plannedFormations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune formation planifiée pour le moment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {plannedFormations.map((formation) => (
                <Card key={formation.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">
                          {formation.intitule}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {formation.domaine}
                        </p>
                      </div>
                      <Badge className={FORMATION_STATUS_COLORS[formation.statut as keyof typeof FORMATION_STATUS_COLORS]}>
                        {FORMATION_STATUS_LABELS[formation.statut as keyof typeof FORMATION_STATUS_LABELS]}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {formation.date_prevue
                            ? format(new Date(formation.date_prevue), "dd MMM yyyy", { locale: fr })
                            : "Non définie"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{formation.duree_heures || 0}h</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{formation.lieu || "Non défini"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>0 participants</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
