const express = require("express");
const router = express.Router();
const { 
  createTypeEquipment, 
  getTypeEquipments, 
  updateTypeEquipment, 
  deleteTypeEquipment 
} = require("../controllers/typeEquipmentController");
const { protect, authorize } = require("../middleware/authMiddleware");

// ✅ Créer un type d'équipement (ADMIN ou SUPER_ADMIN uniquement)
router.post("/", protect, authorize("ADMIN", "SUPER_ADMIN"), createTypeEquipment);

// ✅ Récupérer tous les types d'équipements
router.get("/", protect, getTypeEquipments);

// ✅ Mettre à jour un type d'équipement (ADMIN ou SUPER_ADMIN uniquement)
router.put("/:id", protect, authorize("ADMIN", "SUPER_ADMIN"), updateTypeEquipment);

// ✅ Supprimer un type d'équipement (SUPER_ADMIN uniquement)
router.delete("/:id", protect, authorize("SUPER_ADMIN"), deleteTypeEquipment);

module.exports = router;

