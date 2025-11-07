import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  TrendingUp,
  BookOpen,
  Target,
  ClipboardList,
  Plus,
  ExternalLink,
  Calendar
} from "lucide-react";
import { AlertBadge } from "@/components/AlertBadge";
import { useQuery } from "@tanstack/react-query";
import { actesQueries } from "@/lib/actes-queries";
import { fetchDomaines } from "@/lib/domaines-queries";

export default function VeilleReglementaire() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [domaineFilter, setDomaineFilter] = useState<string>("all");
  const [statutFilter, setStatutFilter] = useState<string>("all");

  // Fetch domaines from database
  const { data: domaines = [] } = useQuery({
    queryKey: ["domaines-reglementaires"],
    queryFn: fetchDomaines,
  });

  // Fetch actes réglementaires
  const { data: result, isLoading } = useQuery({
    queryKey: ["veille-actes", searchTerm, domaineFilter, statutFilter],
    queryFn: () =>
      actesQueries.getAll({
        searchTerm,
        statutFilter: statutFilter !== "all" ? statutFilter : undefined,
      }),
  });

  const textes = result?.data || [];
  
  // Filter by domaine (client-side since domaines is an array)
  const filteredTextes = textes.filter((texte) => {
    if (domaineFilter === "all") return true;
    return texte.domaines?.includes(domaineFilter);
  });

  // Calculate statistics
  const totalTextes = filteredTextes?.length || 0;
  const textesEnVigueur = filteredTextes?.filter((t) => t.statut_vigueur === "en_vigueur").length || 0;
  const textesModifies = filteredTextes?.filter((t) => t.statut_vigueur === "modifie").length || 0;
  const textesAbroges = filteredTextes?.filter((t) => t.statut_vigueur === "abroge").length || 0;

  // Calculate conformity score (simplified)
  const conformiteGlobale = totalTextes > 0 
    ? Math.round((textesEnVigueur / totalTextes) * 100) 
    : 0;

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "en_vigueur":
        return { label: "En vigueur", variant: "success" as const };
      case "modifie":
        return { label: "Modifié", variant: "warning" as const };
      case "abroge":
        return { label: "Abrogé", variant: "destructive" as const };
      case "suspendu":
        return { label: "Suspendu", variant: "secondary" as const };
      default:
        return { label: statut, variant: "secondary" as const };
    }
  };


  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
            Veille réglementaire
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Suivi, analyse et mise en conformité avec la réglementation HSE tunisienne
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/actes")}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Gérer les actes
          </Button>
          <Button
            className="bg-gradient-primary shadow-medium"
            onClick={() => navigate("/actes/nouveau")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un acte
          </Button>
        </div>
      </div>

      {/* Score de conformité légale */}
      <Card className="shadow-medium border-l-4 border-l-primary bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            Conformité légale HSE
          </CardTitle>
          <CardDescription>Tous textes applicables confondus</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-5xl font-bold text-primary">{conformiteGlobale}%</span>
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  conformiteGlobale >= 90
                    ? "bg-success/20 text-success"
                    : conformiteGlobale >= 70
                    ? "bg-warning/20 text-warning"
                    : "bg-destructive/20 text-destructive"
                }`}
              >
                {conformiteGlobale >= 90 ? (
                  <CheckCircle2 className="h-8 w-8" />
                ) : (
                  <AlertCircle className="h-8 w-8" />
                )}
                <span className="font-bold">
                  {conformiteGlobale >= 90
                    ? "Conforme"
                    : conformiteGlobale >= 70
                    ? "Attention"
                    : "Non conforme"}
                </span>
              </div>
            </div>
            <Progress value={conformiteGlobale} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-soft border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <div className="text-3xl font-bold text-primary">{totalTextes}</div>
            <p className="text-sm text-muted-foreground mt-1">Actes suivis</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-l-4 border-l-success">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div className="text-3xl font-bold text-success">{textesEnVigueur}</div>
            <p className="text-sm text-muted-foreground mt-1">En vigueur</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-l-4 border-l-warning">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="h-5 w-5 text-warning" />
            </div>
            <div className="text-3xl font-bold text-warning">{textesModifies}</div>
            <p className="text-sm text-muted-foreground mt-1">Modifiés</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-l-4 border-l-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-5 w-5 text-destructive" />
            </div>
            <div className="text-3xl font-bold text-destructive">{textesAbroges}</div>
            <p className="text-sm text-muted-foreground mt-1">Abrogés</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card className="shadow-soft">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par titre, référence, objet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={domaineFilter} onValueChange={setDomaineFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Domaine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les domaines</SelectItem>
                  {domaines
                    .filter((d) => d.actif)
                    .map((domaine) => (
                      <SelectItem key={domaine.id} value={domaine.libelle}>
                        {domaine.libelle}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <Select value={statutFilter} onValueChange={setStatutFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="en_vigueur">En vigueur</SelectItem>
                  <SelectItem value="modifie">Modifié</SelectItem>
                  <SelectItem value="abroge">Abrogé</SelectItem>
                  <SelectItem value="suspendu">Suspendu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des textes */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <FileText className="h-5 w-5 text-primary" />
            Actes réglementaires
          </CardTitle>
          <CardDescription className="text-sm">
            {filteredTextes?.length || 0} acte(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : filteredTextes && filteredTextes.length > 0 ? (
            <>
              {/* Version mobile - Cards */}
              <div className="block lg:hidden space-y-4">
                {filteredTextes.map((texte) => {
                  const statutInfo = getStatutBadge(texte.statut_vigueur);
                  return (
                    <div
                      key={texte.id}
                      className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/actes/${texte.id}`)}
                    >
                      <div className="space-y-3">
                        <div>
                          <div className="font-semibold text-foreground mb-1">
                            {texte.numero_officiel} - {texte.intitule}
                          </div>
                          {texte.objet_resume && (
                            <div className="text-sm text-muted-foreground line-clamp-2">
                              {texte.objet_resume}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {texte.domaines?.slice(0, 2).map((domaine, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {domaine}
                            </Badge>
                          ))}
                          <Badge
                            className={
                              statutInfo.variant === "success"
                                ? "bg-success text-success-foreground"
                                : statutInfo.variant === "warning"
                                ? "bg-warning text-warning-foreground"
                                : statutInfo.variant === "destructive"
                                ? "bg-destructive text-destructive-foreground"
                                : ""
                            }
                          >
                            {statutInfo.label}
                          </Badge>
                        </div>

                        {texte.date_publication_jort && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(texte.date_publication_jort).toLocaleDateString("fr-TN")}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Version desktop - Table */}
              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Référence</TableHead>
                      <TableHead>Texte réglementaire</TableHead>
                      <TableHead>Domaine</TableHead>
                      <TableHead>Date publication</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTextes.map((texte) => {
                      const statutInfo = getStatutBadge(texte.statut_vigueur);
                      return (
                        <TableRow
                          key={texte.id}
                          className="hover:bg-muted/50 cursor-pointer"
                          onClick={() => navigate(`/actes/${texte.id}`)}
                        >
                          <TableCell className="font-medium">
                            {texte.numero_officiel}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium text-foreground">
                                {texte.intitule}
                              </div>
                              {texte.objet_resume && (
                                <div className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                  {texte.objet_resume}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {texte.domaines?.slice(0, 2).map((domaine, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {domaine}
                                </Badge>
                              ))}
                              {texte.domaines && texte.domaines.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{texte.domaines.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {texte.date_publication_jort
                              ? new Date(texte.date_publication_jort).toLocaleDateString("fr-TN")
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                statutInfo.variant === "success"
                                  ? "bg-success text-success-foreground"
                                  : statutInfo.variant === "warning"
                                  ? "bg-warning text-warning-foreground"
                                  : statutInfo.variant === "destructive"
                                  ? "bg-destructive text-destructive-foreground"
                                  : ""
                              }
                            >
                              {statutInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/actes/${texte.id}`);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {texte.url_pdf_ar && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(texte.url_pdf_ar, "_blank");
                                  }}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun texte réglementaire trouvé</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate("/textes/nouveau")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter le premier texte
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
