import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMedicalVisits } from "@/lib/medical-queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, ChevronLeft, ChevronRight, Users, Stethoscope } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { fr } from "date-fns/locale";

export default function VisitesMedicalesPlanification() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedMedecin, setSelectedMedecin] = useState<string>("all");

  const { data: visits, isLoading } = useQuery({
    queryKey: ["medical-visits"],
    queryFn: fetchMedicalVisits,
  });

  // Get unique médecins
  const medecins = Array.from(
    new Set(
      visits
        ?.filter((v) => v.medecin_nom)
        .map((v) => v.medecin_nom as string) || []
    )
  );

  // Filter visits
  const filteredVisits = visits?.filter((v) => {
    const matchesMedecin =
      selectedMedecin === "all" || v.medecin_nom === selectedMedecin;
    const visitDate = new Date(v.date_planifiee);
    const matchesMonth = isSameMonth(visitDate, currentDate);
    return matchesMedecin && matchesMonth && v.statut_visite === "PLANIFIEE";
  }) || [];

  // Calendar days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get visits for a specific day
  const getVisitsForDay = (day: Date) => {
    return filteredVisits.filter((v) => isSameDay(new Date(v.date_planifiee), day));
  };

  // Stats by médecin
  const statsByMedecin = medecins.map((medecin: string) => ({
    medecin,
    count: filteredVisits.filter((v) => v.medecin_nom === medecin).length,
  }));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Planification médicale</h1>
          <p className="text-muted-foreground">
            Calendrier des visites par médecin et par site
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Visites planifiées ce mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredVisits.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              Médecins actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{medecins.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Employés concernés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(filteredVisits.map((v) => v.employe_id)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold">
                {format(currentDate, "MMMM yyyy", { locale: fr })}
              </h2>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentDate(new Date())}
              >
                Aujourd'hui
              </Button>
            </div>

            <Select value={selectedMedecin} onValueChange={setSelectedMedecin}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Médecin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les médecins</SelectItem>
                {medecins.map((medecin: string) => (
                  <SelectItem key={medecin} value={medecin}>
                    {medecin}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-7 gap-2">
            {/* Days header */}
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {days.map((day, idx) => {
              const dayVisits = getVisitsForDay(day);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={idx}
                  className={`
                    min-h-[100px] p-2 border rounded-lg
                    ${isToday ? "bg-primary/5 border-primary" : "border-border"}
                    ${dayVisits.length > 0 ? "hover:bg-muted/50 cursor-pointer" : ""}
                  `}
                >
                  <div className="text-right">
                    <span
                      className={`
                        text-sm font-medium
                        ${isToday ? "text-primary font-bold" : ""}
                      `}
                    >
                      {format(day, "d")}
                    </span>
                  </div>

                  {dayVisits.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {dayVisits.slice(0, 2).map((visit) => (
                        <div
                          key={visit.id}
                          className="text-xs p-1 bg-blue-100 dark:bg-blue-900 rounded truncate"
                        >
                          <div className="font-medium truncate">
                            {visit.employe?.nom} {visit.employe?.prenom}
                          </div>
                        </div>
                      ))}
                      {dayVisits.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayVisits.length - 2} autres
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Stats by Médecin */}
      {selectedMedecin === "all" && statsByMedecin.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Répartition par médecin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statsByMedecin.map((stat) => (
                <div
                  key={stat.medecin}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Stethoscope className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{stat.medecin}</span>
                  </div>
                  <Badge variant="outline">{stat.count} visites</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
