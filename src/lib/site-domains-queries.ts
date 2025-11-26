import { supabaseAny as supabase } from "@/lib/supabase-any";

export const siteDomainQueries = {
  /**
   * Get count of domains for multiple sites
   */
  async getDomainCounts(siteIds: string[]): Promise<Record<string, number>> {
    if (siteIds.length === 0) return {};
    
    const { data, error } = await supabase
      .from('site_veille_domaines')
      .select('site_id')
      .in('site_id', siteIds)
      .eq('actif', true);
    
    if (error) throw error;
    
    const counts: Record<string, number> = {};
    (data || []).forEach((item: any) => {
      counts[item.site_id] = (counts[item.site_id] || 0) + 1;
    });
    
    return counts;
  }
};
