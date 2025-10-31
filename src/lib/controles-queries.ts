import { supabaseAny as supabase } from "@/lib/supabase-any";
import type { Database } from "@/types/db";

type EquipementControle = Database["public"]["Tables"]["equipements_controle"]["Row"];
type EquipementControleInsert = Database["public"]["Tables"]["equipements_controle"]["Insert"];
type EquipementControleUpdate = Database["public"]["Tables"]["equipements_controle"]["Update"];
type HistoriqueControle = Database["public"]["Tables"]["historique_controles"]["Row"];
type HistoriqueControleInsert = Database["public"]["Tables"]["historique_controles"]["Insert"];
type TypeEquipement = Database["public"]["Tables"]["types_equipement"]["Row"];
type OrganismeControle = Database["public"]["Tables"]["organismes_controle"]["Row"];

// Equipment queries
export const fetchEquipements = async () => {
  const { data, error } = await supabase
    .from("equipements_controle")
    .select(`
      *,
      site:sites(id, nom_site, client_id),
      type_equipement:types_equipement(id, code, libelle, periodicite_mois),
      organisme:organismes_controle(id, nom),
      responsable:profiles(id, nom, prenom, email)
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

export const fetchEquipementById = async (id: string) => {
  const { data, error } = await supabase
    .from("equipements_controle")
    .select(`
      *,
      site:sites(id, nom_site, client_id),
      type_equipement:types_equipement(*),
      organisme:organismes_controle(*),
      responsable:profiles(id, nom, prenom, email)
    `)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
};

export const createEquipement = async (equipement: EquipementControleInsert) => {
  const { data: userData } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from("equipements_controle")
    .insert({
      ...equipement,
      created_by: userData.user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateEquipement = async (id: string, updates: EquipementControleUpdate) => {
  const { data, error } = await supabase
    .from("equipements_controle")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteEquipement = async (id: string) => {
  const { error } = await supabase
    .from("equipements_controle")
    .delete()
    .eq("id", id);

  if (error) throw error;
};

// Control history queries
export const fetchHistoriqueByEquipement = async (equipementId: string) => {
  const { data, error } = await supabase
    .from("historique_controles")
    .select(`
      *,
      organisme:organismes_controle(nom),
      created_by_profile:profiles(nom, prenom)
    `)
    .eq("equipement_id", equipementId)
    .order("date_controle", { ascending: false });

  if (error) throw error;
  return data;
};

export const createHistoriqueControle = async (historique: HistoriqueControleInsert) => {
  const { data: userData } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from("historique_controles")
    .insert({
      ...historique,
      created_by: userData.user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  
  // Update equipment with latest control info
  if (data) {
    await supabase
      .from("equipements_controle")
      .update({
        date_dernier_controle: historique.date_controle,
        resultat_dernier_controle: historique.resultat,
        statut_conformite: historique.resultat === 'conforme' ? 'conforme' : 
                          historique.resultat === 'non_conforme' ? 'non_conforme' : 'a_controler',
      })
      .eq("id", historique.equipement_id);
  }
  
  return data;
};

// Types and organizations queries
export const fetchTypesEquipement = async () => {
  const { data, error } = await supabase
    .from("types_equipement")
    .select("*")
    .eq("actif", true)
    .order("libelle");

  if (error) throw error;
  return data;
};

export const fetchOrganismesControle = async () => {
  const { data, error } = await supabase
    .from("organismes_controle")
    .select("*")
    .eq("actif", true)
    .order("nom");

  if (error) throw error;
  return data;
};

// Dashboard queries
export const fetchEquipementStats = async () => {
  const { data: equipements } = await supabase
    .from("equipements_controle")
    .select("statut_conformite, prochaine_echeance");

  if (!equipements) return null;

  const today = new Date();
  const in30Days = new Date(today);
  in30Days.setDate(today.getDate() + 30);

  const conforme = equipements.filter(e => e.statut_conformite === 'conforme').length;
  const nonConforme = equipements.filter(e => e.statut_conformite === 'non_conforme').length;
  const aControler = equipements.filter(e => e.statut_conformite === 'a_controler').length;
  
  const enRetard = equipements.filter(e => {
    if (!e.prochaine_echeance) return false;
    return new Date(e.prochaine_echeance) < today;
  }).length;

  const procheEcheance = equipements.filter(e => {
    if (!e.prochaine_echeance) return false;
    const echeance = new Date(e.prochaine_echeance);
    return echeance >= today && echeance <= in30Days;
  }).length;

  return {
    total: equipements.length,
    conforme,
    nonConforme,
    aControler,
    enRetard,
    procheEcheance,
  };
};

export const fetchUpcomingControls = async (limit = 10) => {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from("equipements_controle")
    .select(`
      *,
      site:sites(nom_site),
      type_equipement:types_equipement(libelle)
    `)
    .gte("prochaine_echeance", today)
    .order("prochaine_echeance", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data;
};
