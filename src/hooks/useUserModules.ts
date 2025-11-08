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

export const useUserModules = () => {
  const { user, getClientId, isSuperAdmin, isTeamUser, permissions } = useAuth();

  return useQuery({
    queryKey: ["user-modules", user?.id],
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

      // Client users see modules enabled for their sites
      const clientId = getClientId();
      if (!clientId) return [];

      // Get modules from user permissions (TEXT-based module codes)
      const allowedModuleCodes = permissions
        .filter(p => {
          const action = (p as any).action || p.permission_actions?.code;
          return action === "view" && p.decision === "allow";
        })
        .map(p => {
          const moduleCode = (p as any).module || p.modules_systeme?.code;
          return moduleCode?.toUpperCase();
        })
        .filter((code): code is string => !!code);

      if (allowedModuleCodes.length === 0) return [];

      // Get sites for this client
      const { data: sites, error: sitesError } = await supabase
        .from("sites")
        .select("id")
        .eq("client_id", clientId);

      if (sitesError) throw sitesError;
      const siteIds = sites?.map(s => s.id) || [];

      // If client has sites, filter modules by site_modules
      if (siteIds.length > 0) {
        const { data: siteModules, error: siteModulesError } = await supabase
          .from("site_modules")
          .select("module_id, modules_systeme!inner(*)")
          .in("site_id", siteIds)
          .eq("enabled", true)
          .eq("modules_systeme.actif", true);

        if (siteModulesError) throw siteModulesError;

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
      }

      // If client has no sites, show modules based on permissions only
      const { data: allModules, error: modulesError } = await supabase
        .from("modules_systeme")
        .select("*")
        .eq("actif", true)
        .in("code", allowedModuleCodes)
        .order("libelle");

      if (modulesError) throw modulesError;
      return allModules || [];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
};
