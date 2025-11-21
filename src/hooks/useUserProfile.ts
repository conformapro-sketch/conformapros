import { useQuery } from "@tanstack/react-query";
import { supabaseAny as supabase } from "@/lib/supabase-any";
import { useAuth } from "@/contexts/AuthContext";

export interface UserProfile {
  avatarUrl?: string;
  clientName?: string;
  clientLogo?: string;
}

export function useUserProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async (): Promise<UserProfile> => {
      if (!user?.id) return {};

      // Try to get client user profile first
      const { data: clientUser, error: clientError } = await supabase
        .from("client_users")
        .select("avatar_url, clients!client_users_client_id_fkey(logo_url, nom)")
        .eq("id", user.id)
        .maybeSingle();

      if (!clientError && clientUser) {
        return {
          avatarUrl: clientUser.avatar_url || undefined,
          clientName: (clientUser.clients as any)?.nom || undefined,
          clientLogo: (clientUser.clients as any)?.logo_url || undefined,
        };
      }

      // Otherwise try team profile
      const { data: teamProfile, error: teamError } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (!teamError && teamProfile) {
        return {
          avatarUrl: teamProfile.avatar_url || undefined,
        };
      }

      return {};
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}
