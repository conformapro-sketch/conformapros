import { createContext, useState, useEffect, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Site {
  id: string;
  nom: string;
  code_site?: string;
  gouvernorat?: string;
  delegation?: string;
}

interface SiteContextType {
  currentSite: Site | null;
  availableSites: Site[];
  isLoading: boolean;
  setSite: (siteId: string) => void;
}

export const SiteContext = createContext<SiteContextType | null>(null);

const STORAGE_KEY = "conformapro_selected_site";

export function SiteProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentSite, setCurrentSite] = useState<Site | null>(null);
  const [availableSites, setAvailableSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user's assigned sites
  useEffect(() => {
    const fetchSites = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: accessScopes, error } = await supabase
          .from("access_scopes")
          .select(`
            site_id,
            site:sites (
              id,
              nom,
              code_site,
              gouvernorat,
              delegation
            )
          `)
          .eq("user_id", user.id);

        if (error) throw error;

        const sites = accessScopes
          ?.map((scope: any) => scope.site)
          .filter(Boolean) as Site[];

        setAvailableSites(sites || []);

        // Restore or auto-select site
        if (sites && sites.length > 0) {
          const storedSiteId = localStorage.getItem(STORAGE_KEY);
          const validStoredSite = sites.find((s) => s.id === storedSiteId);

          if (validStoredSite) {
            setCurrentSite(validStoredSite);
          } else {
            // Auto-select first site
            setCurrentSite(sites[0]);
            localStorage.setItem(STORAGE_KEY, sites[0].id);
          }
        }
      } catch (error) {
        console.error("Error fetching sites:", error);
        toast.error("Erreur lors du chargement des sites");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSites();
  }, [user?.id]);

  const setSite = (siteId: string) => {
    const site = availableSites.find((s) => s.id === siteId);
    if (site) {
      setCurrentSite(site);
      localStorage.setItem(STORAGE_KEY, siteId);
      
      // Invalidate site-specific queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["user-modules"] });
      queryClient.invalidateQueries({ queryKey: ["site-permissions"] });
      queryClient.invalidateQueries({ queryKey: ["client-bibliotheque"] });
      queryClient.invalidateQueries({ queryKey: ["veille-dashboard-stats"] });
      
      toast.success(`Site changé: ${site.nom}`);
    }
  };

  return (
    <SiteContext.Provider
      value={{ currentSite, availableSites, isLoading, setSite }}
    >
      {children}
    </SiteContext.Provider>
  );
}
