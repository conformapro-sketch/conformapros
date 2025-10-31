import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PermissionMatrix } from "@/components/roles/PermissionMatrix";
import { supabaseAny as supabase } from "@/lib/supabase-any";
import type { PermissionDecision, PermissionScope } from "@/types/roles";
import { Loader2 } from "lucide-react";

interface Permission {
  module: string;
  action: string;
  decision: PermissionDecision;
}

interface UserPermissionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
  } | null;
  clientId: string;
}

export function UserPermissionDrawer({
  open,
  onOpenChange,
  user,
  clientId,
}: UserPermissionDrawerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [scope, setScope] = useState<PermissionScope>("tenant");
  const [isSaving, setIsSaving] = useState(false);

  // Fetch user's current role and permissions
  const { data: userRoleData, isLoading } = useQuery({
    queryKey: ["user-role-permissions", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("user_roles")
        .select(`
          role_uuid,
          roles!inner(
            id,
            name,
            type,
            role_permissions(
              module,
              action,
              decision,
              scope
            )
          )
        `)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && open,
  });

  // Initialize permissions from user's role
  useEffect(() => {
    if (userRoleData?.roles?.role_permissions) {
      const rolePerms = userRoleData.roles.role_permissions.map((p: any) => ({
        module: p.module,
        action: p.action,
        decision: p.decision as PermissionDecision,
      }));
      setPermissions(rolePerms);
      
      // Set scope based on first permission or default
      if (rolePerms.length > 0 && userRoleData.roles.role_permissions[0]?.scope) {
        setScope(userRoleData.roles.role_permissions[0].scope as PermissionScope);
      }
    }
  }, [userRoleData]);

  const savePermissions = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      // Get user's role
      const roleId = userRoleData?.role_uuid;
      if (!roleId) {
        toast({
          title: "Erreur",
          description: "Aucun rôle trouvé pour cet utilisateur",
          variant: "destructive",
        });
        return;
      }

      // Delete existing permissions for this role
      await supabase
        .from("role_permissions")
        .delete()
        .eq("role_id", roleId);

      // Insert new permissions
      if (permissions.length > 0) {
        const permissionsToInsert = permissions.map((p) => ({
          role_id: roleId,
          module: p.module,
          action: p.action,
          decision: p.decision,
          scope: scope,
        }));

        const { error } = await supabase
          .from("role_permissions")
          .insert(permissionsToInsert);

        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ["client-users"] });
      queryClient.invalidateQueries({ queryKey: ["user-role-permissions"] });
      
      toast({
        title: "Permissions mises à jour",
        description: `Les permissions de ${user.prenom} ${user.nom} ont été modifiées avec succès.`,
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving permissions:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder les permissions",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>
            Gérer les permissions de {user.prenom} {user.nom}
          </DrawerTitle>
          <DrawerDescription>
            Configurez les permissions spécifiques pour cet utilisateur
          </DrawerDescription>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 pb-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <PermissionMatrix
              permissions={permissions}
              scope={scope}
              onPermissionsChange={setPermissions}
              onScopeChange={setScope}
              roleType="client"
              readOnly={false}
            />
          )}
        </div>

        <DrawerFooter>
          <Button onClick={savePermissions} disabled={isSaving || isLoading}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer les permissions
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Annuler
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
