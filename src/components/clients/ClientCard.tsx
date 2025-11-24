import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, MapPin, Users, Eye, Pencil, Trash2, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Database } from "@/types/db";

type ClientRow = Database["public"]["Tables"]["clients"]["Row"];

interface ClientCardProps {
  client: ClientRow;
  sitesCount?: number;
  onView: (clientId: string) => void;
  onViewSites: (client: ClientRow) => void;
  onEdit: (client: ClientRow) => void;
  onDelete: (clientId: string) => void;
}

export function ClientCard({ 
  client, 
  sitesCount = 0,
  onView, 
  onViewSites,
  onEdit, 
  onDelete 
}: ClientCardProps) {
  const clientInitials = client.nom
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="group hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={client.logo_url || undefined} alt={client.nom} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {clientInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{client.nom}</CardTitle>
            {client.nom_legal && (
              <CardDescription className="text-xs mt-1 truncate">
                {client.nom_legal}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* SIRET */}
        {client.siret && (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">SIRET:</span> {client.siret}
          </div>
        )}

        {/* Location */}
        {(client.pays || client.code_postal) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              {[client.code_postal, client.pays].filter(Boolean).join(", ")}
            </span>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            {sitesCount} {sitesCount === 1 ? 'site' : 'sites'}
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(client.id)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            Voir
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewSites(client)}
            className="flex-1"
          >
            <Building2 className="h-4 w-4 mr-2" />
            Sites
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(client)}>
                <Pencil className="h-4 w-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(client.id)}
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
