// Query helpers for Actes Réglementaires
import { supabaseAny as supabase } from "@/lib/supabase-any";
import type { 
  ActeReglementaire, 
  TypeActeRow, 
  Article, 
  RelationActe,
  StructureCode,
  ChangelogEntry,
  DomaineApplication,
  SousDomaineApplication,
  ArticleVersion
} from "@/types/textes";

// Type-safe wrappers for textes_reglementaires queries
export const actesQueries = {
  async getAll(filters?: {
    searchTerm?: string;
    typeFilter?: string;
    statutFilter?: string;
    domaineFilter?: string;
    sousDomaineFilter?: string;
    anneeFilter?: string;
    autoriteFilter?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 25;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = (supabase as any)
      .from("textes_reglementaires")
      .select("*, articles(count)", { count: "exact" })
      .is("deleted_at", null);

    // Search across multiple fields - using correct column names
    if (filters?.searchTerm) {
      query = query.or(
        `titre.ilike.%${filters.searchTerm}%,reference.ilike.%${filters.searchTerm}%,autorite_emettrice.ilike.%${filters.searchTerm}%`
      );
    }

    if (filters?.typeFilter && filters.typeFilter !== "all") {
      query = query.eq("type", filters.typeFilter);
    }

    // Note: statut_vigueur is deprecated - status is now tracked via article_versions
    if (filters?.statutFilter && filters.statutFilter !== "all") {
      // Skip this filter as the column no longer exists
    }

    if (filters?.anneeFilter && filters.anneeFilter !== "all") {
      query = query.eq("annee", parseInt(filters.anneeFilter));
    }

    if (filters?.autoriteFilter && filters.autoriteFilter !== "all") {
      query = query.eq("autorite_emettrice_id", filters.autoriteFilter);
    }

    // Sorting - using correct column name
    const sortBy = filters?.sortBy || "date_publication";
    const sortOrder = filters?.sortOrder || "desc";
    query = query.order(sortBy, { ascending: sortOrder === "asc", nullsFirst: false });

    // Pagination
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;
    
    return { 
      data: data as ActeReglementaire[], 
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    };
  },

  async getById(id: string) {
    const { data, error } = await (supabase as any)
      .from("textes_reglementaires")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) throw error;
    return data as ActeReglementaire | null;
  },

  async create(acte: Partial<ActeReglementaire>) {
    // Check for duplicate reference
    const { data: existing } = await (supabase as any)
      .from("textes_reglementaires")
      .select("id")
      .eq("reference", acte.reference || (acte as any).reference_officielle)
      .maybeSingle();
    
    if (existing) {
      throw new Error("Un texte avec cette référence existe déjà");
    }

    // Map legacy fields to correct column names
    const cleanData = {
      type: acte.type || (acte as any).type_acte,
      reference: acte.reference || (acte as any).reference_officielle,
      titre: acte.titre || (acte as any).intitule,
      date_publication: acte.date_publication || (acte as any).date_publication_jort,
      autorite_emettrice: acte.autorite_emettrice,
      autorite_emettrice_id: acte.autorite_emettrice_id,
      source_url: acte.source_url,
      pdf_url: acte.pdf_url,
      annee: acte.annee,
    };

    const { data, error } = await (supabase as any)
      .from("textes_reglementaires")
      .insert([cleanData])
      .select()
      .single();
    if (error) throw error;
    return data as ActeReglementaire;
  },

  async update(id: string, acte: Partial<ActeReglementaire>) {
    // Check for duplicate reference (excluding current)
    const refToCheck = acte.reference || (acte as any).reference_officielle;
    if (refToCheck) {
      const { data: existing } = await (supabase as any)
        .from("textes_reglementaires")
        .select("id")
        .eq("reference", refToCheck)
        .neq("id", id)
        .maybeSingle();
      
      if (existing) {
        throw new Error("Un texte avec cette référence existe déjà");
      }
    }
    
    // Map legacy fields to correct column names
    const cleanData: any = {};
    if (acte.type || (acte as any).type_acte) cleanData.type = acte.type || (acte as any).type_acte;
    if (acte.reference || (acte as any).reference_officielle) cleanData.reference = acte.reference || (acte as any).reference_officielle;
    if (acte.titre || (acte as any).intitule) cleanData.titre = acte.titre || (acte as any).intitule;
    if (acte.date_publication || (acte as any).date_publication_jort) cleanData.date_publication = acte.date_publication || (acte as any).date_publication_jort;
    if (acte.autorite_emettrice !== undefined) cleanData.autorite_emettrice = acte.autorite_emettrice;
    if (acte.autorite_emettrice_id !== undefined) cleanData.autorite_emettrice_id = acte.autorite_emettrice_id;
    if (acte.source_url !== undefined) cleanData.source_url = acte.source_url;
    if (acte.pdf_url !== undefined) cleanData.pdf_url = acte.pdf_url;
    if (acte.annee !== undefined) cleanData.annee = acte.annee;

    const { data, error } = await (supabase as any)
      .from("textes_reglementaires")
      .update(cleanData)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as ActeReglementaire;
  },

  async delete(id: string) {
    const { error } = await (supabase as any)
      .from("textes_reglementaires")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },
};

