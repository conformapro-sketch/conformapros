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
          read_only: boolean
          site_id: string
          tenant_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          read_only?: boolean
          site_id: string
          tenant_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          read_only?: boolean
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
      actes_annexes: {
        Row: {
          acte_id: string
          created_at: string
          file_url: string
          id: string
          label: string
          updated_at: string
        }
        Insert: {
          acte_id: string
          created_at?: string
          file_url: string
          id?: string
          label: string
          updated_at?: string
        }
        Update: {
          acte_id?: string
          created_at?: string
          file_url?: string
          id?: string
          label?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "actes_annexes_acte_id_fkey"
            columns: ["acte_id"]
            isOneToOne: false
            referencedRelation: "actes_reglementaires"
            referencedColumns: ["id"]
          },
        ]
      }
      actes_applicabilite_mapping: {
        Row: {
          acte_id: string
          created_at: string
          id: string
          match_score: number | null
          sous_domaine_id: string
        }
        Insert: {
          acte_id: string
          created_at?: string
          id?: string
          match_score?: number | null
          sous_domaine_id: string
        }
        Update: {
          acte_id?: string
          created_at?: string
          id?: string
          match_score?: number | null
          sous_domaine_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "actes_applicabilite_mapping_acte_id_fkey"
            columns: ["acte_id"]
            isOneToOne: false
            referencedRelation: "actes_reglementaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actes_applicabilite_mapping_sous_domaine_id_fkey"
            columns: ["sous_domaine_id"]
            isOneToOne: false
            referencedRelation: "sous_domaines_application"
            referencedColumns: ["id"]
          },
        ]
      }
      actes_reglementaires: {
        Row: {
          annee: number | null
          autorite_emettrice: string | null
          created_at: string
          date_abrogation: string | null
          date_effet: string | null
          date_publication: string | null
          id: string
          intitule: string
          lien_officiel: string | null
          pdf_url: string | null
          reference_officielle: string
          resume: string | null
          statut_vigueur: string | null
          texte_integral: string | null
          type_acte: string
          updated_at: string
          version: number | null
        }
        Insert: {
          annee?: number | null
          autorite_emettrice?: string | null
          created_at?: string
          date_abrogation?: string | null
          date_effet?: string | null
          date_publication?: string | null
          id?: string
          intitule: string
          lien_officiel?: string | null
          pdf_url?: string | null
          reference_officielle: string
          resume?: string | null
          statut_vigueur?: string | null
          texte_integral?: string | null
          type_acte: string
          updated_at?: string
          version?: number | null
        }
        Update: {
          annee?: number | null
          autorite_emettrice?: string | null
          created_at?: string
          date_abrogation?: string | null
          date_effet?: string | null
          date_publication?: string | null
          id?: string
          intitule?: string
          lien_officiel?: string | null
          pdf_url?: string | null
          reference_officielle?: string
          resume?: string | null
          statut_vigueur?: string | null
          texte_integral?: string | null
          type_acte?: string
          updated_at?: string
          version?: number | null
        }
        Relationships: []
      }
      actes_reglementaires_domaines: {
        Row: {
          acte_id: string
          created_at: string | null
          domaine_id: string
          id: string
        }
        Insert: {
          acte_id: string
          created_at?: string | null
          domaine_id: string
          id?: string
        }
        Update: {
          acte_id?: string
          created_at?: string | null
          domaine_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "actes_reglementaires_domaines_acte_id_fkey"
            columns: ["acte_id"]
            isOneToOne: false
            referencedRelation: "actes_reglementaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actes_reglementaires_domaines_domaine_id_fkey"
            columns: ["domaine_id"]
            isOneToOne: false
            referencedRelation: "domaines_application"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actes_reglementaires_domaines_domaine_id_fkey"
            columns: ["domaine_id"]
            isOneToOne: false
            referencedRelation: "domaines_reglementaires"
            referencedColumns: ["id"]
          },
        ]
      }
      actions_correctives: {
        Row: {
          conformite_id: string
          cout_estime: number | null
          created_at: string
          created_by: string | null
          date_echeance: string | null
          description: string | null
          id: string
          incident_id: string | null
          manquement: string | null
          priorite: string
          responsable_id: string | null
          statut: string
          titre: string
          updated_at: string
        }
        Insert: {
          conformite_id: string
          cout_estime?: number | null
          created_at?: string
          created_by?: string | null
          date_echeance?: string | null
          description?: string | null
          id?: string
          incident_id?: string | null
          manquement?: string | null
          priorite?: string
          responsable_id?: string | null
          statut?: string
          titre: string
          updated_at?: string
        }
        Update: {
          conformite_id?: string
          cout_estime?: number | null
          created_at?: string
          created_by?: string | null
          date_echeance?: string | null
          description?: string | null
          id?: string
          incident_id?: string | null
          manquement?: string | null
          priorite?: string
          responsable_id?: string | null
          statut?: string
          titre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "actions_correctives_conformite_id_fkey"
            columns: ["conformite_id"]
            isOneToOne: false
            referencedRelation: "conformite"
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
      applicabilite: {
        Row: {
          activite: string | null
          applicable: string
          article_id: string
          commentaire_non_applicable: string | null
          created_at: string
          id: string
          justification: string | null
          motif_non_applicable: string | null
          site_id: string
          texte_id: string
          updated_at: string
        }
        Insert: {
          activite?: string | null
          applicable?: string
          article_id: string
          commentaire_non_applicable?: string | null
          created_at?: string
          id?: string
          justification?: string | null
          motif_non_applicable?: string | null
          site_id: string
          texte_id: string
          updated_at?: string
        }
        Update: {
          activite?: string | null
          applicable?: string
          article_id?: string
          commentaire_non_applicable?: string | null
          created_at?: string
          id?: string
          justification?: string | null
          motif_non_applicable?: string | null
          site_id?: string
          texte_id?: string
          updated_at?: string
        }
        Relationships: []
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
      changelog_reglementaire: {
        Row: {
          acte_id: string
          created_at: string
          created_by: string | null
          date_changement: string
          description: string
          id: string
          type_changement: string
          version: number
        }
        Insert: {
          acte_id: string
          created_at?: string
          created_by?: string | null
          date_changement: string
          description: string
          id?: string
          type_changement: string
          version: number
        }
        Update: {
          acte_id?: string
          created_at?: string
          created_by?: string | null
          date_changement?: string
          description?: string
          id?: string
          type_changement?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "changelog_reglementaire_acte_id_fkey"
            columns: ["acte_id"]
            isOneToOne: false
            referencedRelation: "actes_reglementaires"
            referencedColumns: ["id"]
          },
        ]
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
          adresse_siege: string | null
          billing_mode: string | null
          code_postal: string | null
          couleur_primaire: string | null
          created_at: string
          currency: string | null
          delegation: string | null
          email: string | null
          gouvernorat: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          matricule_fiscale: string | null
          max_users: number | null
          max_users_notes: string | null
          nom: string
          nom_legal: string | null
          notes: string | null
          pays: string | null
          rne_rc: string | null
          secteur: string | null
          siret: string | null
          site_web: string | null
          statut: string | null
          telephone: string | null
          tenant_id: string | null
          updated_at: string
          ville: string | null
        }
        Insert: {
          adresse?: string | null
          adresse_siege?: string | null
          billing_mode?: string | null
          code_postal?: string | null
          couleur_primaire?: string | null
          created_at?: string
          currency?: string | null
          delegation?: string | null
          email?: string | null
          gouvernorat?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          matricule_fiscale?: string | null
          max_users?: number | null
          max_users_notes?: string | null
          nom: string
          nom_legal?: string | null
          notes?: string | null
          pays?: string | null
          rne_rc?: string | null
          secteur?: string | null
          siret?: string | null
          site_web?: string | null
          statut?: string | null
          telephone?: string | null
          tenant_id?: string | null
          updated_at?: string
          ville?: string | null
        }
        Update: {
          adresse?: string | null
          adresse_siege?: string | null
          billing_mode?: string | null
          code_postal?: string | null
          couleur_primaire?: string | null
          created_at?: string
          currency?: string | null
          delegation?: string | null
          email?: string | null
          gouvernorat?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          matricule_fiscale?: string | null
          max_users?: number | null
          max_users_notes?: string | null
          nom?: string
          nom_legal?: string | null
          notes?: string | null
          pays?: string | null
          rne_rc?: string | null
          secteur?: string | null
          siret?: string | null
          site_web?: string | null
          statut?: string | null
          telephone?: string | null
          tenant_id?: string | null
          updated_at?: string
          ville?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "domaines_application"
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
          abreviation: string
          created_at: string
          deleted_at: string | null
          description: string | null
          domaine_reglementaire_id: string | null
          id: string
          nom_officiel: string
          reference_jort: string | null
          updated_at: string
        }
        Insert: {
          abreviation: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          domaine_reglementaire_id?: string | null
          id?: string
          nom_officiel: string
          reference_jort?: string | null
          updated_at?: string
        }
        Update: {
          abreviation?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          domaine_reglementaire_id?: string | null
          id?: string
          nom_officiel?: string
          reference_jort?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "codes_juridiques_domaine_reglementaire_id_fkey"
            columns: ["domaine_reglementaire_id"]
            isOneToOne: false
            referencedRelation: "domaines_application"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "codes_juridiques_domaine_reglementaire_id_fkey"
            columns: ["domaine_reglementaire_id"]
            isOneToOne: false
            referencedRelation: "domaines_reglementaires"
            referencedColumns: ["id"]
          },
        ]
      }
      conformite: {
        Row: {
          applicabilite_id: string
          commentaire: string | null
          created_at: string
          date_evaluation: string | null
          derniere_mise_a_jour: string | null
          etat: string
          evaluateur_id: string | null
          id: string
          mise_a_jour_par: string | null
          score: number | null
          score_conformite: number | null
          updated_at: string
        }
        Insert: {
          applicabilite_id: string
          commentaire?: string | null
          created_at?: string
          date_evaluation?: string | null
          derniere_mise_a_jour?: string | null
          etat?: string
          evaluateur_id?: string | null
          id?: string
          mise_a_jour_par?: string | null
          score?: number | null
          score_conformite?: number | null
          updated_at?: string
        }
        Update: {
          applicabilite_id?: string
          commentaire?: string | null
          created_at?: string
          date_evaluation?: string | null
          derniere_mise_a_jour?: string | null
          etat?: string
          evaluateur_id?: string | null
          id?: string
          mise_a_jour_par?: string | null
          score?: number | null
          score_conformite?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conformite_applicabilite_id_fkey"
            columns: ["applicabilite_id"]
            isOneToOne: false
            referencedRelation: "applicabilite"
            referencedColumns: ["id"]
          },
        ]
      }
      delegations: {
        Row: {
          code: string | null
          created_at: string | null
          gouvernorat_id: string
          id: string
          nom: string
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          gouvernorat_id: string
          id?: string
          nom: string
        }
        Update: {
          code?: string | null
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
          statut_emploi: string | null
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
          statut_emploi?: string | null
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
          statut_emploi?: string | null
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
          code_article: string
          created_at: string
          date_attribution: string | null
          date_mise_au_rebut: string | null
          date_reception: string | null
          employe_id: string | null
          id: string
          marque: string | null
          modele: string | null
          observations: string | null
          site_id: string | null
          statut: string | null
          taille: string | null
          type_id: string | null
          updated_at: string
        }
        Insert: {
          code_article: string
          created_at?: string
          date_attribution?: string | null
          date_mise_au_rebut?: string | null
          date_reception?: string | null
          employe_id?: string | null
          id?: string
          marque?: string | null
          modele?: string | null
          observations?: string | null
          site_id?: string | null
          statut?: string | null
          taille?: string | null
          type_id?: string | null
          updated_at?: string
        }
        Update: {
          code_article?: string
          created_at?: string
          date_attribution?: string | null
          date_mise_au_rebut?: string | null
          date_reception?: string | null
          employe_id?: string | null
          id?: string
          marque?: string | null
          modele?: string | null
          observations?: string | null
          site_id?: string | null
          statut?: string | null
          taille?: string | null
          type_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "epi_articles_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "epi_articles_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "epi_articles_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "epi_types"
            referencedColumns: ["id"]
          },
        ]
      }
      epi_demandes: {
        Row: {
          created_at: string
          date_demande: string | null
          date_traitement: string | null
          employe_id: string | null
          id: string
          motif: string | null
          observations: string | null
          quantite: number | null
          site_id: string | null
          statut: string | null
          taille: string | null
          traite_par: string | null
          type_id: string | null
        }
        Insert: {
          created_at?: string
          date_demande?: string | null
          date_traitement?: string | null
          employe_id?: string | null
          id?: string
          motif?: string | null
          observations?: string | null
          quantite?: number | null
          site_id?: string | null
          statut?: string | null
          taille?: string | null
          traite_par?: string | null
          type_id?: string | null
        }
        Update: {
          created_at?: string
          date_demande?: string | null
          date_traitement?: string | null
          employe_id?: string | null
          id?: string
          motif?: string | null
          observations?: string | null
          quantite?: number | null
          site_id?: string | null
          statut?: string | null
          taille?: string | null
          traite_par?: string | null
          type_id?: string | null
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
            foreignKeyName: "epi_demandes_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "epi_demandes_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "epi_types"
            referencedColumns: ["id"]
          },
        ]
      }
      epi_mouvements: {
        Row: {
          article_id: string | null
          created_at: string
          date_mouvement: string
          effectue_par: string | null
          employe_id: string | null
          id: string
          motif: string | null
          quantite: number | null
          type_mouvement: string
        }
        Insert: {
          article_id?: string | null
          created_at?: string
          date_mouvement?: string
          effectue_par?: string | null
          employe_id?: string | null
          id?: string
          motif?: string | null
          quantite?: number | null
          type_mouvement: string
        }
        Update: {
          article_id?: string | null
          created_at?: string
          date_mouvement?: string
          effectue_par?: string | null
          employe_id?: string | null
          id?: string
          motif?: string | null
          quantite?: number | null
          type_mouvement?: string
        }
        Relationships: [
          {
            foreignKeyName: "epi_mouvements_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "epi_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "epi_mouvements_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
        ]
      }
      epi_types: {
        Row: {
          actif: boolean | null
          categorie: string
          code: string
          created_at: string
          description: string | null
          duree_vie_moyenne_mois: number | null
          fiche_technique_url: string | null
          id: string
          libelle: string
          normes_certifications: Json | null
          photo_url: string | null
          specifications_techniques: Json | null
          updated_at: string
        }
        Insert: {
          actif?: boolean | null
          categorie: string
          code: string
          created_at?: string
          description?: string | null
          duree_vie_moyenne_mois?: number | null
          fiche_technique_url?: string | null
          id?: string
          libelle: string
          normes_certifications?: Json | null
          photo_url?: string | null
          specifications_techniques?: Json | null
          updated_at?: string
        }
        Update: {
          actif?: boolean | null
          categorie?: string
          code?: string
          created_at?: string
          description?: string | null
          duree_vie_moyenne_mois?: number | null
          fiche_technique_url?: string | null
          id?: string
          libelle?: string
          normes_certifications?: Json | null
          photo_url?: string | null
          specifications_techniques?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      equipements: {
        Row: {
          cout_maintenance_annuel: number | null
          created_at: string
          date_mise_service: string | null
          derniere_verification: string | null
          fichier_certificat_url: string | null
          id: string
          localisation: string | null
          marque: string | null
          modele: string | null
          nom: string
          numero_serie: string | null
          observations: string | null
          periodicite_mois: number | null
          prestataire_id: string | null
          prochaine_verification: string | null
          qr_code: string | null
          site_id: string
          statut: string | null
          type_equipement: string
          updated_at: string
        }
        Insert: {
          cout_maintenance_annuel?: number | null
          created_at?: string
          date_mise_service?: string | null
          derniere_verification?: string | null
          fichier_certificat_url?: string | null
          id?: string
          localisation?: string | null
          marque?: string | null
          modele?: string | null
          nom: string
          numero_serie?: string | null
          observations?: string | null
          periodicite_mois?: number | null
          prestataire_id?: string | null
          prochaine_verification?: string | null
          qr_code?: string | null
          site_id: string
          statut?: string | null
          type_equipement: string
          updated_at?: string
        }
        Update: {
          cout_maintenance_annuel?: number | null
          created_at?: string
          date_mise_service?: string | null
          derniere_verification?: string | null
          fichier_certificat_url?: string | null
          id?: string
          localisation?: string | null
          marque?: string | null
          modele?: string | null
          nom?: string
          numero_serie?: string | null
          observations?: string | null
          periodicite_mois?: number | null
          prestataire_id?: string | null
          prochaine_verification?: string | null
          qr_code?: string | null
          site_id?: string
          statut?: string | null
          type_equipement?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipements_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      equipements_controle: {
        Row: {
          created_at: string
          date_controle: string
          document_url: string | null
          equipement_id: string
          id: string
          observations: string | null
          organisme_controleur: string | null
          prochain_controle: string | null
          prochaine_echeance: string | null
          resultat: string | null
          statut_conformite: string | null
          type_controle: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_controle: string
          document_url?: string | null
          equipement_id: string
          id?: string
          observations?: string | null
          organisme_controleur?: string | null
          prochain_controle?: string | null
          prochaine_echeance?: string | null
          resultat?: string | null
          statut_conformite?: string | null
          type_controle: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_controle?: string
          document_url?: string | null
          equipement_id?: string
          id?: string
          observations?: string | null
          organisme_controleur?: string | null
          prochain_controle?: string | null
          prochaine_echeance?: string | null
          resultat?: string | null
          statut_conformite?: string | null
          type_controle?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipements_controle_equipement_id_fkey"
            columns: ["equipement_id"]
            isOneToOne: false
            referencedRelation: "equipements"
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
      formation_documents: {
        Row: {
          created_at: string
          description: string | null
          file_name: string | null
          file_size: number | null
          file_url: string
          formation_id: string
          id: string
          titre: string
          type_document: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url: string
          formation_id: string
          id?: string
          titre: string
          type_document: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string
          formation_id?: string
          id?: string
          titre?: string
          type_document?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "formation_documents_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations"
            referencedColumns: ["id"]
          },
        ]
      }
      formation_participants: {
        Row: {
          certificat_numero: string | null
          certificat_url: string | null
          commentaire: string | null
          created_at: string
          date_certificat: string | null
          employe_id: string
          formation_id: string
          id: string
          note: number | null
          present: boolean | null
          reussite: boolean | null
          updated_at: string
        }
        Insert: {
          certificat_numero?: string | null
          certificat_url?: string | null
          commentaire?: string | null
          created_at?: string
          date_certificat?: string | null
          employe_id: string
          formation_id: string
          id?: string
          note?: number | null
          present?: boolean | null
          reussite?: boolean | null
          updated_at?: string
        }
        Update: {
          certificat_numero?: string | null
          certificat_url?: string | null
          commentaire?: string | null
          created_at?: string
          date_certificat?: string | null
          employe_id?: string
          formation_id?: string
          id?: string
          note?: number | null
          present?: boolean | null
          reussite?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "formation_participants_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formation_participants_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations"
            referencedColumns: ["id"]
          },
        ]
      }
      formations: {
        Row: {
          created_at: string
          created_by: string | null
          date_prevue: string | null
          date_realisee: string | null
          domaine: string
          duree_heures: number | null
          formateur_contact: string | null
          formateur_email: string | null
          formateur_nom: string | null
          id: string
          intitule: string
          lieu: string | null
          objectif: string | null
          organisme_formation: string | null
          prochaine_echeance: string | null
          reference: string
          site_id: string
          statut: string
          type_formation: string
          updated_at: string
          validite_mois: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date_prevue?: string | null
          date_realisee?: string | null
          domaine: string
          duree_heures?: number | null
          formateur_contact?: string | null
          formateur_email?: string | null
          formateur_nom?: string | null
          id?: string
          intitule: string
          lieu?: string | null
          objectif?: string | null
          organisme_formation?: string | null
          prochaine_echeance?: string | null
          reference: string
          site_id: string
          statut?: string
          type_formation?: string
          updated_at?: string
          validite_mois?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date_prevue?: string | null
          date_realisee?: string | null
          domaine?: string
          duree_heures?: number | null
          formateur_contact?: string | null
          formateur_email?: string | null
          formateur_nom?: string | null
          id?: string
          intitule?: string
          lieu?: string | null
          objectif?: string | null
          organisme_formation?: string | null
          prochaine_echeance?: string | null
          reference?: string
          site_id?: string
          statut?: string
          type_formation?: string
          updated_at?: string
          validite_mois?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "formations_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      gouvernorats: {
        Row: {
          code: string | null
          created_at: string | null
          id: string
          nom: string
          pays: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          id?: string
          nom: string
          pays?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          id?: string
          nom?: string
          pays?: string | null
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
      incident_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          incident_id: string
          user_id: string | null
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          incident_id: string
          user_id?: string | null
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          incident_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_comments_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_config: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          settings_json: Json
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          settings_json?: Json
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          settings_json?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_config_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_history: {
        Row: {
          action: string
          changes: Json | null
          created_at: string
          id: string
          incident_id: string
          modified_by: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string
          id?: string
          incident_id: string
          modified_by?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string
          id?: string
          incident_id?: string
          modified_by?: string | null
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
          {
            foreignKeyName: "incident_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_question_templates: {
        Row: {
          actif: boolean | null
          created_at: string
          id: string
          questions_json: Json
          type_incident: string
          updated_at: string
        }
        Insert: {
          actif?: boolean | null
          created_at?: string
          id?: string
          questions_json: Json
          type_incident: string
          updated_at?: string
        }
        Update: {
          actif?: boolean | null
          created_at?: string
          id?: string
          questions_json?: Json
          type_incident?: string
          updated_at?: string
        }
        Relationships: []
      }
      incident_recurrent_groups: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          site_id: string | null
          type_incident: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          site_id?: string | null
          type_incident?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          site_id?: string | null
          type_incident?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_recurrent_groups_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_recurrent_mapping: {
        Row: {
          created_at: string
          group_id: string
          id: string
          incident_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          incident_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          incident_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_recurrent_mapping_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "incident_recurrent_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_recurrent_mapping_incident_id_fkey"
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
          created_at: string
          created_by: string | null
          date_cloture: string | null
          date_incident: string
          date_validation: string | null
          declarant_fonction: string | null
          declarant_id: string | null
          declarant_nom: string | null
          description: string
          est_recurrent: boolean | null
          facteur_environnemental: boolean | null
          facteur_humain: boolean | null
          facteur_materiel: boolean | null
          facteur_organisationnel: boolean | null
          gravite: string
          heure_incident: string | null
          hospitalisation: boolean | null
          id: string
          jours_arret: number | null
          mesures_correctives: string | null
          numero_incident: string
          personne_impliquee_id: string | null
          personne_impliquee_nom: string | null
          responsable_suivi_id: string | null
          site_id: string
          statut: string
          type_incident: string
          updated_at: string
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
          created_at?: string
          created_by?: string | null
          date_cloture?: string | null
          date_incident: string
          date_validation?: string | null
          declarant_fonction?: string | null
          declarant_id?: string | null
          declarant_nom?: string | null
          description: string
          est_recurrent?: boolean | null
          facteur_environnemental?: boolean | null
          facteur_humain?: boolean | null
          facteur_materiel?: boolean | null
          facteur_organisationnel?: boolean | null
          gravite: string
          heure_incident?: string | null
          hospitalisation?: boolean | null
          id?: string
          jours_arret?: number | null
          mesures_correctives?: string | null
          numero_incident: string
          personne_impliquee_id?: string | null
          personne_impliquee_nom?: string | null
          responsable_suivi_id?: string | null
          site_id: string
          statut?: string
          type_incident: string
          updated_at?: string
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
          created_at?: string
          created_by?: string | null
          date_cloture?: string | null
          date_incident?: string
          date_validation?: string | null
          declarant_fonction?: string | null
          declarant_id?: string | null
          declarant_nom?: string | null
          description?: string
          est_recurrent?: boolean | null
          facteur_environnemental?: boolean | null
          facteur_humain?: boolean | null
          facteur_materiel?: boolean | null
          facteur_organisationnel?: boolean | null
          gravite?: string
          heure_incident?: string | null
          hospitalisation?: boolean | null
          id?: string
          jours_arret?: number | null
          mesures_correctives?: string | null
          numero_incident?: string
          personne_impliquee_id?: string | null
          personne_impliquee_nom?: string | null
          responsable_suivi_id?: string | null
          site_id?: string
          statut?: string
          type_incident?: string
          updated_at?: string
          validateur_id?: string | null
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incidents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_declarant_id_fkey"
            columns: ["declarant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_validateur_id_fkey"
            columns: ["validateur_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      med_documents: {
        Row: {
          created_at: string
          description: string | null
          file_name: string | null
          id: string
          titre: string
          type_doc: string | null
          type_document: string
          uploaded_by: string | null
          url_document: string
          visite_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name?: string | null
          id?: string
          titre: string
          type_doc?: string | null
          type_document: string
          uploaded_by?: string | null
          url_document: string
          visite_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string | null
          id?: string
          titre?: string
          type_doc?: string | null
          type_document?: string
          uploaded_by?: string | null
          url_document?: string
          visite_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "med_documents_visite_id_fkey"
            columns: ["visite_id"]
            isOneToOne: false
            referencedRelation: "med_visites"
            referencedColumns: ["id"]
          },
        ]
      }
      med_notes_confidentielles: {
        Row: {
          contenu: string
          contre_indications: string | null
          created_at: string
          created_by: string | null
          examens_realises: string | null
          id: string
          observations: string | null
          propositions_amenagement: string | null
          updated_at: string
          updated_by: string | null
          visite_id: string
        }
        Insert: {
          contenu: string
          contre_indications?: string | null
          created_at?: string
          created_by?: string | null
          examens_realises?: string | null
          id?: string
          observations?: string | null
          propositions_amenagement?: string | null
          updated_at?: string
          updated_by?: string | null
          visite_id: string
        }
        Update: {
          contenu?: string
          contre_indications?: string | null
          created_at?: string
          created_by?: string | null
          examens_realises?: string | null
          id?: string
          observations?: string | null
          propositions_amenagement?: string | null
          updated_at?: string
          updated_by?: string | null
          visite_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "med_notes_confidentielles_visite_id_fkey"
            columns: ["visite_id"]
            isOneToOne: true
            referencedRelation: "med_visites"
            referencedColumns: ["id"]
          },
        ]
      }
      med_periodicite_rules: {
        Row: {
          actif: boolean | null
          code: string
          created_at: string
          description: string | null
          id: string
          libelle: string
          periodicite_mois: number
        }
        Insert: {
          actif?: boolean | null
          code: string
          created_at?: string
          description?: string | null
          id?: string
          libelle: string
          periodicite_mois: number
        }
        Update: {
          actif?: boolean | null
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          libelle?: string
          periodicite_mois?: number
        }
        Relationships: []
      }
      med_visites: {
        Row: {
          client_id: string | null
          commentaires: string | null
          created_at: string
          created_by: string | null
          date_planifiee: string
          date_realisee: string | null
          employe_id: string
          id: string
          medecin_nom: string | null
          medecin_organisme: string | null
          medecin_travail: string | null
          motif: string | null
          prochaine_echeance: string | null
          restrictions: string | null
          resultat_aptitude: string | null
          site_id: string | null
          sms_flags: Json | null
          statut_visite: string
          type_visite: string
          updated_at: string
          updated_by: string | null
          validite_jusqua: string | null
        }
        Insert: {
          client_id?: string | null
          commentaires?: string | null
          created_at?: string
          created_by?: string | null
          date_planifiee: string
          date_realisee?: string | null
          employe_id: string
          id?: string
          medecin_nom?: string | null
          medecin_organisme?: string | null
          medecin_travail?: string | null
          motif?: string | null
          prochaine_echeance?: string | null
          restrictions?: string | null
          resultat_aptitude?: string | null
          site_id?: string | null
          sms_flags?: Json | null
          statut_visite?: string
          type_visite: string
          updated_at?: string
          updated_by?: string | null
          validite_jusqua?: string | null
        }
        Update: {
          client_id?: string | null
          commentaires?: string | null
          created_at?: string
          created_by?: string | null
          date_planifiee?: string
          date_realisee?: string | null
          employe_id?: string
          id?: string
          medecin_nom?: string | null
          medecin_organisme?: string | null
          medecin_travail?: string | null
          motif?: string | null
          prochaine_echeance?: string | null
          restrictions?: string | null
          resultat_aptitude?: string | null
          site_id?: string | null
          sms_flags?: Json | null
          statut_visite?: string
          type_visite?: string
          updated_at?: string
          updated_by?: string | null
          validite_jusqua?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "med_visites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "med_visites_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "med_visites_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      modules_systeme: {
        Row: {
          actif: boolean | null
          code: string
          created_at: string
          description: string | null
          id: string
          libelle: string
          updated_at: string
        }
        Insert: {
          actif?: boolean | null
          code: string
          created_at?: string
          description?: string | null
          id?: string
          libelle: string
          updated_at?: string
        }
        Update: {
          actif?: boolean | null
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          libelle?: string
          updated_at?: string
        }
        Relationships: []
      }
      organismes_controle: {
        Row: {
          actif: boolean | null
          adresse: string | null
          agrement: string | null
          created_at: string
          email: string | null
          id: string
          nom: string
          telephone: string | null
        }
        Insert: {
          actif?: boolean | null
          adresse?: string | null
          agrement?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom: string
          telephone?: string | null
        }
        Update: {
          actif?: boolean | null
          adresse?: string | null
          agrement?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom?: string
          telephone?: string | null
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
      prestataire_interventions: {
        Row: {
          commentaire: string | null
          controle_id: string | null
          cout: number | null
          created_at: string
          date_intervention: string
          duree_heures: number | null
          equipement_id: string | null
          evaluation: number | null
          id: string
          prestataire_id: string | null
          rapport_url: string | null
          type_intervention: string
        }
        Insert: {
          commentaire?: string | null
          controle_id?: string | null
          cout?: number | null
          created_at?: string
          date_intervention: string
          duree_heures?: number | null
          equipement_id?: string | null
          evaluation?: number | null
          id?: string
          prestataire_id?: string | null
          rapport_url?: string | null
          type_intervention: string
        }
        Update: {
          commentaire?: string | null
          controle_id?: string | null
          cout?: number | null
          created_at?: string
          date_intervention?: string
          duree_heures?: number | null
          equipement_id?: string | null
          evaluation?: number | null
          id?: string
          prestataire_id?: string | null
          rapport_url?: string | null
          type_intervention?: string
        }
        Relationships: [
          {
            foreignKeyName: "prestataire_interventions_controle_id_fkey"
            columns: ["controle_id"]
            isOneToOne: false
            referencedRelation: "equipements_controle"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestataire_interventions_controle_id_fkey"
            columns: ["controle_id"]
            isOneToOne: false
            referencedRelation: "historique_controles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestataire_interventions_equipement_id_fkey"
            columns: ["equipement_id"]
            isOneToOne: false
            referencedRelation: "equipements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestataire_interventions_prestataire_id_fkey"
            columns: ["prestataire_id"]
            isOneToOne: false
            referencedRelation: "prestataires"
            referencedColumns: ["id"]
          },
        ]
      }
      prestataires: {
        Row: {
          actif: boolean | null
          adresse: string | null
          certifications: Json | null
          contact_email: string | null
          contact_nom: string | null
          contact_telephone: string | null
          created_at: string
          domaines_intervention: Json | null
          evaluation_moyenne: number | null
          id: string
          nom: string
          type_prestation: string | null
          updated_at: string
        }
        Insert: {
          actif?: boolean | null
          adresse?: string | null
          certifications?: Json | null
          contact_email?: string | null
          contact_nom?: string | null
          contact_telephone?: string | null
          created_at?: string
          domaines_intervention?: Json | null
          evaluation_moyenne?: number | null
          id?: string
          nom: string
          type_prestation?: string | null
          updated_at?: string
        }
        Update: {
          actif?: boolean | null
          adresse?: string | null
          certifications?: Json | null
          contact_email?: string | null
          contact_nom?: string | null
          contact_telephone?: string | null
          created_at?: string
          domaines_intervention?: Json | null
          evaluation_moyenne?: number | null
          id?: string
          nom?: string
          type_prestation?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      preuves: {
        Row: {
          conformite_id: string
          created_at: string
          date_document: string | null
          description: string | null
          id: string
          titre: string
          type_document: string | null
          uploaded_by: string | null
          url_document: string
        }
        Insert: {
          conformite_id: string
          created_at?: string
          date_document?: string | null
          description?: string | null
          id?: string
          titre: string
          type_document?: string | null
          uploaded_by?: string | null
          url_document: string
        }
        Update: {
          conformite_id?: string
          created_at?: string
          date_document?: string | null
          description?: string | null
          id?: string
          titre?: string
          type_document?: string | null
          uploaded_by?: string | null
          url_document?: string
        }
        Relationships: [
          {
            foreignKeyName: "preuves_conformite_id_fkey"
            columns: ["conformite_id"]
            isOneToOne: false
            referencedRelation: "conformite"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          actif: boolean
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          is_client_admin: boolean | null
          managed_client_id: string | null
          nom: string | null
          prenom: string | null
          telephone: string | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          actif?: boolean
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          is_client_admin?: boolean | null
          managed_client_id?: string | null
          nom?: string | null
          prenom?: string | null
          telephone?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          actif?: boolean
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          is_client_admin?: boolean | null
          managed_client_id?: string | null
          nom?: string | null
          prenom?: string | null
          telephone?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_managed_client_id_fkey"
            columns: ["managed_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
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
          created_at: string
          decision: Database["public"]["Enums"]["permission_decision"]
          id: string
          module: string
          role_id: string
          scope: Database["public"]["Enums"]["permission_scope"]
        }
        Insert: {
          action: string
          created_at?: string
          decision?: Database["public"]["Enums"]["permission_decision"]
          id?: string
          module: string
          role_id: string
          scope?: Database["public"]["Enums"]["permission_scope"]
        }
        Update: {
          action?: string
          created_at?: string
          decision?: Database["public"]["Enums"]["permission_decision"]
          id?: string
          module?: string
          role_id?: string
          scope?: Database["public"]["Enums"]["permission_scope"]
        }
        Relationships: [
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
          created_at: string
          date_derniere_evaluation: string | null
          etat_conformite: Database["public"]["Enums"]["etat_conformite"]
          evaluateur_id: string | null
          id: string
          site_id: string
          updated_at: string
        }
        Insert: {
          applicabilite?: Database["public"]["Enums"]["applicabilite_reglementaire"]
          article_id: string
          commentaire?: string | null
          created_at?: string
          date_derniere_evaluation?: string | null
          etat_conformite?: Database["public"]["Enums"]["etat_conformite"]
          evaluateur_id?: string | null
          id?: string
          site_id: string
          updated_at?: string
        }
        Update: {
          applicabilite?: Database["public"]["Enums"]["applicabilite_reglementaire"]
          article_id?: string
          commentaire?: string | null
          created_at?: string
          date_derniere_evaluation?: string | null
          etat_conformite?: Database["public"]["Enums"]["etat_conformite"]
          evaluateur_id?: string | null
          id?: string
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
          created_at: string
          enabled: boolean | null
          enabled_at: string | null
          enabled_by: string | null
          id: string
          module_id: string
          site_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean | null
          enabled_at?: string | null
          enabled_by?: string | null
          id?: string
          module_id: string
          site_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean | null
          enabled_at?: string | null
          enabled_by?: string | null
          id?: string
          module_id?: string
          site_id?: string
          updated_at?: string
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
          created_at: string
          domaine_id: string
          enabled: boolean | null
          id: string
          site_id: string
        }
        Insert: {
          created_at?: string
          domaine_id: string
          enabled?: boolean | null
          id?: string
          site_id: string
        }
        Update: {
          created_at?: string
          domaine_id?: string
          enabled?: boolean | null
          id?: string
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_veille_domaines_domaine_id_fkey"
            columns: ["domaine_id"]
            isOneToOne: false
            referencedRelation: "domaines_application"
            referencedColumns: ["id"]
          },
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
          code_site: string
          coordonnees_gps_lat: number | null
          coordonnees_gps_lng: number | null
          created_at: string
          delegation: string | null
          effectif: number | null
          email: string | null
          equipements_critiques: Json | null
          est_siege: boolean | null
          gouvernorat: string | null
          id: string
          latitude: number | null
          localite: string | null
          longitude: number | null
          matricule_fiscale: string | null
          niveau_risque: string | null
          nom: string
          nom_site: string
          nombre_employes: number | null
          pays: string | null
          responsable_site: string | null
          secteur_activite: string | null
          superficie: number | null
          surface: number | null
          telephone: string | null
          tenant_id: string | null
          updated_at: string
          ville: string | null
        }
        Insert: {
          activite?: string | null
          adresse?: string | null
          classification?: string | null
          client_id: string
          code_postal?: string | null
          code_site: string
          coordonnees_gps_lat?: number | null
          coordonnees_gps_lng?: number | null
          created_at?: string
          delegation?: string | null
          effectif?: number | null
          email?: string | null
          equipements_critiques?: Json | null
          est_siege?: boolean | null
          gouvernorat?: string | null
          id?: string
          latitude?: number | null
          localite?: string | null
          longitude?: number | null
          matricule_fiscale?: string | null
          niveau_risque?: string | null
          nom: string
          nom_site: string
          nombre_employes?: number | null
          pays?: string | null
          responsable_site?: string | null
          secteur_activite?: string | null
          superficie?: number | null
          surface?: number | null
          telephone?: string | null
          tenant_id?: string | null
          updated_at?: string
          ville?: string | null
        }
        Update: {
          activite?: string | null
          adresse?: string | null
          classification?: string | null
          client_id?: string
          code_postal?: string | null
          code_site?: string
          coordonnees_gps_lat?: number | null
          coordonnees_gps_lng?: number | null
          created_at?: string
          delegation?: string | null
          effectif?: number | null
          email?: string | null
          equipements_critiques?: Json | null
          est_siege?: boolean | null
          gouvernorat?: string | null
          id?: string
          latitude?: number | null
          localite?: string | null
          longitude?: number | null
          matricule_fiscale?: string | null
          niveau_risque?: string | null
          nom?: string
          nom_site?: string
          nombre_employes?: number | null
          pays?: string | null
          responsable_site?: string | null
          secteur_activite?: string | null
          superficie?: number | null
          surface?: number | null
          telephone?: string | null
          tenant_id?: string | null
          updated_at?: string
          ville?: string | null
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
          actif: boolean | null
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
          actif?: boolean | null
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
          actif?: boolean | null
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
            referencedRelation: "domaines_application"
            referencedColumns: ["id"]
          },
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
      tenants: {
        Row: {
          created_at: string
          id: string
          nom: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nom: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nom?: string
          updated_at?: string
        }
        Relationships: []
      }
      textes_articles: {
        Row: {
          contenu: string
          created_at: string
          id: string
          indicatif: boolean
          numero: string | null
          numero_article: string
          ordre: number | null
          parent_article_id: string | null
          reference: string | null
          resume: string | null
          texte_id: string
          titre: string | null
          titre_court: string | null
          updated_at: string
          version_active: string | null
        }
        Insert: {
          contenu: string
          created_at?: string
          id?: string
          indicatif?: boolean
          numero?: string | null
          numero_article: string
          ordre?: number | null
          parent_article_id?: string | null
          reference?: string | null
          resume?: string | null
          texte_id: string
          titre?: string | null
          titre_court?: string | null
          updated_at?: string
          version_active?: string | null
        }
        Update: {
          contenu?: string
          created_at?: string
          id?: string
          indicatif?: boolean
          numero?: string | null
          numero_article?: string
          ordre?: number | null
          parent_article_id?: string | null
          reference?: string | null
          resume?: string | null
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
            referencedRelation: "actes_reglementaires"
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
          type_relation: string
        }
        Insert: {
          code_id: string
          created_at?: string
          id?: string
          texte_id: string
          type_relation?: string
        }
        Update: {
          code_id?: string
          created_at?: string
          id?: string
          texte_id?: string
          type_relation?: string
        }
        Relationships: [
          {
            foreignKeyName: "textes_codes_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "codes_juridiques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "textes_codes_texte_id_fkey"
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
          reference_officielle: string | null
          resume: string | null
          statut: string
          statut_vigueur: string | null
          titre: string
          type: string | null
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
          reference_officielle?: string | null
          resume?: string | null
          statut?: string
          statut_vigueur?: string | null
          titre: string
          type?: string | null
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
          reference_officielle?: string | null
          resume?: string | null
          statut?: string
          statut_vigueur?: string | null
          titre?: string
          type?: string | null
          type_texte?: string
          updated_at?: string
        }
        Relationships: []
      }
      types_equipement: {
        Row: {
          actif: boolean | null
          created_at: string
          description: string | null
          id: string
          libelle: string
          periodicite_mois: number | null
        }
        Insert: {
          actif?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          libelle: string
          periodicite_mois?: number | null
        }
        Update: {
          actif?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          libelle?: string
          periodicite_mois?: number | null
        }
        Relationships: []
      }
      user_domain_scopes: {
        Row: {
          created_at: string
          decision: Database["public"]["Enums"]["permission_decision"]
          domaine_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          decision?: Database["public"]["Enums"]["permission_decision"]
          domaine_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          decision?: Database["public"]["Enums"]["permission_decision"]
          domaine_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_domain_scopes_domaine_id_fkey"
            columns: ["domaine_id"]
            isOneToOne: false
            referencedRelation: "domaines_application"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_domain_scopes_domaine_id_fkey"
            columns: ["domaine_id"]
            isOneToOne: false
            referencedRelation: "domaines_reglementaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_domain_scopes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          action: string
          client_id: string
          created_at: string
          created_by: string | null
          decision: Database["public"]["Enums"]["permission_decision"]
          id: string
          module: string
          scope: Database["public"]["Enums"]["permission_scope"]
          site_id: string | null
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          action: string
          client_id: string
          created_at?: string
          created_by?: string | null
          decision?: Database["public"]["Enums"]["permission_decision"]
          id?: string
          module: string
          scope?: Database["public"]["Enums"]["permission_scope"]
          site_id?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          action?: string
          client_id?: string
          created_at?: string
          created_by?: string | null
          decision?: Database["public"]["Enums"]["permission_decision"]
          id?: string
          module?: string
          scope?: Database["public"]["Enums"]["permission_scope"]
          site_id?: string | null
          updated_at?: string
          updated_by?: string | null
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
            foreignKeyName: "user_permissions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          role_uuid: string | null
          site_scope: string[] | null
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          role_uuid?: string | null
          site_scope?: string[] | null
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
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
      domaines_application: {
        Row: {
          code: string | null
          couleur: string | null
          created_at: string | null
          description: string | null
          icone: string | null
          id: string | null
          libelle: string | null
        }
        Insert: {
          code?: string | null
          couleur?: string | null
          created_at?: string | null
          description?: string | null
          icone?: string | null
          id?: string | null
          libelle?: string | null
        }
        Update: {
          code?: string | null
          couleur?: string | null
          created_at?: string | null
          description?: string | null
          icone?: string | null
          id?: string | null
          libelle?: string | null
        }
        Relationships: []
      }
      historique_controles: {
        Row: {
          created_at: string | null
          date_controle: string | null
          document_url: string | null
          equipement_id: string | null
          id: string | null
          observations: string | null
          organisme_controleur: string | null
          prochain_controle: string | null
          resultat: string | null
          type_controle: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_controle?: string | null
          document_url?: string | null
          equipement_id?: string | null
          id?: string | null
          observations?: string | null
          organisme_controleur?: string | null
          prochain_controle?: string | null
          resultat?: string | null
          type_controle?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_controle?: string | null
          document_url?: string | null
          equipement_id?: string | null
          id?: string | null
          observations?: string | null
          organisme_controleur?: string | null
          prochain_controle?: string | null
          resultat?: string | null
          type_controle?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipements_controle_equipement_id_fkey"
            columns: ["equipement_id"]
            isOneToOne: false
            referencedRelation: "equipements"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_manage_client_user: {
        Args: { _actor_id: string; _target_user_id: string }
        Returns: boolean
      }
      check_client_user_limit: {
        Args: { _client_id: string }
        Returns: boolean
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
          tenant_id: string
          total_count: number
          updated_at: string
        }[]
      }
      get_applicable_actes_for_site: {
        Args: { p_site_id: string }
        Returns: {
          acte_id: string
          date_publication: string
          intitule: string
          match_score: number
          reference_officielle: string
          sous_domaine_id: string
          type_acte: string
        }[]
      }
      get_client_user_count: { Args: { _client_id: string }; Returns: number }
      get_conforma_team_users: {
        Args: never
        Returns: {
          actif: boolean
          created_at: string
          email: string
          id: string
          nom: string
          prenom: string
          roles: Json
          telephone: string
          updated_at: string
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
      get_user_tenant_id: { Args: { _user_id: string }; Returns: string }
      has_client_access: {
        Args: { _client_id: string; _user_id: string }
        Returns: boolean
      }
      has_role:
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | { Args: { _role: string; _user_id: string }; Returns: boolean }
      has_site_access: {
        Args: { _site_id: string; _user_id: string }
        Returns: boolean
      }
      has_user_permission: {
        Args: { _action: string; _module: string; _user_id: string }
        Returns: boolean
      }
      is_user_client_admin: {
        Args: { check_client_id: string; user_id: string }
        Returns: boolean
      }
      search_actes_reglementaires: {
        Args: { result_limit?: number; search_term: string }
        Returns: {
          date_publication: string
          id: string
          intitule: string
          rank: number
          reference_officielle: string
          resume: string
          statut_vigueur: string
          type_acte: string
        }[]
      }
      set_user_domain_scopes: {
        Args: { domaine_ids: string[]; target_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "gestionnaire" | "consultant" | "user"
      applicabilite_reglementaire:
        | "obligatoire"
        | "non_applicable"
        | "non_concerne"
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
        "non_applicable",
        "non_concerne",
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
      statut_visite: ["programmee", "effectuee", "annulee", "reportee"],
      type_document_medical: ["aptitude", "inaptitude", "restriction", "autre"],
    },
  },
} as const
