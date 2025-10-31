import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchIncidentById,
  fetchIncidentCauses,
  fetchIncidentPhotos,
  fetchIncidentActions,
  closeIncident,
} from "@/lib/incidents-queries";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertTriangle, Calendar, MapPin, User, CheckCircle, FileText, AlertCircle } from "lucide-react";
import {
  TYPE_INCIDENT_LABELS,
  GRAVITE_INCIDENT_LABELS,
  GRAVITE_INCIDENT_COLORS,
  CATEGORIE_INCIDENT_LABELS,
} from "@/types/incidents";
import { toast } from "sonner";
import { AlertBadge } from "./AlertBadge";

interface IncidentDetailDrawerProps {
  incidentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IncidentDetailDrawer({ incidentId, open, onOpenChange }: IncidentDetailDrawerProps) {
  const queryClient = useQueryClient();

  const { data: incident, isLoading } = useQuery({
    queryKey: ["incident", incidentId],
    queryFn: () => fetchIncidentById(incidentId!),
    enabled: !!incidentId,
  });

  const { data: causes } = useQuery({
    queryKey: ["incident-causes", incidentId],
    queryFn: () => fetchIncidentCauses(incidentId!),
    enabled: !!incidentId,
  });

  const { data: photos } = useQuery({
    queryKey: ["incident-photos", incidentId],
    queryFn: () => fetchIncidentPhotos(incidentId!),
    enabled: !!incidentId,
  });

  const { data: actions } = useQuery({
    queryKey: ["incident-actions", incidentId],
    queryFn: () => fetchIncidentActions(incidentId!),
    enabled: !!incidentId,
  });

  const closeMutation = useMutation({
    mutationFn: () => closeIncident(incidentId!),
    onSuccess: () => {
      toast.success("Incident clôturé avec succès");
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      queryClient.invalidateQueries({ queryKey: ["incident", incidentId] });
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Erreur lors de la clôture de l'incident");
    },
  });

  if (!incident || isLoading) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            {incident.numero_incident}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Status and type */}
          <div className="flex items-center gap-2 flex-wrap">
            <AlertBadge status={incident.statut === "en_cours" ? "en-cours" : "conforme"}>
              {incident.statut === "en_cours" ? "En cours" : "Clôturé"}
            </AlertBadge>
            <Badge variant="outline">{TYPE_INCIDENT_LABELS[incident.type_incident]}</Badge>
            {incident.categorie && (
              <Badge variant="secondary">{CATEGORIE_INCIDENT_LABELS[incident.categorie]}</Badge>
            )}
            <span className={`text-sm font-medium ${GRAVITE_INCIDENT_COLORS[incident.gravite]}`}>
              Gravité : {GRAVITE_INCIDENT_LABELS[incident.gravite]}
            </span>
          </div>

          {/* Basic info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {format(new Date(incident.date_incident), "EEEE d MMMM yyyy", { locale: fr })}
                {incident.heure_incident && ` à ${incident.heure_incident}`}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>
                {incident.sites?.nom_site}
                {incident.zone && ` - ${incident.zone}`}
                {incident.batiment && ` - ${incident.batiment}`}
                {incident.atelier && ` - ${incident.atelier}`}
              </span>
            </div>
            {incident.personne_impliquee_nom && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>Personne impliquée : {incident.personne_impliquee_nom}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{incident.description}</p>
          </div>

          {incident.circonstances && (
            <div>
              <h3 className="font-semibold mb-2">Circonstances</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{incident.circonstances}</p>
            </div>
          )}

          {/* Conséquences */}
          {(incident.arret_travail || incident.hospitalisation) && (
            <div>
              <h3 className="font-semibold mb-2">Conséquences</h3>
              <div className="space-y-1">
                {incident.arret_travail && (
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-warning" />
                    <span>
                      Arrêt de travail{incident.jours_arret ? ` (${incident.jours_arret} jours)` : ""}
                    </span>
                  </div>
                )}
                {incident.hospitalisation && (
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <span>Hospitalisation</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* Analyse */}
          <div>
            <h3 className="font-semibold mb-2">Analyse des causes</h3>
            
            {/* Facteurs */}
            <div className="mb-3">
              <p className="text-sm text-muted-foreground mb-2">Facteurs identifiés :</p>
              <div className="flex flex-wrap gap-2">
                {incident.facteur_humain && <Badge variant="secondary">Facteur humain</Badge>}
                {incident.facteur_materiel && <Badge variant="secondary">Facteur matériel</Badge>}
                {incident.facteur_organisationnel && <Badge variant="secondary">Facteur organisationnel</Badge>}
                {incident.facteur_environnemental && <Badge variant="secondary">Facteur environnemental</Badge>}
                {!incident.facteur_humain &&
                  !incident.facteur_materiel &&
                  !incident.facteur_organisationnel &&
                  !incident.facteur_environnemental && (
                    <span className="text-sm text-muted-foreground">Aucun facteur identifié</span>
                  )}
              </div>
            </div>

            {/* 5 Pourquoi */}
            {causes && causes.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Méthode des 5 Pourquoi :</p>
                <div className="space-y-2">
                  {causes.map((cause, idx) => (
                    <div key={cause.id} className="bg-muted p-3 rounded-lg">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Niveau {cause.niveau} : {cause.question}
                      </p>
                      <p className="text-sm">{cause.reponse}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {incident.analyse_causes && (
              <div className="mt-3">
                <p className="text-sm text-muted-foreground mb-1">Analyse complémentaire :</p>
                <p className="text-sm whitespace-pre-wrap">{incident.analyse_causes}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Mesures correctives */}
          {incident.mesures_correctives && (
            <div>
              <h3 className="font-semibold mb-2">Mesures correctives</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{incident.mesures_correctives}</p>
            </div>
          )}

          {/* Actions liées */}
          {actions && actions.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Actions correctives liées ({actions.length})
              </h3>
              <div className="space-y-2">
                {actions.map((action) => (
                  <div key={action.id} className="border border-border rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{action.titre}</p>
                        {action.description && (
                          <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                        )}
                      </div>
                      <AlertBadge
                        status={
                          action.statut === "termine"
                            ? "conforme"
                            : action.statut === "en_cours"
                            ? "en-cours"
                            : "expire"
                        }
                      >
                        {action.statut}
                      </AlertBadge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Photos */}
          {photos && photos.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Documents joints ({photos.length})</h3>
              <div className="grid grid-cols-2 gap-2">
                {photos.map((photo) => (
                  <a
                    key={photo.id}
                    href={photo.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-border rounded-lg p-3 hover:bg-muted transition-colors"
                  >
                    <p className="text-sm font-medium truncate">{photo.file_name || "Document"}</p>
                    {photo.description && (
                      <p className="text-xs text-muted-foreground mt-1">{photo.description}</p>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Metadata */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              Déclaré par : {incident.declarant_nom}
              {incident.declarant_fonction && ` (${incident.declarant_fonction})`}
            </p>
            <p>Le {format(new Date(incident.created_at), "d MMMM yyyy à HH:mm", { locale: fr })}</p>
            {incident.date_cloture && (
              <p>
                Clôturé le {format(new Date(incident.date_cloture), "d MMMM yyyy", { locale: fr })}
              </p>
            )}
          </div>

          {/* Actions */}
          {incident.statut === "en_cours" && (
            <Button
              onClick={() => closeMutation.mutate()}
              disabled={closeMutation.isPending}
              className="w-full"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {closeMutation.isPending ? "Clôture..." : "Clôturer l'incident"}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
