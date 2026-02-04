import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { FileText, BookOpen, GitBranch, Calendar, Eye, Home, ArrowRight, Search } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useSiteContext } from "@/hooks/useSiteContext";
import { clientBibliothequeQueries } from "@/lib/client-bibliotheque-queries";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

const ClientBibliothequeDashboard = () => {
  const navigate = useNavigate();
  const { currentSite, isLoading: isSiteLoading } = useSiteContext();
  const currentSiteId = currentSite?.id;

  // Fetch authorized domains for the current site
  const { data: authorizedDomains = [], isLoading: domainesLoading } = useQuery({
    queryKey: ["authorized-domaines", currentSiteId],
    queryFn: () => clientBibliothequeQueries.getAuthorizedDomains(currentSiteId!),
    enabled: !!currentSiteId,
  });

  // Statistiques pour le site actuel
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["client-bibliotheque-stats", currentSiteId],
    queryFn: async () => {
      if (!currentSiteId) return null;
      
      // Get domain IDs for this site
      const domainIds = authorizedDomains.map(d => d.id);
      
      if (domainIds.length === 0) {
        return { textes: 0, articles: 0, domaines: 0 };
      }

      // Count textes that have articles in authorized domains
      const { count: textesCount } = await supabase
        .from("textes_reglementaires")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null);

      // Count articles in authorized domains
      const { count: articlesCount } = await supabase
        .from("articles")
        .select("*", { count: "exact", head: true });

      return {
        textes: textesCount || 0,
        articles: articlesCount || 0,
        domaines: domainIds.length,
      };
    },
    enabled: !!currentSiteId && authorizedDomains.length >= 0,
  });

  // Derniers textes applicables au site
  const { data: recentTextes = [], isLoading: textesLoading } = useQuery({
    queryKey: ["client-recent-textes", currentSiteId],
    queryFn: async () => {
      if (!currentSiteId) return [];
      
      const result = await clientBibliothequeQueries.getTextesBySite({
        siteId: currentSiteId,
        page: 1,
        pageSize: 5,
      });
      
      return result.data || [];
    },
    enabled: !!currentSiteId,
  });

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      loi: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      decret: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      arrete: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      circulaire: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    };
    return (
      <Badge variant="outline" className={colors[type] || ""}>
        {type.replace("_", " ")}
      </Badge>
    );
  };

  if (isSiteLoading) {
    return (
      <div className="container mx-auto py-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!currentSiteId) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                Aucun site sélectionné. Veuillez sélectionner un site pour accéder à la bibliothèque réglementaire.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">
              <Home className="h-4 w-4" />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          {currentSite && (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink>{currentSite.nom}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          )}
          <BreadcrumbItem>
            <BreadcrumbPage>Tableau de bord Bibliothèque</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bibliothèque Réglementaire</h1>
          <p className="text-muted-foreground mt-1">
            Textes et articles réglementaires applicables à votre site
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/client-bibliotheque/textes")} variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Tous les textes
          </Button>
          <Button onClick={() => navigate("/client/recherche-avancee")} variant="outline">
            <Search className="h-4 w-4 mr-2" />
            Recherche avancée
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Textes applicables</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading || domainesLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.textes || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Textes réglementaires pour votre site
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Articles</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading || domainesLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.articles || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Articles réglementaires disponibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Domaines autorisés</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {domainesLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{authorizedDomains.length}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Domaines réglementaires accessibles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Domaines autorisés */}
      {authorizedDomains.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Domaines réglementaires autorisés</CardTitle>
            <CardDescription>
              Votre site a accès aux textes et articles de ces domaines
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {authorizedDomains.map((domaine) => (
                <Badge key={domaine.id} variant="secondary" className="text-sm py-1 px-3">
                  {domaine.code} - {domaine.libelle}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Accès rapide */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card 
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => navigate("/client-bibliotheque/textes")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <FileText className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-semibold">Textes réglementaires</h3>
                <p className="text-sm text-muted-foreground">
                  Consulter les lois, décrets et arrêtés
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => navigate("/client-bibliotheque/articles")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <BookOpen className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-semibold">Articles</h3>
                <p className="text-sm text-muted-foreground">
                  Parcourir les articles par domaine
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => navigate("/client/codes-juridiques")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <GitBranch className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-semibold">Codes juridiques</h3>
                <p className="text-sm text-muted-foreground">
                  Explorer la structure des codes
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => navigate("/client/recherche-avancee")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <Search className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-semibold">Recherche avancée</h3>
                <p className="text-sm text-muted-foreground">
                  Rechercher dans la bibliothèque
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Derniers textes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Textes récents</CardTitle>
            <CardDescription>Derniers textes applicables à votre site</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/client-bibliotheque/textes")}>
            Voir tout
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardHeader>
        <CardContent>
          {textesLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : recentTextes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                Aucun texte réglementaire disponible pour votre site
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTextes.map((texte: any) => (
                <div
                  key={texte.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => navigate(`/client/bibliotheque/textes/${texte.id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getTypeBadge(texte.type)}
                      <span className="text-sm font-mono text-muted-foreground">
                        {texte.reference}
                      </span>
                    </div>
                    <h3 className="font-semibold line-clamp-1">{texte.titre}</h3>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {texte.date_publication
                          ? format(new Date(texte.date_publication), "d MMM yyyy", { locale: fr })
                          : "Non datée"}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="ml-2">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientBibliothequeDashboard;
