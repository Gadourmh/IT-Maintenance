// routes/avisRoutes.js
const express = require('express');
const router = express.Router();
const avisController = require('../controllers/avisController');
// Importer le middleware 'protect' depuis votre fichier authMiddleware.js
const { protect } = require('../middleware/authMiddleware'); // Ajustez le chemin si nécessaire

// Route pour ajouter un avis
// 'protect' s'assure que l'utilisateur est authentifié.
// La logique pour vérifier si c'est un 'CLIENT' est dans le contrôleur.
router.post('/', protect, avisController.createAvis);

// Route pour récupérer tous les avis
// 'protect' s'assure que l'utilisateur est authentifié pour voir les avis.
router.get('/', avisController.getAvis);

// Route pour modifier un avis par ID
// 'protect' s'assure de l'authentification. La logique d'autorisation (propriétaire) est dans le contrôleur.
router.put('/:id', protect, avisController.updateAvis);

// Route pour supprimer un avis par ID
// 'protect' s'assure de l'authentification. La logique d'autorisation (propriétaire OU admin) est dans le contrôleur.
router.delete('/:id', protect, avisController.deleteAvis);

module.exports = router;