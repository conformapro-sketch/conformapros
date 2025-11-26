// Client-side queries for Bibliothèque Réglementaire
// Filters texts based on site's authorized domains
import { supabase } from "@/integrations/supabase/client";

export interface ClientTexteReglementaire {
  id: string;
  type: 'loi' | 'decret' | 'arrete' | 'circulaire';
  reference: string;
  titre: string;
  date_publication?: string;
  domaines?: Array<{
    id: string;
    code: string;
    libelle: string;
  }>;
}

/**
 * Fetch textes réglementaires filtered by site's authorized domains
 */
export const clientBibliothequeQueries = {
  async getTextesBySite(filters?: {
    siteId: string;
    searchTerm?: string;
    domaineFilter?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // First, get the authorized domains for this site
    const { data: siteDomaines, error: siteDomainesError } = await supabase
      .from("site_veille_domaines")
      .select("domaine_id")
      .eq("site_id", filters?.siteId!)
      .eq("enabled", true);

    if (siteDomainesError) throw siteDomainesError;
    
    const authorizedDomaineIds = (siteDomaines || []).map((sd: any) => sd.domaine_id);
    
    if (authorizedDomaineIds.length === 0) {
      // No authorized domains for this site, return empty result
      return {
        data: [],
        count: 0,
        totalPages: 0,
      };
    }

    // Find articles that belong to these domains
    const { data: articlesInDomains } = await supabase
      .from("articles")
      .select("texte_id, article_sous_domaines!inner(sous_domaines_application!inner(domaine_id))")
      .in("article_sous_domaines.sous_domaines_application.domaine_id", authorizedDomaineIds);

    // Get unique texte_ids
    const texteIds = [...new Set((articlesInDomains || []).map((a: any) => a.texte_id))];

    if (texteIds.length === 0) {
      return {
        data: [],
        count: 0,
        totalPages: 0,
      };
    }

    // Now query textes_reglementaires filtered by these IDs
    let query = supabase
      .from("textes_reglementaires")
      .select("id, type, reference, titre, date_publication", { count: "exact" })
      .in("id", texteIds)
      .is("deleted_at", null);

    // Apply search filter
    if (filters?.searchTerm) {
      query = query.or(
        `reference.ilike.%${filters.searchTerm}%,titre.ilike.%${filters.searchTerm}%`
      );
    }

    // Apply domain filter if specified
    if (filters?.domaineFilter && filters.domaineFilter !== "all") {
      // Re-filter texte_ids by the selected domain
      const { data: filteredArticles } = await supabase
        .from("articles")
        .select("texte_id, article_sous_domaines!inner(sous_domaines_application!inner(domaine_id))")
        .eq("article_sous_domaines.sous_domaines_application.domaine_id", filters.domaineFilter)
        .in("texte_id", texteIds);

      const filteredTexteIds = [...new Set((filteredArticles || []).map((a: any) => a.texte_id))];
      
      if (filteredTexteIds.length === 0) {
        return {
          data: [],
          count: 0,
          totalPages: 0,
        };
      }

      query = query.in("id", filteredTexteIds);
    }

    // Apply pagination
    query = query.range(from, to).order("date_publication", { ascending: false });

    const { data: textes, error, count } = await query;

    if (error) throw error;

    // For each texte, fetch its associated domains
    const textesWithDomains = await Promise.all(
      (textes || []).map(async (texte: any) => {
        const { data: articleDomains } = await supabase
          .from("articles")
          .select("article_sous_domaines!inner(sous_domaines_application!inner(domaine_id, domaines_reglementaires!inner(id, code, libelle)))")
          .eq("texte_id", texte.id);

        // Extract unique domains
        const domainesMap = new Map();
        (articleDomains || []).forEach((article: any) => {
          (article.article_sous_domaines || []).forEach((asd: any) => {
            const domaine = asd?.sous_domaines_application?.domaines_reglementaires;
            if (domaine) {
              domainesMap.set(domaine.id, {
                id: domaine.id,
                code: domaine.code,
                libelle: domaine.libelle,
              });
            }
          });
        });

        return {
          ...texte,
          domaines: Array.from(domainesMap.values()),
        };
      })
    );

    const totalPages = Math.ceil((count || 0) / pageSize);

    return {
      data: textesWithDomains,
      count: count || 0,
      totalPages,
    };
  },

  /**
   * Get authorized domains for a site
   */
  async getAuthorizedDomains(siteId: string) {
    const { data, error } = await supabase
      .from("site_veille_domaines")
      .select("domaine_id, domaines_reglementaires!inner(id, code, libelle)")
      .eq("site_id", siteId)
      .eq("enabled", true);

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.domaines_reglementaires.id,
      code: item.domaines_reglementaires.code,
      libelle: item.domaines_reglementaires.libelle,
    }));
  },

  /**
   * Get text detail by ID with domains
   */
  async getTexteById(texteId: string) {
    const { data: texte, error } = await supabase
      .from("textes_reglementaires")
      .select("id, type, reference, titre, date_publication, pdf_url, source_url")
      .eq("id", texteId)
      .is("deleted_at", null)
      .single();

    if (error) throw error;
    if (!texte) return null;

    // Get domains for this text
    const { data: articleDomains } = await supabase
      .from("articles")
      .select("article_sous_domaines!inner(sous_domaines_application!inner(domaines_reglementaires!inner(id, code, libelle)))")
      .eq("texte_id", texteId);

    // Extract unique domains
    const domainesMap = new Map();
    (articleDomains || []).forEach((article: any) => {
      (article.article_sous_domaines || []).forEach((asd: any) => {
        const domaine = asd?.sous_domaines_application?.domaines_reglementaires;
        if (domaine) {
          domainesMap.set(domaine.id, {
            id: domaine.id,
            code: domaine.code,
            libelle: domaine.libelle,
          });
        }
      });
    });

    return {
      ...texte,
      domaines: Array.from(domainesMap.values()),
    };
  },

  /**
   * Get articles with active versions for a text
   */
  async getTexteArticlesActiveVersions(texteId: string) {
    const { data: articles, error } = await supabase
      .from("articles")
      .select(`
        id,
        numero,
        titre,
        resume,
        est_introductif,
        porte_exigence,
        article_versions!inner(
          id,
          contenu,
          date_effet,
          statut
        )
      `)
      .eq("texte_id", texteId)
      .eq("article_versions.statut", "en_vigueur")
      .order("numero", { ascending: true });

    if (error) throw error;

    return (articles || []).map((article: any) => ({
      id: article.id,
      numero: article.numero,
      titre: article.titre,
      resume: article.resume,
      est_introductif: article.est_introductif,
      porte_exigence: article.porte_exigence,
      active_version: article.article_versions?.[0] || null,
    }));
  },
};
