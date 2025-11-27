import { useQuery } from "@tanstack/react-query";
import { supabaseAny as supabase } from "@/lib/supabase-any";
import { useAuth } from "@/contexts/AuthContext";

export interface ModuleSysteme {
  id: string;
  code: string;
  libelle: string;
  description: string | null;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export const useUserModules = (siteId?: string | null) => {
  const { user, getClientId, isSuperAdmin, isTeamUser, isClientUser, permissions } = useAuth();

  return useQuery({
    queryKey: ["user-modules", user?.id, siteId],
    queryFn: async (): Promise<ModuleSysteme[]> => {
      if (!user) return [];

      // Super Admin sees all active modules
      if (isSuperAdmin()) {
        const { data, error } = await supabase
          .from("modules_systeme")
          .select("*")
          .eq("actif", true)
          .order("libelle");

        if (error) throw error;
        return data || [];
      }

      // Team users see modules based on permissions
      if (isTeamUser()) {
        const allowedModuleCodes = permissions
          .filter(p => p.permission_actions?.code === "view" && p.decision === "allow")
          .map(p => p.modules_systeme?.code.toUpperCase())
          .filter((code): code is string => !!code);

        if (allowedModuleCodes.length === 0) return [];

        const { data, error } = await supabase
          .from("modules_systeme")
          .select("*")
          .eq("actif", true)
          .in("code", allowedModuleCodes)
          .order("libelle");

        if (error) throw error;
        return data || [];
      }

      // Client users see modules enabled for their sites + filtered by permissions
      const clientId = getClientId();
      if (!clientId) return [];

      // If no site selected yet, return empty array (client users must select a site)
      if (!siteId) return [];

      // Get modules enabled for THIS specific site only
      const { data: siteModules, error: siteModulesError } = await supabase
        .from("site_modules")
        .select("module_id, modules_systeme!inner(*)")
        .eq("site_id", siteId)
        .eq("actif", true)
        .eq("modules_systeme.actif", true);

      if (siteModulesError) throw siteModulesError;

      // Get user permissions for THIS specific site
      const { data: userPermissions, error: permsError } = await supabase
        .from("user_permissions")
        .select("module, action, decision")
        .eq("user_id", user.id)
        .eq("site_id", siteId)
        .eq("decision", "allow");

      if (permsError) throw permsError;

      // Extract module codes from permissions with view access
      const allowedModuleCodes = userPermissions
        ?.filter(p => p.action === "view")
        .map(p => p.module?.toUpperCase())
        .filter((code): code is string => !!code) || [];

      if (allowedModuleCodes.length === 0) return [];

      // Extract unique modules and filter by permissions
      const modulesMap = new Map<string, ModuleSysteme>();
      siteModules?.forEach((sm: any) => {
        const module = sm.modules_systeme;
        if (module && allowedModuleCodes.includes(module.code)) {
          modulesMap.set(module.id, module);
        }
      });

      return Array.from(modulesMap.values()).sort((a, b) =>
        a.libelle.localeCompare(b.libelle)
      );
    },
    enabled: !!user && (!isClientUser() || !!siteId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