export const typesActeQueries = {
  async getAll() {
    const { data, error } = await (supabase as any)
      .from("types_acte")
      .select("*")
      .order("libelle");
    if (error) throw error;
    return data as TypeActeRow[];
  },
};

export const articlesQueries = {
  async getByActeId(acteId: string) {
    // Note: acte_id is deprecated, using texte_id
    const { data, error } = await (supabase as any)
      .from("articles")
      .select(`
        *,
        sous_domaines:article_sous_domaines(
          sous_domaine:sous_domaines_application(*)
        )
      `)
      .eq("texte_id", acteId)
      .order("numero");
    if (error) throw error;
    return data as Article[];
  },

  async create(article: Partial<Article>) {
    const { data, error } = await (supabase as any)
      .from("articles")
      .insert([article])
      .select()
      .single();
    if (error) throw error;
    return data as Article;
  },

  async createBulk(articles: Partial<Article>[]) {
    const { data, error } = await (supabase as any)
      .from("articles")
      .insert(articles)
      .select();
    if (error) throw error;
    return data as Article[];
  },

  async update(id: string, article: Partial<Article>) {
    const { data, error } = await (supabase as any)
      .from("articles")
      .update(article)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Article;
  },

  async delete(id: string) {
    const { error } = await (supabase as any)
      .from("articles")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },
};

export const structuresQueries = {
  async getByActeId(acteId: string) {
    const { data, error } = await (supabase as any)
      .from("structures_code")
      .select("*")
      .eq("acte_id", acteId)
      .order("numero");
    if (error) throw error;
    return data as StructureCode[];
  },

  async create(structure: Partial<StructureCode>) {
    const { data, error } = await (supabase as any)
      .from("structures_code")
      .insert([structure])
      .select()
      .single();
    if (error) throw error;
    return data as StructureCode;
  },

  async update(id: string, structure: Partial<StructureCode>) {
    const { data, error } = await (supabase as any)
      .from("structures_code")
      .update(structure)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as StructureCode;
  },

  async delete(id: string) {
    const { error } = await (supabase as any)
      .from("structures_code")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },
};

export const relationsQueries = {
  async getBySourceId(sourceId: string) {
    const { data, error } = await (supabase as any)
      .from("relations_actes")
      .select(`
        *,
        cible:textes_reglementaires!relations_actes_cible_id_fkey(numero_officiel, intitule)
      `)
      .eq("source_id", sourceId);
    if (error) throw error;
    return data as RelationActe[];
  },

  async create(relation: Partial<RelationActe>) {
    const { data, error } = await (supabase as any)
      .from("relations_actes")
      .insert([relation])
      .select()
      .single();
    if (error) throw error;
    return data as RelationActe;
  },

  async delete(id: string) {
    const { error } = await (supabase as any)
      .from("relations_actes")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },
};

export const changelogQueries = {
  async getByActeId(acteId: string) {
    const { data, error } = await (supabase as any)
      .from("changelog_reglementaire")
      .select("*")
      .eq("acte_id", acteId)
      .order("date_changement", { ascending: false });
    if (error) throw error;
    return data as ChangelogEntry[];
  },

  async create(entry: Partial<ChangelogEntry>) {
    const { data, error } = await (supabase as any)
      .from("changelog_reglementaire")
      .insert([entry])
      .select()
      .single();
    if (error) throw error;
    return data as ChangelogEntry;
  },

  async delete(id: string) {
    const { error } = await (supabase as any)
      .from("changelog_reglementaire")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },
};

