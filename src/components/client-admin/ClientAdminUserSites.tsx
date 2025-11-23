import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin } from "lucide-react";

interface ClientAdminUserSitesProps {
  user: any;
  clientId: string;
  onUpdate: () => void;
}

export function ClientAdminUserSites({ user }: ClientAdminUserSitesProps) {
  const userSites = user.sites || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assigned Sites</CardTitle>
        <CardDescription>
          Sites this user has access to
        </CardDescription>
      </CardHeader>
      <CardContent>
        {userSites.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No sites assigned yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {userSites.map((us: any) => (
              <div
                key={us.site.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-medium">{us.site.nom}</div>
                    {us.site.gouvernorat && (
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {us.site.gouvernorat}
                      </div>
                    )}
                  </div>
                </div>
                <Badge variant="default">Active</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
