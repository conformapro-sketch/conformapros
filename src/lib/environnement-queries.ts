import { supabaseAny as supabase } from "./supabase-any";
import type {
  FluxDechet,
  ZoneStockage,
  StockDechet,
  Enlevement,
  PointMesure,
  ParametreLimite,
  Mesure,
  Prestataire,
  PrestataireDocument,
} from "@/types/environnement";

// ============================================
// Flux de déchets
// ============================================

export const fetchFluxDechets = async (siteId?: string): Promise<FluxDechet[]> => {
  let query = supabase
    .from("env_flux_dechets")
    .select(`
      *,
      sites!inner(nom_site)
    `)
    .eq("actif", true)
    .order("libelle");

  if (siteId) {
    query = query.eq("site_id", siteId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const createFluxDechet = async (flux: Partial<FluxDechet>) => {
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("env_flux_dechets")
    .insert({ ...flux, created_by: userData.user?.id })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateFluxDechet = async (id: string, flux: Partial<FluxDechet>) => {
  const { data, error } = await supabase
    .from("env_flux_dechets")
    .update(flux)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ============================================
// Zones de stockage
// ============================================

export const fetchZonesStockage = async (siteId?: string): Promise<ZoneStockage[]> => {
  let query = supabase
    .from("env_zones_stockage")
    .select("*")
    .eq("actif", true)
    .order("nom");

  if (siteId) {
    query = query.eq("site_id", siteId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const createZoneStockage = async (zone: Partial<ZoneStockage>) => {
  const { data, error } = await supabase
    .from("env_zones_stockage")
    .insert(zone)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ============================================
// Stock de déchets
// ============================================

export const fetchStockDechets = async (siteId?: string): Promise<StockDechet[]> => {
  let query = supabase
    .from("env_stock_dechets")
    .select(`
      *,
      env_flux_dechets!inner(*, sites!inner(nom_site)),
      env_zones_stockage(*)
    `)
    .order("quantite_actuelle", { ascending: false });

  if (siteId) {
    query = query.eq("env_flux_dechets.site_id", siteId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const updateStockDechet = async (id: string, stock: Partial<StockDechet>) => {
  const { data, error } = await supabase
    .from("env_stock_dechets")
    .update(stock)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ============================================
// Enlèvements
// ============================================

export const fetchEnlevements = async (siteId?: string, startDate?: string, endDate?: string): Promise<Enlevement[]> => {
  let query = supabase
    .from("env_enlevements")
    .select(`
      *,
      env_flux_dechets(*, sites(nom_site)),
      env_prestataires(raison_sociale)
    `)
    .order("date_enlevement", { ascending: false });

  if (siteId) {
    query = query.eq("site_id", siteId);
  }
  
  if (startDate) {
    query = query.gte("date_enlevement", startDate);
  }
  
  if (endDate) {
    query = query.lte("date_enlevement", endDate);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const createEnlevement = async (enlevement: Partial<Enlevement>) => {
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("env_enlevements")
    .insert({ ...enlevement, created_by: userData.user?.id })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateEnlevement = async (id: string, enlevement: Partial<Enlevement>) => {
  const { data, error } = await supabase
    .from("env_enlevements")
    .update(enlevement)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ============================================
// Points de mesure
// ============================================

export const fetchPointsMesure = async (siteId?: string): Promise<PointMesure[]> => {
  let query = supabase
    .from("env_points_mesure")
    .select(`
      *,
      sites!inner(nom_site)
    `)
    .eq("actif", true)
    .order("code");

  if (siteId) {
    query = query.eq("site_id", siteId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const createPointMesure = async (point: Partial<PointMesure>) => {
  const { data, error } = await supabase
    .from("env_points_mesure")
    .insert(point)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ============================================
// Paramètres et limites
// ============================================

export const fetchParametresLimites = async (pointId: string): Promise<ParametreLimite[]> => {
  const { data, error } = await supabase
    .from("env_parametres_limites")
    .select("*")
    .eq("point_id", pointId)
    .eq("actif", true)
    .order("parametre");

  if (error) throw error;
  return data || [];
};

export const createParametreLimite = async (parametre: Partial<ParametreLimite>) => {
  const { data, error } = await supabase
    .from("env_parametres_limites")
    .insert(parametre)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ============================================
// Mesures environnementales
// ============================================

export const fetchMesures = async (pointId?: string, startDate?: string, endDate?: string): Promise<Mesure[]> => {
  let query = supabase
    .from("env_mesures")
    .select(`
      *,
      env_points_mesure(*, sites(nom_site)),
      env_parametres_limites(*)
    `)
    .order("date_mesure", { ascending: false });

  if (pointId) {
    query = query.eq("point_id", pointId);
  }
  
  if (startDate) {
    query = query.gte("date_mesure", startDate);
  }
  
  if (endDate) {
    query = query.lte("date_mesure", endDate);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const createMesure = async (mesure: Partial<Mesure>) => {
  const { data: userData } = await supabase.auth.getUser();
  
  // Calculer automatiquement la conformité
  if (mesure.parametre_id && mesure.valeur !== undefined) {
    const { data: parametre } = await supabase
      .from("env_parametres_limites")
      .select("limite_min, limite_max")
      .eq("id", mesure.parametre_id)
      .single();
    
    if (parametre) {
      const conforme = 
        (parametre.limite_min === null || mesure.valeur >= parametre.limite_min) &&
        (parametre.limite_max === null || mesure.valeur <= parametre.limite_max);
      mesure.conforme = conforme;
    }
  }
  
  const { data, error } = await supabase
    .from("env_mesures")
    .insert({ ...mesure, created_by: userData.user?.id })
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ============================================
// Prestataires
// ============================================

export const fetchPrestataires = async (type?: string): Promise<Prestataire[]> => {
  let query = supabase
    .from("env_prestataires")
    .select("*")
    .eq("actif", true)
    .order("raison_sociale");

  if (type) {
    query = query.eq("type_prestataire", type);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const createPrestataire = async (prestataire: Partial<Prestataire>) => {
  const { data, error } = await supabase
    .from("env_prestataires")
    .insert(prestataire)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ============================================
// Stats & Dashboard
// ============================================

export const fetchEnvironnementStats = async (siteId?: string) => {
  // Total déchets mois en cours
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const startDateStr = startOfMonth.toISOString().split('T')[0];
  
  const { data: enlevementsMonth } = await supabase
    .from("env_enlevements")
    .select("quantite, destination, env_flux_dechets(dangereux)")
    .gte("date_enlevement", startDateStr)
    .eq(siteId ? "site_id" : "id", siteId || "any");
  
  const totalDechets = enlevementsMonth?.reduce((sum, e) => sum + (e.quantite || 0), 0) || 0;
  const dechetsDangereux = enlevementsMonth?.filter(e => e.env_flux_dechets?.dangereux).reduce((sum, e) => sum + (e.quantite || 0), 0) || 0;
  const dechetsValorises = enlevementsMonth?.filter(e => e.destination === "valorisation" || e.destination === "recyclage").reduce((sum, e) => sum + (e.quantite || 0), 0) || 0;
  
  // Mesures non conformes (mois en cours)
  const { count: mesuresNonConformes } = await supabase
    .from("env_mesures")
    .select("*", { count: "exact", head: true })
    .eq("conforme", false)
    .gte("date_mesure", startDateStr);
  
  // Alertes actives (stocks critiques, bordereaux manquants, documents expirés)
  const { count: stocksCritiques } = await supabase
    .from("env_stock_dechets")
    .select("*, env_flux_dechets!inner(site_id), env_zones_stockage!inner(capacite_max)", { count: "exact", head: true });
  
  const { count: bordereauxManquants } = await supabase
    .from("env_enlevements")
    .select("*", { count: "exact", head: true })
    .eq("bordereau_complet", false)
    .gte("date_enlevement", startDateStr);
  
  return {
    totalDechets: Math.round(totalDechets * 100) / 100,
    dechetsDangereux: Math.round(dechetsDangereux * 100) / 100,
    tauxValorisation: totalDechets > 0 ? Math.round((dechetsValorises / totalDechets) * 100) : 0,
    mesuresNonConformes: mesuresNonConformes || 0,
    alertes: (stocksCritiques || 0) + (bordereauxManquants || 0),
    conformiteEnvironnementale: 85, // À calculer précisément
  };
};
