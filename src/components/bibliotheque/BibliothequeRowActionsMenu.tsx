import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Eye, Pencil, Trash2, FileText, Star, Copy, Archive } from "lucide-react";
import { useState } from "react";

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
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (action: () => void | Promise<void>) => {
    setIsLoading(true);
    try {
      await action();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0 hover:bg-accent/10 data-[state=open]:bg-accent/10"
          disabled={isLoading}
        >
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Ouvrir le menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem 
          onClick={() => handleAction(() => onView(texte))} 
          className="cursor-pointer"
          disabled={isLoading}
        >
          <Eye className="h-4 w-4 mr-2" />
          Voir les détails
        </DropdownMenuItem>
        {texte.pdf_url && onViewPdf && (
          <DropdownMenuItem 
            onClick={() => handleAction(() => onViewPdf(texte))} 
            className="cursor-pointer"
            disabled={isLoading}
          >
            <FileText className="h-4 w-4 mr-2" />
            Ouvrir le PDF
          </DropdownMenuItem>
        )}
        {onToggleFavorite && (
          <DropdownMenuItem 
            onClick={() => handleAction(() => onToggleFavorite(texte))} 
            className="cursor-pointer"
            disabled={isLoading}
          >
            <Star className={`h-4 w-4 mr-2 ${isFavorite ? "fill-warning text-warning" : ""}`} />
            {isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => handleAction(() => onEdit(texte))} 
          className="cursor-pointer"
          disabled={isLoading}
        >
          <Pencil className="h-4 w-4 mr-2" />
          Modifier
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleAction(() => console.log("Dupliquer:", texte.id))} 
          className="cursor-pointer"
          disabled={isLoading}
        >
          <Copy className="h-4 w-4 mr-2" />
          Dupliquer
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleAction(() => console.log("Archiver:", texte.id))} 
          className="cursor-pointer"
          disabled={isLoading}
        >
          <Archive className="h-4 w-4 mr-2" />
          Archiver
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleAction(() => onDelete(texte))}
          className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
          disabled={isLoading}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
