import { Button } from "@/components/ui/button";
import { FileText, Plus, Filter, Search } from "lucide-react";

interface BibliothequeEmptyStateProps {
  hasFilters: boolean;
  hasSearch: boolean;
  onClearFilters: () => void;
  onAddNew: () => void;
}

export function BibliothequeEmptyState({ 
  hasFilters, 
  hasSearch, 
  onClearFilters, 
  onAddNew 
}: BibliothequeEmptyStateProps) {
  if (hasFilters || hasSearch) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="relative mb-6">
          <div className="p-6 rounded-full bg-muted/50">
            <Search className="h-16 w-16 text-muted-foreground" />
          </div>
          <div className="absolute -bottom-1 -right-1 p-2 rounded-full bg-background border-2 border-border">
            <Filter className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-foreground mb-2">
          Aucun résultat trouvé
        </h3>
        <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
          Essayez de modifier vos critères de recherche ou vos filtres pour trouver ce que vous cherchez.
        </p>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClearFilters}>
            <X className="h-4 w-4 mr-2" />
            Réinitialiser les filtres
          </Button>
          <Button onClick={onAddNew} className="bg-accent hover:bg-accent/90">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau texte
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative mb-6 animate-fade-in">
        <div className="p-6 rounded-full bg-gradient-primary">
          <FileText className="h-16 w-16 text-primary-foreground" />
        </div>
        <div className="absolute -top-2 -right-2 p-2 rounded-full bg-accent shadow-gold animate-pulse">
          <Plus className="h-6 w-6 text-accent-foreground" />
        </div>
      </div>
      
      <h3 className="text-2xl font-bold text-foreground mb-2">
        Commencez votre bibliothèque
      </h3>
      <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
        Vous n'avez pas encore de textes réglementaires. Créez votre premier texte pour commencer à constituer votre base juridique HSE.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={onAddNew} size="lg" className="bg-accent hover:bg-accent/90 shadow-gold">
          <Plus className="h-5 w-5 mr-2" />
          Créer le premier texte
        </Button>
        <Button variant="outline" size="lg" onClick={() => {}}>
          <FileText className="h-5 w-5 mr-2" />
          Importer des textes
        </Button>
      </div>
      
      <div className="mt-8 p-4 rounded-lg bg-muted/30 border border-border max-w-md">
        <p className="text-xs text-muted-foreground text-center">
          💡 <strong>Astuce :</strong> Vous pouvez importer plusieurs textes en une seule fois via un fichier CSV
        </p>
      </div>
    </div>
  );
}

import { X } from "lucide-react";
