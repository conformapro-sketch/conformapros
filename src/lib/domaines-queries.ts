import { supabaseAny as supabase } from "@/lib/supabase-any";

// Using any types temporarily until types.ts regenerates
type DomaineRow = any;
type DomaineInsert = any;
type DomaineUpdate = any;
type SousDomaineRow = any;
type SousDomaineInsert = any;
type SousDomaineUpdate = any;

// ==================== DOMAINES ====================

export const fetchDomaines = async () => {
  const { data, error } = await supabase
    .from("domaines_reglementaires" as any)
    .select("*")
    .is("deleted_at", null)
    .order("libelle");
  
  if (error) throw error;
  return data;
};

export const fetchDomaineById = async (domaineId: string) => {
  const { data, error } = await supabase
    .from("domaines_reglementaires" as any)
    .select("*")
    .eq("id", domaineId)
    .is("deleted_at", null)
    .single();
  
  if (error) throw error;
  return data;
};

export const createDomaine = async (domaine: DomaineInsert) => {
  const { data, error } = await supabase
    .from("domaines_reglementaires" as any)
    .insert(domaine)
    .select()
    .single();
  
  if (error) {
    if (error.code === '23505') {
      throw new Error('Ce code de domaine existe déjà. Veuillez choisir un code unique.');
    }
    throw error;
  }
  return data;
};

export const updateDomaine = async (domaineId: string, updates: DomaineUpdate) => {
  const { data, error } = await supabase
    .from("domaines_reglementaires" as any)
    .update(updates)
    .eq("id", domaineId)
    .select()
    .single();
  
  if (error) {
    if (error.code === '23505') {
      throw new Error('Ce code de domaine existe déjà. Veuillez choisir un code unique.');
    }
    throw error;
  }
  return data;
};

export const softDeleteDomaine = async (domaineId: string) => {
  const { data, error } = await supabase
    .from("domaines_reglementaires" as any)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", domaineId)
    .select()
    .single();
  
  if (error) {
    if (error.message?.includes('has articles linked')) {
      throw new Error('Impossible de supprimer ce domaine : il contient des articles liés. Veuillez d\'abord supprimer les associations avec les articles.');
    }
    throw error;
  }
  return data;
};

export const toggleDomaineActif = async (domaineId: string, actif: boolean) => {
  const { data, error } = await supabase
    .from("domaines_reglementaires" as any)
    .update({ actif })
    .eq("id", domaineId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// ==================== SOUS-DOMAINES ====================

export const fetchSousDomaines = async () => {
  const { data, error } = await supabase
    .from("sous_domaines_application" as any)
    .select("*, domaines_reglementaires(libelle)")
    .is("deleted_at", null)
    .order("ordre");
  
  if (error) throw error;
  return data;
};

export const fetchSousDomainesByDomaine = async (domaineId: string) => {
  const { data, error } = await supabase
    .from("sous_domaines_application" as any)
    .select("*")
    .eq("domaine_id", domaineId)
    .is("deleted_at", null)
    .order("ordre");
  
  if (error) throw error;
  return data;
};

export const fetchSousDomaineById = async (sousDomaineId: string) => {
  const { data, error } = await supabase
    .from("sous_domaines_application" as any)
    .select("*, domaines_reglementaires(libelle)")
    .eq("id", sousDomaineId)
    .is("deleted_at", null)
    .single();
  
  if (error) throw error;
  return data;
};

export const createSousDomaine = async (sousDomaine: SousDomaineInsert) => {
  const { data, error } = await supabase
    .from("sous_domaines_application" as any)
    .insert(sousDomaine)
    .select()
    .single();
  
  if (error) {
    if (error.code === '23505') {
      throw new Error('Ce code de sous-domaine existe déjà dans ce domaine. Veuillez choisir un code unique.');
    }
    throw error;
  }
  return data;
};

export const updateSousDomaine = async (sousDomaineId: string, updates: SousDomaineUpdate) => {
  const { data, error } = await supabase
    .from("sous_domaines_application" as any)
    .update(updates)
    .eq("id", sousDomaineId)
    .select()
    .single();
  
  if (error) {
    if (error.code === '23505') {
      throw new Error('Ce code de sous-domaine existe déjà dans ce domaine. Veuillez choisir un code unique.');
    }
    throw error;
  }
  return data;
};

export const softDeleteSousDomaine = async (sousDomaineId: string) => {
  const { data, error } = await supabase
    .from("sous_domaines_application" as any)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", sousDomaineId)
    .select()
    .single();
  
  if (error) {
    if (error.message?.includes('has articles linked')) {
      throw new Error('Impossible de supprimer ce sous-domaine : il contient des articles liés. Veuillez d\'abord supprimer les associations avec les articles.');
    }
    throw error;
  }
  return data;
};

export const toggleSousDomaineActif = async (sousDomaineId: string, actif: boolean) => {
  const { data, error } = await supabase
    .from("sous_domaines_application" as any)
    .update({ actif })
    .eq("id", sousDomaineId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Seed common domains (SST, ENV, SOCIAL with sub-domains)
export const seedCommonDomains = async () => {
  const { data, error } = await supabase.rpc('seed_common_domains');
  if (error) throw error;
  return data;
};
