import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/types/db";

type DomaineRow = Database["public"]["Tables"]["domaines_application"]["Row"];
type DomaineInsert = Database["public"]["Tables"]["domaines_application"]["Insert"];
type DomaineUpdate = Database["public"]["Tables"]["domaines_application"]["Update"];

type SousDomaineRow = Database["public"]["Tables"]["sous_domaines_application"]["Row"];
type SousDomaineInsert = Database["public"]["Tables"]["sous_domaines_application"]["Insert"];
type SousDomaineUpdate = Database["public"]["Tables"]["sous_domaines_application"]["Update"];

// ==================== DOMAINES ====================

export const fetchDomaines = async () => {
  const { data, error } = await supabase
    .from("domaines_application")
    .select("*")
    .is("deleted_at", null)
    .order("libelle");
  
  if (error) throw error;
  return data;
};

export const fetchDomaineById = async (domaineId: string) => {
  const { data, error } = await supabase
    .from("domaines_application")
    .select("*")
    .eq("id", domaineId)
    .is("deleted_at", null)
    .single();
  
  if (error) throw error;
  return data;
};

export const createDomaine = async (domaine: DomaineInsert) => {
  const { data, error } = await supabase
    .from("domaines_application")
    .insert(domaine)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateDomaine = async (domaineId: string, updates: DomaineUpdate) => {
  const { data, error } = await supabase
    .from("domaines_application")
    .update(updates)
    .eq("id", domaineId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const softDeleteDomaine = async (domaineId: string) => {
  const { data, error } = await supabase
    .from("domaines_application")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", domaineId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const toggleDomaineActif = async (domaineId: string, actif: boolean) => {
  const { data, error } = await supabase
    .from("domaines_application")
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
    .from("sous_domaines_application")
    .select("*, domaines_application(libelle)")
    .is("deleted_at", null)
    .order("ordre");
  
  if (error) throw error;
  return data;
};

export const fetchSousDomainesByDomaine = async (domaineId: string) => {
  const { data, error } = await supabase
    .from("sous_domaines_application")
    .select("*")
    .eq("domaine_id", domaineId)
    .is("deleted_at", null)
    .order("ordre");
  
  if (error) throw error;
  return data;
};

export const fetchSousDomaineById = async (sousDomaineId: string) => {
  const { data, error } = await supabase
    .from("sous_domaines_application")
    .select("*, domaines_application(libelle)")
    .eq("id", sousDomaineId)
    .is("deleted_at", null)
    .single();
  
  if (error) throw error;
  return data;
};

export const createSousDomaine = async (sousDomaine: SousDomaineInsert) => {
  const { data, error } = await supabase
    .from("sous_domaines_application")
    .insert(sousDomaine)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateSousDomaine = async (sousDomaineId: string, updates: SousDomaineUpdate) => {
  const { data, error } = await supabase
    .from("sous_domaines_application")
    .update(updates)
    .eq("id", sousDomaineId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const softDeleteSousDomaine = async (sousDomaineId: string) => {
  const { data, error } = await supabase
    .from("sous_domaines_application")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", sousDomaineId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const toggleSousDomaineActif = async (sousDomaineId: string, actif: boolean) => {
  const { data, error } = await supabase
    .from("sous_domaines_application")
    .update({ actif })
    .eq("id", sousDomaineId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};
