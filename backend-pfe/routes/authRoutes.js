const express = require("express");
const router = express.Router();
// Importez les nouvelles fonctions registerFace et loginFace depuis authController
const { login, getProfile, forgotPassword, resetPassword, registerFace, loginFace } = require("../controllers/authController"); // <-- MODIFIÉ
const { protect } = require("../middleware/authMiddleware");
const { rateLimit } = require('express-rate-limit');

// Configurez le limiteur de taux pour la connexion
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Valeur recommandée : Égale à MAX_LOGIN_ATTEMPTS
  message:
    "Trop de tentatives de connexion à partir de cette adresse IP. Veuillez réessayer après 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
});

// ✅ Connexion utilisateur (Admin, Technicien, Client) - Appliquez le limiteur ici
router.post("/login", login);

// --- NOUVELLES ROUTES POUR LA RECONNAISSANCE FACIALE ---
// Route pour enregistrer l'encoding facial d'un utilisateur
// Vous pouvez ajouter `protect` ici si vous voulez que seul un utilisateur authentifié puisse enregistrer son visage.
// Par exemple, après une première connexion classique, l'utilisateur pourrait "activer" la reconnaissance faciale.
router.post("/register-face", protect, registerFace); // <-- NOUVEAU

// Route pour la connexion par reconnaissance faciale
// Pas de `protect` ici, car c'est une route d'authentification initiale. Vous pouvez ajouter un limiteur de taux spécifique si vous le souhaitez.
router.post("/login-face", loginLimiter, loginFace); // <-- NOUVEAU
// ---------------------------------------------------

// ✅ Récupérer le profil de l'utilisateur connecté (Protégé par `protect`)
router.get("/me", protect, getProfile);

// === 🟠 Mot de passe oublié
router.post("/forgot-password", forgotPassword);

// === 🔵 Réinitialisation du mot de passe
router.post("/reset-password/:token", resetPassword);

module.exports = router;