import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { staffRolesQueries } from "@/lib/staff-roles-queries";
import { Save, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const PERMISSION_KEYS = [
  { key: "manage_textes", label: "Gérer textes réglementaires", category: "Bibliothèque" },
  { key: "manage_articles", label: "Gérer articles", category: "Bibliothèque" },
  { key: "manage_versions", label: "Gérer versions", category: "Bibliothèque" },
  { key: "manage_domains", label: "Gérer domaines", category: "Bibliothèque" },
  { key: "manage_clients", label: "Gérer clients", category: "Administration" },
  { key: "manage_sites", label: "Gérer sites", category: "Administration" },
  { key: "manage_users", label: "Gérer utilisateurs clients", category: "Administration" },
  { key: "manage_modules", label: "Gérer modules", category: "Administration" },
  { key: "view_all_sites", label: "Voir tous les sites", category: "Accès" },
  { key: "view_analytics", label: "Voir analytiques", category: "Accès" },
];

export default function StaffPermissionsManagement() {
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: staffRoles, isLoading } = useQuery({
    queryKey: ["staff-roles"],
    queryFn: staffRolesQueries.getAll,
  });

  const { data: allPermissions, isLoading: loadingPermissions } = useQuery({
    queryKey: ["staff-permissions-all"],
    queryFn: async () => {
      if (!staffRoles) return {};
      const permissionsMap: Record<string, Record<string, boolean>> = {};
      
      for (const role of staffRoles) {
        const rolePerms = await staffRolesQueries.getPermissions(role.id);
        permissionsMap[role.id] = {};
        rolePerms.forEach((perm) => {
          permissionsMap[role.id][perm.permission_key] = perm.autorise;
        });
      }
      return permissionsMap;
    },
    enabled: !!staffRoles,
  });

  useEffect(() => {
    if (allPermissions) {
      setPermissions(allPermissions);
    }
  }, [allPermissions]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!staffRoles) return;
      
      for (const role of staffRoles) {
        const rolePermissions = PERMISSION_KEYS.map((pk) => ({
          permission_key: pk.key,
          autorise: permissions[role.id]?.[pk.key] || false,
        }));
        
        await staffRolesQueries.setPermissions(role.id, rolePermissions);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-permissions-all"] });
      toast({ description: "Permissions sauvegardées avec succès" });
      setHasChanges(false);
    },
    onError: () => {
      toast({ variant: "destructive", description: "Erreur lors de la sauvegarde des permissions" });
    },
  });

  const handleToggle = (roleId: string, permissionKey: string, checked: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        [permissionKey]: checked,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate();
  };

  if (isLoading || loadingPermissions) {
    return (
      <div className="container mx-auto py-8 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const permissionsByCategory = PERMISSION_KEYS.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, typeof PERMISSION_KEYS>);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Permissions Staff</h1>
          <p className="text-muted-foreground mt-1">
            Configuration des permissions par rôle
          </p>
        </div>
        <Button onClick={handleSave} disabled={!hasChanges || saveMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {saveMutation.isPending ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </div>

      {hasChanges && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Vous avez des modifications non sauvegardées. Cliquez sur "Sauvegarder" pour les appliquer.
          </AlertDescription>
        </Alert>
      )}

      {Object.entries(permissionsByCategory).map(([category, perms]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle>{category}</CardTitle>
            <CardDescription>Permissions liées à {category.toLowerCase()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/3">Permission</TableHead>
                    {staffRoles?.map((role) => (
                      <TableHead key={role.id} className="text-center">
                        {role.nom_role}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {perms.map((perm) => (
                    <TableRow key={perm.key}>
                      <TableCell className="font-medium">{perm.label}</TableCell>
                      {staffRoles?.map((role) => (
                        <TableCell key={role.id} className="text-center">
                          <Checkbox
                            checked={permissions[role.id]?.[perm.key] || false}
                            onCheckedChange={(checked) =>
                              handleToggle(role.id, perm.key, checked as boolean)
                            }
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
