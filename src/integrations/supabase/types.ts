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
          created_at: string
          date_abrogation: string | null
          date_effet: string | null
          date_publication: string | null
          id: string
          intitule: string
          lien_officiel: string | null
          reference_officielle: string
          resume: string | null
          statut_vigueur: string | null
          texte_integral: string | null
          type_acte: string
          updated_at: string
          version: number | null
        }
        Insert: {
          created_at?: string
          date_abrogation?: string | null
          date_effet?: string | null
          date_publication?: string | null
          id?: string
          intitule: string
          lien_officiel?: string | null
          reference_officielle: string
          resume?: string | null
          statut_vigueur?: string | null
          texte_integral?: string | null
          type_acte: string
          updated_at?: string
          version?: number | null
        }
        Update: {
          created_at?: string
          date_abrogation?: string | null
          date_effet?: string | null
          date_publication?: string | null
          id?: string
          intitule?: string
          lien_officiel?: string | null
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
      actions_correctives: {
        Row: {
          conformite_id: string
          cout_estime: number | null
          created_at: string
          created_by: string | null
          date_echeance: string | null
          description: string | null
          id: string
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
      clients: {
        Row: {
          adresse: string | null
          code_postal: string | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          matricule_fiscale: string | null
          nom: string
          nom_legal: string | null
          pays: string | null
          siret: string | null
          statut: string | null
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
          matricule_fiscale?: string | null
          nom: string
          nom_legal?: string | null
          pays?: string | null
          siret?: string | null
          statut?: string | null
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
          matricule_fiscale?: string | null
          nom?: string
          nom_legal?: string | null
          pays?: string | null
          siret?: string | null
          statut?: string | null
          telephone?: string | null
          updated_at?: string
          ville?: string | null
        }
        Relationships: []
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
      domaines_reglementaires: {
        Row: {
          actif: boolean | null
          code: string
          couleur: string | null
          created_at: string
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
      equipements: {
        Row: {
          created_at: string
          date_mise_service: string | null
          derniere_verification: string | null
          id: string
          localisation: string | null
          marque: string | null
          modele: string | null
          nom: string
          numero_serie: string | null
          observations: string | null
          periodicite_mois: number | null
          prochaine_verification: string | null
          site_id: string
          statut: string | null
          type_equipement: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_mise_service?: string | null
          derniere_verification?: string | null
          id?: string
          localisation?: string | null
          marque?: string | null
          modele?: string | null
          nom: string
          numero_serie?: string | null
          observations?: string | null
          periodicite_mois?: number | null
          prochaine_verification?: string | null
          site_id: string
          statut?: string | null
          type_equipement: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_mise_service?: string | null
          derniere_verification?: string | null
          id?: string
          localisation?: string | null
          marque?: string | null
          modele?: string | null
          nom?: string
          numero_serie?: string | null
          observations?: string | null
          periodicite_mois?: number | null
          prochaine_verification?: string | null
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
          resultat: string | null
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
          resultat?: string | null
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
          resultat?: string | null
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
      organismes_controle: {
        Row: {
          adresse: string | null
          agrement: string | null
          created_at: string
          email: string | null
          id: string
          nom: string
          telephone: string | null
        }
        Insert: {
          adresse?: string | null
          agrement?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom: string
          telephone?: string | null
        }
        Update: {
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
          activite: string | null
          adresse: string
          classification: string | null
          client_id: string
          code_postal: string
          code_site: string | null
          created_at: string
          effectif: number | null
          email: string | null
          gouvernorat: string | null
          id: string
          latitude: number | null
          longitude: number | null
          matricule_fiscale: string | null
          nom: string
          nom_site: string | null
          nombre_employes: number | null
          pays: string | null
          surface: number | null
          telephone: string | null
          updated_at: string
          ville: string
        }
        Insert: {
          activite?: string | null
          adresse: string
          classification?: string | null
          client_id: string
          code_postal: string
          code_site?: string | null
          created_at?: string
          effectif?: number | null
          email?: string | null
          gouvernorat?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          matricule_fiscale?: string | null
          nom: string
          nom_site?: string | null
          nombre_employes?: number | null
          pays?: string | null
          surface?: number | null
          telephone?: string | null
          updated_at?: string
          ville: string
        }
        Update: {
          activite?: string | null
          adresse?: string
          classification?: string | null
          client_id?: string
          code_postal?: string
          code_site?: string | null
          created_at?: string
          effectif?: number | null
          email?: string | null
          gouvernorat?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          matricule_fiscale?: string | null
          nom?: string
          nom_site?: string | null
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
      textes_articles: {
        Row: {
          contenu: string
          created_at: string
          id: string
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
          contenu: string
          created_at?: string
          id?: string
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
          contenu?: string
          created_at?: string
          id?: string
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
          created_at: string
          description: string | null
          id: string
          libelle: string
          periodicite_mois: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          libelle: string
          periodicite_mois?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          libelle?: string
          periodicite_mois?: number | null
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
