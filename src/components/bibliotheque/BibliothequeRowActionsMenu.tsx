import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Eye, Pencil, Trash2, FileText, Star } from "lucide-react";

interface BibliothequeRowActionsMenuProps {
  texte: any;
  onView: (texte: any) => void;
  onEdit: (texte: any) => void;
  onDelete: (texte: any) => void;
  onViewPdf?: (texte: any) => void;
  onToggleFavorite?: (texte: any) => void;
  isFavorite?: boolean;
}

export function BibliothequeRowActionsMenu({
  texte,
  onView,
  onEdit,
  onDelete,
  onViewPdf,
  onToggleFavorite,
  isFavorite = false,
}: BibliothequeRowActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0 hover:bg-accent/10 data-[state=open]:bg-accent/10"
        >
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Ouvrir le menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onView(texte)} className="cursor-pointer">
          <Eye className="h-4 w-4 mr-2" />
          Voir les détails
        </DropdownMenuItem>
        {texte.pdf_url && onViewPdf && (
          <DropdownMenuItem onClick={() => onViewPdf(texte)} className="cursor-pointer">
            <FileText className="h-4 w-4 mr-2" />
            Ouvrir le PDF
          </DropdownMenuItem>
        )}
        {onToggleFavorite && (
          <DropdownMenuItem onClick={() => onToggleFavorite(texte)} className="cursor-pointer">
            <Star className={`h-4 w-4 mr-2 ${isFavorite ? "fill-warning text-warning" : ""}`} />
            {isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onEdit(texte)} className="cursor-pointer">
          <Pencil className="h-4 w-4 mr-2" />
          Modifier
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete(texte)}
          className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