export const domainesQueries = {
  async getAll() {
    const { data, error } = await (supabase as any)
      .from("domaines_reglementaires")
      .select("*")
      .is("deleted_at", null)
      .order("libelle");
    if (error) throw error;
    return data as DomaineApplication[];
  },

  async getActive() {
    const { data, error } = await (supabase as any)
      .from("domaines_reglementaires")
      .select("*")
      .eq("actif", true)
      .is("deleted_at", null)
      .order("libelle");
    if (error) throw error;
    return data as DomaineApplication[];
  },

  async create(domaine: Partial<DomaineApplication>) {
    const { data, error } = await (supabase as any)
      .from("domaines_reglementaires")
      .insert([domaine])
      .select()
      .single();
    if (error) throw error;
    return data as DomaineApplication;
  },

  async update(id: string, domaine: Partial<DomaineApplication>) {
    const { data, error } = await (supabase as any)
      .from("domaines_reglementaires")
      .update(domaine)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as DomaineApplication;
  },

  async softDelete(id: string) {
    const { error } = await (supabase as any)
      .from("domaines_reglementaires")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },
};

export const sousDomainesQueries = {
  async getByDomaineId(domaineId: string) {
    const { data, error } = await (supabase as any)
      .from("sous_domaines_application")
      .select("*, domaine:domaines_reglementaires(*)")
      .eq("domaine_id", domaineId)
      .is("deleted_at", null)
      .order("ordre");
    if (error) throw error;
    return data as SousDomaineApplication[];
  },

  async getActive(domaineId?: string) {
    let query = (supabase as any)
      .from("sous_domaines_application")
      .select("*, domaine:domaines_reglementaires(*)")
      .eq("actif", true)
      .is("deleted_at", null);
    
    if (domaineId) {
      query = query.eq("domaine_id", domaineId);
    }
    
    const { data, error } = await query.order("ordre");
    if (error) throw error;
    return data as SousDomaineApplication[];
  },

  async create(sousDomaine: Partial<SousDomaineApplication>) {
    const { data, error } = await (supabase as any)
      .from("sous_domaines_application")
      .insert([sousDomaine])
      .select()
      .single();
    if (error) throw error;
    return data as SousDomaineApplication;
  },

  async update(id: string, sousDomaine: Partial<SousDomaineApplication>) {
    const { data, error } = await (supabase as any)
      .from("sous_domaines_application")
      .update(sousDomaine)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as SousDomaineApplication;
  },

  async softDelete(id: string) {
    const { error } = await (supabase as any)
      .from("sous_domaines_application")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },
};

export const articleVersionsQueries = {
  async getByArticleId(articleId: string) {
    const { data, error } = await (supabase as any)
      .from("article_versions")
      .select(`
        *,
        source_texte:textes_reglementaires!article_versions_source_texte_id_fkey(
          id, reference, titre, type
        )
      `)
      .eq("article_id", articleId)
      .order("date_effet", { ascending: false });
    if (error) throw error;
    return data as ArticleVersion[];
  },

  async create(version: Partial<ArticleVersion>) {
    const { data, error } = await (supabase as any)
      .from("article_versions")
      .insert([version])
      .select()
      .single();
    if (error) throw error;
    return data as ArticleVersion;
  },

  async update(id: string, version: Partial<ArticleVersion>) {
    const { data, error } = await (supabase as any)
      .from("article_versions")
      .update(version)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as ArticleVersion;
  },

  async softDelete(id: string) {
    // article_versions uses statut column, not deleted_at
    const { error } = await (supabase as any)
      .from("article_versions")
      .update({ statut: "abrogee" })
      .eq("id", id);
    if (error) throw error;
  },
};

// Relations textes-domaines
export const textesDomainesQueries = {
  async getByTexteId(texteId: string) {
    const { data, error } = await (supabase as any)
      .from("textes_domaines")
      .select("*, domaine:domaines_reglementaires(*)")
      .eq("texte_id", texteId);
    if (error) throw error;
    return data;
  },

  async createBulk(texteId: string, domaineIds: string[]) {
    const relations = domaineIds.map(domaineId => ({
      texte_id: texteId,
      domaine_id: domaineId,
    }));
    
    const { error } = await (supabase as any)
      .from("textes_domaines")
      .insert(relations);
    if (error) throw error;
  },

  async deleteByTexteId(texteId: string) {
    const { error } = await (supabase as any)
      .from("textes_domaines")
      .delete()
      .eq("texte_id", texteId);
    if (error) throw error;
  },
};

