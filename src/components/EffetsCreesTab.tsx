import { useQuery } from "@tanstack/react-query";
import { articlesEffetsJuridiquesQueries } from "@/lib/actes-queries";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileEdit, Calendar, Target } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";

interface EffetsCreesTabProps {
  texteId: string;
}

const getEffetBadgeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (type) {
    case "ABROGE":
      return "destructive";
    case "MODIFIE":
    case "REMPLACE":
      return "default";
    default:
      return "secondary";
  }
};

export function EffetsCreesTab({ texteId }: EffetsCreesTabProps) {
  const { data: effets = [], isLoading } = useQuery({
    queryKey: ["effets-crees", texteId],
    queryFn: () => articlesEffetsJuridiquesQueries.getByTexteSourceId(texteId),
  });
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-1/4" />
              <div className="h-3 bg-muted rounded w-3/4" />
            </div>
          </Card>
        ))}
      </div>
    );
  }
  
  if (effets.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center space-y-2">
          <FileEdit className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">
            Ce texte n'a créé aucune modification réglementaire pour le moment
          </p>
          <p className="text-xs text-muted-foreground">
            Les modifications apportées à d'autres articles apparaîtront ici
          </p>
        </div>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Ce texte a créé <strong>{effets.length} modification(s) réglementaire(s)</strong> sur d'autres articles
      </p>
      
      {effets.map((effet) => (
        <Card key={effet.id} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              {/* Type d'effet */}
              <div className="flex items-center gap-2">
                <FileEdit className="h-4 w-4 text-blue-600" />
                <Badge variant={getEffetBadgeVariant(effet.type_effet)}>
                  {effet.type_effet}
                </Badge>
              </div>
              
              {/* Article source (si spécifié) */}
              {effet.article_source && (
                <div className="text-sm">
                  <span className="font-medium">Article source : </span>
                  {effet.article_source.numero_article}
                  {effet.article_source.titre_court && ` - ${effet.article_source.titre_court}`}
                </div>
              )}
              
              {/* Article cible */}
              <div className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Article modifié : </span>
                {effet.texte_cible && effet.article_cible ? (
                  <Link 
                    to={`/bibliotheque/textes/${effet.texte_cible.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {effet.article_cible.numero_article}
                    {" du "}
                    {effet.texte_cible.reference_officielle}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">Article cible non trouvé</span>
                )}
              </div>
              
              {/* Date d'effet */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Effet depuis le {format(new Date(effet.date_effet), "d MMMM yyyy", { locale: fr })}
              </div>
              
              {/* Portée */}
              {effet.portee && effet.portee !== "article" && (
                <div className="text-xs text-muted-foreground">
                  <Badge variant="outline" className="font-normal">
                    Portée : {effet.portee === "alinea" ? "Alinéa" : "Point"}
                    {effet.portee_detail && ` - ${effet.portee_detail}`}
                  </Badge>
                </div>
              )}
              
              {/* Notes */}
              {effet.notes && (
                <p className="text-sm text-muted-foreground italic border-l-2 border-muted pl-3">
                  {effet.notes}
                </p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
