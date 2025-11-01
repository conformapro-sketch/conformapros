import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { format, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";

export function EquipementCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const { data: controles = [] } = useQuery({
    queryKey: ["equipements-controles-calendar"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipements_controle")
        .select(`
          *,
          equipement:equipements(id, nom, type_equipement, site:sites(nom_site))
        `)
        .gte("prochain_controle", new Date().toISOString().split("T")[0])
        .order("prochain_controle", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const controlesForSelectedDate = controles.filter((c: any) => 
    c.prochain_controle && isSameDay(new Date(c.prochain_controle), selectedDate || new Date())
  );

  const datesWithControles = controles
    .filter((c: any) => c.prochain_controle)
    .map((c: any) => new Date(c.prochain_controle));

  const getStatusIcon = (resultat: string) => {
    switch (resultat) {
      case "conforme":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "non_conforme":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-orange-600" />;
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Calendrier des contrôles</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            locale={fr}
            className="rounded-md border"
            modifiers={{
              hasControle: datesWithControles,
            }}
            modifiersStyles={{
              hasControle: {
                backgroundColor: "hsl(var(--primary))",
                color: "white",
                fontWeight: "bold",
              },
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Contrôles du {selectedDate && format(selectedDate, "dd MMMM yyyy", { locale: fr })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {controlesForSelectedDate.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucun contrôle prévu ce jour
              </p>
            ) : (
              controlesForSelectedDate.map((controle: any) => (
                <div
                  key={controle.id}
                  className="flex items-center justify-between border-b pb-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(controle.resultat)}
                      <p className="font-medium">{controle.equipement?.nom}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {controle.equipement?.type_equipement}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {controle.equipement?.site?.nom_site}
                    </p>
                  </div>
                  <Badge variant={controle.resultat === "conforme" ? "default" : "destructive"}>
                    {controle.type_controle}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
