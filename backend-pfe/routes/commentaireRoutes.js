const express = require("express");
const router = express.Router();
const { 
  createCommentaire, 
  getCommentairesByTicket, 
  getCommentairesByTicketCode,
  getAllCommentaires,
  updateCommentaire, 
  deleteCommentaire 
} = require("../controllers/commentaireController");

const { protect, authorize } = require("../middleware/authMiddleware");

// ✅ Ajouter un commentaire (Client ou Technicien connecté)
router.post("/", protect, authorize("CLIENT", "TECHNICIEN"), createCommentaire);

// ✅ Récupérer tous les commentaires (admin uniquement)
router.get("/", protect, authorize("ADMIN", "SUPER_ADMIN","NORMAL"), getAllCommentaires);

// ✅  Récupérer commentaires via TCKT_code
router.get("/byCode/:code", protect, getCommentairesByTicketCode);

// ✅ Récupérer les commentaires d’un ticket (authentifié) - via l’ID Mongo du ticket
router.get("/:ticketId", protect, getCommentairesByTicket);

// ✅ Modifier un commentaire (auteur ou SUPER_ADMIN dans le controller)
router.put("/:id", protect, updateCommentaire);

// ✅ Supprimer un commentaire (auteur ou SUPER_ADMIN dans le controller)
router.delete("/:id", protect, authorize("ADMIN","SUPER_ADMIN","TECHNICIEN","CLIENT") ,deleteCommentaire);


module.exports = router;
