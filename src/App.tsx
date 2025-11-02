import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import Sites from "./pages/Sites";
import SiteDetail from "./pages/SiteDetail";
import Abonnement from "./pages/Abonnement";
import Facture from "./pages/Facture";
import Devis from "./pages/Devis";
import FactureAvoir from "./pages/FactureAvoir";
import VeilleReglementaire from "./pages/VeilleReglementaire";
import VeilleDashboard from "./pages/VeilleDashboard";
import VeilleApplicabilite from "./pages/VeilleApplicabilite";
import BibliothequeTextes from "./pages/BibliothequeTextes";
import BibliothequeReglementaire from "./pages/BibliothequeReglementaire";
import BibliothequeNavigationTree from "./pages/BibliothequeNavigationTree";
import BibliothequeTexteDetail from "./pages/BibliothequeTexteDetail";
import BibliothequeTexteArticles from "./pages/BibliothequeTexteArticles";
import BibliothequeArticleVersions from "./pages/BibliothequeArticleVersions";
import BibliothequeTableauDeBord from "./pages/BibliothequeTableauDeBord";
import BibliothequeRechercheIntelligente from "./pages/BibliothequeRechercheIntelligente";
import ArticleVersions from "./pages/ArticleVersions";
import VeilleEvaluation from "./pages/VeilleEvaluation";
import ConformiteEvaluationNew from "./pages/ConformiteEvaluationNew";
import PlanAction from "./pages/PlanAction";
import DomainesPage from "./pages/DomainesPage";
import GestionArticles from "./pages/GestionArticles";
import DossierReglementaire from "./pages/DossierReglementaire";
import ControlesTechniques from "./pages/ControlesTechniques";
import ControlesDashboard from "./pages/ControlesDashboard";
import ControlesEquipements from "./pages/ControlesEquipements";
import ControlesPlanning from "./pages/ControlesPlanning";
import ControlesHistorique from "./pages/ControlesHistorique";
import Incidents from "./pages/Incidents";
import IncidentsDashboard from "./pages/IncidentsDashboard";
import IncidentsAnalyse from "./pages/IncidentsAnalyse";
import IncidentsRecurrents from "./pages/IncidentsRecurrents";
import IncidentsConfiguration from "./pages/IncidentsConfiguration";
import EPI from "./pages/EPI";
import EPIDashboard from "./pages/EPIDashboard";
import EPIDotations from "./pages/EPIDotations";
import EPIDemandes from "./pages/EPIDemandes";
import EPIBibliotheque from "./pages/EPIBibliotheque";
import EPIHistorique from "./pages/EPIHistorique";
import EPIDotationsDetail from "./pages/EPIDotationsDetail";
import Equipements from "./pages/Equipements";
import EquipementsDashboard from "./pages/EquipementsDashboard";
import EquipementsMaintenance from "./pages/EquipementsMaintenance";
import EquipementsPrestataires from "./pages/EquipementsPrestataires";
import EquipementQRView from "./pages/EquipementQRView";
import TextesReglementaires from "./pages/TextesReglementaires";
import TexteDetail from "./pages/TexteDetail";
import TexteForm from "./pages/TexteForm";
import GestionUtilisateurs from "./pages/GestionUtilisateurs";
import GestionRoles from "./pages/GestionRoles";
import RoleManager from "./pages/RoleManager";
import ClientUsers from "./pages/ClientUsers";
import AllClientUsers from "./pages/AllClientUsers";
import VisitesMedicales from "./pages/VisitesMedicales";
import VisitesMedicalesDashboard from "./pages/VisitesMedicalesDashboard";
import Formations from "./pages/Formations";
import FormationsDashboard from "./pages/FormationsDashboard";
import FormationsPlanning from "./pages/FormationsPlanning";
import FormationsParticipants from "./pages/FormationsParticipants";
import FormationsDocuments from "./pages/FormationsDocuments";
import EnvironnementDashboard from "./pages/EnvironnementDashboard";
import EnvironnementDechets from "./pages/EnvironnementDechets";
import EnvironnementSurveillance from "./pages/EnvironnementSurveillance";
import EnvironnementPointsLimites from "./pages/EnvironnementPointsLimites";
import EnvironnementPrestataires from "./pages/EnvironnementPrestataires";
import EmployeeSanteFiche from "./pages/EmployeeSanteFiche";
import VisitesMedicalesPlanification from "./pages/VisitesMedicalesPlanification";
import ComingSoon from "./pages/ComingSoon";
import NotFound from "./pages/NotFound";
import UserProfile from "./pages/UserProfile";
import CodesJuridiques from "./pages/CodesJuridiques";
import CodeDetail from "./pages/CodeDetail";

