/**
 * UNIFIED QUERIES - Bibliothèque Réglementaire
 * 
 * SOURCE UNIQUE DE VÉRITÉ pour toutes les requêtes réglementaires.
 * 
 * Architecture correcte:
 *   textes_reglementaires (métadonnées)
 *     └─> articles (subdivisions)
 *          └─> article_versions (contenu historisé)
 *     └─> textes_domaines → domaines_reglementaires
 * 
 * Tables LEGACY à NE PAS UTILISER:
 *   - textes_articles (remplacée par articles)
 *   - articles_sous_domaines (remplacée par article_sous_domaines)
 *   - actes_reglementaires (ancien nom)
 * 
 * Colonnes LEGACY mappées:
 *   reference_officielle → reference
 *   intitule → titre
 *   type_acte → type
 *   date_publication_jort → date_publication
 *   fichier_pdf_url → pdf_url
 *   numero_article → numero
 *   titre_court → titre
 *   is_exigence → porte_exigence
 *   acte_id → texte_id
 */

import { supabaseAny as supabase } from "@/lib/supabase-any";
import type { 
  TexteReglementaire, 
  Article, 
  ArticleVersion, 
  DomaineReglementaire,
  SousDomaineApplication,
  ArticleEffetJuridique,
  ChangelogEntry
} from "@/types/textes";

// ============= TEXTES RÉGLEMENTAIRES =============

