// Query helpers for Articles (standalone interface)
import { supabaseAny as supabase } from "@/lib/supabase-any";

export interface ArticleWithDetails {
  id: string;
  numero: string;
  titre: string;
  resume?: string;
  est_introductif: boolean;
  porte_exigence: boolean;
  texte_id: string;
  created_at: string;
  updated_at: string;
  texte?: {
    id: string;
    reference: string;
    titre: string;
    type: string;
    annee?: number;
    date_publication?: string;
  };
  version_active?: {
    id: string;
    contenu: string;
    statut: string;
    date_effet: string;
  };
  sous_domaines?: Array<{
    sous_domaine: {
      id: string;
      libelle: string;
      domaine_id: string;
      domaine?: {
        id: string;
        libelle: string;
        code: string;
      };
    };
  }>;
}

export interface ArticleFilters {
  searchTerm?: string;
  typeTexteFilter?: string;
  domaineFilter?: string;
  sousDomaineFilter?: string;
  anneeFilter?: string;
  exigenceOnly?: boolean;
  introductifOnly?: boolean;
  statutVersionFilter?: string;
  page?: number;
  pageSize?: number;
}

export interface ArticleStats {
  total: number;
  exigences: number;
  introductifs: number;
  enVigueur: number;
}

export const articlesListQueries = {
  async getAll(filters?: ArticleFilters) {
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 25;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Build base query with relations
    let query = supabase
      .from("articles")
      .select(`
        *,
        texte:textes_reglementaires!articles_texte_id_fkey(
          id, reference, titre, type, annee, date_publication
        ),
        sous_domaines:article_sous_domaines(
          sous_domaine:sous_domaines_application(
            id, libelle, domaine_id,
            domaine:domaines_reglementaires(id, libelle, code)
          )
        )
      `, { count: "exact" });

    // Search filter - applied after fetching to include version content
    const searchTerm = filters?.searchTerm?.trim() || "";

    // Exigence filter
    if (filters?.exigenceOnly) {
      query = query.eq("porte_exigence", true);
    }

    // Introductif filter
    if (filters?.introductifOnly) {
      query = query.eq("est_introductif", true);
    }

    // Filter by type of parent text
    if (filters?.typeTexteFilter && filters.typeTexteFilter !== "all") {
      const { data: textesOfType } = await supabase
        .from("textes_reglementaires")
        .select("id")
        .eq("type", filters.typeTexteFilter)
        .is("deleted_at", null);
      
      const texteIds = textesOfType?.map(t => t.id) || [];
      if (texteIds.length > 0) {
        query = query.in("texte_id", texteIds);
      } else {
        query = query.in("texte_id", []);
      }
    }

    // Filter by year of parent text
    if (filters?.anneeFilter && filters.anneeFilter !== "all") {
      const { data: textesOfYear } = await supabase
        .from("textes_reglementaires")
        .select("id")
        .eq("annee", parseInt(filters.anneeFilter))
        .is("deleted_at", null);
      
      const texteIds = textesOfYear?.map(t => t.id) || [];
      if (texteIds.length > 0) {
        query = query.in("texte_id", texteIds);
      } else {
        query = query.in("texte_id", []);
      }
    }

    // Filter by domaine (via sous_domaines)
    if (filters?.domaineFilter && filters.domaineFilter !== "all") {
      const { data: sousDomainesOfDomaine } = await supabase
        .from("sous_domaines_application")
        .select("id")
        .eq("domaine_id", filters.domaineFilter)
        .eq("actif", true);

      if (sousDomainesOfDomaine && sousDomainesOfDomaine.length > 0) {
        const sousDomaineIds = sousDomainesOfDomaine.map(sd => sd.id);
        const { data: articleIds } = await supabase
          .from("article_sous_domaines")
          .select("article_id")
          .in("sous_domaine_id", sousDomaineIds);
        
        const uniqueArticleIds = [...new Set(articleIds?.map(a => a.article_id) || [])];
        if (uniqueArticleIds.length > 0) {
          query = query.in("id", uniqueArticleIds);
        } else {
          query = query.in("id", []);
        }
      } else {
        query = query.in("id", []);
      }
    }

    // Filter by sous-domaine directly
    if (filters?.sousDomaineFilter && filters.sousDomaineFilter !== "all") {
      const { data: articleIds } = await supabase
        .from("article_sous_domaines")
        .select("article_id")
        .eq("sous_domaine_id", filters.sousDomaineFilter);
      
      const uniqueArticleIds = [...new Set(articleIds?.map(a => a.article_id) || [])];
      if (uniqueArticleIds.length > 0) {
        query = query.in("id", uniqueArticleIds);
      } else {
        query = query.in("id", []);
      }
    }

    // Apply pagination and ordering
    query = query.order("created_at", { ascending: false });
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    // Fetch active versions for each article
    const articleIds = data?.map(a => a.id) || [];
    let activeVersionsMap: Record<string, any> = {};

    if (articleIds.length > 0) {
      let versionsQuery = supabase
        .from("article_versions")
        .select("article_id, id, contenu, statut, date_effet")
        .in("article_id", articleIds);

      // Filter by version status if specified
      if (filters?.statutVersionFilter && filters?.statutVersionFilter !== "all") {
        versionsQuery = versionsQuery.eq("statut", filters.statutVersionFilter);
      } else {
        versionsQuery = versionsQuery.eq("statut", "en_vigueur");
      }

      const { data: versions } = await versionsQuery;

      if (versions) {
        versions.forEach(v => {
          activeVersionsMap[v.article_id] = v;
        });
      }
    }

    // Combine articles with their active versions
    let articlesWithVersions = (data || []).map(article => ({
      ...article,
      version_active: activeVersionsMap[article.id] || null,
    }));

    // Apply search filter including version content
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      articlesWithVersions = articlesWithVersions.filter(article => {
        const matchNumero = article.numero?.toLowerCase().includes(lowerSearch);
        const matchTitre = article.titre?.toLowerCase().includes(lowerSearch);
        const matchResume = article.resume?.toLowerCase().includes(lowerSearch);
        const matchContenu = article.version_active?.contenu?.toLowerCase().includes(lowerSearch);
        return matchNumero || matchTitre || matchResume || matchContenu;
      });
    }

    // If filtering by version status, exclude articles without matching version
    let filteredArticles = articlesWithVersions;
    if (filters?.statutVersionFilter && filters.statutVersionFilter !== "all") {
      filteredArticles = articlesWithVersions.filter(a => a.version_active !== null);
    }

    // Recalculate count after client-side filtering
    const finalCount = searchTerm ? filteredArticles.length : (count || 0);

    return {
      data: filteredArticles,
      count: finalCount,
      page,
      pageSize,
      totalPages: Math.ceil(finalCount / pageSize)
    };
  },

  async getStats(): Promise<ArticleStats> {
    // Get all counts in parallel
    const [totalResult, exigencesResult, introductifsResult, enVigueurResult] = await Promise.all([
      supabase
        .from("articles")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("articles")
        .select("id", { count: "exact", head: true })
        .eq("porte_exigence", true),
      supabase
        .from("articles")
        .select("id", { count: "exact", head: true })
        .eq("est_introductif", true),
      supabase
        .from("article_versions")
        .select("id", { count: "exact", head: true })
        .eq("statut", "en_vigueur"),
    ]);

    return {
      total: totalResult.count || 0,
      exigences: exigencesResult.count || 0,
      introductifs: introductifsResult.count || 0,
      enVigueur: enVigueurResult.count || 0,
    };
  },

  async getAvailableYears(): Promise<number[]> {
    const { data } = await supabase
      .from("textes_reglementaires")
      .select("annee")
      .not("annee", "is", null)
      .is("deleted_at", null)
      .order("annee", { ascending: false });

    const years = [...new Set(data?.map(t => t.annee).filter(Boolean) || [])];
    return years as number[];
  },
};