const queryClient = new QueryClient();

function RootRedirect() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<RootRedirect />} />
            
            {/* Profile page - Full screen without navbar */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected routes with Layout */}
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="clients" element={<Clients />} />
              <Route path="clients/:id" element={<ClientDetail />} />
              <Route 
                path="clients/utilisateurs" 
                element={
                  <ProtectedRoute allowedRoles={["super_admin", "admin_global"]}>
                    <AllClientUsers />
                  </ProtectedRoute>
                } 
              />
              <Route path="client-users" element={<ClientUsers />} />
              <Route path="clients/:clientId/users" element={<ClientUsers />} />
              <Route path="sites" element={<Sites />} />
              <Route path="sites/:id" element={<SiteDetail />} />
              <Route
                path="abonnement"
                element={
                  <ProtectedRoute allowedRoles={["super_admin", "admin_global", "billing_manager"]}>
                    <Abonnement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="facture"
                element={
                  <ProtectedRoute allowedRoles={["super_admin", "admin_global", "billing_manager"]}>
                    <Facture />
                  </ProtectedRoute>
                }
              />
              <Route
                path="devis"
                element={
                  <ProtectedRoute allowedRoles={["super_admin", "admin_global", "billing_manager"]}>
                    <Devis />
                  </ProtectedRoute>
                }
              />
              <Route
                path="facture/avoir"
                element={
                  <ProtectedRoute allowedRoles={["super_admin", "admin_global", "billing_manager"]}>
                    <FactureAvoir />
                  </ProtectedRoute>
                }
              />
              <Route path="actes" element={<TextesReglementaires />} />
              <Route path="actes/nouveau" element={<TexteForm />} />
              <Route path="actes/:id" element={<TexteDetail />} />
              <Route path="actes/:id/editer" element={<TexteForm />} />
              <Route path="actes/:acteId/articles/:articleId/versions" element={<ArticleVersions />} />
              {/* Legacy routes for backward compatibility */}
              <Route path="textes" element={<TextesReglementaires />} />
              <Route path="textes/nouveau" element={<TexteForm />} />
              <Route path="textes/:id" element={<TexteDetail />} />
              <Route path="textes/:id/editer" element={<TexteForm />} />
              <Route path="bibliotheque" element={<Navigate to="/veille/bibliotheque/" replace />} />
              {/* legacy tableau-de-bord -> new dashbord path (client-side redirect) */}
              <Route path="bibliotheque/tableau-de-bord" element={<Navigate to="/veille/bibliotheque/dashbord" replace />} />
              <Route path="bibliotheque/textes/:id" element={<BibliothequeTexteDetail />} />
              <Route path="bibliotheque/textes/:id/articles" element={<BibliothequeTexteArticles />} />
              <Route path="bibliotheque/articles/:articleId/versions" element={<BibliothequeArticleVersions />} />
              <Route path="veille" element={<Navigate to="/veille/dashboard" replace />} />
              <Route path="veille/dashboard" element={<VeilleDashboard />} />
              <Route path="veille/applicabilite" element={<VeilleApplicabilite />} />
              <Route path="veille/bibliotheque" element={<BibliothequeReglementaire />} />
              <Route path="veille/bibliotheque-ancienne" element={<BibliothequeTextes />} />
              <Route path="veille/bibliotheque/textes/:id" element={<BibliothequeTexteDetail />} />
              <Route path="veille/bibliotheque/textes/:id/articles" element={<BibliothequeTexteArticles />} />
              <Route path="veille/bibliotheque/articles/:articleId/versions" element={<BibliothequeArticleVersions />} />
              {/* keep new canonical path /veille/bibliotheque/dashbord and redirect old one */}
              <Route path="veille/bibliotheque/tableau-de-bord" element={<Navigate to="/veille/bibliotheque/dashbord" replace />} />
              <Route path="veille/bibliotheque/dashbord" element={<BibliothequeTableauDeBord />} />
              <Route path="veille/bibliotheque/recherche" element={<BibliothequeRechercheIntelligente />} />
              <Route path="codes-juridiques" element={<CodesJuridiques />} />
              <Route path="codes-juridiques/:id" element={<CodeDetail />} />
              <Route path="veille/evaluation" element={<ConformiteEvaluationNew />} />
              <Route path="veille/evaluation-advanced" element={<VeilleEvaluation />} />
              <Route path="veille/conformite" element={<Navigate to="/veille/evaluation" replace />} />
              <Route path="veille/actions" element={<PlanAction />} />
              {/* Domaines moved under Bibliothèque: add new route and redirect old one */}
              <Route path="veille/domaines" element={<Navigate to="/veille/bibliotheque/domain" replace />} />
              <Route path="veille/bibliotheque/domain" element={<DomainesPage />} />
              <Route path="veille/textes/:id/articles" element={<GestionArticles />} />
              <Route
                path="utilisateurs"
                element={
                  <ProtectedRoute allowedRoles={["Super Admin", "Admin Global", "super_admin", "admin_global"]}>
                    <GestionUtilisateurs />
                  </ProtectedRoute>
                }
              />
              <Route path="roles" element={<GestionRoles />} />
              <Route path="client-users" element={<ClientUsers />} />
              <Route path="clients/:clientId/users" element={<ClientUsers />} />
              <Route path="dossier" element={<DossierReglementaire />} />
              
              {/* Contrôles Routes */}
              <Route path="controles" element={<Navigate to="/controles/dashboard" replace />} />
              <Route path="controles/dashboard" element={<ControlesDashboard />} />
              <Route path="controles/equipements" element={<ControlesEquipements />} />
              <Route path="controles/planning" element={<ControlesPlanning />} />
              <Route path="controles/historique" element={<ControlesHistorique />} />
              
              <Route path="incidents" element={<Incidents />} />
              <Route path="incidents/dashboard" element={<IncidentsDashboard />} />
              <Route path="incidents/analyse" element={<IncidentsAnalyse />} />
              <Route path="incidents/recurrents" element={<IncidentsRecurrents />} />
              <Route path="incidents/configuration" element={<IncidentsConfiguration />} />
              
              {/* EPI Routes */}
              <Route path="epi" element={<EPI />} />
              <Route path="epi/dashboard" element={<EPIDashboard />} />
              <Route path="epi/stock" element={<EPI />} />
              <Route path="epi/dotations" element={<EPIDotations />} />
              <Route path="epi/demandes" element={<EPIDemandes />} />
              <Route path="epi/bibliotheque" element={<EPIBibliotheque />} />
              
              {/* Equipements Routes */}
              <Route path="equipements" element={<Equipements />} />
              <Route path="equipements/dashboard" element={<EquipementsDashboard />} />
              <Route path="equipements/inventaire" element={<Equipements />} />
              <Route path="equipements/maintenance" element={<EquipementsMaintenance />} />
              <Route path="equipements/prestataires" element={<EquipementsPrestataires />} />
              <Route path="audits" element={<ComingSoon title="Audits & Inspections" description="Gestion des audits, inspections et checklists de conformité" />} />
              <Route path="formations" element={<Formations />} />
              <Route path="formations/dashboard" element={<FormationsDashboard />} />
              <Route path="formations/planning" element={<FormationsPlanning />} />
              <Route path="formations/participants" element={<FormationsParticipants />} />
              <Route path="formations/documents" element={<FormationsDocuments />} />
              
              <Route path="environnement/dashboard" element={<EnvironnementDashboard />} />
              <Route path="environnement/dechets" element={<EnvironnementDechets />} />
              <Route path="environnement/surveillance" element={<EnvironnementSurveillance />} />
              <Route path="environnement/points-limites" element={<EnvironnementPointsLimites />} />
              <Route path="environnement/prestataires" element={<EnvironnementPrestataires />} />
              
              <Route path="visites-medicales/dashboard" element={<VisitesMedicalesDashboard />} />
              <Route path="visites-medicales" element={<VisitesMedicales />} />
              <Route path="visites-medicales/planning" element={<VisitesMedicalesPlanification />} />
              <Route path="visites-medicales/employe/:employeeId" element={<EmployeeSanteFiche />} />
              
              <Route path="prestataires" element={<ComingSoon title="Prestataires & Sous-traitants" description="Gestion des contrats et conformité des prestataires externes" />} />
              <Route path="permis" element={<ComingSoon title="Permis de travail" description="Système électronique de permis de travail et accès visiteurs" />} />
            </Route>
            
            {/* Catch-all 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
