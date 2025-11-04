// Query helpers for TextesReglementaires
import { supabaseAny as supabase } from "@/lib/supabase-any";

export interface TexteReglementaire {
  id: string;
  type_acte: 'loi' | 'decret-loi' | 'arrete' | 'decret' | 'circulaire';
  reference_officielle: string;
  intitule: string;
  autorite_emettrice?: string;
  date_publication?: string;
  statut_vigueur: 'en_vigueur' | 'abroge' | 'suspendu' | 'modifie';
  resume?: string;
  lien_officiel?: string;
  annee?: number;
  created_at: string;
  updated_at: string;
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
    statutFilter?: string;
    domaineFilter?: string;
    sousDomaineFilter?: string;
    anneeFilter?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 10;
    const searchTerm = filters?.searchTerm?.trim() || "";

    // Search in actes
    let textesQuery = supabase
      .from("actes_reglementaires")
      .select(`
        *,
        domaines:actes_reglementaires_domaines(
          domaine:domaines_reglementaires(id, libelle)
        )
      `);

    if (searchTerm) {
      textesQuery = textesQuery.or(
        `intitule.ilike.%${searchTerm}%,reference_officielle.ilike.%${searchTerm}%,resume.ilike.%${searchTerm}%,autorite_emettrice.ilike.%${searchTerm}%`
      );
    }

    if (filters?.typeFilter && filters.typeFilter !== "all") {
      textesQuery = textesQuery.eq("type_acte", filters.typeFilter as any);
    }

    if (filters?.statutFilter && filters.statutFilter !== "all") {
      textesQuery = textesQuery.eq("statut_vigueur", filters.statutFilter as any);
    }

    if (filters?.anneeFilter && filters.anneeFilter !== "all") {
      textesQuery = textesQuery.eq("annee", parseInt(filters.anneeFilter));
    }

    // Filter by domaine if specified
    if (filters?.domaineFilter && filters.domaineFilter !== "all") {
      const { data: actesWithDomain } = await supabase
        .from("actes_reglementaires_domaines")
        .select("acte_id")
        .eq("domaine_id", filters.domaineFilter);
      
      const acteIds = actesWithDomain?.map(a => a.acte_id) || [];
      if (acteIds.length > 0) {
        textesQuery = textesQuery.in("id", acteIds);
      } else {
        textesQuery = textesQuery.in("id", []);
      }
    }

    // Filter by sous-domaine if specified
    if (filters?.sousDomaineFilter && filters.sousDomaineFilter !== "all") {
      const { data: actesWithSousDomaine } = await supabase
        .from("actes_reglementaires_sous_domaines")
        .select("acte_id")
        .eq("sous_domaine_id", filters.sousDomaineFilter);
      
      const acteIds = actesWithSousDomaine?.map(a => a.acte_id) || [];
      if (acteIds.length > 0) {
        textesQuery = textesQuery.in("id", acteIds);
      } else {
        textesQuery = textesQuery.in("id", []);
      }
    }

    // Search in articles
    let articlesQuery = supabase
      .from("textes_articles")
      .select(`
        *,
        texte:actes_reglementaires!textes_articles_texte_id_fkey(
          id, intitule, reference_officielle, type_acte, statut_vigueur, date_publication, annee,
          domaines:actes_reglementaires_domaines(
            domaine:domaines_reglementaires(id, libelle)
          )
        )
      `);

    if (searchTerm) {
      articlesQuery = articlesQuery.or(
        `numero_article.ilike.%${searchTerm}%,titre.ilike.%${searchTerm}%,contenu.ilike.%${searchTerm}%`
      );
    }

    if (filters?.typeFilter && filters.typeFilter !== "all") {
      articlesQuery = articlesQuery.eq("texte.type_acte", filters.typeFilter as any);
    }

    if (filters?.statutFilter && filters.statutFilter !== "all") {
      articlesQuery = articlesQuery.eq("texte.statut_vigueur", filters.statutFilter as any);
    }

    if (filters?.anneeFilter && filters.anneeFilter !== "all") {
      articlesQuery = articlesQuery.eq("texte.annee", parseInt(filters.anneeFilter));
    }

    // Filter articles by domaine if specified
    if (filters?.domaineFilter && filters.domaineFilter !== "all") {
      const { data: actesWithDomain } = await supabase
        .from("actes_reglementaires_domaines")
        .select("acte_id")
        .eq("domaine_id", filters.domaineFilter);
      
      const acteIds = actesWithDomain?.map(a => a.acte_id) || [];
      if (acteIds.length > 0) {
        articlesQuery = articlesQuery.in("texte_id", acteIds);
      } else {
        articlesQuery = articlesQuery.in("texte_id", []);
      }
    }

