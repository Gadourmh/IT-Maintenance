const express = require("express");
const router = express.Router();
const upload = require("../config/multerConfig");
const {
  getTechnicianProfile,
  updateTechnicianProfile,
  getTechniciens,
  getTechnicienById,
  updateTechnician,
  createTechnician,
  deleteTechnician
} = require("../controllers/technicienController");

const { protect, authorize } = require("../middleware/authMiddleware");

// ✅ Routes accessibles uniquement par le technicien lui-même
router.get("/me", protect, getTechnicianProfile);
router.put("/me", protect, authorize("TECHNICIEN"), updateTechnicianProfile);//il peut ajouter sa photo de profil a verifier tanssach

// ✅ Routes accessibles par un ADMIN ou SUPER_ADMIN
router.get("/", getTechniciens);
router.get("/:id", protect, authorize("ADMIN", "SUPER_ADMIN"), getTechnicienById);
router.put("/:id", protect, authorize("ADMIN", "SUPER_ADMIN"), updateTechnician);
router.post("/", protect, authorize("ADMIN", "SUPER_ADMIN"), createTechnician);


router.delete("/:id", protect, authorize("ADMIN", "SUPER_ADMIN"), deleteTechnician);
module.exports = router;

