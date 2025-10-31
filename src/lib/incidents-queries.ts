import { supabase } from "@/integrations/supabase/client";
import { Incident, IncidentCause, IncidentPhoto } from "@/types/incidents";

// ============================================
// INCIDENTS
// ============================================

export async function fetchIncidents(siteId?: string) {
  let query = supabase
    .from("incidents")
    .select(`
      *,
      sites (nom_site),
      employes (nom, prenom)
    `)
    .order("date_incident", { ascending: false });

  if (siteId) {
    query = query.eq("site_id", siteId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Incident[];
}

export async function fetchIncidentById(id: string) {
  const { data, error } = await supabase
    .from("incidents")
    .select(`
      *,
      sites (nom_site),
      employes (nom, prenom)
    `)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Incident;
}

export async function createIncident(incident: Partial<Incident>) {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from("incidents")
    .insert({
      ...(incident as any),
      created_by: user?.id,
    } as any)
    .select()
    .single();

  if (error) throw error;
  return data as Incident;
}

export async function updateIncident(id: string, incident: Partial<Incident>) {
  const { data, error } = await supabase
    .from("incidents")
    .update(incident)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Incident;
}

export async function deleteIncident(id: string) {
  const { error } = await supabase
    .from("incidents")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function closeIncident(id: string, validatorId?: string) {
  const { data, error } = await supabase
    .from("incidents")
    .update({
      statut: "cloture",
      date_cloture: new Date().toISOString().split("T")[0],
      validateur_id: validatorId,
      date_validation: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Incident;
}

// ============================================
// CAUSES
// ============================================

export async function fetchIncidentCauses(incidentId: string) {
  const { data, error } = await supabase
    .from("incident_causes")
    .select("*")
    .eq("incident_id", incidentId)
    .order("niveau", { ascending: true });

  if (error) throw error;
  return data as IncidentCause[];
}

export async function createIncidentCause(cause: Omit<IncidentCause, "id" | "created_at">) {
  const { data, error } = await supabase
    .from("incident_causes")
    .insert(cause)
    .select()
    .single();

  if (error) throw error;
  return data as IncidentCause;
}

export async function deleteIncidentCause(id: string) {
  const { error } = await supabase
    .from("incident_causes")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// ============================================
// PHOTOS
// ============================================

export async function fetchIncidentPhotos(incidentId: string) {
  const { data, error } = await supabase
    .from("incident_photos")
    .select("*")
    .eq("incident_id", incidentId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as IncidentPhoto[];
}

export async function createIncidentPhoto(photo: Omit<IncidentPhoto, "id" | "created_at">) {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from("incident_photos")
    .insert({
      ...photo,
      uploaded_by: user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as IncidentPhoto;
}

export async function deleteIncidentPhoto(id: string) {
  const { error } = await supabase
    .from("incident_photos")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// ============================================
// STATISTIQUES
// ============================================

export async function fetchIncidentStats(siteId?: string, startDate?: string, endDate?: string) {
  let query = supabase
    .from("incidents")
    .select("*");

  if (siteId) {
    query = query.eq("site_id", siteId);
  }

  if (startDate) {
    query = query.gte("date_incident", startDate);
  }

  if (endDate) {
    query = query.lte("date_incident", endDate);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Calculate average resolution time
  const closedIncidents = data?.filter((i) => i.statut === "cloture" && i.date_cloture) || [];
  const avgResolutionDays = closedIncidents.length > 0
    ? closedIncidents.reduce((acc, incident) => {
        const start = new Date(incident.date_incident).getTime();
        const end = new Date(incident.date_cloture!).getTime();
        return acc + (end - start) / (1000 * 60 * 60 * 24);
      }, 0) / closedIncidents.length
    : 0;

  // Calculate monthly trend
  const monthlyTrend: Record<string, number> = {};
  data?.forEach((incident) => {
    const month = new Date(incident.date_incident).toISOString().substring(0, 7);
    monthlyTrend[month] = (monthlyTrend[month] || 0) + 1;
  });

  const total = data?.length || 0;
  const en_cours = data?.filter((i) => i.statut === "en_cours").length || 0;
  const clotures = data?.filter((i) => i.statut === "cloture").length || 0;
  const majeurs = data?.filter((i) => i.gravite === "majeure").length || 0;
  const recurrents = data?.filter((i) => i.est_recurrent === true).length || 0;

  const byType = data?.reduce((acc, i) => {
    acc[i.type_incident] = (acc[i.type_incident] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const byGravite = data?.reduce((acc, i) => {
    acc[i.gravite] = (acc[i.gravite] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return {
    total,
    en_cours,
    clotures,
    majeurs,
    recurrents,
    avgResolutionDays: Math.round(avgResolutionDays),
    byType,
    byGravite,
    monthlyTrend: Object.entries(monthlyTrend)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month)),
  };
}

// Fetch incident history
export async function fetchIncidentHistory(incidentId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("incident_history")
    .select(`
      *,
      profiles:modified_by(nom, prenom)
    `)
    .eq("incident_id", incidentId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Upload incident photo to storage
export async function uploadIncidentPhoto(
  file: File,
  incidentId: string
): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${incidentId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("incident-photos")
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from("incident-photos")
    .getPublicUrl(fileName);

  return publicUrl;
}

// ============================================
// ACTIONS CORRECTIVES LIÉES
// ============================================

export async function fetchIncidentActions(incidentId: string) {
  const { data, error } = await supabase
    .from("actions_correctives")
    .select("*")
    .eq("incident_id", incidentId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createActionFromIncident(
  incidentId: string,
  action: {
    titre: string;
    description?: string;
    priorite?: string;
    date_echeance?: string;
    responsable_id?: string;
  }
) {
  const { data, error } = await supabase
    .from("actions_correctives")
    .insert({
      ...action,
      incident_id: incidentId,
      statut: "a_faire",
    } as any)
    .select()
    .single();

  if (error) throw error;
  return data;
}
