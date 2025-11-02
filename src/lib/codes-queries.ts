import { supabase } from "@/integrations/supabase/client";
import type { CodeJuridique, TexteCode, CodeWithTextes } from "@/types/codes";

// ============= CODES JURIDIQUES =============

export const codesQueries = {
  // Récupérer tous les codes (non supprimés)
  async getAll() {
    const { data, error } = await supabase
      .from("codes_juridiques")
      .select(`
        *,
        codes_domaines (
          id,
          domaine_id,
          domaines_reglementaires (
            id,
            libelle,
            code
          )
        )
      `)
      .is("deleted_at", null)
      .order("nom_officiel");

    if (error) throw error;
    return data as CodeJuridique[];
  },

  // Récupérer un code par ID avec ses textes associés
  async getById(id: string) {
    const { data, error } = await supabase
      .from("codes_juridiques")
      .select(`
        *,
        codes_domaines (
          id,
          domaine_id,
          domaines_reglementaires (
            id,
            libelle,
            code
          )
        )
      `)
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (error) throw error;

    // Récupérer les textes associés
    const { data: textes, error: textesError } = await supabase
      .from("textes_codes")
      .select(`
        id,
        type_relation,
        textes_reglementaires (
          id,
          reference_officielle,
          intitule,
          type_acte,
          date_publication,
          statut_vigueur
        )
      `)
      .eq("code_id", id)
      .order("created_at", { ascending: false });

    if (textesError) throw textesError;

    const codeWithTextes: CodeWithTextes = {
      ...data,
      textes: textes?.map((t: any) => ({
        texte_code_id: t.id,
        type_relation: t.type_relation,
        texte: t.textes_reglementaires,
      })),
    };

    return codeWithTextes;
  },

  // Créer un code
  async create(code: Partial<CodeJuridique>, domaineIds: string[] = []) {
    const { data, error } = await supabase
      .from("codes_juridiques")
      .insert({
        nom_officiel: code.nom_officiel,
        abreviation: code.abreviation,
        reference_jort: code.reference_jort,
        description: code.description,
      })
      .select()
      .single();

    if (error) throw error;

    // Ajouter les liaisons avec les domaines
    if (domaineIds.length > 0) {
      const { error: linkError } = await supabase
        .from("codes_domaines")
        .insert(
          domaineIds.map(domaineId => ({
            code_id: data.id,
            domaine_id: domaineId,
          }))
        );

      if (linkError) throw linkError;
    }

    return data as CodeJuridique;
  },

  // Mettre à jour un code
  async update(id: string, code: Partial<CodeJuridique>, domaineIds: string[] = []) {
    const { data, error } = await supabase
      .from("codes_juridiques")
      .update({
        nom_officiel: code.nom_officiel,
        abreviation: code.abreviation,
        reference_jort: code.reference_jort,
        description: code.description,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Supprimer les anciennes liaisons
    const { error: deleteError } = await supabase
      .from("codes_domaines")
      .delete()
      .eq("code_id", id);

    if (deleteError) throw deleteError;

    // Ajouter les nouvelles liaisons
    if (domaineIds.length > 0) {
      const { error: linkError } = await supabase
        .from("codes_domaines")
        .insert(
          domaineIds.map(domaineId => ({
            code_id: id,
            domaine_id: domaineId,
          }))
        );

      if (linkError) throw linkError;
    }

    return data as CodeJuridique;
  },

  // Soft delete d'un code
  async softDelete(id: string) {
    const { error } = await supabase
      .from("codes_juridiques")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
  },
};

// ============= LIAISONS TEXTES-CODES =============

export const textesCodesQueries = {
  // Associer un texte à un code
  async link(texteId: string, codeId: string, typeRelation: string) {
    const { data, error } = await supabase
      .from("textes_codes")
      .insert({
        texte_id: texteId,
        code_id: codeId,
        type_relation: typeRelation,
      })
      .select()
      .single();

    if (error) throw error;
    return data as TexteCode;
  },

  // Dissocier un texte d'un code
  async unlink(texteCodeId: string) {
    const { error } = await supabase
      .from("textes_codes")
      .delete()
      .eq("id", texteCodeId);

    if (error) throw error;
  },

  // Récupérer tous les codes associés à un texte
  async getCodesByTexteId(texteId: string) {
    const { data, error } = await supabase
      .from("textes_codes")
      .select(`
        id,
        type_relation,
        codes_juridiques (
          id,
          nom_officiel,
          abreviation
        )
      `)
      .eq("texte_id", texteId);

    if (error) throw error;
    return data;
  },

  // Mettre à jour les codes d'un texte (supprime les anciens et ajoute les nouveaux)
  async updateTexteCodes(
    texteId: string,
    codes: Array<{ codeId: string; typeRelation: string }>
  ) {
    // Supprimer les anciennes liaisons
    const { error: deleteError } = await supabase
      .from("textes_codes")
      .delete()
      .eq("texte_id", texteId);

    if (deleteError) throw deleteError;

    // Ajouter les nouvelles liaisons si il y en a
    if (codes.length > 0) {
      const { data, error: insertError } = await supabase
        .from("textes_codes")
        .insert(
          codes.map((c) => ({
            texte_id: texteId,
            code_id: c.codeId,
            type_relation: c.typeRelation,
          }))
        )
        .select();

      if (insertError) throw insertError;
      return data;
    }

    return [];
  },
};
