import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchEmployeeById,
  fetchVisitsByEmployee,
  fetchVisitDocuments,
} from "@/lib/medical-queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  User,
  Briefcase,
  MapPin,
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Bell,
  Download,
} from "lucide-react";
import { format, addMonths, isBefore, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";

export default function EmployeeSanteFiche() {
  const { employeeId } = useParams();
  const navigate = useNavigate();

  const { data: employee, isLoading: loadingEmployee } = useQuery({
    queryKey: ["employee", employeeId],
    queryFn: () => fetchEmployeeById(employeeId!),
    enabled: !!employeeId,
  });

  const { data: visits, isLoading: loadingVisits } = useQuery({
    queryKey: ["employee-visits", employeeId],
    queryFn: () => fetchVisitsByEmployee(employeeId!),
    enabled: !!employeeId,
  });

  // Surveillance spéciale (à stocker dans la table employes ou nouvelle table)
  const [surveillanceSpeciale, setSurveillanceSpeciale] = useState({
    travail_hauteur: false,
    exposition_bruit: false,
    exposition_chimique: false,
    travail_nuit: false,
    femme_enceinte: false,
    poste_risque: false,
  });

  const getAptitudeIcon = (aptitude: string | null) => {
    if (!aptitude || aptitude === "EN_ATTENTE")
      return <Clock className="h-4 w-4 text-muted-foreground" />;
    if (aptitude === "APTE")
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (aptitude === "APTE_RESTRICTIONS")
      return <AlertTriangle className="h-4 w-4 text-amber-600" />;
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getAptitudeLabel = (aptitude: string | null) => {
    const labels: Record<string, string> = {
      APTE: "Apte",
      APTE_RESTRICTIONS: "Apte avec restrictions",
      INAPTE_TEMP: "Inapte temporaire",
      INAPTE_DEFINITIVE: "Inapte définitif",
      EN_ATTENTE: "En attente",
    };
    return labels[aptitude || "EN_ATTENTE"] || "Non défini";
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      EMBAUCHE: "Embauche",
      PERIODIQUE: "Périodique (GMT)",
      REPRISE: "Reprise",
      CHANGEMENT_POSTE: "Changement de poste",
      SMS: "SMS",
    };
    return labels[type] || type;
  };

  // Calculer la prochaine visite attendue
  const getNextExpectedVisit = () => {
    if (!visits || visits.length === 0) return null;

    const lastCompletedVisit = visits
      .filter((v) => v.statut_visite === "REALISEE")
      .sort(
        (a, b) =>
          new Date(b.date_realisee || b.date_planifiee).getTime() -
          new Date(a.date_realisee || a.date_planifiee).getTime()
      )[0];

    if (!lastCompletedVisit) return null;

    // Calculer selon périodicité (standard 12 mois, à risque 6 mois)
    const baseDate = new Date(
      lastCompletedVisit.date_realisee || lastCompletedVisit.date_planifiee
    );
    const periodicite = surveillanceSpeciale.poste_risque ? 6 : 12;
    const nextDate = addMonths(baseDate, periodicite);

    const today = new Date();
    const daysUntil = differenceInDays(nextDate, today);

    let statut: "ok" | "attention" | "retard" = "ok";
    if (daysUntil < 0) statut = "retard";
    else if (daysUntil <= 30) statut = "attention";

    return { date: nextDate, daysUntil, statut };
  };

  const nextVisit = getNextExpectedVisit();

  if (loadingEmployee) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Employé non trouvé</p>
            <Button className="mt-4" onClick={() => navigate("/visites-medicales")}>
              Retour
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              Dossier médical - {employee.nom} {employee.prenom}
            </h1>
            <p className="text-muted-foreground">
              Suivi de la santé au travail réglementaire
            </p>
          </div>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exporter PDF
        </Button>
      </div>

      <Tabs defaultValue="info" className="space-y-6">
        <TabsList>
          <TabsTrigger value="info">Informations</TabsTrigger>
          <TabsTrigger value="historique">Historique des visites</TabsTrigger>
          <TabsTrigger value="suivi">Suivi & Alertes</TabsTrigger>
          <TabsTrigger value="surveillance">Surveillance spéciale</TabsTrigger>
        </TabsList>

        {/* Onglet 1: Informations personnelles */}
        <TabsContent value="info" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations personnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Nom & Prénom
                  </label>
                  <p className="text-lg font-semibold">
                    {employee.nom} {employee.prenom}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Matricule
                  </label>
                  <p className="font-mono">{employee.matricule || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Email
                  </label>
                  <p>{employee.email || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Téléphone
                  </label>
                  <p>{employee.telephone || "-"}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Poste occupé
                    </label>
                    <p className="font-medium">{employee.poste || "-"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Site d'affectation
                    </label>
                    <p className="font-medium">{employee.site?.nom_site || "-"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Date d'embauche
                    </label>
                    <p className="font-medium">
                      {employee.date_embauche
                        ? format(new Date(employee.date_embauche), "dd MMMM yyyy", {
                            locale: fr,
                          })
                        : "-"}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Statut
                  </label>
                  <div className="mt-1">
                    <Badge
                      variant={employee.statut_emploi === "actif" ? "default" : "secondary"}
                    >
                      {employee.statut_emploi}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet 2: Historique des visites */}
        <TabsContent value="historique" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Historique chronologique des visites
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingVisits ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chargement...
                </div>
              ) : !visits || visits.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune visite enregistrée</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Résultat</TableHead>
                      <TableHead>Médecin</TableHead>
                      <TableHead>Document</TableHead>
                      <TableHead>Observations</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visits.map((visit) => (
                      <TableRow key={visit.id}>
                        <TableCell>
                          <Badge variant="outline">{getTypeLabel(visit.type_visite)}</Badge>
                        </TableCell>
                        <TableCell>
                          {visit.date_realisee
                            ? format(new Date(visit.date_realisee), "dd MMM yyyy", {
                                locale: fr,
                              })
                            : format(new Date(visit.date_planifiee), "dd MMM yyyy", {
                                locale: fr,
                              })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getAptitudeIcon(visit.resultat_aptitude)}
                            <span>{getAptitudeLabel(visit.resultat_aptitude)}</span>
                          </div>
                        </TableCell>
                        <TableCell>{visit.medecin_nom || "-"}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-md">
                          {visit.commentaires || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet 3: Suivi & Alertes */}
        <TabsContent value="suivi" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Prochaine visite attendue
                </CardTitle>
              </CardHeader>
              <CardContent>
                {nextVisit ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Date prévue
                      </label>
                      <p className="text-2xl font-bold">
                        {format(nextVisit.date, "dd MMMM yyyy", { locale: fr })}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Délai
                      </label>
                      <div className="mt-2">
                        {nextVisit.statut === "retard" && (
                          <Badge variant="destructive" className="text-base">
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            En retard de {Math.abs(nextVisit.daysUntil)} jours
                          </Badge>
                        )}
                        {nextVisit.statut === "attention" && (
                          <Badge variant="default" className="text-base bg-amber-500">
                            <Clock className="h-4 w-4 mr-2" />
                            Dans {nextVisit.daysUntil} jours
                          </Badge>
                        )}
                        {nextVisit.statut === "ok" && (
                          <Badge variant="outline" className="text-base">
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Dans {nextVisit.daysUntil} jours
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    Aucune visite complétée. Planifiez une visite d'embauche.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full">
                  <Bell className="h-4 w-4 mr-2" />
                  Envoyer rappel au salarié
                </Button>
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-2">Alertes configurées :</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>🟡 À planifier (30 jours avant échéance)</li>
                    <li>🔴 En retard (échéance dépassée)</li>
                    <li>📧 Email au salarié 7 jours avant</li>
                    <li>📱 SMS de rappel la veille</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Onglet 4: Surveillance spéciale */}
        <TabsContent value="surveillance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Surveillance médicale spéciale
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-6">
                Cochez les cases selon le profil du salarié. Les visites
                supplémentaires seront programmées automatiquement.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="travail_hauteur"
                      checked={surveillanceSpeciale.travail_hauteur}
                      onCheckedChange={(checked) =>
                        setSurveillanceSpeciale((prev) => ({
                          ...prev,
                          travail_hauteur: checked as boolean,
                        }))
                      }
                    />
                    <label
                      htmlFor="travail_hauteur"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Travail en hauteur
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="exposition_bruit"
                      checked={surveillanceSpeciale.exposition_bruit}
                      onCheckedChange={(checked) =>
                        setSurveillanceSpeciale((prev) => ({
                          ...prev,
                          exposition_bruit: checked as boolean,
                        }))
                      }
                    />
                    <label
                      htmlFor="exposition_bruit"
                      className="text-sm font-medium leading-none"
                    >
                      Exposition au bruit
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="exposition_chimique"
                      checked={surveillanceSpeciale.exposition_chimique}
                      onCheckedChange={(checked) =>
                        setSurveillanceSpeciale((prev) => ({
                          ...prev,
                          exposition_chimique: checked as boolean,
                        }))
                      }
                    />
                    <label
                      htmlFor="exposition_chimique"
                      className="text-sm font-medium leading-none"
                    >
                      Exposition aux produits chimiques
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="travail_nuit"
                      checked={surveillanceSpeciale.travail_nuit}
                      onCheckedChange={(checked) =>
                        setSurveillanceSpeciale((prev) => ({
                          ...prev,
                          travail_nuit: checked as boolean,
                        }))
                      }
                    />
                    <label htmlFor="travail_nuit" className="text-sm font-medium leading-none">
                      Travail de nuit
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="femme_enceinte"
                      checked={surveillanceSpeciale.femme_enceinte}
                      onCheckedChange={(checked) =>
                        setSurveillanceSpeciale((prev) => ({
                          ...prev,
                          femme_enceinte: checked as boolean,
                        }))
                      }
                    />
                    <label
                      htmlFor="femme_enceinte"
                      className="text-sm font-medium leading-none"
                    >
                      Femme enceinte / allaitante
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="poste_risque"
                      checked={surveillanceSpeciale.poste_risque}
                      onCheckedChange={(checked) =>
                        setSurveillanceSpeciale((prev) => ({
                          ...prev,
                          poste_risque: checked as boolean,
                        }))
                      }
                    />
                    <label htmlFor="poste_risque" className="text-sm font-medium leading-none">
                      Poste à risque particulier
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Périodicité recommandée :</p>
                <p className="text-sm text-muted-foreground">
                  {surveillanceSpeciale.poste_risque ||
                  Object.values(surveillanceSpeciale).some((v) => v)
                    ? "Visite tous les 6 mois (surveillance renforcée)"
                    : "Visite tous les 12 mois (standard)"}
                </p>
              </div>

              <Button className="mt-6 w-full">Enregistrer la surveillance spéciale</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
