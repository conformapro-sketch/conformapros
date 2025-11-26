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
      access_scopes: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          read_only: boolean | null
          site_id: string
          tenant_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          read_only?: boolean | null
          site_id: string
          tenant_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          read_only?: boolean | null
          site_id?: string
          tenant_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_scopes_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      actions_correctives: {
        Row: {
          conformite_id: string | null
          created_at: string
          date_echeance: string | null
          description: string | null
          id: string
          incident_id: string | null
          priorite: string | null
          responsable_id: string | null
          statut: string | null
          titre: string
          updated_at: string
        }
        Insert: {
          conformite_id?: string | null
          created_at?: string
          date_echeance?: string | null
          description?: string | null
          id?: string
          incident_id?: string | null
          priorite?: string | null
          responsable_id?: string | null
          statut?: string | null
          titre: string
          updated_at?: string
        }
        Update: {
          conformite_id?: string | null
          created_at?: string
          date_echeance?: string | null
          description?: string | null
          id?: string
          incident_id?: string | null
          priorite?: string | null
          responsable_id?: string | null
          statut?: string | null
          titre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "actions_correctives_conformite_id_fkey"
            columns: ["conformite_id"]
            isOneToOne: false
            referencedRelation: "conformite_evaluations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_correctives_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      article_sous_domaines: {
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
            foreignKeyName: "article_sous_domaines_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_sous_domaines_sous_domaine_id_fkey"
            columns: ["sous_domaine_id"]
            isOneToOne: false
            referencedRelation: "sous_domaines_application"
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
          date_effet: string
          id: string
          notes_modifications: string | null
          numero_version: number
          source_texte_id: string
          statut: Database["public"]["Enums"]["statut_version_article"]
          updated_at: string
        }
        Insert: {
          article_id: string
          contenu: string
          created_at?: string
          created_by?: string | null
          date_effet: string
          id?: string
          notes_modifications?: string | null
          numero_version: number
          source_texte_id: string
          statut?: Database["public"]["Enums"]["statut_version_article"]
          updated_at?: string
        }
        Update: {
          article_id?: string
          contenu?: string
          created_at?: string
          created_by?: string | null
          date_effet?: string
          id?: string
          notes_modifications?: string | null
          numero_version?: number
          source_texte_id?: string
          statut?: Database["public"]["Enums"]["statut_version_article"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_versions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_versions_source_texte_id_fkey"
            columns: ["source_texte_id"]
            isOneToOne: false
            referencedRelation: "textes_reglementaires"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          created_at: string
          created_by: string | null
          est_introductif: boolean
          id: string
          numero: string
          porte_exigence: boolean
          resume: string | null
          texte_id: string
          titre: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          est_introductif?: boolean
          id?: string
          numero: string
          porte_exigence?: boolean
          resume?: string | null
          texte_id: string
          titre: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          est_introductif?: boolean
          id?: string
          numero?: string
          porte_exigence?: boolean
          resume?: string | null
          texte_id?: string
          titre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "articles_texte_id_fkey"
            columns: ["texte_id"]
            isOneToOne: false
            referencedRelation: "textes_reglementaires"
            referencedColumns: ["id"]
          },
        ]
      }
      articles_effets_juridiques: {
        Row: {
          article_id: string
          article_source_id: string | null
          created_at: string
          date_effet: string
          id: string
          textes_articles: string[] | null
          type_effet: string
        }
        Insert: {
          article_id: string
          article_source_id?: string | null
          created_at?: string
          date_effet: string
          id?: string
          textes_articles?: string[] | null
          type_effet: string
        }
        Update: {
          article_id?: string
          article_source_id?: string | null
          created_at?: string
          date_effet?: string
          id?: string
          textes_articles?: string[] | null
          type_effet?: string
        }
        Relationships: [
          {
            foreignKeyName: "articles_effets_juridiques_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "textes_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_effets_juridiques_article_source_id_fkey"
            columns: ["article_source_id"]
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
      autorites_emettrices: {
        Row: {
          actif: boolean | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          nom: string
          nom_court: string | null
          ordre: number | null
          pays: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          actif?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          nom: string
          nom_court?: string | null
          ordre?: number | null
          pays?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          actif?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          nom?: string
          nom_court?: string | null
          ordre?: number | null
          pays?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      client_users: {
        Row: {
          actif: boolean
          avatar_url: string | null
          client_id: string
          created_at: string
          email: string
          id: string
          is_client_admin: boolean
          nom: string | null
          prenom: string | null
          telephone: string | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          actif?: boolean
          avatar_url?: string | null
          client_id: string
          created_at?: string
          email: string
          id: string
          is_client_admin?: boolean
          nom?: string | null
          prenom?: string | null
          telephone?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          actif?: boolean
          avatar_url?: string | null
          client_id?: string
          created_at?: string
          email?: string
          id?: string
          is_client_admin?: boolean
          nom?: string | null
          prenom?: string | null
          telephone?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_users_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
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
          nom_legal: string | null
          pays: string | null
          siret: string | null
          telephone: string | null
          updated_at: string
        }
        Insert: {
          adresse?: string | null
          code_postal?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          nom: string
          nom_legal?: string | null
          pays?: string | null
          siret?: string | null
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          adresse?: string | null
          code_postal?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          nom?: string
          nom_legal?: string | null
          pays?: string | null
          siret?: string | null
          telephone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      codes_domaines: {
        Row: {
          code_id: string
          created_at: string
          domaine_id: string
          id: string
        }
        Insert: {
          code_id: string
          created_at?: string
          domaine_id: string
          id?: string
        }
        Update: {
          code_id?: string
          created_at?: string
          domaine_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "codes_domaines_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "codes_juridiques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "codes_domaines_domaine_id_fkey"
            columns: ["domaine_id"]
            isOneToOne: false
            referencedRelation: "domaines_reglementaires"
            referencedColumns: ["id"]
          },
        ]
      }
      codes_juridiques: {
        Row: {
          abreviation: string | null
          code: string
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: string
          nom_officiel: string | null
          titre: string
          updated_at: string | null
        }
        Insert: {
          abreviation?: string | null
          code: string
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          nom_officiel?: string | null
          titre: string
          updated_at?: string | null
        }
        Update: {
          abreviation?: string | null
          code?: string
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          nom_officiel?: string | null
          titre?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      codes_liens_articles: {
        Row: {
          article_id: string
          created_at: string
          id: string
          structure_id: string
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          structure_id: string
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          structure_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "codes_liens_articles_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "codes_liens_articles_structure_id_fkey"
            columns: ["structure_id"]
            isOneToOne: false
            referencedRelation: "codes_structures"
            referencedColumns: ["id"]
          },
        ]
      }
      codes_structures: {
        Row: {
          code_id: string
          created_at: string
          id: string
          niveau: string
          numero: string
          ordre: number
          parent_id: string | null
          titre: string
        }
        Insert: {
          code_id: string
          created_at?: string
          id?: string
          niveau: string
          numero: string
          ordre?: number
          parent_id?: string | null
          titre: string
        }
        Update: {
          code_id?: string
          created_at?: string
          id?: string
          niveau?: string
          numero?: string
          ordre?: number
          parent_id?: string | null
          titre?: string
        }
        Relationships: [
          {
            foreignKeyName: "codes_structures_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "codes_juridiques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "codes_structures_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "codes_structures"
            referencedColumns: ["id"]
          },
        ]
      }
      conformite_evaluations: {
        Row: {
          article_id: string | null
          client_id: string
          created_at: string | null
          date_evaluation: string
          evaluateur_id: string | null
          id: string
          manquement: string | null
          observations: string | null
          site_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          article_id?: string | null
          client_id: string
          created_at?: string | null
          date_evaluation: string
          evaluateur_id?: string | null
          id?: string
          manquement?: string | null
          observations?: string | null
          site_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          article_id?: string | null
          client_id?: string
          created_at?: string | null
          date_evaluation?: string
          evaluateur_id?: string | null
          id?: string
          manquement?: string | null
          observations?: string | null
          site_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conformite_evaluations_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "textes_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conformite_evaluations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conformite_evaluations_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      dechets: {
        Row: {
          client_id: string
          created_at: string | null
          date_collecte: string | null
          id: string
          prestataire: string | null
          quantite: number | null
          site_id: string | null
          type_dechet: string
          unite: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          date_collecte?: string | null
          id?: string
          prestataire?: string | null
          quantite?: number | null
          site_id?: string | null
          type_dechet: string
          unite?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          date_collecte?: string | null
          id?: string
          prestataire?: string | null
          quantite?: number | null
          site_id?: string | null
          type_dechet?: string
          unite?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dechets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dechets_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      delegations: {
        Row: {
          created_at: string | null
          gouvernorat_id: string
          id: string
          nom: string
        }
        Insert: {
          created_at?: string | null
          gouvernorat_id: string
          id?: string
          nom: string
        }
        Update: {
          created_at?: string | null
          gouvernorat_id?: string
          id?: string
          nom?: string
        }
        Relationships: [
          {
            foreignKeyName: "delegations_gouvernorat_id_fkey"
            columns: ["gouvernorat_id"]
            isOneToOne: false
            referencedRelation: "gouvernorats"
            referencedColumns: ["id"]
          },
        ]
      }
      domaines_reglementaires: {
        Row: {
          actif: boolean | null
          code: string
          couleur: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          icone: string | null
          id: string
          libelle: string
        }
        Insert: {
          actif?: boolean | null
          code: string
          couleur?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          icone?: string | null
          id?: string
          libelle: string
        }
        Update: {
          actif?: boolean | null
          code?: string
          couleur?: string | null
          created_at?: string
          deleted_at?: string | null
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
          matricule: string | null
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
          matricule?: string | null
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
          matricule?: string | null
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
      epi_articles: {
        Row: {
          client_id: string
          code_article: string | null
          created_at: string | null
          date_achat: string | null
          epi_type_id: string | null
          id: string
          marque: string | null
          modele: string | null
          observations: string | null
          reference: string
          site_id: string | null
          statut: string | null
          taille: string | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          code_article?: string | null
          created_at?: string | null
          date_achat?: string | null
          epi_type_id?: string | null
          id?: string
          marque?: string | null
          modele?: string | null
          observations?: string | null
          reference: string
          site_id?: string | null
          statut?: string | null
          taille?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          code_article?: string | null
          created_at?: string | null
          date_achat?: string | null
          epi_type_id?: string | null
          id?: string
          marque?: string | null
          modele?: string | null
          observations?: string | null
          reference?: string
          site_id?: string | null
          statut?: string | null
          taille?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "epi_articles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "epi_articles_epi_type_id_fkey"
            columns: ["epi_type_id"]
            isOneToOne: false
            referencedRelation: "epi_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "epi_articles_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      epi_demandes: {
        Row: {
          created_at: string | null
          date_demande: string | null
          date_traitement: string | null
          employe_id: string
          epi_type_id: string
          id: string
          quantite: number | null
          statut: string | null
        }
        Insert: {
          created_at?: string | null
          date_demande?: string | null
          date_traitement?: string | null
          employe_id: string
          epi_type_id: string
          id?: string
          quantite?: number | null
          statut?: string | null
        }
        Update: {
          created_at?: string | null
          date_demande?: string | null
          date_traitement?: string | null
          employe_id?: string
          epi_type_id?: string
          id?: string
          quantite?: number | null
          statut?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "epi_demandes_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "epi_demandes_epi_type_id_fkey"
            columns: ["epi_type_id"]
            isOneToOne: false
            referencedRelation: "epi_types"
            referencedColumns: ["id"]
          },
        ]
      }
      epi_dotations: {
        Row: {
          created_at: string | null
          date_attribution: string
          date_retour: string | null
          employe_id: string
          epi_article_id: string
          id: string
          statut: string | null
        }
        Insert: {
          created_at?: string | null
          date_attribution: string
          date_retour?: string | null
          employe_id: string
          epi_article_id: string
          id?: string
          statut?: string | null
        }
        Update: {
          created_at?: string | null
          date_attribution?: string
          date_retour?: string | null
          employe_id?: string
          epi_article_id?: string
          id?: string
          statut?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "epi_dotations_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "epi_dotations_epi_article_id_fkey"
            columns: ["epi_article_id"]
            isOneToOne: false
            referencedRelation: "epi_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      epi_mouvements: {
        Row: {
          created_at: string
          date_mouvement: string
          employe_id: string
          epi_article_id: string
          id: string
          quantite: number
          remarque: string | null
          type_mouvement: string
        }
        Insert: {
          created_at?: string
          date_mouvement?: string
          employe_id: string
          epi_article_id: string
          id?: string
          quantite?: number
          remarque?: string | null
          type_mouvement: string
        }
        Update: {
          created_at?: string
          date_mouvement?: string
          employe_id?: string
          epi_article_id?: string
          id?: string
          quantite?: number
          remarque?: string | null
          type_mouvement?: string
        }
        Relationships: [
          {
            foreignKeyName: "epi_mouvements_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "epi_mouvements_epi_article_id_fkey"
            columns: ["epi_article_id"]
            isOneToOne: false
            referencedRelation: "epi_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      epi_types: {
        Row: {
          categorie: string | null
          created_at: string | null
          description: string | null
          duree_vie_mois: number | null
          id: string
          libelle: string | null
          nom: string
          norme: string | null
        }
        Insert: {
          categorie?: string | null
          created_at?: string | null
          description?: string | null
          duree_vie_mois?: number | null
          id?: string
          libelle?: string | null
          nom: string
          norme?: string | null
        }
        Update: {
          categorie?: string | null
          created_at?: string | null
          description?: string | null
          duree_vie_mois?: number | null
          id?: string
          libelle?: string | null
          nom?: string
          norme?: string | null
        }
        Relationships: []
      }
      equipements: {
        Row: {
          client_id: string
          created_at: string | null
          date_mise_service: string | null
          derniere_verification: string | null
          equipement_type_id: string | null
          id: string
          localisation: string | null
          nom: string
          numero_serie: string | null
          observations: string | null
          prochaine_verification: string | null
          site_id: string | null
          statut: string | null
          type_equipement: string | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          date_mise_service?: string | null
          derniere_verification?: string | null
          equipement_type_id?: string | null
          id?: string
          localisation?: string | null
          nom: string
          numero_serie?: string | null
          observations?: string | null
          prochaine_verification?: string | null
          site_id?: string | null
          statut?: string | null
          type_equipement?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          date_mise_service?: string | null
          derniere_verification?: string | null
          equipement_type_id?: string | null
          id?: string
          localisation?: string | null
          nom?: string
          numero_serie?: string | null
          observations?: string | null
          prochaine_verification?: string | null
          site_id?: string | null
          statut?: string | null
          type_equipement?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipements_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipements_equipement_type_id_fkey"
            columns: ["equipement_type_id"]
            isOneToOne: false
            referencedRelation: "equipements_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipements_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      equipements_controles: {
        Row: {
          created_at: string | null
          date_controle: string
          date_prochain_controle: string | null
          equipement_id: string
          id: string
          organisme_controle: string | null
          resultat: string | null
          type_controle: string
        }
        Insert: {
          created_at?: string | null
          date_controle: string
          date_prochain_controle?: string | null
          equipement_id: string
          id?: string
          organisme_controle?: string | null
          resultat?: string | null
          type_controle: string
        }
        Update: {
          created_at?: string | null
          date_controle?: string
          date_prochain_controle?: string | null
          equipement_id?: string
          id?: string
          organisme_controle?: string | null
          resultat?: string | null
          type_controle?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipements_controles_equipement_id_fkey"
            columns: ["equipement_id"]
            isOneToOne: false
            referencedRelation: "equipements"
            referencedColumns: ["id"]
          },
        ]
      }
      equipements_maintenance: {
        Row: {
          cout: number | null
          created_at: string | null
          date_maintenance: string
          description: string | null
          equipement_id: string
          id: string
          type_maintenance: string
        }
        Insert: {
          cout?: number | null
          created_at?: string | null
          date_maintenance: string
          description?: string | null
          equipement_id: string
          id?: string
          type_maintenance: string
        }
        Update: {
          cout?: number | null
          created_at?: string | null
          date_maintenance?: string
          description?: string | null
          equipement_id?: string
          id?: string
          type_maintenance?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipements_maintenance_equipement_id_fkey"
            columns: ["equipement_id"]
            isOneToOne: false
            referencedRelation: "equipements"
            referencedColumns: ["id"]
          },
        ]
      }
      equipements_types: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          nom: string
          periodicite_controle_mois: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          nom: string
          periodicite_controle_mois?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          nom?: string
          periodicite_controle_mois?: number | null
        }
        Relationships: []
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
      formations: {
        Row: {
          client_id: string
          created_at: string | null
          description: string | null
          duree_heures: number | null
          id: string
          organisme: string | null
          titre: string
          validite_mois: number | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          description?: string | null
          duree_heures?: number | null
          id?: string
          organisme?: string | null
          titre: string
          validite_mois?: number | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          description?: string | null
          duree_heures?: number | null
          id?: string
          organisme?: string | null
          titre?: string
          validite_mois?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "formations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      formations_participants: {
        Row: {
          created_at: string | null
          date_certificat: string | null
          employe_id: string
          id: string
          presence: boolean | null
          resultat: string | null
          session_id: string
        }
        Insert: {
          created_at?: string | null
          date_certificat?: string | null
          employe_id: string
          id?: string
          presence?: boolean | null
          resultat?: string | null
          session_id: string
        }
        Update: {
          created_at?: string | null
          date_certificat?: string | null
          employe_id?: string
          id?: string
          presence?: boolean | null
          resultat?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "formations_participants_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formations_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "formations_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      formations_sessions: {
        Row: {
          created_at: string | null
          date_debut: string
          date_fin: string
          formateur: string | null
          formation_id: string
          id: string
          lieu: string | null
          site_id: string | null
          statut: string | null
        }
        Insert: {
          created_at?: string | null
          date_debut: string
          date_fin: string
          formateur?: string | null
          formation_id: string
          id?: string
          lieu?: string | null
          site_id?: string | null
          statut?: string | null
        }
        Update: {
          created_at?: string | null
          date_debut?: string
          date_fin?: string
          formateur?: string | null
          formation_id?: string
          id?: string
          lieu?: string | null
          site_id?: string | null
          statut?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "formations_sessions_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formations_sessions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      gouvernorats: {
        Row: {
          code: string
          created_at: string | null
          id: string
          nom: string
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          nom: string
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          nom?: string
        }
        Relationships: []
      }
      incident_causes: {
        Row: {
          created_at: string
          id: string
          incident_id: string
          niveau: number
          question: string
          reponse: string
        }
        Insert: {
          created_at?: string
          id?: string
          incident_id: string
          niveau: number
          question: string
          reponse: string
        }
        Update: {
          created_at?: string
          id?: string
          incident_id?: string
          niveau?: number
          question?: string
          reponse?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_causes_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_history: {
        Row: {
          created_at: string
          field_name: string
          id: string
          incident_id: string
          modified_by: string | null
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          created_at?: string
          field_name: string
          id?: string
          incident_id: string
          modified_by?: string | null
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          created_at?: string
          field_name?: string
          id?: string
          incident_id?: string
          modified_by?: string | null
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_history_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_photos: {
        Row: {
          created_at: string
          description: string | null
          file_name: string | null
          file_type: string | null
          file_url: string
          id: string
          incident_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_type?: string | null
          file_url: string
          id?: string
          incident_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_type?: string | null
          file_url?: string
          id?: string
          incident_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_photos_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          analyse_causes: string | null
          arret_travail: boolean | null
          atelier: string | null
          batiment: string | null
          categorie: string | null
          circonstances: string | null
          client_id: string
          created_at: string | null
          created_by: string | null
          date_cloture: string | null
          date_incident: string
          date_validation: string | null
          declarant_fonction: string | null
          declarant_id: string | null
          declarant_nom: string | null
          description: string | null
          est_recurrent: boolean | null
          facteur_environnemental: boolean | null
          facteur_humain: boolean | null
          facteur_materiel: boolean | null
          facteur_organisationnel: boolean | null
          gravite: string | null
          heure_incident: string | null
          hospitalisation: boolean | null
          id: string
          incident_type_id: string | null
          jours_arret: number | null
          mesures_correctives: string | null
          numero_incident: string | null
          personne_impliquee_id: string | null
          personne_impliquee_nom: string | null
          responsable_suivi_id: string | null
          site_id: string | null
          statut: string | null
          titre: string
          type_incident: string | null
          updated_at: string | null
          validateur_id: string | null
          zone: string | null
        }
        Insert: {
          analyse_causes?: string | null
          arret_travail?: boolean | null
          atelier?: string | null
          batiment?: string | null
          categorie?: string | null
          circonstances?: string | null
          client_id: string
          created_at?: string | null
          created_by?: string | null
          date_cloture?: string | null
          date_incident: string
          date_validation?: string | null
          declarant_fonction?: string | null
          declarant_id?: string | null
          declarant_nom?: string | null
          description?: string | null
          est_recurrent?: boolean | null
          facteur_environnemental?: boolean | null
          facteur_humain?: boolean | null
          facteur_materiel?: boolean | null
          facteur_organisationnel?: boolean | null
          gravite?: string | null
          heure_incident?: string | null
          hospitalisation?: boolean | null
          id?: string
          incident_type_id?: string | null
          jours_arret?: number | null
          mesures_correctives?: string | null
          numero_incident?: string | null
          personne_impliquee_id?: string | null
          personne_impliquee_nom?: string | null
          responsable_suivi_id?: string | null
          site_id?: string | null
          statut?: string | null
          titre: string
          type_incident?: string | null
          updated_at?: string | null
          validateur_id?: string | null
          zone?: string | null
        }
        Update: {
          analyse_causes?: string | null
          arret_travail?: boolean | null
          atelier?: string | null
          batiment?: string | null
          categorie?: string | null
          circonstances?: string | null
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          date_cloture?: string | null
          date_incident?: string
          date_validation?: string | null
          declarant_fonction?: string | null
          declarant_id?: string | null
          declarant_nom?: string | null
          description?: string | null
          est_recurrent?: boolean | null
          facteur_environnemental?: boolean | null
          facteur_humain?: boolean | null
          facteur_materiel?: boolean | null
          facteur_organisationnel?: boolean | null
          gravite?: string | null
          heure_incident?: string | null
          hospitalisation?: boolean | null
          id?: string
          incident_type_id?: string | null
          jours_arret?: number | null
          mesures_correctives?: string | null
          numero_incident?: string | null
          personne_impliquee_id?: string | null
          personne_impliquee_nom?: string | null
          responsable_suivi_id?: string | null
          site_id?: string | null
          statut?: string | null
          titre?: string
          type_incident?: string | null
          updated_at?: string | null
          validateur_id?: string | null
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incidents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_declarant_id_fkey"
            columns: ["declarant_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_incident_type_id_fkey"
            columns: ["incident_type_id"]
            isOneToOne: false
            referencedRelation: "incidents_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_personne_impliquee_id_fkey"
            columns: ["personne_impliquee_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_responsable_suivi_id_fkey"
            columns: ["responsable_suivi_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents_analyses: {
        Row: {
          actions_correctives: string | null
          actions_preventives: string | null
          causes: string | null
          created_at: string | null
          date_analyse: string | null
          id: string
          incident_id: string
        }
        Insert: {
          actions_correctives?: string | null
          actions_preventives?: string | null
          causes?: string | null
          created_at?: string | null
          date_analyse?: string | null
          id?: string
          incident_id: string
        }
        Update: {
          actions_correctives?: string | null
          actions_preventives?: string | null
          causes?: string | null
          created_at?: string | null
          date_analyse?: string | null
          id?: string
          incident_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_analyses_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents_types: {
        Row: {
          couleur: string | null
          created_at: string | null
          description: string | null
          id: string
          nom: string
        }
        Insert: {
          couleur?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          nom: string
        }
        Update: {
          couleur?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          nom?: string
        }
        Relationships: []
      }
      med_visites: {
        Row: {
          created_at: string | null
          date_prochaine_visite: string | null
          date_visite: string
          employe_id: string
          id: string
          medecin_nom: string | null
          medecin_organisme: string | null
          observations: string | null
          resultat_aptitude: string | null
          statut_visite: string | null
          type_visite: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_prochaine_visite?: string | null
          date_visite: string
          employe_id: string
          id?: string
          medecin_nom?: string | null
          medecin_organisme?: string | null
          observations?: string | null
          resultat_aptitude?: string | null
          statut_visite?: string | null
          type_visite?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_prochaine_visite?: string | null
          date_visite?: string
          employe_id?: string
          id?: string
          medecin_nom?: string | null
          medecin_organisme?: string | null
          observations?: string | null
          resultat_aptitude?: string | null
          statut_visite?: string | null
          type_visite?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "med_visites_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
        ]
      }
      mesures_environnementales: {
        Row: {
          commentaire: string | null
          conforme: boolean | null
          created_at: string | null
          date_mesure: string
          id: string
          point_id: string
          unite: string | null
          valeur: number | null
        }
        Insert: {
          commentaire?: string | null
          conforme?: boolean | null
          created_at?: string | null
          date_mesure: string
          id?: string
          point_id: string
          unite?: string | null
          valeur?: number | null
        }
        Update: {
          commentaire?: string | null
          conforme?: boolean | null
          created_at?: string | null
          date_mesure?: string
          id?: string
          point_id?: string
          unite?: string | null
          valeur?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mesures_environnementales_point_id_fkey"
            columns: ["point_id"]
            isOneToOne: false
            referencedRelation: "points_surveillance"
            referencedColumns: ["id"]
          },
        ]
      }
      module_features: {
        Row: {
          actif: boolean | null
          code: string
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          module_id: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          actif?: boolean | null
          code: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          module_id?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          actif?: boolean | null
          code?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          module_id?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "module_features_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules_systeme"
            referencedColumns: ["id"]
          },
        ]
      }
      modules_systeme: {
        Row: {
          actif: boolean | null
          code: string
          couleur: string | null
          created_at: string
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          libelle: string
          nom: string
          ordre: number | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          actif?: boolean | null
          code: string
          couleur?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          libelle: string
          nom: string
          ordre?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          actif?: boolean | null
          code?: string
          couleur?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          libelle?: string
          nom?: string
          ordre?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      permission_actions: {
        Row: {
          code: string
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          label: string | null
          nom: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          label?: string | null
          nom: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          label?: string | null
          nom?: string
        }
        Relationships: []
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
          manquement: string | null
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
          manquement?: string | null
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
          manquement?: string | null
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
      plans_action_attachments: {
        Row: {
          action_id: string
          created_at: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          titre: string
          uploaded_by: string | null
        }
        Insert: {
          action_id: string
          created_at?: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          titre: string
          uploaded_by?: string | null
        }
        Update: {
          action_id?: string
          created_at?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          titre?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plans_action_attachments_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "plans_action"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plans_action_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "client_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plans_action_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "v_client_admin_users_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plans_action_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "v_staff_client_users_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      points_surveillance: {
        Row: {
          client_id: string
          created_at: string | null
          frequence: string | null
          id: string
          nom: string
          site_id: string | null
          type_surveillance: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          frequence?: string | null
          id?: string
          nom: string
          site_id?: string | null
          type_surveillance: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          frequence?: string | null
          id?: string
          nom?: string
          site_id?: string | null
          type_surveillance?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_surveillance_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_surveillance_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      prestataires: {
        Row: {
          adresse: string | null
          client_id: string
          code_postal: string | null
          created_at: string
          email: string | null
          id: string
          nom: string
          siret: string | null
          telephone: string | null
          type_prestation: string
          updated_at: string
        }
        Insert: {
          adresse?: string | null
          client_id: string
          code_postal?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom: string
          siret?: string | null
          telephone?: string | null
          type_prestation: string
          updated_at?: string
        }
        Update: {
          adresse?: string | null
          client_id?: string
          code_postal?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom?: string
          siret?: string | null
          telephone?: string | null
          type_prestation?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prestataires_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          nom: string | null
          prenom: string | null
          telephone: string | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          nom?: string | null
          prenom?: string | null
          telephone?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          nom?: string | null
          prenom?: string | null
          telephone?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      role_audit_logs: {
        Row: {
          action: string
          changes: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "role_audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          action: string
          action_id: string | null
          created_at: string
          decision: Database["public"]["Enums"]["permission_decision"]
          feature_id: string | null
          id: string
          module: string
          module_id: string | null
          role_id: string
          scope: Database["public"]["Enums"]["permission_scope"]
          updated_at: string
        }
        Insert: {
          action: string
          action_id?: string | null
          created_at?: string
          decision?: Database["public"]["Enums"]["permission_decision"]
          feature_id?: string | null
          id?: string
          module: string
          module_id?: string | null
          role_id: string
          scope?: Database["public"]["Enums"]["permission_scope"]
          updated_at?: string
        }
        Update: {
          action?: string
          action_id?: string | null
          created_at?: string
          decision?: Database["public"]["Enums"]["permission_decision"]
          feature_id?: string | null
          id?: string
          module?: string
          module_id?: string | null
          role_id?: string
          scope?: Database["public"]["Enums"]["permission_scope"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "permission_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "module_features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules_systeme"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          archived_at: string | null
          created_at: string
          description: string | null
          id: string
          is_system: boolean | null
          name: string
          tenant_id: string | null
          type: Database["public"]["Enums"]["role_type"]
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          tenant_id?: string | null
          type: Database["public"]["Enums"]["role_type"]
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          tenant_id?: string | null
          type?: Database["public"]["Enums"]["role_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
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
      site_modules: {
        Row: {
          actif: boolean | null
          created_at: string | null
          disabled_at: string | null
          enabled_at: string | null
          enabled_by: string | null
          id: string
          module_id: string
          site_id: string
          updated_at: string | null
        }
        Insert: {
          actif?: boolean | null
          created_at?: string | null
          disabled_at?: string | null
          enabled_at?: string | null
          enabled_by?: string | null
          id?: string
          module_id: string
          site_id: string
          updated_at?: string | null
        }
        Update: {
          actif?: boolean | null
          created_at?: string | null
          disabled_at?: string | null
          enabled_at?: string | null
          enabled_by?: string | null
          id?: string
          module_id?: string
          site_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules_systeme"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_modules_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_veille_domaines: {
        Row: {
          created_at: string | null
          domaine_id: string
          enabled: boolean | null
          id: string
          site_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          domaine_id: string
          enabled?: boolean | null
          id?: string
          site_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          domaine_id?: string
          enabled?: boolean | null
          id?: string
          site_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_veille_domaines_domaine_id_fkey"
            columns: ["domaine_id"]
            isOneToOne: false
            referencedRelation: "domaines_reglementaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_veille_domaines_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          activite: string | null
          adresse: string | null
          classification: string | null
          client_id: string
          code_postal: string | null
          code_site: string | null
          created_at: string
          delegation: string | null
          email: string | null
          est_siege: boolean | null
          gouvernorat: string | null
          id: string
          latitude: number | null
          localite: string | null
          logo_url: string | null
          longitude: number | null
          niveau_risque: string | null
          nom: string
          nom_site: string
          nombre_employes: number | null
          pays: string | null
          responsable_site: string | null
          secteur_activite: string | null
          surface: number | null
          telephone: string | null
          updated_at: string
        }
        Insert: {
          activite?: string | null
          adresse?: string | null
          classification?: string | null
          client_id: string
          code_postal?: string | null
          code_site?: string | null
          created_at?: string
          delegation?: string | null
          email?: string | null
          est_siege?: boolean | null
          gouvernorat?: string | null
          id?: string
          latitude?: number | null
          localite?: string | null
          logo_url?: string | null
          longitude?: number | null
          niveau_risque?: string | null
          nom: string
          nom_site: string
          nombre_employes?: number | null
          pays?: string | null
          responsable_site?: string | null
          secteur_activite?: string | null
          surface?: number | null
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          activite?: string | null
          adresse?: string | null
          classification?: string | null
          client_id?: string
          code_postal?: string | null
          code_site?: string | null
          created_at?: string
          delegation?: string | null
          email?: string | null
          est_siege?: boolean | null
          gouvernorat?: string | null
          id?: string
          latitude?: number | null
          localite?: string | null
          logo_url?: string | null
          longitude?: number | null
          niveau_risque?: string | null
          nom?: string
          nom_site?: string
          nombre_employes?: number | null
          pays?: string | null
          responsable_site?: string | null
          secteur_activite?: string | null
          surface?: number | null
          telephone?: string | null
          updated_at?: string
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
          actif: boolean
          code: string
          created_at: string
          deleted_at: string | null
          description: string | null
          domaine_id: string
          id: string
          libelle: string
          ordre: number
        }
        Insert: {
          actif?: boolean
          code: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          domaine_id: string
          id?: string
          libelle: string
          ordre?: number
        }
        Update: {
          actif?: boolean
          code?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          domaine_id?: string
          id?: string
          libelle?: string
          ordre?: number
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
          acte_id: string | null
          contenu: string
          created_at: string
          id: string
          is_exigence: boolean | null
          numero: string | null
          numero_article: string
          ordre: number | null
          parent_article_id: string | null
          texte_id: string
          titre: string | null
          titre_court: string | null
          updated_at: string
          version_active: string | null
        }
        Insert: {
          acte_id?: string | null
          contenu: string
          created_at?: string
          id?: string
          is_exigence?: boolean | null
          numero?: string | null
          numero_article: string
          ordre?: number | null
          parent_article_id?: string | null
          texte_id: string
          titre?: string | null
          titre_court?: string | null
          updated_at?: string
          version_active?: string | null
        }
        Update: {
          acte_id?: string | null
          contenu?: string
          created_at?: string
          id?: string
          is_exigence?: boolean | null
          numero?: string | null
          numero_article?: string
          ordre?: number | null
          parent_article_id?: string | null
          texte_id?: string
          titre?: string | null
          titre_court?: string | null
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
      textes_codes: {
        Row: {
          code_id: string
          created_at: string
          id: string
          texte_id: string
          type_relation: string | null
        }
        Insert: {
          code_id: string
          created_at?: string
          id?: string
          texte_id: string
          type_relation?: string | null
        }
        Update: {
          code_id?: string
          created_at?: string
          id?: string
          texte_id?: string
          type_relation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "textes_codes_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "codes_juridiques"
            referencedColumns: ["id"]
          },
        ]
      }
      textes_domaines: {
        Row: {
          created_at: string | null
          domaine_id: string
          id: string
          texte_id: string
        }
        Insert: {
          created_at?: string | null
          domaine_id: string
          id?: string
          texte_id: string
        }
        Update: {
          created_at?: string | null
          domaine_id?: string
          id?: string
          texte_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "textes_domaines_domaine_id_fkey"
            columns: ["domaine_id"]
            isOneToOne: false
            referencedRelation: "domaines_reglementaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "textes_domaines_texte_id_fkey"
            columns: ["texte_id"]
            isOneToOne: false
            referencedRelation: "textes_reglementaires"
            referencedColumns: ["id"]
          },
        ]
      }
      textes_reglementaires: {
        Row: {
          annee: number | null
          autorite_emettrice: string | null
          autorite_emettrice_id: string | null
          created_at: string
          created_by: string | null
          date_publication: string | null
          id: string
          pdf_url: string | null
          reference: string
          source_url: string | null
          titre: string
          type: Database["public"]["Enums"]["type_texte_reglementaire"]
          updated_at: string
        }
        Insert: {
          annee?: number | null
          autorite_emettrice?: string | null
          autorite_emettrice_id?: string | null
          created_at?: string
          created_by?: string | null
          date_publication?: string | null
          id?: string
          pdf_url?: string | null
          reference: string
          source_url?: string | null
          titre: string
          type: Database["public"]["Enums"]["type_texte_reglementaire"]
          updated_at?: string
        }
        Update: {
          annee?: number | null
          autorite_emettrice?: string | null
          autorite_emettrice_id?: string | null
          created_at?: string
          created_by?: string | null
          date_publication?: string | null
          id?: string
          pdf_url?: string | null
          reference?: string
          source_url?: string | null
          titre?: string
          type?: Database["public"]["Enums"]["type_texte_reglementaire"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "textes_reglementaires_autorite_emettrice_id_fkey"
            columns: ["autorite_emettrice_id"]
            isOneToOne: false
            referencedRelation: "autorites_emettrices"
            referencedColumns: ["id"]
          },
        ]
      }
      textes_sous_domaines: {
        Row: {
          created_at: string | null
          id: string
          sous_domaine_id: string
          texte_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          sous_domaine_id: string
          texte_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          sous_domaine_id?: string
          texte_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "textes_sous_domaines_sous_domaine_id_fkey"
            columns: ["sous_domaine_id"]
            isOneToOne: false
            referencedRelation: "sous_domaines_application"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "textes_sous_domaines_texte_id_fkey"
            columns: ["texte_id"]
            isOneToOne: false
            referencedRelation: "textes_reglementaires"
            referencedColumns: ["id"]
          },
        ]
      }
      user_domain_scopes: {
        Row: {
          created_at: string | null
          domaine_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          domaine_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          domaine_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_domain_scopes_domaine_id_fkey"
            columns: ["domaine_id"]
            isOneToOne: false
            referencedRelation: "domaines_reglementaires"
            referencedColumns: ["id"]
          },
        ]
      }
      user_management_audit: {
        Row: {
          action_type: string
          after_state: Json | null
          before_state: Json | null
          changes: Json | null
          client_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          performed_by: string
          session_id: string | null
          site_id: string | null
          target_user_id: string
          user_agent: string | null
        }
        Insert: {
          action_type: string
          after_state?: Json | null
          before_state?: Json | null
          changes?: Json | null
          client_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          performed_by: string
          session_id?: string | null
          site_id?: string | null
          target_user_id: string
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          after_state?: Json | null
          before_state?: Json | null
          changes?: Json | null
          client_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          performed_by?: string
          session_id?: string | null
          site_id?: string | null
          target_user_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_management_audit_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_management_audit_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          action: string
          client_id: string
          created_at: string
          decision: Database["public"]["Enums"]["permission_decision"]
          id: string
          module: string
          scope: Database["public"]["Enums"]["permission_scope"]
          site_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          action: string
          client_id: string
          created_at?: string
          decision?: Database["public"]["Enums"]["permission_decision"]
          id?: string
          module: string
          scope?: Database["public"]["Enums"]["permission_scope"]
          site_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          action?: string
          client_id?: string
          created_at?: string
          decision?: Database["public"]["Enums"]["permission_decision"]
          id?: string
          module?: string
          scope?: Database["public"]["Enums"]["permission_scope"]
          site_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"] | null
          role_uuid: string | null
          site_scope: string[] | null
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"] | null
          role_uuid?: string | null
          site_scope?: string[] | null
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"] | null
          role_uuid?: string | null
          site_scope?: string[] | null
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
          {
            foreignKeyName: "user_roles_role_uuid_fkey"
            columns: ["role_uuid"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sites: {
        Row: {
          created_at: string
          id: string
          site_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          site_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          site_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sites_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      veille_alerts: {
        Row: {
          alert_type: string
          article_id: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          read_at: string | null
          read_by: string | null
          site_id: string
          version_id: string | null
        }
        Insert: {
          alert_type: string
          article_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          read_at?: string | null
          read_by?: string | null
          site_id: string
          version_id?: string | null
        }
        Update: {
          alert_type?: string
          article_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          read_at?: string | null
          read_by?: string | null
          site_id?: string
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "veille_alerts_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "textes_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "veille_alerts_read_by_fkey"
            columns: ["read_by"]
            isOneToOne: false
            referencedRelation: "client_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "veille_alerts_read_by_fkey"
            columns: ["read_by"]
            isOneToOne: false
            referencedRelation: "v_client_admin_users_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "veille_alerts_read_by_fkey"
            columns: ["read_by"]
            isOneToOne: false
            referencedRelation: "v_staff_client_users_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "veille_alerts_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
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
      visites_medicales_documents: {
        Row: {
          created_at: string
          date_document: string | null
          id: string
          titre: string
          type_document: string
          uploaded_by: string | null
          url_document: string
          visite_id: string
        }
        Insert: {
          created_at?: string
          date_document?: string | null
          id?: string
          titre: string
          type_document: string
          uploaded_by?: string | null
          url_document: string
          visite_id: string
        }
        Update: {
          created_at?: string
          date_document?: string | null
          id?: string
          titre?: string
          type_document?: string
          uploaded_by?: string | null
          url_document?: string
          visite_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visites_medicales_documents_visite_id_fkey"
            columns: ["visite_id"]
            isOneToOne: false
            referencedRelation: "visites_medicales"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      equipements_controle: {
        Row: {
          created_at: string | null
          date_controle: string | null
          date_prochain_controle: string | null
          equipement_id: string | null
          id: string | null
          organisme_controle: string | null
          resultat: string | null
          type_controle: string | null
        }
        Insert: {
          created_at?: string | null
          date_controle?: string | null
          date_prochain_controle?: string | null
          equipement_id?: string | null
          id?: string | null
          organisme_controle?: string | null
          resultat?: string | null
          type_controle?: string | null
        }
        Update: {
          created_at?: string | null
          date_controle?: string | null
          date_prochain_controle?: string | null
          equipement_id?: string | null
          id?: string | null
          organisme_controle?: string | null
          resultat?: string | null
          type_controle?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipements_controles_equipement_id_fkey"
            columns: ["equipement_id"]
            isOneToOne: false
            referencedRelation: "equipements"
            referencedColumns: ["id"]
          },
        ]
      }
      v_articles_versions_actives: {
        Row: {
          article_id: string | null
          article_numero: string | null
          article_titre: string | null
          contenu: string | null
          date_effet: string | null
          est_introductif: boolean | null
          notes_modifications: string | null
          numero_version: number | null
          porte_exigence: boolean | null
          source_texte_id: string | null
          texte_id: string | null
          version_created_at: string | null
          version_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "article_versions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_versions_source_texte_id_fkey"
            columns: ["source_texte_id"]
            isOneToOne: false
            referencedRelation: "textes_reglementaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_texte_id_fkey"
            columns: ["texte_id"]
            isOneToOne: false
            referencedRelation: "textes_reglementaires"
            referencedColumns: ["id"]
          },
        ]
      }
      v_client_admin_users_overview: {
        Row: {
          actif: boolean | null
          avatar_url: string | null
          client_id: string | null
          created_at: string | null
          email: string | null
          id: string | null
          is_client_admin: boolean | null
          nom: string | null
          permission_count: number | null
          prenom: string | null
          roles: Json | null
          site_count: number | null
          sites: Json | null
          telephone: string | null
          updated_at: string | null
        }
        Insert: {
          actif?: boolean | null
          avatar_url?: string | null
          client_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_client_admin?: boolean | null
          nom?: string | null
          permission_count?: never
          prenom?: string | null
          roles?: never
          site_count?: never
          sites?: never
          telephone?: string | null
          updated_at?: string | null
        }
        Update: {
          actif?: boolean | null
          avatar_url?: string | null
          client_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_client_admin?: boolean | null
          nom?: string | null
          permission_count?: never
          prenom?: string | null
          roles?: never
          site_count?: never
          sites?: never
          telephone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_users_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      v_staff_client_users_overview: {
        Row: {
          actif: boolean | null
          avatar_url: string | null
          client_id: string | null
          client_logo: string | null
          client_name: string | null
          created_at: string | null
          email: string | null
          id: string | null
          is_client_admin: boolean | null
          last_login: string | null
          nom: string | null
          permission_count: number | null
          prenom: string | null
          roles: Json | null
          site_count: number | null
          sites: Json | null
          telephone: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_users_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      check_domain_has_articles: {
        Args: { p_domaine_id: string }
        Returns: boolean
      }
      check_sous_domaine_has_articles: {
        Args: { p_sous_domaine_id: string }
        Returns: boolean
      }
      client_admin_get_user_overview: {
        Args: {
          p_page?: number
          p_page_size?: number
          p_search?: string
          p_site_id?: string
          p_status?: string
        }
        Returns: {
          actif: boolean
          avatar_url: string
          email: string
          id: string
          is_client_admin: boolean
          nom: string
          permission_count: number
          prenom: string
          roles: Json
          site_count: number
          sites: Json
          telephone: string
          total_count: number
        }[]
      }
      get_all_client_users: {
        Args: {
          filter_client_id?: string
          filter_status?: string
          page_num?: number
          page_size?: number
          search_term?: string
        }
        Returns: {
          actif: boolean
          avatar_url: string
          client_data: Json
          client_id: string
          created_at: string
          email: string
          id: string
          is_client_admin: boolean
          nom: string
          prenom: string
          roles_data: Json
          sites_data: Json
          telephone: string
          total_count: number
          updated_at: string
        }[]
      }
      get_applicable_textes_for_site: {
        Args: { p_site_id: string }
        Returns: {
          date_publication: string
          id: string
          reference: string
          titre: string
          type: string
        }[]
      }
      get_article_version_impact: {
        Args: { p_article_id: string }
        Returns: Json
      }
      get_bulk_site_modules: {
        Args: { site_ids: string[] }
        Returns: {
          modules: Json
          site_id: string
        }[]
      }
      get_site_enabled_modules: {
        Args: { _site_id: string }
        Returns: {
          code: string
          couleur: string
          description: string
          icon: string
          libelle: string
          module_id: string
          ordre: number
        }[]
      }
      get_site_modules_summary: {
        Args: { p_site_id: string }
        Returns: {
          enabled_modules_count: number
          has_bibliotheque: boolean
          has_veille: boolean
          module_codes: string[]
          site_id: string
          site_name: string
          total_modules_count: number
        }[]
      }
      get_site_permissions: {
        Args: { p_site_id: string; p_user_id: string }
        Returns: {
          action: string
          decision: Database["public"]["Enums"]["permission_decision"]
          module: string
          scope: Database["public"]["Enums"]["permission_scope"]
        }[]
      }
      get_user_sites: {
        Args: { _user_id: string }
        Returns: {
          client_id: string
          client_name: string
          site_id: string
          site_name: string
        }[]
      }
      get_user_sites_with_permissions: {
        Args: { p_user_id: string }
        Returns: {
          permission_count: number
          site_active: boolean
          site_id: string
          site_name: string
        }[]
      }
      has_client_access: {
        Args: { _client_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
      has_site_access: {
        Args: { _site_id: string; _user_id: string }
        Returns: boolean
      }
      is_module_enabled_for_site: {
        Args: { _module_id: string; _site_id: string }
        Returns: boolean
      }
      log_user_management_action: {
        Args: {
          p_action_type: string
          p_after_state?: Json
          p_before_state?: Json
          p_changes?: Json
          p_client_id?: string
          p_site_id?: string
          p_target_user_id: string
        }
        Returns: string
      }
      quick_enable_site_modules: {
        Args: { p_module_codes: string[]; p_site_id: string }
        Returns: Json
      }
      save_site_permissions: {
        Args: {
          p_client_id: string
          p_permissions: Json
          p_site_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      search_textes_reglementaires: {
        Args: { result_limit?: number; search_term: string }
        Returns: {
          date_publication: string
          id: string
          rank: number
          reference: string
          titre: string
          type: string
        }[]
      }
      seed_common_domains: { Args: never; Returns: undefined }
      set_user_domain_scopes: {
        Args: { domaine_ids: string[]; target_user_id: string }
        Returns: undefined
      }
      staff_get_user_overview: {
        Args: {
          p_client_id?: string
          p_page?: number
          p_page_size?: number
          p_search?: string
          p_status?: string
        }
        Returns: {
          actif: boolean
          avatar_url: string
          client_id: string
          client_logo: string
          client_name: string
          email: string
          id: string
          is_client_admin: boolean
          nom: string
          permission_count: number
          prenom: string
          roles: Json
          site_count: number
          sites: Json
          telephone: string
          total_count: number
        }[]
      }
      validate_site_permissions: {
        Args: { p_permissions: Json }
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
      permission_decision: "allow" | "deny" | "inherit"
      permission_scope: "global" | "tenant" | "site"
      priorite: "haute" | "moyenne" | "basse"
      role_type: "team" | "client"
      statut_action: "a_faire" | "en_cours" | "terminee" | "annulee"
      statut_version_article: "en_vigueur" | "abrogee" | "remplacee"
      statut_visite: "programmee" | "effectuee" | "annulee" | "reportee"
      type_document_medical: "aptitude" | "inaptitude" | "restriction" | "autre"
      type_texte_reglementaire: "loi" | "decret" | "arrete" | "circulaire"
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
      permission_decision: ["allow", "deny", "inherit"],
      permission_scope: ["global", "tenant", "site"],
      priorite: ["haute", "moyenne", "basse"],
      role_type: ["team", "client"],
      statut_action: ["a_faire", "en_cours", "terminee", "annulee"],
      statut_version_article: ["en_vigueur", "abrogee", "remplacee"],
      statut_visite: ["programmee", "effectuee", "annulee", "reportee"],
      type_document_medical: ["aptitude", "inaptitude", "restriction", "autre"],
      type_texte_reglementaire: ["loi", "decret", "arrete", "circulaire"],
    },
  },
} as const
