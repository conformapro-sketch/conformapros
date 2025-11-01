import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, isSameDay, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { fetchEquipements } from "@/lib/controles-queries";
import { fetchSites } from "@/lib/multi-tenant-queries";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";

const STATUT_CONFORMITE_LABELS = {
  conforme: { label: "Conforme", color: "bg-green-500", icon: CheckCircle },
  non_conforme: { label: "Non conforme", color: "bg-red-500", icon: AlertCircle },
  a_controler: { label: "À contrôler", color: "bg-yellow-500", icon: Clock },
};

export default function ControlesPlanning() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filterSite, setFilterSite] = useState<string>("all");

  const { data: equipements, isLoading } = useQuery({
    queryKey: ["equipements_controle"],
    queryFn: fetchEquipements,
  });

  const { data: sites } = useQuery({
    queryKey: ["sites"],
    queryFn: fetchSites,
  });

  // Filter equipements by site
  const filteredEquipements = equipements?.filter((eq) => {
    if (filterSite === "all") return true;
    return eq.site_id === filterSite;
  });

  // Get controls for selected date
  const controlesForSelectedDate = filteredEquipements?.filter((eq) => {
    if (!eq.prochaine_echeance) return false;
    return isSameDay(new Date(eq.prochaine_echeance), selectedDate);
  });

  // Get all dates with controls
  const datesWithControles = filteredEquipements?.reduce((acc, eq) => {
    if (eq.prochaine_echeance) {
      const date = new Date(eq.prochaine_echeance);
      acc.add(date.toDateString());
    }
    return acc;
  }, new Set<string>());

  const getUrgencyBadge = (prochaine_echeance: string | null) => {
    if (!prochaine_echeance) return null;
    const daysUntil = differenceInDays(new Date(prochaine_echeance), new Date());
    if (daysUntil < 0) return <Badge variant="destructive">Retard: {Math.abs(daysUntil)}j</Badge>;
    if (daysUntil <= 30) return <Badge className="bg-orange-500 text-white">Dans {daysUntil}j</Badge>;
    if (daysUntil <= 60) return <Badge variant="outline">Dans {daysUntil}j</Badge>;
    return null;
  };

  const getStatusIcon = (statut: string) => {
    const info = STATUT_CONFORMITE_LABELS[statut as keyof typeof STATUT_CONFORMITE_LABELS];
    if (!info) return null;
    const Icon = info.icon;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Planning des Contrôles</h1>
          <p className="text-muted-foreground">Calendrier des échéances de contrôle</p>
        </div>
        <Select value={filterSite} onValueChange={setFilterSite}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Site" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les sites</SelectItem>
            {sites?.map((site) => (
              <SelectItem key={site.id} value={site.id}>{site.nom_site}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle>Calendrier</CardTitle>
            <CardDescription>Sélectionnez une date pour voir les contrôles prévus</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={fr}
              className="rounded-md border"
              modifiers={{
                hasControle: (date) => datesWithControles?.has(date.toDateString()) || false,
              }}
              modifiersStyles={{
                hasControle: {
                  fontWeight: "bold",
                  backgroundColor: "hsl(var(--primary))",
                  color: "white",
                },
              }}
            />
          </CardContent>
        </Card>

        {/* Controls for selected date */}
        <Card>
          <CardHeader>
            <CardTitle>Contrôles prévus</CardTitle>
            <CardDescription>
              {format(selectedDate, "EEEE dd MMMM yyyy", { locale: fr })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Chargement...</div>
            ) : controlesForSelectedDate && controlesForSelectedDate.length > 0 ? (
              <div className="space-y-3">
                {controlesForSelectedDate.map((eq: any) => {
                  const statutInfo = STATUT_CONFORMITE_LABELS[eq.statut_conformite as keyof typeof STATUT_CONFORMITE_LABELS];
                  return (
                    <Card key={eq.id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{eq.code_identification}</span>
                              <Badge className={`${statutInfo.color} text-white gap-1`}>
                                {getStatusIcon(eq.statut_conformite)}
                                {statutInfo.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{eq.type_equipement?.libelle}</p>
                            <p className="text-sm text-muted-foreground">{eq.site?.nom_site}</p>
                            {eq.localisation && (
                              <p className="text-xs text-muted-foreground">📍 {eq.localisation}</p>
                            )}
                          </div>
                          {getUrgencyBadge(eq.prochaine_echeance)}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Aucun contrôle prévu pour cette date
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary by month */}
      <Card>
        <CardHeader>
          <CardTitle>Résumé mensuel</CardTitle>
          <CardDescription>
            Contrôles à venir dans les 90 prochains jours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredEquipements
              ?.filter((eq) => {
                if (!eq.prochaine_echeance) return false;
                const daysUntil = differenceInDays(new Date(eq.prochaine_echeance), new Date());
                return daysUntil >= 0 && daysUntil <= 90;
              })
              .sort((a, b) => {
                if (!a.prochaine_echeance || !b.prochaine_echeance) return 0;
                return new Date(a.prochaine_echeance).getTime() - new Date(b.prochaine_echeance).getTime();
              })
              .map((eq: any) => (
                <div key={eq.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{eq.code_identification}</span>
                      <span className="text-sm text-muted-foreground">• {eq.type_equipement?.libelle}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{eq.site?.nom_site}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm">
                      {format(new Date(eq.prochaine_echeance), "dd/MM/yyyy", { locale: fr })}
                    </span>
                    {getUrgencyBadge(eq.prochaine_echeance)}
                  </div>
                </div>
              ))}
            {(!filteredEquipements || filteredEquipements.filter((eq) => {
              if (!eq.prochaine_echeance) return false;
              const daysUntil = differenceInDays(new Date(eq.prochaine_echeance), new Date());
              return daysUntil >= 0 && daysUntil <= 90;
            }).length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                Aucun contrôle prévu dans les 90 prochains jours
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