    // Filter articles by sous-domaine if specified
    if (filters?.sousDomaineFilter && filters.sousDomaineFilter !== "all") {
      const { data: actesWithSousDomaine } = await supabase
        .from("actes_reglementaires_sous_domaines")
        .select("acte_id")
        .eq("sous_domaine_id", filters.sousDomaineFilter);
      
      const acteIds = actesWithSousDomaine?.map(a => a.acte_id) || [];
      if (acteIds.length > 0) {
        articlesQuery = articlesQuery.in("texte_id", acteIds);
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
    statutFilter?: string;
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
      .from("actes_reglementaires")
      .select(`
        *,
        articles:textes_articles(count),
        domaines:actes_reglementaires_domaines(
          domaine:domaines_reglementaires(id, libelle)
        )
      `, { count: "exact" });

    if (filters?.searchTerm) {
      query = query.or(
        `intitule.ilike.%${filters.searchTerm}%,reference_officielle.ilike.%${filters.searchTerm}%,autorite_emettrice.ilike.%${filters.searchTerm}%,resume.ilike.%${filters.searchTerm}%`
      );
    }

    if (filters?.typeFilter && filters.typeFilter !== "all") {
      query = query.eq("type_acte", filters.typeFilter as any);
    }

    if (filters?.statutFilter && filters.statutFilter !== "all") {
      query = query.eq("statut_vigueur", filters.statutFilter as any);
    }

    if (filters?.anneeFilter && filters.anneeFilter !== "all") {
      query = query.eq("annee", parseInt(filters.anneeFilter));
    }

    if (filters?.typeFilter && filters.typeFilter !== "all") {
      query = query.eq("type_acte", filters.typeFilter);
    }

    if (filters?.statutFilter && filters.statutFilter !== "all") {
      query = query.eq("statut_vigueur", filters.statutFilter);
    }

    if (filters?.anneeFilter && filters.anneeFilter !== "all") {
      query = query.eq("annee", parseInt(filters.anneeFilter));
    }

    if (filters?.domaineFilter && filters.domaineFilter !== "all") {
      // Filter by domain through junction table - this needs a different approach
      const { data: actesWithDomain } = await supabase
        .from("actes_reglementaires_domaines")
        .select("acte_id")
        .eq("domaine_id", filters.domaineFilter);
      
      if (actesWithDomain && actesWithDomain.length > 0) {
        const acteIds = actesWithDomain.map(a => a.acte_id);
        query = query.in("id", acteIds);
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
      .from("actes_reglementaires")
      .select(`
        *,
        articles:textes_articles(*),
        domaines:actes_reglementaires_domaines(
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
      .from("actes_reglementaires")
      .insert([texte as any])
      .select()
      .single();
    if (error) throw error;

    // Link domaines
    if (domaineIds && domaineIds.length > 0) {
      const relations = domaineIds.map(domaineId => ({
        acte_id: data.id,
        domaine_id: domaineId,
      }));
      await supabase.from("actes_reglementaires_domaines").insert(relations);
    }

    return data;
  },

  async update(id: string, texte: Partial<TexteReglementaire>, domaineIds?: string[]) {
    const { data, error } = await supabase
      .from("actes_reglementaires")
      .update(texte as any)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    // Update domaines
    if (domaineIds !== undefined) {
      await supabase.from("actes_reglementaires_domaines").delete().eq("acte_id", id);
      if (domaineIds.length > 0) {
        const relations = domaineIds.map(domaineId => ({
          acte_id: id,
          domaine_id: domaineId,
        }));
        await supabase.from("actes_reglementaires_domaines").insert(relations);
      }
    }

    return data;
  },

  async softDelete(id: string) {
    const { error } = await supabase
      .from("actes_reglementaires")
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
      .from("textes_articles")
      .select(`
        *,
        sous_domaines:articles_sous_domaines(
          sous_domaine:sous_domaines_application(*)
        )
      `)
      .eq("texte_id", texteId)
      .order("ordre");
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from("textes_articles")
      .select(`
        *, 
        actes_reglementaires(reference_officielle, intitule),
        sous_domaines:articles_sous_domaines(
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
      .from("textes_articles")
      .insert([article])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, article: any) {
    const { data, error } = await supabase
      .from("textes_articles")
      .update(article)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from("textes_articles")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  async updateArticleSousDomaines(articleId: string, sousDomaineIds: string[]) {
    // Delete existing associations
    await supabase
      .from("articles_sous_domaines")
      .delete()
      .eq("article_id", articleId);

    // Insert new associations
    if (sousDomaineIds.length > 0) {
      const relations = sousDomaineIds.map((sousDomaineId) => ({
        article_id: articleId,
        sous_domaine_id: sousDomaineId,
      }));
      const { error } = await supabase
        .from("articles_sous_domaines")
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
        source_text:source_text_id (
          id,
          reference_officielle,
          intitule,
          type_acte,
          date_publication
        )
      `)
      .eq("article_id", articleId)
      .is("deleted_at", null)
      .order("effective_from", { ascending: false });
    if (error) throw error;
    return data;
  },

  async getByArticleIdWithSources(articleId: string) {
    const { data, error } = await supabase
      .from("article_versions")
      .select(`
        *,
        source_text:source_text_id (
          id,
          reference_officielle,
          intitule,
          type_acte,
          date_publication
        )
      `)
      .eq("article_id", articleId)
      .is("deleted_at", null)
      .order("effective_from", { ascending: false });
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
    version_numero: number;
    version_label: string;
    contenu: string;
    date_version: string;
    effective_from: string;
    effective_to?: string;
    modification_type: string;
    source_text_id?: string;
    source_article_reference?: string;
    replaced_version_id?: string;
    notes_modification?: string;
    raison_modification?: string;
    tags?: string[];
    impact_estime?: string;
  }) {
    const { data, error } = await supabase
      .from("article_versions")
      .insert([version as any])
      .select(`
        *,
        source_text:source_text_id (
          id,
          reference_officielle,
          intitule,
          type_acte
        )
      `)
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, version: Partial<{
    version_label: string;
    contenu: string;
    effective_from: string;
    effective_to?: string;
    modification_type: string;
    source_text_id?: string;
    source_article_reference?: string;
    notes_modification?: string;
    is_active: boolean;
  }>) {
    const { data, error } = await supabase
      .from("article_versions")
      .update(version as any)
      .eq("id", id)
      .select(`
        *,
        source_text:source_text_id (
          id,
          reference_officielle,
          intitule,
          type_acte
        )
      `)
      .single();
    if (error) throw error;
    return data;
  },

  async softDelete(id: string) {
    const { error } = await supabase
      .from("article_versions")
      .update({ deleted_at: new Date().toISOString() })
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
