import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FileText, Pencil, Trash2, ExternalLink, Calendar, Building2, Scale, Copy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

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

interface BibliothequeQuickViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  texte: any | null;
  onEdit: (texte: any) => void;
  onDelete: (id: string) => void;
  getStatutBadge: (statut: string) => { label: string; className: string; icon: string };
}

export function BibliothequeQuickView({ 
  open, 
  onOpenChange, 
  texte, 
  onEdit, 
  onDelete,
  getStatutBadge 
}: BibliothequeQuickViewProps) {
  const navigate = useNavigate();

  if (!texte) return null;

  const statutInfo = getStatutBadge(texte.statut_vigueur);
  const articleCount = texte.articles?.[0]?.count || 0;

  const handleCopyReference = () => {
    navigator.clipboard.writeText(texte.reference_officielle);
    toast.success("Référence copiée");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-sm font-medium">
                  <span className="mr-1.5">{TYPE_ICONS[texte.type_acte as keyof typeof TYPE_ICONS]}</span>
                  {TYPE_LABELS[texte.type_acte as keyof typeof TYPE_LABELS]}
                </Badge>
                <Badge className={statutInfo.className}>
                  <span className="mr-1">{statutInfo.icon}</span>
                  {statutInfo.label}
                </Badge>
              </div>
              <SheetTitle className="text-2xl">{texte.intitule}</SheetTitle>
              <SheetDescription className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-primary">{texte.reference_officielle}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={handleCopyReference}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            {texte.autorite_emettrice && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                  <Building2 className="h-4 w-4" />
                  <span>Autorité émettrice</span>
                </div>
                <p className="text-sm font-medium">{texte.autorite_emettrice}</p>
              </div>
            )}
            
            {texte.date_publication && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                  <Calendar className="h-4 w-4" />
                  <span>Date de publication</span>
                </div>
                <p className="text-sm font-medium">
                  {new Date(texte.date_publication).toLocaleDateString("fr-FR", { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <FileText className="h-4 w-4" />
                <span>Nombre d'articles</span>
              </div>
              <p className="text-sm font-medium">{articleCount} article{articleCount > 1 ? 's' : ''}</p>
            </div>

            {texte.annee && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                  <Scale className="h-4 w-4" />
                  <span>Année</span>
                </div>
                <p className="text-sm font-medium">{texte.annee}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Resume */}
          {texte.resume && (
            <>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Résumé</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {texte.resume}
                </p>
              </div>
              <Separator />
            </>
          )}

          {/* Object */}
          {texte.objet && (
            <>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Objet</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {texte.objet}
                </p>
              </div>
              <Separator />
            </>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => {
                navigate(`/bibliotheque/textes/${texte.id}`);
                onOpenChange(false);
              }}
              className="w-full justify-start"
              size="lg"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Voir tous les détails
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  onEdit(texte);
                  onOpenChange(false);
                }}
                className="justify-start hover:border-accent hover:text-accent"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Modifier
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  onDelete(texte.id);
                  onOpenChange(false);
                }}
                className="justify-start hover:border-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
