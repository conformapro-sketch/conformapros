import { useQuery } from "@tanstack/react-query";
import { supabaseAny as supabase } from "@/lib/supabase-any";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteContext } from "@/hooks/useSiteContext";

export function useSitePermissions() {
  const { user, isClientUser } = useAuth();
  const { currentSite } = useSiteContext();
  
  const { data: permissions, isLoading } = useQuery({
    queryKey: ["site-permissions", user?.id, currentSite?.id],
    queryFn: async () => {
      if (!user?.id || !currentSite?.id) return [];
      
      const { data, error } = await supabase
        .from("user_permissions")
        .select("*")
        .eq("user_id", user.id)
        .eq("site_id", currentSite.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!currentSite?.id && isClientUser(),
  });
  
  const hasPermission = (module: string, action: string): boolean => {
    if (!permissions || permissions.length === 0) return false;
    
    return permissions.some(
      (p) =>
        p.module?.toLowerCase() === module.toLowerCase() &&
        p.action?.toLowerCase() === action.toLowerCase() &&
        p.decision === "allow"
    );
  };
  
  return { 
    permissions: permissions || [], 
    hasPermission, 
    isLoading 
  };
}
