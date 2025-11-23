import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, MapPin, ShieldCheck } from "lucide-react";

interface ClientAdminUserCardProps {
  user: any;
  onClick: () => void;
}

export function ClientAdminUserCard({ user, onClick }: ClientAdminUserCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatar_url} />
            <AvatarFallback>
              {user.nom?.[0]}{user.prenom?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">
              {user.nom} {user.prenom}
            </h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <Mail className="h-3 w-3" />
              <span className="truncate">{user.email}</span>
            </div>
            {user.telephone && (
              <div className="text-sm text-muted-foreground mt-1">
                {user.telephone}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant={user.actif ? "default" : "secondary"}>
            {user.actif ? "Active" : "Inactive"}
          </Badge>
          {user.is_client_admin && (
            <Badge variant="default" className="bg-orange-500">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Admin
            </Badge>
          )}
          {user.site_count > 0 && (
            <Badge variant="outline">
              <MapPin className="h-3 w-3 mr-1" />
              {user.site_count} {user.site_count === 1 ? "site" : "sites"}
            </Badge>
          )}
        </div>

        {user.roles && user.roles.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {user.roles.map((role: any, idx: number) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {role.name}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
