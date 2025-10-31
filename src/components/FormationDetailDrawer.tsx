import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calendar, MapPin, Clock, GraduationCap, User, Building2 } from "lucide-react";
import { fetchFormationById } from "@/lib/formations-queries";
import { FORMATION_STATUS_COLORS, FORMATION_STATUS_LABELS } from "@/types/formations";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface FormationDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formationId?: string;
}

export function FormationDetailDrawer({
  open,
  onOpenChange,
  formationId,
}: FormationDetailDrawerProps) {
  const queryClient = useQueryClient();

  const { data: formation, isLoading } = useQuery({
    queryKey: ["formation-detail", formationId],
    queryFn: () => fetchFormationById(formationId!),
    enabled: !!formationId && open,
  });

  if (!formationId) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] overflow-y-auto">
        <DrawerHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DrawerTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                {formation?.intitule || "Formation"}
              </DrawerTitle>
              <DrawerDescription className="font-mono text-sm">
                {formation?.reference}
              </DrawerDescription>
            </div>
            {formation && (
              <Badge className={FORMATION_STATUS_COLORS[formation.statut as keyof typeof FORMATION_STATUS_COLORS]}>
                {FORMATION_STATUS_LABELS[formation.statut as keyof typeof FORMATION_STATUS_LABELS]}
              </Badge>
            )}
          </div>
        </DrawerHeader>

        {isLoading ? (
          <div className="px-4 py-12 text-center">
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        ) : formation ? (
          <div className="px-4">
            <Tabs defaultValue="informations" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="informations">Informations</TabsTrigger>
                <TabsTrigger value="planification">Planification</TabsTrigger>
                <TabsTrigger value="participants">Participants</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>

              {/* Onglet 1: Informations générales */}
              <TabsContent value="informations" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Informations générales</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Intitulé</p>
                        <p className="text-sm">{formation.intitule}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Domaine</p>
                        <Badge variant="outline">{formation.domaine}</Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Type</p>
                        <p className="text-sm capitalize">{formation.type_formation}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Site</p>
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          <p className="text-sm">{formation.sites?.nom_site}</p>
                        </div>
                      </div>
                    </div>

                    {formation.objectif && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">Objectif</p>
                          <p className="text-sm">{formation.objectif}</p>
                        </div>
                      </>
                    )}

                    {(formation.formateur_nom || formation.organisme_formation) && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">Formateur / Organisme</p>
                          <div className="space-y-2">
                            {formation.formateur_nom && (
                              <div className="flex items-center gap-2">
                                <User className="h-3 w-3 text-muted-foreground" />
                                <p className="text-sm">{formation.formateur_nom}</p>
                              </div>
                            )}
                            {formation.organisme_formation && (
                              <div className="flex items-center gap-2">
                                <Building2 className="h-3 w-3 text-muted-foreground" />
                                <p className="text-sm">{formation.organisme_formation}</p>
                              </div>
                            )}
                            {formation.formateur_contact && (
                              <p className="text-sm text-muted-foreground">
                                Tél: {formation.formateur_contact}
                              </p>
                            )}
                            {formation.formateur_email && (
                              <p className="text-sm text-muted-foreground">
                                Email: {formation.formateur_email}
                              </p>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Onglet 2: Planification & réalisation */}
              <TabsContent value="planification" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Planification & Réalisation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Date prévue</p>
                        {formation.date_prevue ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <p className="text-sm">
                              {format(new Date(formation.date_prevue), "dd MMMM yyyy", { locale: fr })}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Non définie</p>
                        )}
                      </div>

                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Date réalisée</p>
                        {formation.date_realisee ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-success" />
                            <p className="text-sm">
                              {format(new Date(formation.date_realisee), "dd MMMM yyyy", { locale: fr })}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Non réalisée</p>
                        )}
                      </div>

                      {formation.duree_heures && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Durée</p>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <p className="text-sm">{formation.duree_heures}h</p>
                          </div>
                        </div>
                      )}

                      {formation.lieu && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Lieu</p>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <p className="text-sm">{formation.lieu}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {formation.validite_mois && (
                      <>
                        <Separator />
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-sm font-medium mb-2">Validité et renouvellement</p>
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              Validité: {formation.validite_mois} mois
                            </p>
                            {formation.prochaine_echeance && (
                              <p className="text-sm">
                                Prochaine échéance:{" "}
                                <span className="font-medium">
                                  {format(new Date(formation.prochaine_echeance), "dd MMMM yyyy", { locale: fr })}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Onglet 3: Participants */}
              <TabsContent value="participants" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Liste des participants</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Fonctionnalité à venir</p>
                      <p className="text-sm">Gestion des participants et feuille d'émargement</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Onglet 4: Documents */}
              <TabsContent value="documents" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Documents & Certificats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Fonctionnalité à venir</p>
                      <p className="text-sm">Téléversement et gestion des certificats</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="px-4 py-12 text-center">
            <p className="text-muted-foreground">Formation non trouvée</p>
          </div>
        )}

        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Fermer</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
