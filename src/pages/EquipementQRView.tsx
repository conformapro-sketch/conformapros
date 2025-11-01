import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  Calendar, 
  MapPin, 
  CheckCircle, 
  AlertCircle, 
  User,
  Building 
} from "lucide-react";

export default function EquipementQRView() {
  const { id } = useParams();

  const { data: equipement, isLoading } = useQuery({
    queryKey: ["equipement-qr", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipements")
        .select(`
          *,
          site:sites(nom_site, adresse),
          prestataire:prestataires(nom, contact_telephone)
        `)
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
  }

  if (!equipement) {
    return <div className="flex items-center justify-center min-h-screen">Équipement non trouvé</div>;
  }

  const isUpToDate = equipement.prochaine_verification 
    ? new Date(equipement.prochaine_verification) > new Date()
    : false;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mb-4">
              <img 
                src="/conforma-pro-logo.png" 
                alt="ConformaPro" 
                className="h-16 mx-auto"
              />
            </div>
            <CardTitle className="text-2xl">{equipement.nom}</CardTitle>
            <p className="text-muted-foreground">{equipement.type_equipement}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center">
              <Badge 
                variant={isUpToDate ? "default" : "destructive"}
                className="text-lg px-4 py-2"
              >
                {isUpToDate ? (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Conforme
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 mr-2" />
                    Contrôle requis
                  </>
                )}
              </Badge>
            </div>

            <div className="grid gap-4 mt-6">
              <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <Building className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Site</p>
                  <p className="font-medium">{equipement.site?.nom_site}</p>
                  {equipement.site?.adresse && (
                    <p className="text-sm text-muted-foreground">{equipement.site.adresse}</p>
                  )}
                </div>
              </div>

              {equipement.localisation && (
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <MapPin className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Localisation</p>
                    <p className="font-medium">{equipement.localisation}</p>
                  </div>
                </div>
              )}

              {equipement.derniere_verification && (
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <Calendar className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Dernière vérification</p>
                    <p className="font-medium">
                      {format(new Date(equipement.derniere_verification), "dd MMMM yyyy", { locale: fr })}
                    </p>
                  </div>
                </div>
              )}

              {equipement.prochaine_verification && (
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <Calendar className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Prochaine vérification</p>
                    <p className="font-medium">
                      {format(new Date(equipement.prochaine_verification), "dd MMMM yyyy", { locale: fr })}
                    </p>
                  </div>
                </div>
              )}

              {equipement.prestataire && Array.isArray(equipement.prestataire) && equipement.prestataire.length > 0 && (
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <User className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Prestataire</p>
                    <p className="font-medium">{equipement.prestataire[0].nom}</p>
                    {equipement.prestataire[0].contact_telephone && (
                      <p className="text-sm text-muted-foreground">
                        {equipement.prestataire[0].contact_telephone}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {equipement.numero_serie && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Numéro de série</p>
                  <p className="font-medium font-mono">{equipement.numero_serie}</p>
                </div>
              )}
            </div>

            {equipement.observations && (
              <div className="mt-6 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Observations</p>
                <p className="text-sm">{equipement.observations}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Généré par ConformaPro - {format(new Date(), "dd/MM/yyyy HH:mm")}
        </p>
      </div>
    </div>
  );
}
