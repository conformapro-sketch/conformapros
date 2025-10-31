// Query helpers for TextesReglementaires
import { supabaseAny as supabase } from "@/lib/supabase-any";

export interface TexteReglementaire {
  id: string;
  type: 'LOI' | 'ARRETE' | 'DECRET' | 'CIRCULAIRE';
  code_id?: string;
  reference_officielle: string;
  titre: string;
  autorite?: string;
  date_signature?: string;
  date_publication?: string;
  statut_vigueur: 'en_vigueur' | 'abroge' | 'suspendu' | 'modifie';
  resume?: string;
  fichier_pdf_url?: string;
  annee?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
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
      .from("domaines_application")
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
      .select("*")
      .eq("actif", true)
      .is("deleted_at", null)
      .order("ordre");
    
    if (domaineId) {
      query = query.eq("domaine_id", domaineId);
    }
    
    const { data, error } = await query;
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
        domaines:textes_reglementaires_domaines(
          domaine:domaines_application(id, libelle)
        )
      `)
      .is("deleted_at", null);

    if (searchTerm) {
      textesQuery = textesQuery.or(
        `titre.ilike.%${searchTerm}%,reference_officielle.ilike.%${searchTerm}%,resume.ilike.%${searchTerm}%,autorite.ilike.%${searchTerm}%`
      );
    }

    if (filters?.typeFilter && filters.typeFilter !== "all") {
      textesQuery = textesQuery.eq("type", filters.typeFilter as any);
    }

    if (filters?.statutFilter && filters.statutFilter !== "all") {
      textesQuery = textesQuery.eq("statut_vigueur", filters.statutFilter as any);
    }

    if (filters?.anneeFilter && filters.anneeFilter !== "all") {
      textesQuery = textesQuery.eq("annee", parseInt(filters.anneeFilter));
    }

    // Search in articles
    let articlesQuery = supabase
      .from("textes_articles")
      .select(`
        *,
        texte:textes_reglementaires!inner(
          id, titre, reference_officielle, type, statut_vigueur, date_publication, annee,
          domaines:textes_reglementaires_domaines(
            domaine:domaines_application(id, libelle)
          )
        )
      `)
      .is("texte.deleted_at", null);

    if (searchTerm) {
      articlesQuery = articlesQuery.or(
        `numero.ilike.%${searchTerm}%,titre_court.ilike.%${searchTerm}%,contenu.ilike.%${searchTerm}%,reference.ilike.%${searchTerm}%`
      );
    }

    if (filters?.typeFilter && filters.typeFilter !== "all") {
      articlesQuery = articlesQuery.eq("texte.type", filters.typeFilter as any);
    }

    if (filters?.statutFilter && filters.statutFilter !== "all") {
      articlesQuery = articlesQuery.eq("texte.statut_vigueur", filters.statutFilter as any);
    }

    if (filters?.anneeFilter && filters.anneeFilter !== "all") {
      articlesQuery = articlesQuery.eq("texte.annee", parseInt(filters.anneeFilter));
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
      .from("textes_reglementaires")
      .select(`
        *,
        code:codes(titre),
        articles:textes_articles(count),
        domaines:textes_reglementaires_domaines(
          domaine:domaines_application(id, libelle)
        ),
        sous_domaines:textes_reglementaires_sous_domaines(
          sous_domaine:sous_domaines_application(id, libelle)
        )
      `, { count: "exact" })
      .is("deleted_at", null);

    if (filters?.searchTerm) {
      query = query.or(
        `titre.ilike.%${filters.searchTerm}%,reference_officielle.ilike.%${filters.searchTerm}%,autorite.ilike.%${filters.searchTerm}%,resume.ilike.%${filters.searchTerm}%`
      );
    }

    if (filters?.typeFilter && filters.typeFilter !== "all") {
      query = query.eq("type", filters.typeFilter as any);
    }

    if (filters?.statutFilter && filters.statutFilter !== "all") {
      query = query.eq("statut_vigueur", filters.statutFilter as any);
    }

    if (filters?.anneeFilter && filters.anneeFilter !== "all") {
      query = query.eq("annee", parseInt(filters.anneeFilter));
    }

    if (filters?.domaineFilter && filters.domaineFilter !== "all") {
      query = query.contains("domaines", [{ domaine: { id: filters.domaineFilter } }]);
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
        code:codes(*),
        articles:textes_articles(*),
        domaines:textes_reglementaires_domaines(
          domaine:domaines_application(*)
        ),
        sous_domaines:textes_reglementaires_sous_domaines(
          sous_domaine:sous_domaines_application(*)
        )
      `)
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(texte: Partial<TexteReglementaire>, domaineIds?: string[], sousDomaineIds?: string[]) {
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
      await supabase.from("textes_reglementaires_domaines").insert(relations);
    }

    // Link sous-domaines
    if (sousDomaineIds && sousDomaineIds.length > 0) {
      const relations = sousDomaineIds.map(sousDomaineId => ({
        texte_id: data.id,
        sous_domaine_id: sousDomaineId,
      }));
      await supabase.from("textes_reglementaires_sous_domaines").insert(relations);
    }

    return data;
  },

  async update(id: string, texte: Partial<TexteReglementaire>, domaineIds?: string[], sousDomaineIds?: string[]) {
    const { data, error } = await supabase
      .from("textes_reglementaires")
      .update(texte as any)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    // Update domaines
    if (domaineIds !== undefined) {
      await supabase.from("textes_reglementaires_domaines").delete().eq("texte_id", id);
      if (domaineIds.length > 0) {
        const relations = domaineIds.map(domaineId => ({
          texte_id: id,
          domaine_id: domaineId,
        }));
        await supabase.from("textes_reglementaires_domaines").insert(relations);
      }
    }

    // Update sous-domaines
    if (sousDomaineIds !== undefined) {
      await supabase.from("textes_reglementaires_sous_domaines").delete().eq("texte_id", id);
      if (sousDomaineIds.length > 0) {
        const relations = sousDomaineIds.map(sousDomaineId => ({
          texte_id: id,
          sous_domaine_id: sousDomaineId,
        }));
        await supabase.from("textes_reglementaires_sous_domaines").insert(relations);
      }
    }

    return data;
  },

  async softDelete(id: string) {
    const { error } = await supabase
      .from("textes_reglementaires")
      .update({ deleted_at: new Date().toISOString() })
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
      .select("*")
      .eq("texte_id", texteId)
      .order("ordre");
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from("textes_articles")
      .select("*, textes_reglementaires(reference_officielle, titre)")
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
};

export const textesArticlesVersionsQueries = {
  async getByArticleId(articleId: string) {
    const { data, error } = await supabase
      .from("textes_articles_versions")
      .select("*")
      .eq("article_id", articleId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async create(version: {
    article_id: string;
    version_label: string;
    contenu: string;
    date_effet?: string;
    statut_vigueur: string;
    remplace_version_id?: string;
  }) {
    const { data, error } = await supabase
      .from("textes_articles_versions")
      .insert([version as any])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, version: Partial<{
    version_label: string;
    contenu: string;
    date_effet: string;
    statut_vigueur: string;
  }>) {
    const { data, error } = await supabase
      .from("textes_articles_versions")
      .update(version as any)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async softDelete(id: string) {
    const { error } = await supabase
      .from("textes_articles_versions")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },
};
