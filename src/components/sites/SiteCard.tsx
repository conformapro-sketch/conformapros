import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Pencil, Trash2, Eye, MoreVertical, Building2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Database } from "@/types/db";

type SiteRow = Database["public"]["Tables"]["sites"]["Row"];

interface SiteCardProps {
  site: SiteRow & { clients?: any };
  modules?: any[];
  onView: (siteId: string) => void;
  onEdit: (site: SiteRow) => void;
  onDelete: (siteId: string) => void;
}

export function SiteCard({ site, modules = [], onView, onEdit, onDelete }: SiteCardProps) {
  const getClassificationColor = (classification: string | null) => {
    switch (classification) {
      case "1ère catégorie": return "bg-red-100 text-red-800 border-red-300";
      case "2ème catégorie": return "bg-orange-100 text-orange-800 border-orange-300";
      case "3ème catégorie": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 relative overflow-hidden">
      {/* Classification Badge - Top Right */}
      {site.classification_icpe && (
        <div className="absolute top-2 right-2 z-10">
          <Badge variant="outline" className={getClassificationColor(site.classification_icpe)}>
            {site.classification_icpe}
          </Badge>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {/* Site or Client Logo */}
          <div className="relative">
            {(site.logo_url || site.clients?.logo_url) ? (
              <img
                src={site.logo_url || site.clients?.logo_url}
                alt={site.nom}
                className="h-12 w-12 rounded-lg object-cover border-2 border-border"
              />
            ) : (
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate pr-20">{site.nom}</CardTitle>
            {site.code_site && (
              <CardDescription className="text-xs mt-1">
                Code: {site.code_site}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Client Info */}
        {site.clients && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span className="truncate">{site.clients.nom}</span>
          </div>
        )}

        {/* Location */}
        {(site.gouvernorat || site.delegation) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              {[site.delegation, site.gouvernorat].filter(Boolean).join(", ")}
            </span>
          </div>
        )}

        {/* Modules */}
        {modules.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {modules.slice(0, 3).map((module: any) => (
              <Badge
                key={module.id}
                variant="secondary"
                className="text-xs"
                style={{ 
                  backgroundColor: module.couleur ? `${module.couleur}20` : undefined,
                  color: module.couleur || undefined,
                }}
              >
                {module.libelle}
              </Badge>
            ))}
            {modules.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{modules.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(site.id)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            Voir
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(site)}>
                <Pencil className="h-4 w-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(site.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
