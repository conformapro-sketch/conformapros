import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Wrench, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function EquipementsDashboard() {
  const { data: equipements = [] } = useQuery({
    queryKey: ["equipements-dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipements")
        .select(`
          *,
          site:sites(id, nom_site)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: controles = [] } = useQuery({
    queryKey: ["equipements-controles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipements_controle")
        .select("*")
        .order("date_controle", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  // Stats
  const stats = {
    total: equipements.length,
    enService: equipements.filter((e: any) => e.statut === "en_service").length,
    aControler: equipements.filter((e: any) => {
      if (!e.prochaine_verification) return false;
      const diff = new Date(e.prochaine_verification).getTime() - new Date().getTime();
      return diff < 30 * 24 * 60 * 60 * 1000;
    }).length,
    enRetard: equipements.filter((e: any) => {
      if (!e.prochaine_verification) return false;
      return new Date(e.prochaine_verification) < new Date();
    }).length,
  };

  // Répartition par type
  const typeData = equipements.reduce((acc: any[], eq: any) => {
    const existing = acc.find((item) => item.name === eq.type_equipement);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: eq.type_equipement, value: 1 });
    }
    return acc;
  }, []);

  // Équipements à contrôler dans les 30 prochains jours
  const equipementsAControler = equipements
    .filter((e: any) => {
      if (!e.prochaine_verification) return false;
      const diff = new Date(e.prochaine_verification).getTime() - new Date().getTime();
      return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
    })
    .sort((a: any, b: any) =>
      new Date(a.prochaine_verification).getTime() - new Date(b.prochaine_verification).getTime()
    );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tableau de bord équipements</h1>
        <p className="text-muted-foreground mt-1">
          Vue d'ensemble de votre parc d'équipements réglementaires
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total équipements</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En service</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.enService}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">À contrôler (30j)</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.aControler}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En retard</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.enRetard}</div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Répartition par type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contrôles récents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {controles.slice(0, 10).map((controle: any) => (
                <div key={controle.id} className="flex items-center justify-between text-sm">
                  <span>{format(new Date(controle.date_controle), "dd/MM/yyyy")}</span>
                  <Badge variant={controle.resultat === "conforme" ? "default" : "destructive"}>
                    {controle.resultat}
                  </Badge>
                </div>
              ))}
              {controles.length === 0 && (
                <p className="text-sm text-muted-foreground">Aucun contrôle enregistré</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertes - Équipements à contrôler */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            Équipements à contrôler (30 prochains jours)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {equipementsAControler.length > 0 ? (
            <div className="space-y-3">
              {equipementsAControler.map((eq: any) => (
                <div key={eq.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{eq.nom}</div>
                    <div className="text-sm text-muted-foreground">
                      {eq.type_equipement} • {eq.site?.nom_site}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-orange-600">
                      {format(new Date(eq.prochaine_verification), "dd/MM/yyyy")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {Math.ceil(
                        (new Date(eq.prochaine_verification).getTime() - new Date().getTime()) /
                          (1000 * 60 * 60 * 24)
                      )}{" "}
                      jours
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              Aucun équipement à contrôler dans les 30 prochains jours
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
