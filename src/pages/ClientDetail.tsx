import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Building2,
  Edit,
  Factory,
  FileText,
  MapPin,
  Users,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchClientById, fetchSitesByClient } from "@/lib/multi-tenant-queries";
import { ClientUserManagementSection } from "@/components/ClientUserManagementSection";

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    data: client,
    isLoading: clientLoading,
    isError: clientError,
  } = useQuery({
    queryKey: ["client", id],
    queryFn: () => fetchClientById(id!),
    enabled: !!id,
  });

  const {
    data: sites = [],
    isLoading: sitesLoading,
  } = useQuery({
    queryKey: ["client-sites", id],
    queryFn: () => fetchSitesByClient(id!),
    enabled: !!id,
  });

  const summaryCards = useMemo(() => {
    const totalSites = sites.length;
    const totalEmployees = sites.reduce((sum, site: any) => sum + (site.effectif ?? 0), 0);

    return [
      {
        label: "Sites",
        value: totalSites,
      },
      {
        label: "Effectif total",
        value: totalEmployees,
      },
      {
        label: "Status",
        value: client?.statut ? client.statut : "—",
      },
      {
        label: "Gouvernorat",
        value: client?.gouvernorat ?? "—",
      },
    ];
  }, [sites, client]);

  if (clientLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (clientError || !client) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <Building2 className="h-12 w-12 text-muted-foreground" />
        <div>
          <h2 className="text-xl font-semibold">Client introuvable</h2>
          <p className="text-sm text-muted-foreground">
            Impossible de récupérer les informations de ce client.
          </p>
        </div>
        <Button onClick={() => navigate("/clients")}>Retour à la liste des clients</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/clients")}
          className="w-fit"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux clients
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold">{client.nom_legal}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {client.secteur && <Badge variant="outline">{client.secteur}</Badge>}
                {client.gouvernorat && <Badge variant="outline">{client.gouvernorat}</Badge>}
                {client.statut && <Badge variant="secondary">{client.statut}</Badge>}
              </div>
            </div>
          </div>

  <Button className="w-full sm:w-auto">
            <Edit className="mr-2 h-4 w-4" />
            Modifier
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label} className="shadow-soft">
            <CardHeader className="pb-3">
              <CardDescription>{card.label}</CardDescription>
              <CardTitle className="text-3xl">{card.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="apercu" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 sm:w-fit">
          <TabsTrigger value="apercu">Aperçu</TabsTrigger>
          <TabsTrigger value="sites">Sites</TabsTrigger>
          <TabsTrigger value="utilisateurs">Utilisateurs</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="apercu" className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="shadow-soft lg:col-span-2">
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Matricule fiscal</p>
                  <p className="text-sm font-medium">{client.matricule_fiscal ?? "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">RNE / RC</p>
                  <p className="text-sm font-medium">{client.rne_rc ?? "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Téléphone</p>
                  <p className="text-sm font-medium">{client.telephone ?? "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{client.email ?? "—"}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-sm text-muted-foreground">Adresse du siège</p>
                  <p className="text-sm font-medium">{client.adresse_siege ?? "—"}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Notes internes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {client.notes ??
                    "Aucune note pour ce client. Ajoutez des points de contact ou des informations clés ici."}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sites" className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {sites.length} site{sites.length > 1 ? "s" : ""} enregistré{sites.length > 1 ? "s" : ""}
            </p>
            <Button size="sm">
              <Factory className="mr-2 h-4 w-4" />
              Ajouter un site
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {sitesLoading ? (
              Array.from({ length: 2 }).map((_, index) => (
                <Skeleton key={index} className="h-40 w-full" />
              ))
            ) : sites.length === 0 ? (
              <Card className="shadow-soft">
                <CardContent className="py-12 text-center text-muted-foreground">
                  Aucun site associé à ce client pour le moment.
                </CardContent>
              </Card>
            ) : (
              sites.map((site: any) => (
                <Card
                  key={site.id}
                  className="cursor-pointer shadow-soft transition-shadow hover:shadow-medium"
                  onClick={() => navigate(`/sites/${site.id}`)}
                >
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                      <Badge variant="outline" className="mb-2 text-xs">
                        {site.code_site ?? "—"}
                      </Badge>
                      <CardTitle className="text-lg">{site.nom_site}</CardTitle>
                    </div>
                    <Users className="h-6 w-6 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{site.gouvernorat ?? "—"}</span>
                    </div>
                    {site.effectif && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{site.effectif} employés</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="utilisateurs">
          <ClientUserManagementSection clientId={client.id} clientName={client.nom_legal} />
        </TabsContent>

        <TabsContent value="documents">
          <Card className="shadow-soft">
            <CardContent className="flex flex-col items-center gap-4 py-12 text-muted-foreground">
              <FileText className="h-12 w-12" />
              <p>La gestion documentaire sera bientôt disponible pour ce client.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