// Effets juridiques entre articles
export const articlesEffetsJuridiquesQueries = {
  async getByArticleSourceId(articleSourceId: string) {
    const { data, error } = await (supabase as any)
      .from("articles_effets_juridiques")
      .select(`
        *,
        texte_cible:textes_reglementaires!articles_effets_juridiques_texte_cible_id_fkey(
          id,
          reference,
          titre,
          type
        ),
        article_cible:articles!articles_effets_juridiques_article_cible_id_fkey(
          id,
          numero,
          titre
        )
      `)
      .eq("article_source_id", articleSourceId)
      .order("date_effet", { ascending: false });
    if (error) throw error;
    return data;
  },

  async getByArticleCibleId(articleCibleId: string) {
    const { data, error } = await (supabase as any)
      .from("articles_effets_juridiques")
      .select(`
        *,
        texte_source:textes_reglementaires!articles_effets_juridiques_texte_source_id_fkey(
          id,
          reference,
          titre,
          type
        ),
        article_source:articles!articles_effets_juridiques_article_source_id_fkey(
          id,
          numero,
          titre,
          texte:textes_reglementaires(
            reference,
            titre
          )
        )
      `)
      .eq("article_cible_id", articleCibleId)
      .order("date_effet", { ascending: false });
    if (error) throw error;
    return data;
  },

  async getByTexteSourceId(texteSourceId: string) {
    const { data, error } = await (supabase as any)
      .from("articles_effets_juridiques")
      .select(`
        *,
        article_source:articles!articles_effets_juridiques_article_source_id_fkey(
          id,
          numero,
          titre
        ),
        texte_cible:textes_reglementaires!articles_effets_juridiques_texte_cible_id_fkey(
          id,
          reference,
          titre,
          type
        ),
        article_cible:articles!articles_effets_juridiques_article_cible_id_fkey(
          id,
          numero,
          titre
        )
      `)
      .eq("texte_source_id", texteSourceId)
      .order("date_effet", { ascending: false });
    if (error) throw error;
    return data;
  },

  async getByTexteCibleId(texteCibleId: string) {
    const { data, error } = await (supabase as any)
      .from("articles_effets_juridiques")
      .select(`
        *,
        article_source:articles!articles_effets_juridiques_article_source_id_fkey(
          id,
          numero,
          titre,
          texte:textes_reglementaires(
            reference,
            titre
          )
        ),
        article_cible:articles!articles_effets_juridiques_article_cible_id_fkey(
          id,
          numero,
          titre
        )
      `)
      .eq("texte_cible_id", texteCibleId)
      .order("date_effet", { ascending: false });
    if (error) throw error;
    return data;
  },

  async create(effet: Partial<any>) {
    const { data, error } = await (supabase as any)
      .from("articles_effets_juridiques")
      .insert([effet])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, effet: Partial<any>) {
    const { data, error } = await (supabase as any)
      .from("articles_effets_juridiques")
      .update(effet)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await (supabase as any)
      .from("articles_effets_juridiques")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },
};

// Relations textes-sous-domaines
export const textesSousDomainesQueries = {
  async getByTexteId(texteId: string) {
    const { data, error } = await (supabase as any)
      .from("textes_sous_domaines")
      .select("*, sous_domaine:sous_domaines_application(*)")
      .eq("texte_id", texteId);
    if (error) throw error;
    return data;
  },

  async createBulk(texteId: string, sousDomaineIds: string[]) {
    if (sousDomaineIds.length === 0) return;
    
    const relations = sousDomaineIds.map(sousDomaineId => ({
      texte_id: texteId,
      sous_domaine_id: sousDomaineId,
    }));
    
    const { error } = await (supabase as any)
      .from("textes_sous_domaines")
      .insert(relations);
    if (error) throw error;
  },

  async deleteByTexteId(texteId: string) {
    const { error } = await (supabase as any)
      .from("textes_sous_domaines")
      .delete()
      .eq("texte_id", texteId);
    if (error) throw error;
  },
};

// Storage helpers for PDFs
export const pdfStorageQueries = {
  async uploadPdf(file: File, filename: string) {
    const filePath = `${Date.now()}_${filename}`;
    
    const { data, error } = await supabase.storage
      .from("textes_pdf")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });
    
    if (error) throw error;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("textes_pdf")
      .getPublicUrl(filePath);
    
    return publicUrl;
  },

  async deletePdf(url: string) {
    // Extract file path from URL
    const urlParts = url.split("/textes_pdf/");
    if (urlParts.length < 2) return;
    
    const filePath = urlParts[1];
    const { error } = await supabase.storage
      .from("textes_pdf")
      .remove([filePath]);
    
    if (error) console.error("Error deleting PDF:", error);
  },
};
