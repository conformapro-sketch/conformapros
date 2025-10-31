export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      abonnements: {
        Row: {
          client_id: string
          created_at: string
          date_debut: string
          date_fin: string | null
          id: string
          mode_facturation: Database["public"]["Enums"]["billing_mode"]
          plan_id: string
          statut: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          date_debut: string
          date_fin?: string | null
          id?: string
          mode_facturation?: Database["public"]["Enums"]["billing_mode"]
          plan_id: string
          statut?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          date_debut?: string
          date_fin?: string | null
          id?: string
          mode_facturation?: Database["public"]["Enums"]["billing_mode"]
          plan_id?: string
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "abonnements_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abonnements_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      article_versions: {
        Row: {
          article_id: string
          contenu: string
          created_at: string
          created_by: string | null
          date_version: string
          id: string
          raison_modification: string | null
          version_numero: number
        }
        Insert: {
          article_id: string
          contenu: string
          created_at?: string
          created_by?: string | null
          date_version: string
          id?: string
          raison_modification?: string | null
          version_numero: number
        }
        Update: {
          article_id?: string
          contenu?: string
          created_at?: string
          created_by?: string | null
          date_version?: string
          id?: string
          raison_modification?: string | null
          version_numero?: number
        }
        Relationships: [
          {
            foreignKeyName: "article_versions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "textes_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      articles_sous_domaines: {
        Row: {
          article_id: string
          created_at: string
          id: string
          sous_domaine_id: string
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          sous_domaine_id: string
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          sous_domaine_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "articles_sous_domaines_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "textes_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_sous_domaines_sous_domaine_id_fkey"
            columns: ["sous_domaine_id"]
            isOneToOne: false
            referencedRelation: "sous_domaines_application"
            referencedColumns: ["id"]
          },
        ]
      }
      changelog: {
        Row: {
          created_at: string
          date_publication: string
          description: string
          id: string
          titre: string
          version: string
        }
        Insert: {
          created_at?: string
          date_publication: string
          description: string
          id?: string
          titre: string
          version: string
        }
        Update: {
          created_at?: string
          date_publication?: string
          description?: string
          id?: string
          titre?: string
          version?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          adresse: string | null
          code_postal: string | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          nom: string
          pays: string | null
          siret: string | null
          telephone: string | null
          updated_at: string
          ville: string | null
        }
        Insert: {
          adresse?: string | null
          code_postal?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          nom: string
          pays?: string | null
          siret?: string | null
          telephone?: string | null
          updated_at?: string
          ville?: string | null
        }
        Update: {
          adresse?: string | null
          code_postal?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          nom?: string
          pays?: string | null
          siret?: string | null
          telephone?: string | null
          updated_at?: string
          ville?: string | null
        }
        Relationships: []
      }
      domaines_reglementaires: {
        Row: {
          code: string
          couleur: string | null
          created_at: string
          description: string | null
          icone: string | null
          id: string
          libelle: string
        }
        Insert: {
          code: string
          couleur?: string | null
          created_at?: string
          description?: string | null
          icone?: string | null
          id?: string
          libelle: string
        }
        Update: {
          code?: string
          couleur?: string | null
          created_at?: string
          description?: string | null
          icone?: string | null
          id?: string
          libelle?: string
        }
        Relationships: []
      }
      employes: {
        Row: {
          client_id: string
          created_at: string
          date_embauche: string | null
          email: string | null
          id: string
          nom: string
          numero_securite_sociale: string | null
          poste: string | null
          prenom: string
          site_id: string | null
          telephone: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          date_embauche?: string | null
          email?: string | null
          id?: string
          nom: string
          numero_securite_sociale?: string | null
          poste?: string | null
          prenom: string
          site_id?: string | null
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          date_embauche?: string | null
          email?: string | null
          id?: string
          nom?: string
          numero_securite_sociale?: string | null
          poste?: string | null
          prenom?: string
          site_id?: string | null
          telephone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employes_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      factures: {
        Row: {
          abonnement_id: string
          created_at: string
          date_echeance: string
          date_emission: string
          date_paiement: string | null
          id: string
          montant_ht: number
          montant_ttc: number
          montant_tva: number
          numero_facture: string
          statut: string
        }
        Insert: {
          abonnement_id: string
          created_at?: string
          date_echeance: string
          date_emission: string
          date_paiement?: string | null
          id?: string
          montant_ht: number
          montant_ttc: number
          montant_tva: number
          numero_facture: string
          statut?: string
        }
        Update: {
          abonnement_id?: string
          created_at?: string
          date_echeance?: string
          date_emission?: string
          date_paiement?: string | null
          id?: string
          montant_ht?: number
          montant_ttc?: number
          montant_tva?: number
          numero_facture?: string
          statut?: string
        }
        Relationships: [
          {
            foreignKeyName: "factures_abonnement_id_fkey"
            columns: ["abonnement_id"]
            isOneToOne: false
            referencedRelation: "abonnements"
            referencedColumns: ["id"]
          },
        ]
      }
      plans_action: {
        Row: {
          article_id: string | null
          cout_estime: number | null
          created_at: string
          created_by: string | null
          date_echeance: string | null
          description: string | null
          id: string
          priorite: Database["public"]["Enums"]["priorite"]
          responsable_id: string | null
          site_id: string
          statut: Database["public"]["Enums"]["statut_action"]
          titre: string
          updated_at: string
        }
        Insert: {
          article_id?: string | null
          cout_estime?: number | null
          created_at?: string
          created_by?: string | null
          date_echeance?: string | null
          description?: string | null
          id?: string
          priorite?: Database["public"]["Enums"]["priorite"]
          responsable_id?: string | null
          site_id: string
          statut?: Database["public"]["Enums"]["statut_action"]
          titre: string
          updated_at?: string
        }
        Update: {
          article_id?: string | null
          cout_estime?: number | null
          created_at?: string
          created_by?: string | null
          date_echeance?: string | null
          description?: string | null
          id?: string
          priorite?: Database["public"]["Enums"]["priorite"]
          responsable_id?: string | null
          site_id?: string
          statut?: Database["public"]["Enums"]["statut_action"]
          titre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_action_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "textes_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plans_action_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          nom: string | null
          prenom: string | null
          telephone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          nom?: string | null
          prenom?: string | null
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nom?: string | null
          prenom?: string | null
          telephone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_article_preuves: {
        Row: {
          created_at: string
          date_document: string | null
          description: string | null
          id: string
          site_article_status_id: string
          titre: string
          type_document: string | null
          uploaded_by: string | null
          url_document: string
        }
        Insert: {
          created_at?: string
          date_document?: string | null
          description?: string | null
          id?: string
          site_article_status_id: string
          titre: string
          type_document?: string | null
          uploaded_by?: string | null
          url_document: string
        }
        Update: {
          created_at?: string
          date_document?: string | null
          description?: string | null
          id?: string
          site_article_status_id?: string
          titre?: string
          type_document?: string | null
          uploaded_by?: string | null
          url_document?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_article_preuves_site_article_status_id_fkey"
            columns: ["site_article_status_id"]
            isOneToOne: false
            referencedRelation: "site_article_status"
            referencedColumns: ["id"]
          },
        ]
      }
      site_article_status: {
        Row: {
          applicabilite: Database["public"]["Enums"]["applicabilite_reglementaire"]
          article_id: string
          commentaire: string | null
          commentaire_non_applicable: string | null
          created_at: string
          date_derniere_evaluation: string | null
          etat_conformite: Database["public"]["Enums"]["etat_conformite"]
          evaluateur_id: string | null
          id: string
          motif_non_applicable:
            | Database["public"]["Enums"]["motif_non_applicable"]
            | null
          site_id: string
          updated_at: string
        }
        Insert: {
          applicabilite?: Database["public"]["Enums"]["applicabilite_reglementaire"]
          article_id: string
          commentaire?: string | null
          commentaire_non_applicable?: string | null
          created_at?: string
          date_derniere_evaluation?: string | null
          etat_conformite?: Database["public"]["Enums"]["etat_conformite"]
          evaluateur_id?: string | null
          id?: string
          motif_non_applicable?:
            | Database["public"]["Enums"]["motif_non_applicable"]
            | null
          site_id: string
          updated_at?: string
        }
        Update: {
          applicabilite?: Database["public"]["Enums"]["applicabilite_reglementaire"]
          article_id?: string
          commentaire?: string | null
          commentaire_non_applicable?: string | null
          created_at?: string
          date_derniere_evaluation?: string | null
          etat_conformite?: Database["public"]["Enums"]["etat_conformite"]
          evaluateur_id?: string | null
          id?: string
          motif_non_applicable?:
            | Database["public"]["Enums"]["motif_non_applicable"]
            | null
          site_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_article_status_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "textes_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_article_status_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          adresse: string
          client_id: string
          code_postal: string
          created_at: string
          email: string | null
          id: string
          latitude: number | null
          longitude: number | null
          nom: string
          nombre_employes: number | null
          pays: string | null
          surface: number | null
          telephone: string | null
          updated_at: string
          ville: string
        }
        Insert: {
          adresse: string
          client_id: string
          code_postal: string
          created_at?: string
          email?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          nom: string
          nombre_employes?: number | null
          pays?: string | null
          surface?: number | null
          telephone?: string | null
          updated_at?: string
          ville: string
        }
        Update: {
          adresse?: string
          client_id?: string
          code_postal?: string
          created_at?: string
          email?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          nom?: string
          nombre_employes?: number | null
          pays?: string | null
          surface?: number | null
          telephone?: string | null
          updated_at?: string
          ville?: string
        }
        Relationships: [
          {
            foreignKeyName: "sites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      sous_domaines_application: {
        Row: {
          code: string
          created_at: string
          description: string | null
          domaine_id: string
          id: string
          libelle: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          domaine_id: string
          id?: string
          libelle: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          domaine_id?: string
          id?: string
          libelle?: string
        }
        Relationships: [
          {
            foreignKeyName: "sous_domaines_application_domaine_id_fkey"
            columns: ["domaine_id"]
            isOneToOne: false
            referencedRelation: "domaines_reglementaires"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          fonctionnalites: Json | null
          id: string
          max_sites: number | null
          max_utilisateurs: number | null
          nom: string
          prix_mensuel: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          fonctionnalites?: Json | null
          id?: string
          max_sites?: number | null
          max_utilisateurs?: number | null
          nom: string
          prix_mensuel: number
        }
        Update: {
          created_at?: string
          description?: string | null
          fonctionnalites?: Json | null
          id?: string
          max_sites?: number | null
          max_utilisateurs?: number | null
          nom?: string
          prix_mensuel?: number
        }
        Relationships: []
      }
      textes_articles: {
        Row: {
          contenu: string
          created_at: string
          id: string
          numero_article: string
          ordre: number | null
          parent_article_id: string | null
          texte_id: string
          titre: string | null
          updated_at: string
          version_active: string | null
        }
        Insert: {
          contenu: string
          created_at?: string
          id?: string
          numero_article: string
          ordre?: number | null
          parent_article_id?: string | null
          texte_id: string
          titre?: string | null
          updated_at?: string
          version_active?: string | null
        }
        Update: {
          contenu?: string
          created_at?: string
          id?: string
          numero_article?: string
          ordre?: number | null
          parent_article_id?: string | null
          texte_id?: string
          titre?: string | null
          updated_at?: string
          version_active?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "textes_articles_parent_article_id_fkey"
            columns: ["parent_article_id"]
            isOneToOne: false
            referencedRelation: "textes_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "textes_articles_texte_id_fkey"
            columns: ["texte_id"]
            isOneToOne: false
            referencedRelation: "textes_reglementaires"
            referencedColumns: ["id"]
          },
        ]
      }
      textes_reglementaires: {
        Row: {
          created_at: string
          date_abrogation: string | null
          date_entree_vigueur: string | null
          date_publication: string
          id: string
          lien_officiel: string | null
          numero: string
          resume: string | null
          statut: string
          titre: string
          type_texte: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_abrogation?: string | null
          date_entree_vigueur?: string | null
          date_publication: string
          id?: string
          lien_officiel?: string | null
          numero: string
          resume?: string | null
          statut?: string
          titre: string
          type_texte: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_abrogation?: string | null
          date_entree_vigueur?: string | null
          date_publication?: string
          id?: string
          lien_officiel?: string | null
          numero?: string
          resume?: string | null
          statut?: string
          titre?: string
          type_texte?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      visites_medicales: {
        Row: {
          commentaires: string | null
          created_at: string
          date_prochaine_visite: string | null
          date_visite: string
          employe_id: string
          id: string
          medecin_travail: string | null
          resultat: string | null
          statut: Database["public"]["Enums"]["statut_visite"]
          type_document:
            | Database["public"]["Enums"]["type_document_medical"]
            | null
          type_visite: string
          updated_at: string
        }
        Insert: {
          commentaires?: string | null
          created_at?: string
          date_prochaine_visite?: string | null
          date_visite: string
          employe_id: string
          id?: string
          medecin_travail?: string | null
          resultat?: string | null
          statut?: Database["public"]["Enums"]["statut_visite"]
          type_document?:
            | Database["public"]["Enums"]["type_document_medical"]
            | null
          type_visite: string
          updated_at?: string
        }
        Update: {
          commentaires?: string | null
          created_at?: string
          date_prochaine_visite?: string | null
          date_visite?: string
          employe_id?: string
          id?: string
          medecin_travail?: string | null
          resultat?: string | null
          statut?: Database["public"]["Enums"]["statut_visite"]
          type_document?:
            | Database["public"]["Enums"]["type_document_medical"]
            | null
          type_visite?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "visites_medicales_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_client_access: {
        Args: { _client_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_site_access: {
        Args: { _site_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "gestionnaire" | "consultant" | "user"
      applicabilite_reglementaire:
        | "obligatoire"
        | "recommande"
        | "non_applicable"
      billing_mode: "par_site" | "par_nombre_employes" | "forfait_global"
      domaine_reglementaire:
        | "incendie"
        | "electrique"
        | "machines"
        | "levage"
        | "aeraulique"
        | "sanitaire"
        | "risques_chimiques"
        | "environnement"
        | "accessibilite"
        | "securite_generale"
        | "autre"
      etat_conformite:
        | "conforme"
        | "non_conforme"
        | "en_attente"
        | "non_applicable"
      motif_non_applicable:
        | "effectif_insuffisant"
        | "activite_non_concernee"
        | "configuration_batiment"
        | "dispense_reglementaire"
        | "autre"
      priorite: "haute" | "moyenne" | "basse"
      statut_action: "a_faire" | "en_cours" | "terminee" | "annulee"
      statut_visite: "programmee" | "effectuee" | "annulee" | "reportee"
      type_document_medical: "aptitude" | "inaptitude" | "restriction" | "autre"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "admin", "gestionnaire", "consultant", "user"],
      applicabilite_reglementaire: [
        "obligatoire",
        "recommande",
        "non_applicable",
      ],
      billing_mode: ["par_site", "par_nombre_employes", "forfait_global"],
      domaine_reglementaire: [
        "incendie",
        "electrique",
        "machines",
        "levage",
        "aeraulique",
        "sanitaire",
        "risques_chimiques",
        "environnement",
        "accessibilite",
        "securite_generale",
        "autre",
      ],
      etat_conformite: [
        "conforme",
        "non_conforme",
        "en_attente",
        "non_applicable",
      ],
      motif_non_applicable: [
        "effectif_insuffisant",
        "activite_non_concernee",
        "configuration_batiment",
        "dispense_reglementaire",
        "autre",
      ],
      priorite: ["haute", "moyenne", "basse"],
      statut_action: ["a_faire", "en_cours", "terminee", "annulee"],
      statut_visite: ["programmee", "effectuee", "annulee", "reportee"],
      type_document_medical: ["aptitude", "inaptitude", "restriction", "autre"],
    },
  },
} as const
