import { supabaseAny as supabase } from "@/lib/supabase-any";
import type { Database } from "@/types/db";

type Employee = Database["public"]["Tables"]["employes"]["Row"];
type EmployeeInsert = Database["public"]["Tables"]["employes"]["Insert"];
type EmployeeUpdate = Database["public"]["Tables"]["employes"]["Update"];
type MedicalVisit = Database["public"]["Tables"]["med_visites"]["Row"];
type MedicalVisitInsert = Database["public"]["Tables"]["med_visites"]["Insert"];
type MedicalVisitUpdate = Database["public"]["Tables"]["med_visites"]["Update"];
type MedicalDocument = Database["public"]["Tables"]["med_documents"]["Row"];
type MedicalDocumentInsert = Database["public"]["Tables"]["med_documents"]["Insert"];
type ConfidentialNote = Database["public"]["Tables"]["med_notes_confidentielles"]["Row"];
type ConfidentialNoteInsert = Database["public"]["Tables"]["med_notes_confidentielles"]["Insert"];
type PeriodicityRule = Database["public"]["Tables"]["med_periodicite_rules"]["Row"];

// Employee queries
export const fetchEmployees = async () => {
  const { data, error } = await supabase
    .from("employes")
    .select(`
      *,
      client:clients(id, nom_legal),
      site:sites(id, nom_site)
    `)
    .order("nom", { ascending: true });

  if (error) throw error;
  return data;
};

export const fetchEmployeeById = async (id: string) => {
  const { data, error } = await supabase
    .from("employes")
    .select(`
      *,
      client:clients(id, nom_legal),
      site:sites(id, nom_site)
    `)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
};

export const createEmployee = async (employee: EmployeeInsert) => {
  const { data, error } = await supabase
    .from("employes")
    .insert(employee)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateEmployee = async (id: string, updates: EmployeeUpdate) => {
  const { data, error } = await supabase
    .from("employes")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteEmployee = async (id: string) => {
  const { error } = await supabase
    .from("employes")
    .delete()
    .eq("id", id);

  if (error) throw error;
};

// Medical visit queries
export const fetchMedicalVisits = async () => {
  const { data, error } = await supabase
    .from("med_visites")
    .select(`
      *,
      employe:employes(id, matricule, nom, prenom, poste),
      client:clients(id, nom_legal),
      site:sites(id, nom_site)
    `)
    .order("date_planifiee", { ascending: false });

  if (error) throw error;
  return data;
};

export const fetchMedicalVisitById = async (id: string) => {
  const { data, error } = await supabase
    .from("med_visites")
    .select(`
      *,
      employe:employes(*),
      client:clients(id, nom_legal),
      site:sites(id, nom_site)
    `)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
};

export const fetchVisitsByEmployee = async (employeeId: string) => {
  const { data, error } = await supabase
    .from("med_visites")
    .select("*")
    .eq("employe_id", employeeId)
    .order("date_planifiee", { ascending: false });

  if (error) throw error;
  return data;
};

export const createMedicalVisit = async (visit: MedicalVisitInsert) => {
  const { data: userData } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from("med_visites")
    .insert({
      ...visit,
      created_by: userData.user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateMedicalVisit = async (id: string, updates: MedicalVisitUpdate) => {
  const { data: userData } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from("med_visites")
    .update({
      ...updates,
      updated_by: userData.user?.id,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteMedicalVisit = async (id: string) => {
  const { error } = await supabase
    .from("med_visites")
    .delete()
    .eq("id", id);

  if (error) throw error;
};

// Medical documents queries
export const fetchVisitDocuments = async (visitId: string) => {
  const { data, error } = await supabase
    .from("med_documents")
    .select("*")
    .eq("visite_id", visitId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

export const createMedicalDocument = async (document: MedicalDocumentInsert) => {
  const { data: userData } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from("med_documents")
    .insert({
      ...document,
      uploaded_by: userData.user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteMedicalDocument = async (id: string) => {
  const { error } = await supabase
    .from("med_documents")
    .delete()
    .eq("id", id);

  if (error) throw error;
};

// Confidential notes queries (medical staff only)
export const fetchConfidentialNote = async (visitId: string) => {
  const { data, error } = await supabase
    .from("med_notes_confidentielles")
    .select("*")
    .eq("visite_id", visitId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const upsertConfidentialNote = async (note: ConfidentialNoteInsert) => {
  const { data: userData } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from("med_notes_confidentielles")
    .upsert({
      ...note,
      created_by: userData.user?.id,
      updated_by: userData.user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Periodicity rules queries
export const fetchPeriodicityRules = async () => {
  const { data, error } = await supabase
    .from("med_periodicite_rules")
    .select("*")
    .eq("actif", true)
    .order("libelle");

  if (error) throw error;
  return data;
};

// Dashboard statistics
export const fetchMedicalVisitsStats = async () => {
  const { data: visits } = await supabase
    .from("med_visites")
    .select("statut_visite, date_planifiee, prochaine_echeance, resultat_aptitude");

  if (!visits) return null;

  const today = new Date();
  const in30Days = new Date(today);
  in30Days.setDate(today.getDate() + 30);

  const planifiees = visits.filter(v => v.statut_visite === 'PLANIFIEE').length;
  const realisees = visits.filter(v => v.statut_visite === 'REALISEE').length;
  const enRetard = visits.filter(v => {
    if (v.statut_visite !== 'PLANIFIEE') return false;
    return new Date(v.date_planifiee) < today;
  }).length;
  
  const procheEcheance = visits.filter(v => {
    if (v.statut_visite !== 'PLANIFIEE') return false;
    const datePlanifiee = new Date(v.date_planifiee);
    return datePlanifiee >= today && datePlanifiee <= in30Days;
  }).length;

  const aptes = visits.filter(v => v.resultat_aptitude === 'APTE').length;
  const aptesRestrictions = visits.filter(v => v.resultat_aptitude === 'APTE_RESTRICTIONS').length;
  const inaptes = visits.filter(v => 
    v.resultat_aptitude === 'INAPTE_TEMP' || v.resultat_aptitude === 'INAPTE_DEFINITIVE'
  ).length;

  return {
    total: visits.length,
    planifiees,
    realisees,
    enRetard,
    procheEcheance,
    aptes,
    aptesRestrictions,
    inaptes,
  };
};

export const fetchUpcomingVisits = async (limit = 10) => {
  const today = new Date().toISOString();
  
  const { data, error } = await supabase
    .from("med_visites")
    .select(`
      *,
      employe:employes(matricule, nom, prenom),
      site:sites(nom_site)
    `)
    .eq("statut_visite", "PLANIFIEE")
    .gte("date_planifiee", today)
    .order("date_planifiee", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data;
};

// File upload helper
export const uploadMedicalDocument = async (
  file: File,
  visitId: string,
  path: string
) => {
  const { data, error } = await supabase.storage
    .from("medical_documents")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw error;
  return data;
};

export const getMedicalDocumentUrl = async (path: string) => {
  const { data } = await supabase.storage
    .from("medical_documents")
    .createSignedUrl(path, 3600); // 1 hour expiry

  return data?.signedUrl;
};

export const deleteMedicalDocumentFile = async (path: string) => {
  const { error } = await supabase.storage
    .from("medical_documents")
    .remove([path]);

  if (error) throw error;
};
