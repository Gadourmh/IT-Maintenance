const express = require("express");
const router = express.Router();
const {
  createPersonnel,
  getPersonnels,
  getPersonnelById,
  updatePersonnel,
  updatePersonnelProfile,
  deletePersonnel
} = require("../controllers/personnelController");
const { protect, authorize } = require("../middleware/authMiddleware");

// ✅ Création d'un personnel (SUPER_ADMIN gère tout)
router.post("/", protect, authorize("SUPER_ADMIN"), createPersonnel);

// ✅ Récupérer un personnel par son ID (seulement ADMIN et SUPER_ADMIN)
router.get("/",  getPersonnels);

// ✅ Récupérer un personnel par son ID (seulement ADMIN et SUPER_ADMIN)
router.get("/:id", protect, authorize("SUPER_ADMIN", "ADMIN","NORMAL"), getPersonnelById);

// ✅ Modifier son propre profil (tous les personnels)
router.put("/profile", protect, updatePersonnelProfile);

// ✅ Modifier un personnel (SUPER_ADMIN gère tout, ADMIN ne modifie que NORMAL)
router.put("/:id", protect, authorize("SUPER_ADMIN"), updatePersonnel);



// ✅ Supprimer un personnel (seulement SUPER_ADMIN)
router.delete("/:id", protect, authorize("SUPER_ADMIN"), deletePersonnel);

module.exports = router;