export const textesQueries = {
  async getAll(filters?: {
    searchTerm?: string;
    typeFilter?: string;
    domaineFilter?: string;
    sousDomaineFilter?: string;
    anneeFilter?: string;
    dateFrom?: string;
    dateTo?: string;
    hasPdf?: boolean | null;
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
        articles:articles(count),
        domaines:textes_domaines(
          domaine:domaines_reglementaires(id, code, libelle, couleur)
        )
      `, { count: "exact" })
      .is("deleted_at", null);

    // Search - using correct column names
    if (filters?.searchTerm) {
      query = query.or(
        `titre.ilike.%${filters.searchTerm}%,reference.ilike.%${filters.searchTerm}%,autorite_emettrice.ilike.%${filters.searchTerm}%`
      );
    }

    if (filters?.typeFilter && filters.typeFilter !== "all") {
      query = query.eq("type", filters.typeFilter);
    }

    if (filters?.anneeFilter && filters.anneeFilter !== "all") {
      query = query.eq("annee", parseInt(filters.anneeFilter));
    }

    if (filters?.dateFrom) {
      query = query.gte("date_publication", filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte("date_publication", filters.dateTo);
    }

    if (filters?.hasPdf === true) {
      query = query.not("pdf_url", "is", null);
    } else if (filters?.hasPdf === false) {
      query = query.is("pdf_url", null);
    }

    // Filter by domaine
    if (filters?.domaineFilter && filters.domaineFilter !== "all") {
      const { data: textesWithDomain } = await supabase
        .from("textes_domaines")
        .select("texte_id")
        .eq("domaine_id", filters.domaineFilter);
      
      const texteIds = textesWithDomain?.map(t => t.texte_id) || [];
      if (texteIds.length > 0) {
        query = query.in("id", texteIds);
      } else {
        return { data: [], count: 0, page, pageSize, totalPages: 0 };
      }
    }

    // Filter by sous-domaine (via articles)
    if (filters?.sousDomaineFilter && filters.sousDomaineFilter !== "all") {
      const { data: articlesWithSousDomaine } = await supabase
        .from("article_sous_domaines")
        .select("articles!inner(texte_id)")
        .eq("sous_domaine_id", filters.sousDomaineFilter);
      
      const texteIds = [...new Set(articlesWithSousDomaine?.map((a: any) => a.articles?.texte_id).filter(Boolean) || [])];
      if (texteIds.length > 0) {
        query = query.in("id", texteIds);
      } else {
        return { data: [], count: 0, page, pageSize, totalPages: 0 };
      }
    }

    const sortBy = filters?.sortBy || "date_publication";
    const sortOrder = filters?.sortOrder || "desc";
    query = query.order(sortBy, { ascending: sortOrder === "asc", nullsFirst: false });
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
        articles:articles(*),
        domaines:textes_domaines(
          domaine:domaines_reglementaires(*)
        )
      `)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data as TexteReglementaire | null;
  },

  async create(texte: Partial<TexteReglementaire>, domaineIds?: string[]) {
    // Check for duplicate reference
    const reference = texte.reference || (texte as any).reference_officielle;
    if (reference) {
      const { data: existing } = await supabase
        .from("textes_reglementaires")
        .select("id")
        .eq("reference", reference)
        .maybeSingle();
      
      if (existing) {
        throw new Error("Un texte avec cette référence existe déjà");
      }
    }

    // Clean data - map legacy fields
    const cleanData = {
      type: texte.type || (texte as any).type_acte,
      reference: texte.reference || (texte as any).reference_officielle,
      titre: texte.titre || (texte as any).intitule,
      date_publication: texte.date_publication || (texte as any).date_publication_jort,
      autorite_emettrice: texte.autorite_emettrice,
      autorite_emettrice_id: texte.autorite_emettrice_id,
      source_url: texte.source_url,
      pdf_url: texte.pdf_url || (texte as any).fichier_pdf_url,
      annee: texte.annee,
    };

    const { data, error } = await supabase
      .from("textes_reglementaires")
      .insert([cleanData])
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

    return data as TexteReglementaire;
  },

  async update(id: string, texte: Partial<TexteReglementaire>, domaineIds?: string[]) {
    // Check for duplicate reference (excluding current)
    const reference = texte.reference || (texte as any).reference_officielle;
    if (reference) {
      const { data: existing } = await supabase
        .from("textes_reglementaires")
        .select("id")
        .eq("reference", reference)
        .neq("id", id)
        .maybeSingle();
      
      if (existing) {
        throw new Error("Un texte avec cette référence existe déjà");
      }
    }

    // Clean data - map legacy fields
    const cleanData: any = {};
    if (texte.type || (texte as any).type_acte) cleanData.type = texte.type || (texte as any).type_acte;
    if (texte.reference || (texte as any).reference_officielle) cleanData.reference = texte.reference || (texte as any).reference_officielle;
    if (texte.titre || (texte as any).intitule) cleanData.titre = texte.titre || (texte as any).intitule;
    if (texte.date_publication || (texte as any).date_publication_jort) cleanData.date_publication = texte.date_publication || (texte as any).date_publication_jort;
    if (texte.autorite_emettrice !== undefined) cleanData.autorite_emettrice = texte.autorite_emettrice;
    if (texte.autorite_emettrice_id !== undefined) cleanData.autorite_emettrice_id = texte.autorite_emettrice_id;
    if (texte.source_url !== undefined) cleanData.source_url = texte.source_url;
    if (texte.pdf_url !== undefined || (texte as any).fichier_pdf_url !== undefined) {
      cleanData.pdf_url = texte.pdf_url || (texte as any).fichier_pdf_url;
    }
    if (texte.annee !== undefined) cleanData.annee = texte.annee;

    const { data, error } = await supabase
      .from("textes_reglementaires")
      .update(cleanData)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    // Update domaines if provided
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

    return data as TexteReglementaire;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from("textes_reglementaires")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  async softDelete(id: string) {
    const { error } = await supabase
      .from("textes_reglementaires")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },

  async uploadPDF(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('textes-reglementaires-pdf')
      .upload(fileName, file);

    if (uploadError) {
      throw new Error(`Erreur lors de l'upload: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('textes-reglementaires-pdf')
      .getPublicUrl(fileName);

    return publicUrl;
  },

  async deletePDF(pdfUrl: string) {
    const urlParts = pdfUrl.split('/textes-reglementaires-pdf/');
    if (urlParts.length < 2) return;
    
    const filePath = urlParts[1];
    await supabase.storage.from('textes-reglementaires-pdf').remove([filePath]);
  }
};

// ============= ARTICLES =============

export const articlesQueries = {
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
    return data as Article[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from("articles")
      .select(`
        *, 
        texte:textes_reglementaires(id, reference, titre, type),
        sous_domaines:article_sous_domaines(
          sous_domaine:sous_domaines_application(*)
        )
      `)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data as Article | null;
  },

  async create(article: Partial<Article>) {
    // Map legacy fields
    const cleanData = {
      texte_id: article.texte_id || (article as any).acte_id,
      numero: article.numero || (article as any).numero_article,
      titre: article.titre || (article as any).titre_court,
      resume: article.resume,
      porte_exigence: article.porte_exigence ?? (article as any).is_exigence ?? true,
      est_introductif: article.est_introductif ?? false,
    };

    const { data, error } = await supabase
      .from("articles")
      .insert([cleanData])
      .select()
      .single();
    if (error) throw error;
    return data as Article;
  },

  async update(id: string, article: Partial<Article>) {
    // Map legacy fields
    const cleanData: any = {};
    if (article.numero || (article as any).numero_article) {
      cleanData.numero = article.numero || (article as any).numero_article;
    }
    if (article.titre || (article as any).titre_court) {
      cleanData.titre = article.titre || (article as any).titre_court;
    }
    if (article.resume !== undefined) cleanData.resume = article.resume;
    if (article.porte_exigence !== undefined || (article as any).is_exigence !== undefined) {
      cleanData.porte_exigence = article.porte_exigence ?? (article as any).is_exigence;
    }
    if (article.est_introductif !== undefined) cleanData.est_introductif = article.est_introductif;

    const { data, error } = await supabase
      .from("articles")
      .update(cleanData)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Article;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from("articles")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  async updateSousDomaines(articleId: string, sousDomaineIds: string[]) {
    // Use correct table: article_sous_domaines (NOT articles_sous_domaines)
    await supabase.from("article_sous_domaines").delete().eq("article_id", articleId);
    
    if (sousDomaineIds.length > 0) {
      const relations = sousDomaineIds.map(sdId => ({
        article_id: articleId,
        sous_domaine_id: sdId,
      }));
      const { error } = await supabase.from("article_sous_domaines").insert(relations);
      if (error) throw error;
    }
  },

  async getSousDomainesByArticleId(articleId: string) {
    const { data, error } = await supabase
      .from("article_sous_domaines")
      .select("sous_domaine_id, sous_domaines_application(id, code, libelle)")
      .eq("article_id", articleId);
    if (error) throw error;
    return data;
  }
};

// ============= ARTICLE VERSIONS =============

export const versionsQueries = {
  async getByArticleId(articleId: string) {
    const { data, error } = await supabase
      .from("article_versions")
      .select(`
        *,
        source_texte:textes_reglementaires!article_versions_source_texte_id_fkey(
          id, reference, titre, type, date_publication
        )
      `)
      .eq("article_id", articleId)
      .order("numero_version", { ascending: false });
    if (error) throw error;
    return data as ArticleVersion[];
  },

  async getActiveByArticleId(articleId: string) {
    const { data, error } = await supabase
      .from("article_versions")
      .select(`
        *,
        source_texte:textes_reglementaires!article_versions_source_texte_id_fkey(
          id, reference, titre, type
        )
      `)
      .eq("article_id", articleId)
      .eq("statut", "en_vigueur")
      .order("date_effet", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data as ArticleVersion | null;
  },

  async getActiveVersionsMap(articleIds: string[]): Promise<Record<string, ArticleVersion>> {
    if (articleIds.length === 0) return {};
    
    const map: Record<string, ArticleVersion> = {};
    
    const promises = articleIds.map(async (articleId) => {
      const version = await this.getActiveByArticleId(articleId);
      if (version) {
        map[articleId] = version;
      }
    });
    
    await Promise.all(promises);
    return map;
  },

  async create(version: {
    article_id: string;
    contenu: string;
    date_effet: string;
    numero_version: number;
    source_texte_id: string;
    statut?: 'en_vigueur' | 'remplacee' | 'abrogee';
    notes_modifications?: string;
  }) {
    const { data, error } = await supabase
      .from("article_versions")
      .insert([{
        ...version,
        statut: version.statut || 'en_vigueur',
      }])
      .select()
      .single();
    if (error) throw error;
    return data as ArticleVersion;
  },

  async update(id: string, version: Partial<{
    contenu: string;
    date_effet: string;
    statut: 'en_vigueur' | 'remplacee' | 'abrogee';
    notes_modifications: string;
  }>) {
    const { data, error } = await supabase
      .from("article_versions")
      .update(version)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as ArticleVersion;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from("article_versions")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  async deleteWithRepair(id: string) {
    // Get version info
    const { data: version } = await supabase
      .from("article_versions")
      .select("article_id, statut")
      .eq("id", id)
      .single();

    if (!version) return;

    // Delete the version
    await this.delete(id);

    // If it was active, promote the most recent version
    if (version.statut === 'en_vigueur') {
      const { data: nextVersion } = await supabase
        .from("article_versions")
        .select("id")
        .eq("article_id", version.article_id)
        .order("date_effet", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (nextVersion) {
        await this.update(nextVersion.id, { statut: 'en_vigueur' });
      }
    }
  },

  async updateOldVersionsStatus(articleId: string, excludeVersionId: string, newStatus: 'remplacee' | 'abrogee') {
    const { error } = await supabase
      .from("article_versions")
      .update({ statut: newStatus })
      .eq("article_id", articleId)
      .eq("statut", "en_vigueur")
      .neq("id", excludeVersionId);
    if (error) throw error;
  },

  async getNextVersionNumber(articleId: string): Promise<number> {
    const { data } = await supabase
      .from("article_versions")
      .select("numero_version")
      .eq("article_id", articleId)
      .order("numero_version", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    return (data?.numero_version || 0) + 1;
  }
};

// ============= DOMAINES =============

export const domainesQueries = {
  async getAll() {
    const { data, error } = await supabase
      .from("domaines_reglementaires")
      .select("*")
      .is("deleted_at", null)
      .order("libelle");
    if (error) throw error;
    return data as DomaineReglementaire[];
  },

  async getActive() {
    const { data, error } = await supabase
      .from("domaines_reglementaires")
      .select("*")
      .eq("actif", true)
      .is("deleted_at", null)
      .order("libelle");
    if (error) throw error;
    return data as DomaineReglementaire[];
  },

  async create(domaine: Partial<DomaineReglementaire>) {
    const { data, error } = await supabase
      .from("domaines_reglementaires")
      .insert([domaine])
      .select()
      .single();
    if (error) throw error;
    return data as DomaineReglementaire;
  },

  async update(id: string, domaine: Partial<DomaineReglementaire>) {
    const { data, error } = await supabase
      .from("domaines_reglementaires")
      .update(domaine)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as DomaineReglementaire;
  },

  async softDelete(id: string) {
    const { error } = await supabase
      .from("domaines_reglementaires")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },
};

// ============= SOUS-DOMAINES =============

export const sousDomainesQueries = {
  async getByDomaineId(domaineId: string) {
    const { data, error } = await supabase
      .from("sous_domaines_application")
      .select("*, domaine:domaines_reglementaires(*)")
      .eq("domaine_id", domaineId)
      .is("deleted_at", null)
      .order("ordre");
    if (error) throw error;
    return data as SousDomaineApplication[];
  },

  async getActive(domaineId?: string) {
    let query = supabase
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
    const { data, error } = await supabase
      .from("sous_domaines_application")
      .insert([sousDomaine])
      .select()
      .single();
    if (error) throw error;
    return data as SousDomaineApplication;
  },

  async update(id: string, sousDomaine: Partial<SousDomaineApplication>) {
    const { data, error } = await supabase
      .from("sous_domaines_application")
      .update(sousDomaine)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as SousDomaineApplication;
  },

  async softDelete(id: string) {
    const { error } = await supabase
      .from("sous_domaines_application")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },
};

// ============= EFFETS JURIDIQUES =============

export const effetsJuridiquesQueries = {
  async getByArticleId(articleId: string) {
    const { data, error } = await supabase
      .from("articles_effets_juridiques")
      .select(`
        *,
        article_source:articles!articles_effets_juridiques_article_source_id_fkey(
          id,
          numero,
          titre,
          texte:textes_reglementaires(id, reference, titre)
        )
      `)
      .eq("article_id", articleId)
      .order("date_effet", { ascending: false });
    if (error) throw error;
    return data;
  },

  async create(effet: Partial<ArticleEffetJuridique>) {
    const { data, error } = await supabase
      .from("articles_effets_juridiques")
      .insert([effet])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from("articles_effets_juridiques")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },
};

// ============= CHANGELOG =============

export const changelogQueries = {
  async getByTexteId(texteId: string) {
    const { data, error } = await supabase
      .from("changelog_reglementaire")
      .select("*")
      .eq("acte_id", texteId)
      .order("date_changement", { ascending: false });
    if (error) throw error;
    return data as ChangelogEntry[];
  },

  async create(entry: Partial<ChangelogEntry>) {
    const { data, error } = await supabase
      .from("changelog_reglementaire")
      .insert([entry])
      .select()
      .single();
    if (error) throw error;
    return data as ChangelogEntry;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from("changelog_reglementaire")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },
};

// ============= SMART SEARCH =============

export const searchQueries = {
  async smartSearch(filters?: {
    searchTerm?: string;
    typeFilter?: string;
    domaineFilter?: string;
    sousDomaineFilter?: string;
    anneeFilter?: string;
    page?: number;
    pageSize?: number;
  }) {
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
      textesQuery = textesQuery.eq("type", filters.typeFilter);
    }

    if (filters?.anneeFilter && filters.anneeFilter !== "all") {
      textesQuery = textesQuery.eq("annee", parseInt(filters.anneeFilter));
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
        `numero.ilike.%${searchTerm}%,titre.ilike.%${searchTerm}%,resume.ilike.%${searchTerm}%`
      );
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

  async fullTextSearch(searchTerm: string, limit: number = 50) {
    const { data, error } = await supabase
      .rpc('search_textes_reglementaires', {
        search_term: searchTerm,
        result_limit: limit
      });
    
    if (error) throw error;
    return data;
  }
};

// ============= LEGACY ALIASES =============
// For backward compatibility during migration

/** @deprecated Use textesQueries instead */
export const actesQueries = textesQueries;

/** @deprecated Use textesQueries instead */
export const textesReglementairesQueries = textesQueries;

/** @deprecated Use articlesQueries instead */
export const textesArticlesQueries = {
  getByTexteId: articlesQueries.getByTexteId,
  getById: articlesQueries.getById,
  create: articlesQueries.create,
  update: articlesQueries.update,
  delete: articlesQueries.delete,
  updateArticleSousDomaines: articlesQueries.updateSousDomaines,
};

/** @deprecated Use versionsQueries instead */
export const textesArticlesVersionsQueries = {
  getByArticleId: versionsQueries.getByArticleId,
  create: versionsQueries.create,
  update: versionsQueries.update,
  delete: versionsQueries.delete,
  deleteWithRepair: versionsQueries.deleteWithRepair,
};

/** @deprecated Use versionsQueries instead */
export const articleVersionsQueries = versionsQueries;

/** @deprecated Use effetsJuridiquesQueries instead */
export const articlesEffetsJuridiquesQueries = effetsJuridiquesQueries;
