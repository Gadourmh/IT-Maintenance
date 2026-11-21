const express = require("express");
const router = express.Router();
const { 
    createNotification,
    getAllNotifications,
    getUserNotifications,
    updateNotification,
    deleteNotification,
    getNotificationStats
} = require("../controllers/notificationController");
const { protect, authorize } = require("../middleware/authMiddleware");

// ✅ Créer une notification (ADMIN ou SUPER_ADMIN uniquement)
router.post("/", protect, authorize("ADMIN", "SUPER_ADMIN"), createNotification);

// ✅ Récupérer toutes les notifications (ADMIN ou SUPER_ADMIN uniquement)
router.get("/", protect, getAllNotifications);


// ✅ Récupérer toutes les notifications (ADMIN ou SUPER_ADMIN uniquement)
router.get("/stats", protect, authorize("ADMIN", "SUPER_ADMIN","NORMAL"),getNotificationStats);


// ✅ Récupérer les notifications d'un utilisateur spécifique
router.get("/:id", protect, authorize("ADMIN", "SUPER_ADMIN","TECHNICIEN"), getUserNotifications);

// ✅ Mettre à jour une notification (ADMIN ou SUPER_ADMIN uniquement)
router.put("/:id", protect, authorize("ADMIN", "SUPER_ADMIN"), updateNotification);

// ✅ Supprimer une notification (ADMIN ou SUPER_ADMIN)
router.delete("/:id", protect, authorize("SUPER_ADMIN", "ADMIN"), deleteNotification);

module.exports = router;
