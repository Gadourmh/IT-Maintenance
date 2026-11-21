// statsRoutes.js
const express = require("express");
const {
  getStats,
  getTechnicianProgress,
  getTechnicianPerformance,
  getTicketStatsByDate,
  getClientTicketStats, // Reste sur /clients/tickets
  getEfficiencyIndicators, // Reste sur /indicateurs-performance
  getClientStats, // Reste sur /client/:id
  getTechnicienStats, // Reste sur /technicien/:id
  getTotalTimePerTechnician, // 🆕 Nouvelle fonction importée
  getAverageTicketDurationPerClient,
  getInvoiceOverview ,
  getInvoicesOverviewByClient// 🆕 Nouvelle fonction importée

} = require("../controllers/statsController");

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// 📌 Route existante : Statistiques globales
// Autorisation : ADMIN, SUPER_ADMIN, TECHNICIEN, NORMAL
router.get("/", protect, authorize("ADMIN", "SUPER_ADMIN", "TECHNICIEN", "NORMAL"), getStats);


// ✅ Route existante : Statistiques d'un client spécifique
// Autorisation : ADMIN, SUPER_ADMIN, CLIENT
router.get("/client/:id", protect, authorize("ADMIN", "SUPER_ADMIN", "CLIENT","TECHNICIEN","NORMAL"), getClientStats);


// ✅ Route existante : Statistiques d'un technicien spécifique
// Autorisation : ADMIN, SUPER_ADMIN, TECHNICIEN
router.get(
  "/technicien/:id",
  protect,
  authorize("ADMIN", "SUPER_ADMIN", "TECHNICIEN"), getTechnicienStats);


// 📌 Route existante : Progression d'un technicien spécifique
// Autorisation : ADMIN, SUPER_ADMIN, TECHNICIEN (avec vérification interne)
router.get("/techniciens/:technicienId/progression", protect, authorize("ADMIN", "SUPER_ADMIN", "TECHNICIEN"), getTechnicianProgress);


// 📌 Route existante : Performance d'un technicien spécifique (temps passé sur interventions)
// Autorisation : ADMIN, SUPER_ADMIN
router.get("/techniciens/:technicienId/performance", protect, authorize("ADMIN", "SUPER_ADMIN","NORMAL"), getTechnicianPerformance);

// 📌 Route existante : Statistiques des tickets sur une période donnée
// Autorisation : ADMIN, SUPER_ADMIN, TECHNICIEN
router.get("/tickets/date-range", protect, authorize("ADMIN", "SUPER_ADMIN", "TECHNICIEN","NORMAL"), getTicketStatsByDate);

// 📌 Route existante : Nombre de tickets par client (tous les clients)
// Autorisation : ADMIN, SUPER_ADMIN
// Le chemin /clients/tickets est conservé comme demandé.
router.get("/clients/tickets", protect, authorize("ADMIN", "SUPER_ADMIN","TECHNICIEN"), getClientTicketStats);

// 📌 Route existante : Indicateurs de performances globales
// Autorisation : ADMIN, SUPER_ADMIN
// Le chemin /indicateurs-performance est conservé comme demandé.
router.get("/indicateurs-performance", protect, authorize("ADMIN", "SUPER_ADMIN","TECHNICIEN"), getEfficiencyIndicators);


// 🆕 Nouvelle route : Temps total passé sur les interventions par chaque technicien
// Ce endpoint renvoie une liste de tous les techniciens avec leur temps total d'intervention.
// Autorisation : ADMIN, SUPER_ADMIN (typiquement pour des tableaux de bord administratifs)
router.get("/techniciens/total-time-all", protect, authorize("ADMIN", "SUPER_ADMIN","NORMAL"), getTotalTimePerTechnician); // ✅ Nouveau chemin

// 🆕 Nouvelle route : Durée moyenne des tickets par chaque client
// Ce endpoint renvoie une liste de tous les clients avec la durée moyenne de résolution de leurs tickets.
// Autorisation : ADMIN, SUPER_ADMIN (typiquement pour des tableaux de bord administratifs)
router.get("/clients/average-ticket-duration-all", protect, authorize("ADMIN", "SUPER_ADMIN","NORMAL"), getAverageTicketDurationPerClient); // ✅ Nouveau chemin


router.get("/invoices-overview", protect, authorize("ADMIN", "SUPER_ADMIN","NORMAL"), getInvoiceOverview);


// Route pour le résumé de facturation par client
router.get("/clients-invoices-overview", protect, authorize("ADMIN", "SUPER_ADMIN", "NORMAL"), getInvoicesOverviewByClient);


module.exports = router;