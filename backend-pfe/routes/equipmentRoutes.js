const express = require("express");
const router = express.Router();
const { 
  createEquipment, 
  getEquipments, 
  getEquipmentById, 
  updateEquipment, 
  deleteEquipment,
  getEquipmentsByClientCode,
  getEquipmentsByTechnician
} = require("../controllers/equipmentController");
const { protect, authorize } = require("../middleware/authMiddleware");

// ✅ Créer un équipement (uniquement ADMIN et SUPER_ADMIN, ou CLIENT si l'équipement lui appartient)
router.post("/", protect, authorize("ADMIN", "SUPER_ADMIN"), createEquipment);

// ✅ Récupérer les équipements assignés à un technicien spécifique par son ID
router.get("/technicien/assigned/:technicienId", protect, authorize("TECHNICIEN"), getEquipmentsByTechnician);

// ✅ Récupérer tous les équipements (ADMIN, SUPER_ADMIN, TECHNICIEN ,NORMAL)
router.get("/", protect, authorize("ADMIN", "SUPER_ADMIN", "TECHNICIEN","NORMAL"), getEquipments);




// ✅ Récupérer les équipements associés à un client par son code
router.get("/client/code/:clientCode", protect, authorize("ADMIN", "SUPER_ADMIN", "CLIENT"), getEquipmentsByClientCode);

// ✅ Récupérer un équipement par ID
router.get("/:id", protect, authorize("ADMIN", "SUPER_ADMIN", "TECHNICIEN"), getEquipmentById);

// ✅ Mettre à jour un équipement (ADMIN, SUPER_ADMIN, CLIENT si l'équipement lui appartient)
router.put("/:id", protect, authorize("ADMIN", "SUPER_ADMIN", "CLIENT"), updateEquipment);

// ✅ Supprimer un équipement (ADMIN et SUPER_ADMIN uniquement)
router.delete("/:id", protect, authorize("ADMIN", "SUPER_ADMIN"), deleteEquipment);

module.exports = router;
