import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Factory, MapPin, Phone, Mail, Users, 
  AlertTriangle, FileText, ClipboardCheck, Edit, Shield
} from "lucide-react";

export default function SiteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock data - will be replaced with real Supabase query
  const site = {
    id: "site-1",
    code_site: "SITE-SSE-001",
    nom_site: "Usine Sousse",
    client: "ConformaTech Industries",
    adresse: "Zone Industrielle Kheireddine, Sousse",
    gouvernorat: "Sousse",
    responsable_site: "Mohamed Ben Ali",
    telephone: "+216 73 123 456",
    email: "sousse@conformatech.tn",
    nombre_employes: 150,
    activite: "Fabrication de composants automobiles",
    niveau_risque: "Élevé",
    autorite_protection_civile: "Protection Civile Sousse Centre",
    conformity_score: 92
  };

  const getRisqueBadgeVariant = (risque: string) => {
    switch (risque) {
      case "Critique": return "destructive";
      case "Élevé": return "destructive";
      case "Moyen": return "secondary";
      case "Faible": return "default";
      default: return "default";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/sites")}
          className="w-fit"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux sites
        </Button>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Factory className="h-8 w-8 text-primary" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs font-mono">{site.code_site}</Badge>
                <Badge variant={getRisqueBadgeVariant(site.niveau_risque)}>
                  Risque {site.niveau_risque}
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                {site.nom_site}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">{site.client}</p>
            </div>
          </div>
          <Button className="bg-gradient-primary shadow-medium w-full sm:w-auto">
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <CardDescription>Effectif</CardDescription>
            <CardTitle className="text-3xl">{site.nombre_employes}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <CardDescription>Conformité</CardDescription>
            <CardTitle className="text-3xl text-success">{site.conformity_score}%</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <CardDescription>Contrôles à venir</CardDescription>
            <CardTitle className="text-3xl text-warning">5</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <CardDescription>Incidents</CardDescription>
            <CardTitle className="text-3xl text-destructive">2</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="apercu" className="space-y-6">
        <TabsList className="w-full overflow-x-auto flex sm:inline-flex">
          <TabsTrigger value="apercu" className="flex-shrink-0">Aperçu</TabsTrigger>
          <TabsTrigger value="dossier" className="flex-shrink-0">Dossier réglementaire</TabsTrigger>
          <TabsTrigger value="controles" className="flex-shrink-0">Contrôles</TabsTrigger>
          <TabsTrigger value="incidents" className="flex-shrink-0">Incidents</TabsTrigger>
          <TabsTrigger value="veille" className="flex-shrink-0">Veille</TabsTrigger>
        </TabsList>

        <TabsContent value="apercu" className="space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Code site</p>
                  <p className="text-sm mt-1 font-mono">{site.code_site}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Niveau de risque</p>
                  <Badge variant={getRisqueBadgeVariant(site.niveau_risque)} className="mt-1">
                    {site.niveau_risque}
                  </Badge>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Activité</p>
                  <p className="text-sm mt-1">{site.activite}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Adresse</p>
                  <p className="text-sm mt-1">{site.adresse}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Gouvernorat</p>
                  <p className="text-sm mt-1">{site.gouvernorat}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Effectif</p>
                  <p className="text-sm mt-1">{site.nombre_employes} employés</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Autorité Protection Civile</p>
                  <p className="text-sm mt-1">{site.autorite_protection_civile}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Responsable du site</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg border border-border">
                <p className="font-medium">{site.responsable_site}</p>
                <div className="flex flex-col sm:flex-row gap-3 mt-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{site.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{site.telephone}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dossier">
          <Card className="shadow-soft">
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Module dossier réglementaire à intégrer</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate("/dossier")}
              >
                Voir le module
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="controles">
          <Card className="shadow-soft">
            <CardContent className="py-12 text-center">
              <ClipboardCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Module contrôles techniques à intégrer</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate("/controles")}
              >
                Voir le module
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents">
          <Card className="shadow-soft">
            <CardContent className="py-12 text-center">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Module incidents à intégrer</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate("/incidents")}
              >
                Voir le module
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="veille">
          <Card className="shadow-soft">
            <CardContent className="py-12 text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Module veille réglementaire à intégrer</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate("/veille")}
              >
                Voir le module
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
