import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield } from "lucide-react";
import { SimplePermissionSelector } from "./SimplePermissionSelector";

interface PermissionMatrixV2Props {
  userId: string;
  clientId: string;
  siteId: string;
  onUpdate: () => void;
}

interface Permission {
  module: string;
  action: string;
  decision: "allow" | "deny" | "inherit";
  scope?: "global" | "tenant" | "site";
}

export function PermissionMatrixV2({
  userId,
  clientId,
  siteId,
  onUpdate,
}: PermissionMatrixV2Props) {
  const [permissions, setPermissions] = useState<Permission[]>([]);

  // Fetch enabled modules for site
  const { data: modules, isLoading: loadingModules } = useQuery({
    queryKey: ["site-modules", siteId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_site_enabled_modules", {
        _site_id: siteId,
      });
      if (error) throw error;
      return data;
    },
  });

  // Fetch current permissions
  const { data: currentPerms, isLoading: loadingPerms } = useQuery({
    queryKey: ["site-permissions", userId, siteId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_site_permissions", {
        p_user_id: userId,
        p_site_id: siteId,
      });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (currentPerms) {
      setPermissions(currentPerms);
    }
  }, [currentPerms]);

  const saveMutation = useMutation({
    mutationFn: async (perms: Permission[]) => {
      console.log('💾 Calling save_site_permissions RPC:', {
        p_user_id: userId,
        p_site_id: siteId,
        p_client_id: clientId,
        p_permissions: perms,
        permissionCount: perms.length
      });

      const { data, error } = await supabase.rpc('save_site_permissions', {
        p_user_id: userId,
        p_site_id: siteId,
        p_client_id: clientId,
        p_permissions: perms as any,
      });

      if (error) {
        console.error('❌ Error saving permissions:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('✅ Permissions saved successfully:', data);
      return data;
    },
    onSuccess: () => {
      toast.success("Permissions saved successfully");
      onUpdate();
    },
    onError: (error: any) => {
      console.error('❌ Save mutation error:', error);
      toast.error(`Failed to save permissions: ${error.message || error.details || 'Unknown error'}`);
    },
  });

  // Removed complex permission logic - now handled by SimplePermissionSelector

  const handleSave = () => {
    console.log('🔐 Saving permissions from PermissionMatrixV2:', {
      userId,
      siteId,
      clientId,
      permissions,
      permissionCount: permissions.length,
      nonInheritCount: permissions.filter(p => p.decision !== 'inherit').length,
      timestamp: new Date().toISOString()
    });
    saveMutation.mutate(permissions);
  };

  if (loadingModules || loadingPerms) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!modules || modules.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No modules enabled for this site</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <SimplePermissionSelector
        modules={modules.map((m: any) => ({
          code: m.code,
          libelle: m.libelle,
        }))}
        permissions={permissions}
        onPermissionsChange={setPermissions}
      />

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Enregistrement..." : "Enregistrer les permissions"}
        </Button>
      </div>
    </div>
  );
}
