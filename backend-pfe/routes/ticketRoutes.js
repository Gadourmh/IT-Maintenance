const express = require("express");
const router = express.Router();
const {
  createTicket,
  addTicketToSprint,
  getTickets,
  getTicketsByTechnician,
  getTicketById,
  getTicketsByClientId,
  updateTicket,
  assignTicketToTechnicians,
  updateTicketStatus,
  getTechniciensByTicketCode,
  deleteTicket
} = require("../controllers/ticketController");

const { protect, authorize } = require("../middleware/authMiddleware");

// 📌 Création d'un ticket (par un client)
router.post("/", protect, authorize("CLIENT"), createTicket);

// 📌 Récupérer tous les tickets d'un client par son ID
router.get("/client/:id", protect, getTicketsByClientId);

// 📌 Récupérer les tickets d’un technicien
router.get("/technicien/:technicianId", protect, authorize("ADMIN", "SUPER_ADMIN", "TECHNICIEN"), getTicketsByTechnician);

// 📌 Consulter tous les tickets (admins, super-admins, techniciens)
router.get("/", protect, authorize("ADMIN", "SUPER_ADMIN","NORMAL","TECHNICIEN"), getTickets);

// 📌 Récupérer les techniciens assignés à un ticket par son code
router.get("/code/:ticketCode/techniciens", protect, authorize("ADMIN", "SUPER_ADMIN", "TECHNICIEN"), getTechniciensByTicketCode); // Add this new route



// 📌 Récupérer un ticket par son ID
router.get("/:id", protect, getTicketById);

// 📌 Ajouter un ticket à un sprint
router.put("/:id/sprint", protect, authorize("ADMIN", "SUPER_ADMIN"), addTicketToSprint);

// 📌 Mettre à jour un ticket
router.put("/:id", protect, authorize("ADMIN", "SUPER_ADMIN", "TECHNICIEN"), updateTicket);

// 📌 Assigner un ou plusieurs techniciens à un ticket
router.put("/:id/assign", protect, authorize("ADMIN", "SUPER_ADMIN"), assignTicketToTechnicians);

// 📌 Modifier le statut d’un ticket
router.put("/:id/status", protect, authorize("TECHNICIEN", "ADMIN", "SUPER_ADMIN"), updateTicketStatus);

// 📌 Supprimer un ticket
router.delete("/:id", protect, authorize("ADMIN", "SUPER_ADMIN"), deleteTicket);

module.exports = router;
