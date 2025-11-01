import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { fetchUserPermissions, saveUserPermissions } from "@/lib/multi-tenant-queries";
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

  // Fetch user's individual permissions
  const { data: userPermissions, isLoading } = useQuery({
    queryKey: ["user-permissions", user?.id, clientId],
    queryFn: () => fetchUserPermissions(user!.id, clientId),
    enabled: !!user?.id && !!clientId && open,
  });

  // Initialize permissions from user's individual permissions
  useEffect(() => {
    if (userPermissions) {
      const perms = userPermissions.map((p: any) => ({
        module: p.module,
        action: p.action,
        decision: p.decision as PermissionDecision,
      }));
      setPermissions(perms);
      
      if (perms.length > 0 && userPermissions[0]?.scope) {
        setScope(userPermissions[0].scope as PermissionScope);
      }
    }
  }, [userPermissions]);

  const savePermissionsHandler = async () => {
    if (!user?.id) {
      toast({
        title: "Erreur",
        description: "Utilisateur non défini",
        variant: "destructive",
      });
      return;
    }

    if (!clientId) {
      toast({
        title: "Erreur",
        description: "Client non défini",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      console.log("Saving permissions for user:", user.id, "client:", clientId);
      
      // Filter out 'inherit' decisions - only save explicit allow/deny
      const explicitPermissions = permissions
        .filter(p => p.decision !== 'inherit')
        .map(p => ({
          module: p.module,
          action: p.action,
          decision: p.decision as 'allow' | 'deny',
          scope: scope,
        }));
      
      console.log("Explicit permissions to save:", explicitPermissions);
      
      await saveUserPermissions(user.id, clientId, explicitPermissions);
      
      queryClient.invalidateQueries({ queryKey: ["client-users"] });
      queryClient.invalidateQueries({ queryKey: ["user-permissions"] });
      queryClient.invalidateQueries({ queryKey: ["all-client-users"] });
      
      toast({
        title: "Permissions mises à jour",
        description: `Les permissions de ${user.prenom} ${user.nom} ont été modifiées.`,
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

  if (!clientId) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Erreur</DrawerTitle>
            <DrawerDescription>
              Client non défini pour cet utilisateur
            </DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>
            Gérer les permissions de {user.prenom} {user.nom}
          </DrawerTitle>
          <DrawerDescription>
            Configurez les permissions individuelles pour cet utilisateur
          </DrawerDescription>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 pb-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-sm text-muted-foreground">Chargement des permissions...</span>
            </div>
          ) : (
            <PermissionMatrix
              permissions={permissions}
              scope={scope}
              onPermissionsChange={setPermissions}
              onScopeChange={setScope}
              roleType="client"
              readOnly={false}
              userType="client"
            />
          )}
        </div>

        <DrawerFooter>
          <Button onClick={savePermissionsHandler} disabled={isSaving || isLoading}>
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
