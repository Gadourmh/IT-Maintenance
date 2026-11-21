import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";




// 🌐 Pages publiques
import Home from "./pages/shared/Home";
import Login from "./pages/shared/Login";
import About from "./pages/shared/About";
import Contact from "./pages/shared/Contact";
import ResetPassword from "./pages/shared/ResetPassword";
import AvisSection from "./pages/shared/AvisSection";
import Chatbot from "./pages/shared/Chatbot";

// 🔐 Pages ADMIN & SUPER_ADMIN
import Dashboard from "./pages/admin/Dashboard";
import GestionClients from "./pages/admin/GestionClients";
import GestionTechniciens from "./pages/admin/GestionTechniciens";
import GestionPersonnel from "./pages/admin/GestionPersonnel";
import GestionTickets from "./pages/admin/GestionTickets";
import GestionInterventions from "./pages/admin/GestionInterventions";
import GestionNotifications from "./pages/admin/GestionNotifications";
import GestionEquipements from "./pages/admin/GestionEquipements";
import GestionTypeEquipements from "./pages/admin/GestionTypeEquipements";
import GestionTypePannes from "./pages/admin/GestionTypePannes";
import Statistiques from "./pages/admin/Statistiques";
import Profile from "./pages/admin/Profile";

import TicketDetail from "./pages/admin/TicketDetail";
import GestionCommentaires from "./pages/admin/GestionCommentaires";

import FinancialReports from "./pages/admin/FinancialReports";
import TransactionHistory from "./pages/admin/TransactionHistory";
import BudgetManagement from "./pages/admin/BudgetManagement";
import PerformanceTracking from "./pages/admin/PerformanceTracking";
import Recruitement from "./pages/admin/Recruitement";
import FactureClientAdmin from "./pages/admin/FactureClientAdmin"

// 👷 Pages TECHNICIEN
import Kanban from "./pages/technicien/Kanban";
import DashboardTechnicien from "./pages/technicien/DashboardTechnicien";
import MesInterventions from "./pages/technicien/MesInterventions";
import MesTicketsTechnicien from "./pages/technicien/MesTicketsTechnicien";
import MonProfilTechnicien from "./pages/technicien/MonProfilTechnicien";

import MesEquipementsTechnicien from "./pages/technicien/MesEquipementsTechnicien";
import MesCommentairesTechnicien from "./pages/technicien/MesCommentairesTechnicien";
import MesPerformancesTechnicien from "./pages/technicien/MesPerformancesTechnicien";


// 👤 Pages CLIENT
import DashboardClient from "./pages/client/Dashboardclient";
import MesTickets from "./pages/client/MesTickets";
import MesEquipements from "./pages/client/MesEquipements";
import MonProfil from "./pages/client/MonProfil";

import MesCommentaires from "./pages/client/MesCommentaires";

import MesFactures from "./pages/client/MesFactures";

// ✅ Pages NORMAL
import DashboardChefService from "./pages/normal/DashboardChefService";
import DashboardComptable from "./pages/normal/DashboardComptable";
import DashboardGestionnaireTickets from "./pages/normal/DashboardGestionnaireTickets";
import DashboardResponsableMaintenance from "./pages/normal/DashboardResponsableMaintenance";
import DashboardRh from "./pages/normal/DashboardRh";
import DashboardSecretaire from "./pages/normal/DashboardSecretaire";
import DashboardSupportClient from "./pages/normal/DashboardSupportClient";

import MesTicketsNormal from "./pages/normal/MesTicketsNormal";
import MesEquipementsNormal from "./pages/normal/MesEquipementsNormal";
import MesCommentairesNormal from "./pages/normal/MesCommentairesNormal";
import MesNotificationsNormal from "./pages/normal/MesNotificationsNormal";
import MonProfilNormal from "./pages/normal/MonProfilNormal";
import MesInterventionsNormal from "./pages/normal/MesInterventionsNormal";

import MesPersonnelsNormal from "./pages/normal/MesPersonnelsNormal";
import MesClientsNormal from "./pages/normal/MesClientsNormal";
import MesTechniciensNormal from "./pages/normal/MesTechniciensNormal";

import FinancialReportsNormal from "./pages/normal/FinancialReportsNormal";
import TransactionHistoryNormal  from "./pages/normal/TransactionHistoryNormal";
import BudgetManagementNormal  from "./pages/normal/BudgetManagementNormal";
import PerformanceTrackingNormal from "./pages/normal/PerformanceTrackingNormal";
import RecruitementNormal from "./pages/normal/RecruitementNormal";
import FactureClient from "./pages/normal/FactureClient";

import MesPerformancesNormal from "./pages/normal/MesPerformancesNormal";


