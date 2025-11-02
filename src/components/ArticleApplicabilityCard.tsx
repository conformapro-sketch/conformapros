import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, XCircle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { stripHtml } from "@/lib/sanitize-html";

interface ArticleApplicabilityCardProps {
  article: {
    article_id: string;
    article_numero: string;
    article_titre?: string;
    article_contenu?: string;
    texte_reference?: string;
    texte_titre?: string;
    applicabilite: "obligatoire" | "non_applicable" | "non_concerne";
    isModified?: boolean;
  };
  index: number;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onUpdate: (applicabilite: string) => void;
}

export function ArticleApplicabilityCard({
  article,
  index,
  isSelected,
  onSelect,
  onUpdate
}: ArticleApplicabilityCardProps) {
  const getStatusColor = () => {
    switch (article.applicabilite) {
      case "obligatoire": return "border-l-green-500";
      case "non_applicable": return "border-l-gray-400";
      case "non_concerne": return "border-l-gray-300";
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
                Article {article.article_numero}
                {article.article_titre && (
                  <span className="text-muted-foreground font-normal ml-2">
                    {article.article_titre}
                  </span>
                )}
              </h4>
              
              {/* Badge statut actuel */}
              <Badge 
                variant={article.applicabilite === "obligatoire" ? "default" : "outline"} 
                className={cn(
                  "text-xs shrink-0 font-medium",
                  article.applicabilite === "obligatoire" && "bg-green-600 text-white hover:bg-green-700",
                  article.applicabilite === "non_applicable" && "bg-gray-400 text-white",
                  article.applicabilite === "non_concerne" && "bg-gray-300 text-gray-600"
                )}
              >
                {article.applicabilite === "obligatoire" ? "✅ Applicable" : 
                 article.applicabilite === "non_applicable" ? "❌ Non applicable" : 
                 "🔘 Non concerné"}
              </Badge>
            </div>
            
            {/* Aperçu contenu article */}
            {article.article_contenu && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {stripHtml(article.article_contenu)}
              </p>
            )}
            
            {/* Texte réglementaire source */}
            <div className="flex items-start gap-2 text-xs">
              <span className="text-muted-foreground shrink-0">Source:</span>
              <div className="flex-1">
                <div className="font-medium">{article.texte_titre}</div>
                <div className="text-muted-foreground">{article.texte_reference}</div>
              </div>
            </div>
            
            {/* Actions rapides */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                size="sm"
                variant={article.applicabilite === "non_concerne" ? "default" : "outline"}
                className="flex-1 h-8"
                onClick={() => onUpdate("non_concerne")}
              >
                <Circle className="h-3.5 w-3.5 mr-1" />
                Non concerné
              </Button>

              <Button
                size="sm"
                variant={article.applicabilite === "obligatoire" ? "default" : "outline"}
                className="flex-1 h-8"
                onClick={() => onUpdate("obligatoire")}
                disabled={article.applicabilite === "non_concerne"}
                title={article.applicabilite === "non_concerne" ? "Les articles à titre indicatif ne peuvent pas être applicables" : ""}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Applicable
              </Button>
              
              <Button
                size="sm"
                variant={article.applicabilite === "non_applicable" ? "default" : "outline"}
                className="flex-1 h-8"
                onClick={() => onUpdate("non_applicable")}
                disabled={article.applicabilite === "non_concerne"}
                title={article.applicabilite === "non_concerne" ? "Les articles à titre indicatif ne peuvent pas être non applicables" : ""}
              >
                <XCircle className="h-3.5 w-3.5 mr-1" />
                Non applicable
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
