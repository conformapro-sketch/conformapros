import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchFilters {
  // Texte filters
  texte_types?: string[]; // loi, decret, arrete, circulaire
  texte_reference?: string;
  texte_titre?: string;
  
  // Domain filters
  domaine_ids?: string[];
  sous_domaine_ids?: string[];
  
  // Article filters
  article_numero?: string;
  article_keywords?: string; // search in resume and contenu
  
  // Code filters (optional)
  code_ids?: string[];
  structure_ids?: string[];
  
  // Pagination
  page?: number;
  page_size?: number;
}

interface SearchResult {
  texte_id: string;
  texte_type: string;
  texte_reference: string;
  texte_titre: string;
  texte_date_publication: string | null;
  article_id: string;
  article_numero: string;
  article_titre: string;
  article_resume: string | null;
  article_est_introductif: boolean;
  article_porte_exigence: boolean;
  version_id: string;
  version_numero: number;
  version_contenu: string;
  version_date_effet: string;
  version_statut: string;
  domaines: Array<{ id: string; libelle: string; code: string }>;
  sous_domaines: Array<{ id: string; libelle: string; code: string }>;
  codes?: Array<{ id: string; nom: string; structure_label?: string }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    console.log(`[recherche-reglementaire] User ${user.id} initiated search`);

    // Parse request body
    const filters: SearchFilters = await req.json();
    console.log('[recherche-reglementaire] Filters:', JSON.stringify(filters));

    const page = filters.page || 1;
    const pageSize = filters.page_size || 50;
    const offset = (page - 1) * pageSize;

    // Step 1: Build article query with active versions
    let articleQuery = supabase
      .from('articles')
      .select(`
        id,
        numero,
        titre,
        resume,
        est_introductif,
        porte_exigence,
        texte_id,
        textes_reglementaires!inner (
          id,
          type,
          reference,
          titre,
          date_publication
        ),
        article_versions!inner (
          id,
          numero_version,
          contenu,
          date_effet,
          statut
        ),
        articles_sous_domaines (
          sous_domaine_id,
          sous_domaines_application (
            id,
            code,
            libelle,
            domaine_id,
            domaines_reglementaires (
              id,
              code,
              libelle
            )
          )
        )
      `);

    // Filter by active versions only
    articleQuery = articleQuery.eq('article_versions.statut', 'en_vigueur');

    // Apply texte filters
    if (filters.texte_types && filters.texte_types.length > 0) {
      articleQuery = articleQuery.in('textes_reglementaires.type', filters.texte_types);
    }

    if (filters.texte_reference) {
      articleQuery = articleQuery.ilike('textes_reglementaires.reference', `%${filters.texte_reference}%`);
    }

    if (filters.texte_titre) {
      articleQuery = articleQuery.ilike('textes_reglementaires.titre', `%${filters.texte_titre}%`);
    }

    // Apply article filters
    if (filters.article_numero) {
      articleQuery = articleQuery.ilike('numero', `%${filters.article_numero}%`);
    }

    // Execute base query
    const { data: articlesData, error: articlesError } = await articleQuery
      .range(offset, offset + pageSize - 1);

    if (articlesError) {
      console.error('[recherche-reglementaire] Articles query error:', articlesError);
      throw articlesError;
    }

    console.log(`[recherche-reglementaire] Found ${articlesData?.length || 0} initial articles`);

    if (!articlesData || articlesData.length === 0) {
      return new Response(
        JSON.stringify({ results: [], total: 0, page, page_size: pageSize }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Apply domain/sous-domain filters
    let filteredArticles = articlesData;

    if (filters.domaine_ids && filters.domaine_ids.length > 0) {
      filteredArticles = filteredArticles.filter((article: any) => {
        const articleDomaines = article.articles_sous_domaines
          ?.map((asd: any) => asd.sous_domaines_application?.domaine_id)
          .filter(Boolean);
        return articleDomaines?.some((id: string) => filters.domaine_ids!.includes(id));
      });
    }

    if (filters.sous_domaine_ids && filters.sous_domaine_ids.length > 0) {
      filteredArticles = filteredArticles.filter((article: any) => {
        const articleSousDomaines = article.articles_sous_domaines
          ?.map((asd: any) => asd.sous_domaine_id)
          .filter(Boolean);
        return articleSousDomaines?.some((id: string) => filters.sous_domaine_ids!.includes(id));
      });
    }

    // Step 3: Apply keyword filter on resume and version content
    if (filters.article_keywords) {
      const keywords = filters.article_keywords.toLowerCase();
      filteredArticles = filteredArticles.filter((article: any) => {
        const resumeMatch = article.resume?.toLowerCase().includes(keywords);
        const contenuMatch = article.article_versions?.[0]?.contenu?.toLowerCase().includes(keywords);
        return resumeMatch || contenuMatch;
      });
    }

    console.log(`[recherche-reglementaire] After filters: ${filteredArticles.length} articles`);

    // Step 4: Fetch code associations if requested
    let codeAssociations: Map<string, any[]> = new Map();
    
    if (filters.code_ids || filters.structure_ids) {
      const articleIds = filteredArticles.map((a: any) => a.id);
      
      let codeLinksQuery = supabase
        .from('codes_liens_articles')
        .select(`
          article_id,
          structure_id,
          codes_structures (
            id,
            label,
            code_id,
            codes_juridiques (
              id,
              nom_officiel,
              titre
            )
          )
        `)
        .in('article_id', articleIds);

      if (filters.code_ids && filters.code_ids.length > 0) {
        codeLinksQuery = codeLinksQuery.in('codes_structures.code_id', filters.code_ids);
      }

      if (filters.structure_ids && filters.structure_ids.length > 0) {
        codeLinksQuery = codeLinksQuery.in('structure_id', filters.structure_ids);
      }

      const { data: codeLinks, error: codeLinksError } = await codeLinksQuery;

      if (!codeLinksError && codeLinks) {
        codeLinks.forEach((link: any) => {
          if (!codeAssociations.has(link.article_id)) {
            codeAssociations.set(link.article_id, []);
          }
          codeAssociations.get(link.article_id)!.push({
            id: link.codes_structures?.codes_juridiques?.id,
            nom: link.codes_structures?.codes_juridiques?.nom_officiel || link.codes_structures?.codes_juridiques?.titre,
            structure_label: link.codes_structures?.label,
          });
        });

        // Apply code filter if specified
        if (filters.code_ids || filters.structure_ids) {
          filteredArticles = filteredArticles.filter((article: any) => 
            codeAssociations.has(article.id)
          );
        }
      }
    }

    // Step 5: Normalize results
    const results: SearchResult[] = filteredArticles.map((article: any) => {
      const texte = article.textes_reglementaires;
      const version = article.article_versions?.[0];
      
      // Extract unique domains and sous-domains
      const domainesMap = new Map<string, any>();
      const sousDomainesMap = new Map<string, any>();
      
      article.articles_sous_domaines?.forEach((asd: any) => {
        if (asd.sous_domaines_application) {
          const sd = asd.sous_domaines_application;
          sousDomainesMap.set(sd.id, {
            id: sd.id,
            libelle: sd.libelle,
            code: sd.code,
          });
          
          if (sd.domaines_reglementaires) {
            const d = sd.domaines_reglementaires;
            domainesMap.set(d.id, {
              id: d.id,
              libelle: d.libelle,
              code: d.code,
            });
          }
        }
      });

      const result: SearchResult = {
        texte_id: texte.id,
        texte_type: texte.type,
        texte_reference: texte.reference,
        texte_titre: texte.titre,
        texte_date_publication: texte.date_publication,
        article_id: article.id,
        article_numero: article.numero,
        article_titre: article.titre,
        article_resume: article.resume,
        article_est_introductif: article.est_introductif,
        article_porte_exigence: article.porte_exigence,
        version_id: version?.id,
        version_numero: version?.numero_version,
        version_contenu: version?.contenu,
        version_date_effet: version?.date_effet,
        version_statut: version?.statut,
        domaines: Array.from(domainesMap.values()),
        sous_domaines: Array.from(sousDomainesMap.values()),
      };

      if (codeAssociations.has(article.id)) {
        result.codes = codeAssociations.get(article.id);
      }

      return result;
    });

    console.log(`[recherche-reglementaire] Returning ${results.length} results`);

    return new Response(
      JSON.stringify({
        results,
        total: results.length,
        page,
        page_size: pageSize,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('[recherche-reglementaire] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const statusCode = errorMessage === 'Unauthorized' ? 401 : 500;
    
    return new Response(
      JSON.stringify({
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: statusCode,
      }
    );
  }
});