const AppRoutes = () => {
  return (
    <Routes>
      {/* 🌐 Routes publiques */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/avis-section" element={<AvisSection />} />
      <Route path="/chatbot" element={<Chatbot />} />


      {/* 🔐 Routes ADMIN & SUPER_ADMIN */}
      <Route element={<ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]} />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/gestion-clients" element={<GestionClients />} />
        <Route path="/gestion-techniciens" element={<GestionTechniciens />} />
        <Route path="/gestion-personnel" element={<GestionPersonnel />} />
        <Route path="/gestion-tickets" element={<GestionTickets />} />
        <Route path="/gestion-interventions" element={<GestionInterventions />} />
        <Route path="/gestion-notifications" element={<GestionNotifications />} />
        <Route path="/gestion-equipements" element={<GestionEquipements />} />
        <Route path="/gestion-type-equipements" element={<GestionTypeEquipements />} />
        <Route path="/gestion-type-pannes" element={<GestionTypePannes />} />
        <Route path="/statistiques" element={<Statistiques />} />
        <Route path="/gestion-commentaires" element={<GestionCommentaires />} />
      
        <Route path="/profile" element={<Profile />} />
        <Route path="/ticket-detail/:ticketId" element={<TicketDetail />} />

        <Route path="/rapports-financiers" element={<FinancialReports/>} />
        <Route path="/historique-transactions" element={<TransactionHistory/>} />
        <Route path="/gestion-budgets" element={<BudgetManagement />} />
        <Route path="/suivi-performances" element={<PerformanceTracking />} />
        <Route path="/recrutement" element={<Recruitement/>} />
         <Route path="/facture-client-admin" element={<FactureClientAdmin/>} />
      
      </Route>

      {/* 👷 Routes TECHNICIEN */}
      <Route element={<ProtectedRoute allowedRoles={["TECHNICIEN"]} />}>
        <Route path="/dashboard-technicien" element={<DashboardTechnicien />} />
        <Route path="/mes-interventions" element={<MesInterventions />} />
        <Route path="/mes-tickets-technicien" element={<MesTicketsTechnicien />} />
        <Route path="/mon-profil-technicien" element={<MonProfilTechnicien />} />
 
        <Route path="/equipements-technicien" element={<MesEquipementsTechnicien />} />
        <Route path="/kanban-technicien" element={<Kanban />} />
        <Route path="/commentaires-tickets" element={<MesCommentairesTechnicien />} />
         <Route path="/mes-performances-technicien" element={<MesPerformancesTechnicien />} />
      </Route>

      {/* ✅ Routes CLIENT */}
      <Route element={<ProtectedRoute allowedRoles={["CLIENT"]} />}>
        <Route path="/dashboard-client" element={<DashboardClient />} />
        <Route path="/mes-tickets" element={<MesTickets />} />
        <Route path="/mes-equipements" element={<MesEquipements />} />
        <Route path="/mon-profil" element={<MonProfil />} />
     
        <Route path="/mes-commentaires" element={<MesCommentaires />} />
            <Route path="/mes-factures" element={<MesFactures />} />
        
      </Route>

      {/* ✅ Routes NORMAL */}
      <Route element={<ProtectedRoute allowedRoles={["NORMAL"]} />}>
        <Route path="/dashboard-chef-service" element={<DashboardChefService />} />
        <Route path="/dashboard-comptable" element={<DashboardComptable/>} />
        <Route path="/dashboard-gestionnaire-tickets" element={<DashboardGestionnaireTickets/>} />
        <Route path="/dashboard-responsable-maintenance" element={<DashboardResponsableMaintenance/>} />
    
        <Route path="/dashboard-rh" element={<DashboardRh/>}/>
        <Route path="/dashboard-secretaire" element={<DashboardSecretaire/>}/>
        <Route path="/dashboard-support-client" element={<DashboardSupportClient/>}/>
        
        <Route path="/mes-tickets-normal" element={<MesTicketsNormal />} />
        <Route path="/mes-equipements-normal" element={<MesEquipementsNormal />} />
        <Route path="/mes-commentaires-normal" element={<MesCommentairesNormal />} />
        
        <Route path="/mes-notifications-normal" element={<MesNotificationsNormal />} />
        <Route path="/mon-profil-normal" element={<MonProfilNormal />} />
      
        <Route path="/mes-interventions-normal" element={<MesInterventionsNormal />} />
        <Route path="/mes-personnels-normal" element={<MesPersonnelsNormal />} />
        <Route path="/mes-clients-normal" element={<MesClientsNormal />} />
        <Route path="/mes-techniciens-normal" element={<MesTechniciensNormal />} />
        
        <Route path="/rapports-financiers-normal" element={<FinancialReportsNormal/>} />
        <Route path="/historique-transactions-normal" element={<TransactionHistoryNormal/>} />
        <Route path="/gestion-budgets-normal" element={<BudgetManagementNormal />} />
        <Route path="/suivi-performances-normal" element={<PerformanceTrackingNormal />} />
        <Route path="/recrutement-normal" element={<RecruitementNormal/>} />
        <Route path="/facture-client" element={<FactureClient/>} />
      
        <Route path="/mes-performances-normal" element={<MesPerformancesNormal/>} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
