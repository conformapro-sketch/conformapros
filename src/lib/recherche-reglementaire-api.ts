import { supabase } from "@/integrations/supabase/client";

export interface SearchFilters {
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

export interface SearchResult {
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

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  page_size: number;
}

/**
 * Call the advanced regulatory search edge function
 */
export async function rechercheReglementaireAvancee(
  filters: SearchFilters
): Promise<SearchResponse> {
  const { data, error } = await supabase.functions.invoke(
    'recherche-reglementaire',
    {
      body: filters,
    }
  );

  if (error) {
    console.error('[rechercheReglementaireAvancee] Error:', error);
    throw new Error(error.message || 'Failed to search regulatory content');
  }

  return data as SearchResponse;
}

/**
 * Helper to search by text type and keywords
 */
export async function searchByTextAndKeywords(
  keywords: string,
  types?: string[]
): Promise<SearchResponse> {
  return rechercheReglementaireAvancee({
    article_keywords: keywords,
    texte_types: types,
    page: 1,
    page_size: 50,
  });
}

/**
 * Helper to search by domain
 */
export async function searchByDomain(
  domaineIds: string[],
  keywords?: string
): Promise<SearchResponse> {
  return rechercheReglementaireAvancee({
    domaine_ids: domaineIds,
    article_keywords: keywords,
    page: 1,
    page_size: 50,
  });
}

/**
 * Helper to search by code juridique
 */
export async function searchByCode(
  codeIds: string[],
  structureIds?: string[]
): Promise<SearchResponse> {
  return rechercheReglementaireAvancee({
    code_ids: codeIds,
    structure_ids: structureIds,
    page: 1,
    page_size: 50,
  });
}

/**
 * Helper to search articles by number
 */
export async function searchByArticleNumber(
  numero: string
): Promise<SearchResponse> {
  return rechercheReglementaireAvancee({
    article_numero: numero,
    page: 1,
    page_size: 50,
  });
}
