import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { FileText, BookOpen, GitBranch, Filter, Calendar } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BibliothequeTableauDeBord = () => {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [domaineFilter, setDomaineFilter] = useState<string>("all");

  // Statistiques générales
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["bibliotheque-stats"],
    queryFn: async () => {
      const [textesCount, articlesCount, versionsCount] = await Promise.all([
        supabase
          .from("textes_reglementaires")
          .select("*", { count: "exact", head: true })
          .is("deleted_at", null),
        supabase
          .from("articles")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("article_versions")
          .select("*", { count: "exact", head: true }),
      ]);

      return {
        textes: textesCount.count || 0,
        articles: articlesCount.count || 0,
        versions: versionsCount.count || 0,
      };
    },
  });

  // Derniers textes ajoutés avec filtres
  const { data: recentTextes = [], isLoading: textesLoading } = useQuery({
    queryKey: ["recent-textes", typeFilter, domaineFilter],
    queryFn: async () => {
      let query = supabase
        .from("textes_reglementaires")
        .select(`
          id,
          type,
          reference,
          titre,
          date_publication,
          created_at,
          autorites_emettrices (
            nom,
            nom_court
          )
        `)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(10);

      if (typeFilter !== "all") {
        query = query.eq("type", typeFilter as any);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filtrer par domaine si nécessaire
      if (domaineFilter !== "all") {
        // Récupérer les IDs des textes liés au domaine via articles
        const { data: articlesData } = await supabase
          .from("articles")
          .select(`
            texte_id,
            article_sous_domaines (
              sous_domaine_id,
              sous_domaines_application (
                domaine_id
              )
            )
          `)
          .eq("article_sous_domaines.sous_domaines_application.domaine_id", domaineFilter);

        const texteIds = new Set(articlesData?.map((a) => a.texte_id) || []);
        return data?.filter((t) => texteIds.has(t.id)) || [];
      }

      return data || [];
    },
  });

  // Dernières versions créées
  const { data: recentVersions = [], isLoading: versionsLoading } = useQuery({
    queryKey: ["recent-versions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("article_versions")
        .select(`
          id,
          numero_version,
          date_effet,
          statut,
          created_at,
          articles (
            id,
            numero,
            titre,
            texte_id,
            textes_reglementaires (
              reference,
              titre
            )
          ),
          textes_reglementaires (
            reference,
            titre
          ),
          profiles (
            prenom,
            nom,
            email
          )
        `)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
  });

  // Liste des domaines pour le filtre
  const { data: domaines = [] } = useQuery({
    queryKey: ["domaines-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("domaines_reglementaires")
        .select("id, code, libelle")
        .eq("actif", true)
        .order("libelle");
      if (error) throw error;
      return data || [];
    },
  });

  const getStatutBadge = (statut: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      en_vigueur: { variant: "default", label: "En vigueur" },
      abrogee: { variant: "destructive", label: "Abrogée" },
      remplacee: { variant: "secondary", label: "Remplacée" },
    };
    const config = variants[statut] || { variant: "outline", label: statut };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      loi: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      decret: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      arrete: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      circulaire: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      code_juridique: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
    };
    return (
      <Badge variant="outline" className={colors[type] || ""}>
        {type.replace("_", " ")}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tableau de Bord - Bibliothèque Réglementaire</h1>
          <p className="text-muted-foreground mt-1">
            Vue synthétique des textes, articles et versions
          </p>
        </div>
        <Button onClick={() => navigate("/bibliotheque/textes")}>
          Voir tous les textes
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Textes réglementaires</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.textes || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Lois, décrets, arrêtés, circulaires
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Articles</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.articles || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Articles réglementaires structurés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Versions</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.versions || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Versions successives enregistrées
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres rapides */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle>Filtres rapides</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Type de texte</label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="loi">Loi</SelectItem>
                <SelectItem value="decret">Décret</SelectItem>
                <SelectItem value="arrete">Arrêté</SelectItem>
                <SelectItem value="circulaire">Circulaire</SelectItem>
                <SelectItem value="code_juridique">Code juridique</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Domaine réglementaire</label>
            <Select value={domaineFilter} onValueChange={setDomaineFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les domaines" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les domaines</SelectItem>
                {domaines.map((domaine) => (
                  <SelectItem key={domaine.id} value={domaine.id}>
                    {domaine.libelle} ({domaine.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(typeFilter !== "all" || domaineFilter !== "all") && (
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setTypeFilter("all");
                  setDomaineFilter("all");
                }}
              >
                Réinitialiser
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Derniers textes ajoutés */}
      <Card>
        <CardHeader>
          <CardTitle>Derniers textes ajoutés</CardTitle>
        </CardHeader>
        <CardContent>
          {textesLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : recentTextes.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Aucun texte trouvé avec ces filtres
            </p>
          ) : (
            <div className="space-y-3">
              {recentTextes.map((texte: any) => (
                <div
                  key={texte.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => navigate(`/bibliotheque/textes/${texte.id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getTypeBadge(texte.type)}
                      <span className="text-sm font-mono text-muted-foreground">
                        {texte.reference}
                      </span>
                    </div>
                    <h3 className="font-semibold">{texte.titre}</h3>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {texte.date_publication
                          ? format(new Date(texte.date_publication), "d MMM yyyy", { locale: fr })
                          : "Non datée"}
                      </span>
                      {texte.autorites_emettrices && (
                        <span>• {texte.autorites_emettrices.nom_court || texte.autorites_emettrices.nom}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Ajouté le {format(new Date(texte.created_at), "d MMM yyyy", { locale: fr })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dernières versions créées */}
      <Card>
        <CardHeader>
          <CardTitle>Dernières versions créées</CardTitle>
        </CardHeader>
        <CardContent>
          {versionsLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : recentVersions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Aucune version enregistrée
            </p>
          ) : (
            <div className="space-y-3">
              {recentVersions.map((version: any) => (
                <div
                  key={version.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => navigate(`/bibliotheque/articles/${version.articles?.id}/versions`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatutBadge(version.statut)}
                      <span className="text-sm font-semibold">
                        Version {version.numero_version}
                      </span>
                    </div>
                    <h3 className="font-semibold">
                      {version.articles?.numero} - {version.articles?.titre}
                    </h3>
                    <div className="text-sm text-muted-foreground mt-1">
                      Texte source: {version.textes_reglementaires?.reference} - {version.textes_reglementaires?.titre}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Effet: {format(new Date(version.date_effet), "d MMM yyyy", { locale: fr })}
                      </span>
                      {version.profiles && (
                        <span>
                          • Par {version.profiles.prenom} {version.profiles.nom}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(version.created_at), "d MMM yyyy", { locale: fr })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BibliothequeTableauDeBord;
