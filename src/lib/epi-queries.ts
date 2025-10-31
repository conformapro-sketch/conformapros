import { supabaseAny as supabase } from "@/lib/supabase-any";
import type { Database } from "@/types/db";

type EPIType = Database["public"]["Tables"]["epi_types"]["Row"];
type EPIArticle = Database["public"]["Tables"]["epi_articles"]["Row"];
type EPIArticleInsert = Database["public"]["Tables"]["epi_articles"]["Insert"];
type EPIArticleUpdate = Database["public"]["Tables"]["epi_articles"]["Update"];

// EPI Types
export const fetchEPITypes = async () => {
  const { data, error } = await supabase
    .from("epi_types")
    .select("*")
    .eq("actif", true)
    .order("libelle");

  if (error) throw error;
  return data;
};

// EPI Articles (stock)
export const fetchEPIArticles = async (siteId?: string) => {
  let query = supabase
    .from("epi_articles")
    .select(`
      *,
      site:sites(id, nom_site),
      type:epi_types(id, code, libelle, categorie),
      employe:employes(id, nom, prenom, matricule)
    `)
    .order("created_at", { ascending: false });

  if (siteId) {
    query = query.eq("site_id", siteId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const fetchEPIArticleById = async (id: string) => {
  const { data, error } = await supabase
    .from("epi_articles")
    .select(`
      *,
      site:sites(id, nom_site),
      type:epi_types(*),
      employe:employes(id, nom, prenom, matricule)
    `)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
};

export const createEPIArticle = async (article: EPIArticleInsert) => {
  const { data, error } = await supabase
    .from("epi_articles")
    .insert(article)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateEPIArticle = async (id: string, updates: EPIArticleUpdate) => {
  const { data, error } = await supabase
    .from("epi_articles")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteEPIArticle = async (id: string) => {
  const { error } = await supabase
    .from("epi_articles")
    .delete()
    .eq("id", id);

  if (error) throw error;
};

// Assignment/status changes
export const assignEPIToEmployee = async (
  articleId: string,
  employeId: string,
  dateAttribution: string
) => {
  return updateEPIArticle(articleId, {
    employe_id: employeId,
    date_attribution: dateAttribution,
    statut: "attribue",
  });
};

export const unassignEPI = async (articleId: string) => {
  return updateEPIArticle(articleId, {
    employe_id: null,
    date_attribution: null,
    statut: "en_stock",
  });
};

export const retireEPI = async (articleId: string, dateMiseAuRebut: string) => {
  return updateEPIArticle(articleId, {
    statut: "mis_au_rebut",
    date_mise_au_rebut: dateMiseAuRebut,
  });
};

// Stats
export const fetchEPIStats = async (siteId?: string) => {
  let query = supabase.from("epi_articles").select("statut");
  
  if (siteId) {
    query = query.eq("site_id", siteId);
  }

  const { data: articles } = await query;
  if (!articles) return null;

  const enStock = articles.filter(a => a.statut === "en_stock").length;
  const attribue = articles.filter(a => a.statut === "attribue").length;
  const misAuRebut = articles.filter(a => a.statut === "mis_au_rebut").length;

  return {
    total: articles.length,
    enStock,
    attribue,
    misAuRebut,
  };
};
