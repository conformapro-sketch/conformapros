import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Pencil, Trash2, Calendar, Building2, Sparkles, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  getStatutBadge: (statut: string) => { label: string; className: string; icon: string };
  isNew?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
}

export function BibliothequeTextCard({ 
  texte, 
  onEdit, 
  onDelete, 
  onQuickView,
  getStatutBadge, 
  isNew,
  isSelected,
  onSelect 
}: BibliothequeTextCardProps) {
  const navigate = useNavigate();
  const statutInfo = getStatutBadge(texte.statut_vigueur);
  const articleCount = texte.articles?.[0]?.count || 0;

  return (
    <Card className={`group hover:shadow-strong transition-all duration-300 border-2 hover:border-accent/50 relative overflow-hidden ${isSelected ? 'ring-2 ring-accent border-accent' : ''}`}>
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

      {isNew && (
        <div className={`absolute top-3 ${onSelect ? 'right-3' : 'right-3'} z-10`}>
          <Badge className="bg-accent text-accent-foreground shadow-gold animate-pulse">
            <Sparkles className="h-3 w-3 mr-1" />
            Nouveau
          </Badge>
        </div>
      )}
      
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
