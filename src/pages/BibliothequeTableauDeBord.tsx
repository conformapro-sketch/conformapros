import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, BookOpen, CheckCircle2, XCircle, BarChart3, PieChart, Calendar } from "lucide-react";
import { BarChart, Bar, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--muted))'];
const TYPE_LABELS: Record<string, string> = {
  loi: "Loi",
  decret: "Decret",
  arrete: "Arrete",
  circulaire: "Circulaire"
};

export default function BibliothequeTableauDeBord() {
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [autoriteFilter, setAutoriteFilter] = useState<string>("all");
  const [domaineFilter, setDomaineFilter] = useState<string>("all");

  // Fetch textes réglementaires
  const { data: textes = [] } = useQuery({
    queryKey: ['textes_stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('actes_reglementaires')
        .select('*, actes_reglementaires_domaines(domaine_id)')
        .is('deleted_at', null);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch articles
  const { data: articles = [] } = useQuery({
    queryKey: ['articles_stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('textes_articles')
        .select('*');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch domaines
  const { data: domaines = [] } = useQuery({
    queryKey: ['domaines_filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('domaines_application')
        .select('*')
        .eq('actif', true)
        .is('deleted_at', null);
      if (error) throw error;
      return data || [];
    },
  });

  // Filter data
  const filteredTextes = useMemo(() => {
    return textes.filter(texte => {
      const yearMatch = yearFilter === "all" || texte.annee?.toString() === yearFilter;
      const autoriteMatch = autoriteFilter === "all" || texte.autorite === autoriteFilter;
      const domaineMatch = domaineFilter === "all" || 
        (texte.actes_reglementaires_domaines || []).some((d: any) => d.domaine_id === domaineFilter);
      return yearMatch && autoriteMatch && domaineMatch;
    });
  }, [textes, yearFilter, autoriteFilter, domaineFilter]);

  // Get unique years and autorités
  const uniqueYears = useMemo(() => 
    Array.from(new Set(textes.map(t => t.annee).filter(Boolean))).sort().reverse(),
    [textes]
  );
  
  const uniqueAutorites = useMemo(() => 
    Array.from(new Set(textes.map(t => t.autorite).filter(Boolean))).sort(),
    [textes]
  );

  // Calculate stats
  const stats = useMemo(() => {
    const totalTextes = filteredTextes.length;
    
    const textesByType = filteredTextes.reduce((acc, t) => {
      acc[t.type_acte] = (acc[t.type_acte] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const textesByStatut = filteredTextes.reduce((acc, t) => {
      acc[t.statut_vigueur] = (acc[t.statut_vigueur] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const articlesEnVigueur = articles.filter(a => 
      filteredTextes.some(t => t.id === a.texte_id)
    ).length;

    return {
      totalTextes,
      totalArticles: articles.length,
      lois: textesByType['loi'] || 0,
      decrets: textesByType['decret'] || 0,
      arretes: textesByType['arrete'] || 0,
      circulaires: textesByType['circulaire'] || 0,
      textesByType,
      textesByStatut,
      articlesEnVigueur,
    };
  }, [filteredTextes, articles]);

  // Prepare chart data
  const barChartData = useMemo(() => {
    return Object.entries(stats.textesByType).map(([type, count]) => ({
      type: TYPE_LABELS[type] || (type.charAt(0).toUpperCase() + type.slice(1)),
      count
    }));
  }, [stats.textesByType]);

  const pieChartData = useMemo(() => {
    return Object.entries(stats.textesByStatut).map(([statut, count]) => ({
      name: statut === 'en_vigueur' ? 'En vigueur' : statut === 'abroge' ? 'Abrogé' : 'Modifié',
      value: count
    }));
  }, [stats.textesByStatut]);

  const recentTextes = useMemo(() => {
    return [...filteredTextes]
      .sort((a, b) => new Date(b.date_publication || 0).getTime() - new Date(a.date_publication || 0).getTime())
      .slice(0, 5);
  }, [filteredTextes]);

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">Tableau de bord réglementaire</h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">Vue d'ensemble de la base réglementaire</p>
      </div>

      {/* Filtres */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Année de publication</label>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les années" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les années</SelectItem>
                  {uniqueYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Autorité émettrice</label>
              <Select value={autoriteFilter} onValueChange={setAutoriteFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les autorités" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les autorités</SelectItem>
                  {uniqueAutorites.map(autorite => (
                    <SelectItem key={autorite} value={autorite}>{autorite}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Domaine d'application</label>
              <Select value={domaineFilter} onValueChange={setDomaineFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les domaines" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les domaines</SelectItem>
                  {domaines.map(domaine => (
                    <SelectItem key={domaine.id} value={domaine.id}>{domaine.libelle}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Textes réglementaires"
          value={stats.totalTextes}
          icon={FileText}
          variant="default"
        />
        <StatCard
          title="Articles enregistrés"
          value={stats.totalArticles}
          icon={BookOpen}
          variant="success"
        />
        <StatCard
          title="Lois"
          value={stats.lois}
          icon={FileText}
          variant="default"
        />
        <StatCard
          title="Décrets"
          value={stats.decrets}
          icon={FileText}
          variant="warning"
        />
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Arrêtés"
          value={stats.arretes}
          icon={FileText}
          variant="default"
        />
        <StatCard
          title="Circulaires"
          value={stats.circulaires}
          icon={FileText}
          variant="default"
        />
        <StatCard
          title="Articles en vigueur"
          value={stats.articlesEnVigueur}
          icon={CheckCircle2}
          variant="success"
        />
        <StatCard
          title="Textes abrogés"
          value={stats.textesByStatut['abroge'] || 0}
          icon={XCircle}
          variant="destructive"
        />
      </div>

      {/* Graphiques */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bar Chart */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Textes par type
            </CardTitle>
            <CardDescription>Distribution des textes selon leur type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="type" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Statut des textes
            </CardTitle>
            <CardDescription>Répartition par statut de vigueur</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RePieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </RePieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Dernières publications
          </CardTitle>
          <CardDescription>Les 5 textes les plus récemment publiés</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTextes.map((texte, index) => (
              <div
                key={texte.id}
                className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground truncate">{texte.titre}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {texte.reference_officielle} • {texte.autorite}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {texte.date_publication ? new Date(texte.date_publication).toLocaleDateString('fr-FR') : 'Date non renseignée'}
                  </p>
                </div>
                <div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    texte.statut_vigueur === 'en_vigueur' 
                      ? 'bg-success/10 text-success' 
                      : texte.statut_vigueur === 'abroge'
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-warning/10 text-warning'
                  }`}>
                    {texte.statut_vigueur === 'en_vigueur' ? 'En vigueur' : texte.statut_vigueur === 'abroge' ? 'Abrogé' : 'Modifié'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}





