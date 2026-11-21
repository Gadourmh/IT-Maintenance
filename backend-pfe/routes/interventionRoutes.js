const express = require("express");
const router = express.Router();
const { 
  createIntervention, 
  getInterventions, 
  getInterventionById, 
  updateIntervention, 
  deleteIntervention,
  getInterventionsByTechnician
} = require("../controllers/interventionController");
const { protect, authorize } = require("../middleware/authMiddleware");

// ✅ Créer une intervention 
router.post("/", protect, authorize("ADMIN", "SUPER_ADMIN", "TECHNICIEN"), createIntervention);


// ✅ Récupérer toutes les interventions (admin, super-admin, techniciens)
router.get("/", protect, authorize("ADMIN", "SUPER_ADMIN", "TECHNICIEN","NORMAL"), getInterventions);

// ✅ Récupérer les interventions d’un technicien via son ID
router.get("/technicien/:id", protect, authorize("TECHNICIEN", "ADMIN", "SUPER_ADMIN"), getInterventionsByTechnician);


// ✅ Récupérer une intervention par ID
router.get("/:id", protect, authorize("ADMIN", "SUPER_ADMIN", "TECHNICIEN","NORMAL"), getInterventionById);

// ✅ Mettre à jour une intervention (seulement le technicien assigné)
router.put("/:id", protect, authorize("TECHNICIEN", "ADMIN", "SUPER_ADMIN"), updateIntervention);

// ✅ Supprimer une intervention (ADMIN et SUPER_ADMIN uniquement)
router.delete("/:id", protect, authorize("SUPER_ADMIN", "ADMIN"), deleteIntervention);

module.exports = router;



