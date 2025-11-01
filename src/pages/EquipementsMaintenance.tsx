import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function EquipementsMaintenance() {
  const { data: controles = [] } = useQuery({
    queryKey: ["controles-planning"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipements_controle")
        .select(`
          *,
          equipement:equipements(id, nom, type_equipement, site:sites(nom_site))
        `)
        .order("date_controle", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Planning de maintenance</h1>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Calendrier des contrôles</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar mode="single" className="rounded-md border" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contrôles récents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {controles.slice(0, 10).map((c: any) => (
                <div key={c.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <div className="font-medium">{c.equipement?.nom}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(c.date_controle), "dd MMMM yyyy", { locale: fr })}
                    </div>
                  </div>
                  <Badge variant={c.resultat === "conforme" ? "default" : "destructive"}>
                    {c.resultat || "En attente"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
