import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Pencil, Trash2, Calendar, Building2, Sparkles, Eye, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const TYPE_LABELS = {
  loi: "Loi",
  arrete: "Arrêté",
  decret: "Décret",
  circulaire: "Circulaire",
};

const TYPE_ICONS = {
  loi: "⚖️",
  arrete: "📋",
  decret: "📜",
  circulaire: "📄",
};

interface BibliothequeTextCardProps {
  texte: any;
  onEdit: (texte: any) => void;
  onDelete: (id: string) => void;
  onQuickView?: (texte: any) => void;
  onViewPdf?: (texte: any) => void;
  getStatutBadge: (statut: string) => { label: string; className: string; icon: string };
  isNew?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
}

export function BibliothequeTextCard({ 
  texte, 
  onEdit, 
  onDelete, 
  onQuickView,
  onViewPdf,
  getStatutBadge, 
  isNew,
  isSelected,
  onSelect,
  isFavorite = false,
  onToggleFavorite
}: BibliothequeTextCardProps) {
  const navigate = useNavigate();
  const statutInfo = getStatutBadge(texte.statut_vigueur);
  const articleCount = texte.articles?.[0]?.count || 0;

  // Get border color based on type
  const getBorderColor = (type: string) => {
    switch (type) {
      case "loi": return "border-l-primary";
      case "decret": return "border-l-accent";
      case "arrete": return "border-l-warning";
      case "circulaire": return "border-l-secondary";
      default: return "border-l-border";
    }
  };

  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-300",
      "border-2 border-l-4 hover:shadow-strong hover:border-accent/50",
      "hover:scale-[1.02] hover:-translate-y-1",
      "animate-fade-in",
      getBorderColor(texte.type_acte),
      isSelected && "ring-2 ring-accent border-accent"
    )}>
      {/* Selection Checkbox */}
      {onSelect && (
        <div className="absolute top-3 left-3 z-10" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(texte.id, !!checked)}
            className="bg-background shadow-medium"
          />
        </div>
      )}

      <div className="absolute top-3 right-3 z-10 flex gap-2">
        {isFavorite && (
          <Badge className="bg-yellow-500 text-white text-xs">
            <Star className="h-3 w-3 fill-current" />
          </Badge>
        )}
        {texte.pdf_url && (
          <Badge className="bg-blue-500 text-white text-xs">
            <FileText className="h-3 w-3 mr-1" />
            PDF
          </Badge>
        )}
        {isNew && (
          <Badge className="bg-accent text-accent-foreground shadow-gold animate-pulse">
            <Sparkles className="h-3 w-3 mr-1" />
            Nouveau
          </Badge>
        )}
      </div>
      
      <CardContent 
        className="p-5 cursor-pointer" 
        onClick={() => onQuickView ? onQuickView(texte) : navigate(`/bibliotheque/textes/${texte.id}`)}
      >
        <div className="space-y-3">
          <div className={`flex items-start justify-between gap-2 ${onSelect ? 'ml-7' : ''}`}>
            <Badge variant="outline" className="text-xs font-medium">
              <span className="mr-1.5">{TYPE_ICONS[texte.type_acte as keyof typeof TYPE_ICONS]}</span>
              {TYPE_LABELS[texte.type_acte as keyof typeof TYPE_LABELS]}
            </Badge>
            <Badge className={statutInfo.className}>
              <span className="mr-1">{statutInfo.icon}</span>
              {statutInfo.label}
            </Badge>
          </div>

          <div>
            <h3 className="font-bold text-sm text-primary mb-1 line-clamp-1">
              {texte.reference_officielle}
            </h3>
            <p className="font-semibold text-foreground line-clamp-2 mb-2 leading-tight">
              {texte.intitule}
            </p>
            {texte.resume && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {texte.resume}
              </p>
            )}
          </div>

          <div className="space-y-1.5 pt-2 border-t">
            {texte.autorite_emettrice && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" />
                <span className="truncate">{texte.autorite_emettrice}</span>
              </div>
            )}
            {texte.date_publication && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>{new Date(texte.date_publication).toLocaleDateString("fr-FR")}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs">
              <FileText className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium text-primary">{articleCount} article{articleCount > 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-3 pt-0 flex gap-1" onClick={(e) => e.stopPropagation()}>
        {onToggleFavorite && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleFavorite(texte.id)}
            className={cn(
              "px-2 transition-colors",
              isFavorite ? "text-yellow-500 hover:text-yellow-600" : "text-muted-foreground hover:text-yellow-500"
            )}
          >
            <Star className={cn("h-3.5 w-3.5", isFavorite && "fill-current")} />
          </Button>
        )}
        {texte.pdf_url && onViewPdf && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewPdf(texte)}
            className="flex-1 text-xs hover:text-accent hover:border-accent"
          >
            <FileText className="h-3.5 w-3.5 mr-1" />
            PDF
          </Button>
        )}
        {onQuickView && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuickView(texte)}
            className="flex-1 text-xs hover:text-primary hover:border-primary"
          >
            <Eye className="h-3.5 w-3.5 mr-1" />
            Aperçu
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(texte)}
          className="flex-1 text-xs hover:text-accent hover:border-accent"
        >
          <Pencil className="h-3.5 w-3.5 mr-1" />
          Modifier
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(texte.id)}
          className="px-2 hover:text-destructive hover:border-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}
