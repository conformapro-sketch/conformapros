import { supabaseAny as supabase } from "./supabase-any";

export interface Formation {
  id: string;
  reference: string;
  intitule: string;
  domaine: string;
  type_formation: string;
  objectif?: string;
  formateur_nom?: string;
  formateur_contact?: string;
  formateur_email?: string;
  organisme_formation?: string;
  site_id: string;
  lieu?: string;
  date_prevue?: string;
  date_realisee?: string;
  duree_heures?: number;
  validite_mois?: number;
  prochaine_echeance?: string;
  statut: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  sites?: {
    id: string;
    nom_site: string;
    code_site: string;
  };
  participants_count?: number;
}

export interface FormationParticipant {
  id: string;
  formation_id: string;
  employe_id: string;
  present: boolean;
  reussite?: boolean;
  note?: number;
  commentaire?: string;
  certificat_url?: string;
  certificat_numero?: string;
  date_certificat?: string;
  created_at: string;
  employes?: {
    id: string;
    nom: string;
    prenom: string;
    poste?: string;
    matricule?: string;
  };
}

export interface FormationDocument {
  id: string;
  formation_id: string;
  type_document: string;
  titre: string;
  description?: string;
  file_url: string;
  file_name?: string;
  file_size?: number;
  uploaded_by?: string;
  created_at: string;
}

// Fetch all formations
export const fetchFormations = async (siteId?: string): Promise<Formation[]> => {
  let query = supabase
    .from("formations")
    .select(`
      *,
      sites!inner(id, nom_site, code_site)
    `)
    .order("created_at", { ascending: false });

  if (siteId) {
    query = query.eq("site_id", siteId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
};

// Fetch formation by ID with participants
export const fetchFormationById = async (id: string) => {
  const { data, error } = await supabase
    .from("formations")
    .select(`
      *,
      sites!inner(id, nom_site, code_site)
    `)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
};

// Create formation
export const createFormation = async (formation: Partial<Formation>) => {
  const { data: userData } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from("formations")
    .insert({
      ...formation,
      created_by: userData.user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update formation
export const updateFormation = async (id: string, formation: Partial<Formation>) => {
  const { data, error } = await supabase
    .from("formations")
    .update(formation)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete formation
export const deleteFormation = async (id: string) => {
  const { error } = await supabase
    .from("formations")
    .delete()
    .eq("id", id);

  if (error) throw error;
};

// Participants

// Fetch participants for a formation
export const fetchFormationParticipants = async (formationId: string): Promise<FormationParticipant[]> => {
  const { data, error } = await supabase
    .from("formation_participants")
    .select(`
      *,
      employes!inner(id, nom, prenom, poste, matricule)
    `)
    .eq("formation_id", formationId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

// Add participant
export const addFormationParticipant = async (participant: Partial<FormationParticipant>) => {
  const { data, error } = await supabase
    .from("formation_participants")
    .insert(participant)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update participant
export const updateFormationParticipant = async (id: string, participant: Partial<FormationParticipant>) => {
  const { data, error } = await supabase
    .from("formation_participants")
    .update(participant)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete participant
export const deleteFormationParticipant = async (id: string) => {
  const { error } = await supabase
    .from("formation_participants")
    .delete()
    .eq("id", id);

  if (error) throw error;
};

// Bulk add participants
export const addFormationParticipants = async (participants: Partial<FormationParticipant>[]) => {
  const { data, error } = await supabase
    .from("formation_participants")
    .insert(participants)
    .select();

  if (error) throw error;
  return data;
};

// Documents

// Fetch documents for a formation
export const fetchFormationDocuments = async (formationId: string): Promise<FormationDocument[]> => {
  const { data, error } = await supabase
    .from("formation_documents")
    .select("*")
    .eq("formation_id", formationId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

// Add document
export const addFormationDocument = async (document: Partial<FormationDocument>) => {
  const { data: userData } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from("formation_documents")
    .insert({
      ...document,
      uploaded_by: userData.user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete document
export const deleteFormationDocument = async (id: string) => {
  const { error } = await supabase
    .from("formation_documents")
    .delete()
    .eq("id", id);

  if (error) throw error;
};

// Stats
export const fetchFormationStats = async (siteId?: string) => {
  let query = supabase
    .from("formations")
    .select("*", { count: "exact", head: true });

  if (siteId) {
    query = query.eq("site_id", siteId);
  }

  const { count: total } = await query;

  const { count: planifiees } = await (siteId 
    ? supabase.from("formations").select("*", { count: "exact", head: true }).eq("site_id", siteId).eq("statut", "planifiee")
    : supabase.from("formations").select("*", { count: "exact", head: true }).eq("statut", "planifiee")
  );

  const { count: realisees } = await (siteId
    ? supabase.from("formations").select("*", { count: "exact", head: true }).eq("site_id", siteId).eq("statut", "realisee")
    : supabase.from("formations").select("*", { count: "exact", head: true }).eq("statut", "realisee")
  );

  const { count: expirees } = await (siteId
    ? supabase.from("formations").select("*", { count: "exact", head: true }).eq("site_id", siteId).eq("statut", "expiree")
    : supabase.from("formations").select("*", { count: "exact", head: true }).eq("statut", "expiree")
  );

  return {
    total: total || 0,
    planifiees: planifiees || 0,
    realisees: realisees || 0,
    expirees: expirees || 0,
  };
};
