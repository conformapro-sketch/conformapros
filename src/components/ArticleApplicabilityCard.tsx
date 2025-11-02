import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, Lightbulb, XCircle, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface ArticleApplicabilityCardProps {
  article: {
    article_id: string;
    article_numero: string;
    article_titre?: string;
    article_contenu?: string;
    texte_reference?: string;
    texte_titre?: string;
    applicabilite: "obligatoire" | "recommande" | "non_applicable";
    commentaire_non_applicable?: string;
    isModified?: boolean;
  };
  index: number;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onUpdate: (applicabilite: string) => void;
  onAddComment: () => void;
}

export function ArticleApplicabilityCard({
  article,
  index,
  isSelected,
  onSelect,
  onUpdate,
  onAddComment
}: ArticleApplicabilityCardProps) {
  const getStatusColor = () => {
    switch (article.applicabilite) {
      case "obligatoire": return "border-l-green-500";
      case "recommande": return "border-l-blue-500";
      case "non_applicable": return "border-l-gray-400";
    }
  };
  
  return (
    <Card className={cn(
      "border-l-4 transition-all duration-300 hover:shadow-md",
      getStatusColor(),
      article.isModified && "ring-2 ring-primary/20 animate-pulse",
      isSelected && "ring-2 ring-primary"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <Checkbox 
            checked={isSelected}
            onCheckedChange={onSelect}
          />
          
          {/* Numéro d'ordre */}
          <Badge variant="outline" className="shrink-0 h-7 w-7 rounded-full flex items-center justify-center">
            {index}
          </Badge>
          
          {/* Contenu principal */}
          <div className="flex-1 space-y-2">
            {/* Référence article */}
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-sm">
                {article.article_numero}
                {article.article_titre && (
                  <span className="text-muted-foreground font-normal ml-2">
                    - {article.article_titre}
                  </span>
                )}
              </h4>
              
              {/* Badge statut actuel */}
              <Badge 
                variant={
                  article.applicabilite === "obligatoire" ? "default" :
                  article.applicabilite === "recommande" ? "secondary" :
                  "outline"
                } 
                className={cn(
                  "text-xs shrink-0 font-medium",
                  article.applicabilite === "obligatoire" && "bg-green-600 text-white hover:bg-green-700",
                  article.applicabilite === "recommande" && "bg-blue-600 text-white hover:bg-blue-700",
                  article.applicabilite === "non_applicable" && "bg-gray-400 text-white"
                )}
              >
                {article.applicabilite === "obligatoire" ? "✅ Applicable" :
                 article.applicabilite === "recommande" ? "💡 Recommandé" :
                 "❌ Non concerné"}
              </Badge>
            </div>
            
            {/* Texte source */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-xs">
                {article.texte_reference}
              </Badge>
              <span className="line-clamp-1">{article.texte_titre}</span>
            </div>
            
            {/* Actions rapides */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                size="sm"
                variant={article.applicabilite === "obligatoire" ? "default" : "outline"}
                className="flex-1 h-8"
                onClick={() => onUpdate("obligatoire")}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Applicable
              </Button>
              
              <Button
                size="sm"
                variant={article.applicabilite === "recommande" ? "default" : "outline"}
                className="flex-1 h-8"
                onClick={() => onUpdate("recommande")}
              >
                <Lightbulb className="h-3.5 w-3.5 mr-1" />
                Recommandé
              </Button>
              
              <Button
                size="sm"
                variant={article.applicabilite === "non_applicable" ? "default" : "outline"}
                className="flex-1 h-8"
                onClick={() => onUpdate("non_applicable")}
              >
                <XCircle className="h-3.5 w-3.5 mr-1" />
                Non concerné
              </Button>
              
              {/* Bouton commentaire (visible si non_applicable) */}
              {article.applicabilite === "non_applicable" && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2"
                  onClick={onAddComment}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            
            {/* Commentaire affiché si existe */}
            {article.commentaire_non_applicable && (
              <div className="mt-2 p-2 bg-muted rounded-md text-xs text-muted-foreground">
                💬 {article.commentaire_non_applicable}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
