const express = require("express");
const router = express.Router();
const upload = require("../config/multerConfig");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  createClient,
  getClientProfile,
  updateClientProfile,
  getClients,
  updateClient,
  updateClientStatus,
  deleteClient
} = require("../controllers/clientController");

// Route pour créer un client avec l'upload du contrat
router.post(
  "/",
  protect,
  authorize("ADMIN", "SUPER_ADMIN"),
  upload.single("CLNT_contract"), // Assurez-vous que l'upload est appelé ici
  createClient
);

// Route pour récupérer le profil du client connecté
router.get("/me", protect, getClientProfile);

// Route pour mettre à jour le profil du client connecté
router.put("/me", protect, updateClientProfile);

// Route pour obtenir tous les clients avec pagination
router.get("/", protect, authorize("ADMIN", "SUPER_ADMIN","NORMAL"), getClients);

// Route pour mettre à jour un client spécifique (ADMIN ou SUPER_ADMIN)
router.put(
  "/:id",
  protect,
  authorize("ADMIN", "SUPER_ADMIN"),
  upload.single("CLNT_contract"), // Ajouter l'upload ici si nécessaire pour la mise à jour
  updateClient
);

// Route pour mettre à jour le statut d'un client (activation/blocage)
router.put(
  "/:id/status",
  protect,
  authorize("ADMIN", "SUPER_ADMIN"),
  updateClientStatus
);

// Route pour supprimer un client (ADMIN ou SUPER_ADMIN)
router.delete("/:id", protect, authorize("ADMIN", "SUPER_ADMIN"), deleteClient);

module.exports = router;
