// Query helpers for TextesReglementaires
import { supabaseAny as supabase } from "@/lib/supabase-any";

export interface TexteReglementaire {
  id: string;
  type: 'loi' | 'decret' | 'arrete' | 'circulaire';
  reference: string;
  titre: string;
  autorite_emettrice?: string;
  autorite_emettrice_id?: string;
  date_publication?: string;
  source_url?: string;
  pdf_url?: string;
  annee?: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Code {
  id: string;
  titre: string;
  description?: string;
  structure: any[];
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export const domainesQueries = {
  async getActive() {
    const { data, error } = await supabase
      .from("domaines_reglementaires")
      .select("*")
      .eq("actif", true)
      .is("deleted_at", null)
      .order("libelle");
    if (error) throw error;
    return data || [];
  },
};

export const sousDomainesQueries = {
  async getActive(domaineId?: string) {
    let query = supabase
      .from("sous_domaines_application")
      .select("*");
    
    if (domaineId) {
      query = query.eq("domaine_id", domaineId);
    }
    
    const { data, error } = await query.order("libelle");
    if (error) throw error;
    return data || [];
  },
};

export const textesReglementairesQueries = {
  async smartSearch(filters?: {
    searchTerm?: string;
    typeFilter?: string;
    domaineFilter?: string;
    sousDomaineFilter?: string;
    anneeFilter?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 10;
    const searchTerm = filters?.searchTerm?.trim() || "";

    // Search in textes
    let textesQuery = supabase
      .from("textes_reglementaires")
      .select(`
        *,
        domaines:textes_domaines(
          domaine:domaines_reglementaires(id, libelle)
        )
      `);

    if (searchTerm) {
      textesQuery = textesQuery.or(
        `titre.ilike.%${searchTerm}%,reference.ilike.%${searchTerm}%,autorite_emettrice.ilike.%${searchTerm}%`
      );
    }

    if (filters?.typeFilter && filters.typeFilter !== "all") {
      textesQuery = textesQuery.eq("type", filters.typeFilter as any);
    }

    if (filters?.anneeFilter && filters.anneeFilter !== "all") {
      textesQuery = textesQuery.eq("annee", parseInt(filters.anneeFilter));
    }

    // Filter by domaine if specified
    if (filters?.domaineFilter && filters.domaineFilter !== "all") {
      const { data: textesWithDomain } = await supabase
        .from("textes_domaines")
        .select("texte_id")
        .eq("domaine_id", filters.domaineFilter);
      
      const texteIds = textesWithDomain?.map(t => t.texte_id) || [];
      if (texteIds.length > 0) {
        textesQuery = textesQuery.in("id", texteIds);
      } else {
        textesQuery = textesQuery.in("id", []);
      }
    }

    // Filter by sous-domaine if specified
    if (filters?.sousDomaineFilter && filters.sousDomaineFilter !== "all") {
      const { data: textesWithSousDomaine } = await supabase
        .from("textes_sous_domaines")
        .select("texte_id")
        .eq("sous_domaine_id", filters.sousDomaineFilter);
      
      const texteIds = textesWithSousDomaine?.map(t => t.texte_id) || [];
      if (texteIds.length > 0) {
        textesQuery = textesQuery.in("id", texteIds);
      } else {
        textesQuery = textesQuery.in("id", []);
      }
    }

    // Get texte IDs that match type and année filters for articles filtering
    let texteIdsForArticles: string[] | null = null;

    if (filters?.typeFilter || filters?.anneeFilter) {
      let texteFilterQuery = supabase
        .from("textes_reglementaires")
        .select("id");
      
      if (filters?.typeFilter && filters.typeFilter !== "all") {
        texteFilterQuery = texteFilterQuery.eq("type", filters.typeFilter);
      }
      
      if (filters?.anneeFilter && filters.anneeFilter !== "all") {
        texteFilterQuery = texteFilterQuery.eq("annee", parseInt(filters.anneeFilter));
      }
      
      const { data: matchingTextes } = await texteFilterQuery;
      texteIdsForArticles = matchingTextes?.map(t => t.id) || [];
    }

    // Search in articles
    let articlesQuery = supabase
      .from("articles")
      .select(`
        *,
        texte:textes_reglementaires!articles_texte_id_fkey(
          id, titre, reference, type, date_publication, annee,
          domaines:textes_domaines(
            domaine:domaines_reglementaires(id, libelle)
          )
        )
      `);

    if (searchTerm) {
      articlesQuery = articlesQuery.or(
        `numero_article.ilike.%${searchTerm}%,titre.ilike.%${searchTerm}%,contenu.ilike.%${searchTerm}%`
      );
    }

    // Combine domaine/sous-domaine filters with type/statut/année filters
    let finalTexteIdsForArticles = texteIdsForArticles;

    // Filter articles by domaine if specified
    if (filters?.domaineFilter && filters.domaineFilter !== "all") {
      const { data: textesWithDomain } = await supabase
        .from("textes_domaines")
        .select("texte_id")
        .eq("domaine_id", filters.domaineFilter);
      
      const domaineTexteIds = textesWithDomain?.map(t => t.texte_id) || [];
      
      if (finalTexteIdsForArticles !== null) {
        // Intersection of both filters
        finalTexteIdsForArticles = finalTexteIdsForArticles.filter(id => domaineTexteIds.includes(id));
      } else {
        finalTexteIdsForArticles = domaineTexteIds;
      }
    }

    // Filter articles by sous-domaine if specified
    if (filters?.sousDomaineFilter && filters.sousDomaineFilter !== "all") {
      const { data: articlesWithSousDomaine } = await supabase
        .from("article_sous_domaines")
        .select("article_id")
        .eq("sous_domaine_id", filters.sousDomaineFilter);
      
      const articleIdsWithSousDomaine = articlesWithSousDomaine?.map(a => a.article_id) || [];
      
      // Important: Pour les sous-domaines, on filtre directement par article_id
      // car les sous-domaines sont liés aux articles, pas aux textes
      if (articleIdsWithSousDomaine.length > 0) {
        articlesQuery = articlesQuery.in("id", articleIdsWithSousDomaine);
      } else {
        // Aucun article ne correspond à ce sous-domaine
        articlesQuery = articlesQuery.in("id", []);
      }
      
      // Ne pas combiner avec finalTexteIdsForArticles pour les sous-domaines
      // car la relation est article->sous_domaine, pas texte->sous_domaine
    }

    // Apply final combined filters (type/année/domaine)
    // MAIS PAS si sous-domaine est filtré (car déjà appliqué directement sur les articles)
    if (finalTexteIdsForArticles !== null && (!filters?.sousDomaineFilter || filters.sousDomaineFilter === "all")) {
      if (finalTexteIdsForArticles.length > 0) {
        articlesQuery = articlesQuery.in("texte_id", finalTexteIdsForArticles);
      } else {
        articlesQuery = articlesQuery.in("texte_id", []);
      }
    }

    const [textesResult, articlesResult] = await Promise.all([
      textesQuery,
      articlesQuery.limit(50)
    ]);

    if (textesResult.error) throw textesResult.error;
    if (articlesResult.error) throw articlesResult.error;

    const results = [
      ...(textesResult.data || []).map((t: any) => ({
        type: 'texte' as const,
        id: t.id,
        data: t
      })),
      ...(articlesResult.data || []).map((a: any) => ({
        type: 'article' as const,
        id: a.id,
        data: a
      }))
    ];

    return {
      results,
      totalCount: results.length
    };
  },

  async getAll(filters?: {
    searchTerm?: string;
    typeFilter?: string;
    domaineFilter?: string;
    sousDomaineFilter?: string;
    anneeFilter?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 25;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("textes_reglementaires")
      .select(`
        *,
        articles:textes_articles(count),
        domaines:textes_domaines(
          domaine:domaines_reglementaires(id, libelle)
        )
      `, { count: "exact" });

    if (filters?.searchTerm) {
      query = query.or(
        `titre.ilike.%${filters.searchTerm}%,reference.ilike.%${filters.searchTerm}%,autorite_emettrice.ilike.%${filters.searchTerm}%`
      );
    }

    if (filters?.typeFilter && filters.typeFilter !== "all") {
      query = query.eq("type", filters.typeFilter as any);
    }

    if (filters?.anneeFilter && filters.anneeFilter !== "all") {
      query = query.eq("annee", parseInt(filters.anneeFilter));
    }

    if (filters?.domaineFilter && filters.domaineFilter !== "all") {
      // Filter by domain through junction table - this needs a different approach
      const { data: textesWithDomain } = await supabase
        .from("textes_domaines")
        .select("texte_id")
        .eq("domaine_id", filters.domaineFilter);
      
      if (textesWithDomain && textesWithDomain.length > 0) {
        const texteIds = textesWithDomain.map(t => t.texte_id);
        query = query.in("id", texteIds);
      }
    }

    const sortBy = filters?.sortBy || "date_publication";
    const sortOrder = filters?.sortOrder || "desc";
    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;
    
    return { 
      data: data || [], 
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from("textes_reglementaires")
      .select(`
        *,
        articles:textes_articles(*),
        domaines:textes_domaines(
          domaine:domaines_reglementaires(*)
        )
      `)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(texte: Partial<TexteReglementaire>, domaineIds?: string[]) {
    const { data, error } = await supabase
      .from("textes_reglementaires")
      .insert([texte as any])
      .select()
      .single();
    if (error) throw error;

    // Link domaines
    if (domaineIds && domaineIds.length > 0) {
      const relations = domaineIds.map(domaineId => ({
        texte_id: data.id,
        domaine_id: domaineId,
      }));
      await supabase.from("textes_domaines").insert(relations);
    }

    return data;
  },

  async update(id: string, texte: Partial<TexteReglementaire>, domaineIds?: string[]) {
    const { data, error } = await supabase
      .from("textes_reglementaires")
      .update(texte as any)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    // Update domaines
    if (domaineIds !== undefined) {
      await supabase.from("textes_domaines").delete().eq("texte_id", id);
      if (domaineIds.length > 0) {
        const relations = domaineIds.map(domaineId => ({
          texte_id: id,
          domaine_id: domaineId,
        }));
        await supabase.from("textes_domaines").insert(relations);
      }
    }

    return data;
  },

  async softDelete(id: string) {
    const { error } = await supabase
      .from("textes_reglementaires")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },
};

export const codesQueries = {
  async getAll() {
    const { data, error } = await supabase
      .from("codes")
      .select("*")
      .is("deleted_at", null)
      .order("titre");
    if (error) throw error;
    return data as Code[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from("codes")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) throw error;
    return data as Code | null;
  },

  async create(code: Partial<Code>) {
    const { data, error } = await supabase
      .from("codes")
      .insert([code as any])
      .select()
      .single();
    if (error) throw error;
    return data as Code;
  },

  async update(id: string, code: Partial<Code>) {
    const { data, error } = await supabase
      .from("codes")
      .update(code as any)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Code;
  },

  async softDelete(id: string) {
    const { error } = await supabase
      .from("codes")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },
};

export const textesArticlesQueries = {
  async getByTexteId(texteId: string) {
    const { data, error } = await supabase
      .from("articles")
      .select(`
        *,
        sous_domaines:article_sous_domaines(
          sous_domaine:sous_domaines_application(*)
        )
      `)
      .eq("texte_id", texteId)
      .order("numero");
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from("articles")
      .select(`
        *, 
        textes_reglementaires(reference, titre),
        sous_domaines:article_sous_domaines(
          sous_domaine:sous_domaines_application(*)
        )
      `)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(article: any) {
    const { data, error } = await supabase
      .from("articles")
      .insert([article])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, article: any) {
    const { data, error } = await supabase
      .from("articles")
      .update(article)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from("articles")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  async updateArticleSousDomaines(articleId: string, sousDomaineIds: string[]) {
    // Delete existing associations
    await supabase
      .from("article_sous_domaines")
      .delete()
      .eq("article_id", articleId);

    // Insert new associations
    if (sousDomaineIds.length > 0) {
      const relations = sousDomaineIds.map((sousDomaineId) => ({
        article_id: articleId,
        sous_domaine_id: sousDomaineId,
      }));
      const { error } = await supabase
        .from("article_sous_domaines")
        .insert(relations);
      if (error) throw error;
    }
  },
};

export const textesArticlesVersionsQueries = {
  async getByArticleId(articleId: string) {
    const { data, error } = await supabase
      .from("article_versions")
      .select(`
        *,
        source_texte:source_texte_id (
          id,
          reference,
          titre,
          type,
          date_publication
        )
      `)
      .eq("article_id", articleId)
      .order("date_effet", { ascending: false });
    if (error) throw error;
    return data;
  },

  async getByArticleIdWithSources(articleId: string) {
    const { data, error } = await supabase
      .from("article_versions")
      .select(`
        *,
        source_texte:source_texte_id (
          id,
          reference,
          titre,
          type,
          date_publication
        )
      `)
      .eq("article_id", articleId)
      .order("date_effet", { ascending: false });
    if (error) throw error;
    return data;
  },

  async getActiveVersionAtDate(articleId: string, targetDate: string) {
    const { data, error } = await supabase
      .rpc('get_article_version_at_date', {
        p_article_id: articleId,
        p_target_date: targetDate
      });
    if (error) throw error;
    return data?.[0];
  },

  async getModificationHistory(articleId: string) {
    const { data, error } = await supabase
      .rpc('get_article_modification_history', {
        p_article_id: articleId
      });
    if (error) throw error;
    return data;
  },

  async create(version: {
    article_id: string;
    numero_version: number;
    contenu: string;
    date_effet: string;
    statut?: "en_vigueur" | "abrogee" | "remplacee";
    source_texte_id: string;
    notes_modifications?: string;
  }) {
    const { data, error } = await supabase
      .from("article_versions")
      .insert([version as any])
      .select(`
        *,
        source_texte:source_texte_id (
          id,
          reference,
          titre,
          type
        )
      `)
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, version: Partial<{
    contenu: string;
    date_effet: string;
    statut: "en_vigueur" | "abrogee" | "remplacee";
    source_texte_id?: string;
    notes_modifications?: string;
  }>) {
    const { data, error } = await supabase
      .from("article_versions")
      .update(version as any)
      .eq("id", id)
      .select(`
        *,
        source_texte:source_texte_id (
          id,
          reference,
          titre,
          type
        )
      `)
      .single();
    if (error) throw error;
    return data;
  },

  async softDelete(id: string) {
    const { error } = await supabase
      .from("article_versions")
      .update({ statut: "abrogee" })
      .eq("id", id);
    if (error) throw error;
  },

  async deleteWithRepair(versionId: string) {
    const { error } = await supabase.rpc("delete_article_version", {
      p_version_id: versionId,
    });
    if (error) throw error;
  },
};
