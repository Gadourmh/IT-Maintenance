const express = require('express');
const router = express.Router();
const factureController = require('../controllers/factureController'); // Adjust path if necessary
const { protect, authorize } = require("../middleware/authMiddleware");

// Create a new Facture
router.post('/',protect, factureController.createFacture); // Protect with auth

// Get all Factures
router.get('/', protect,factureController.getAllFactures); // Protect with auth


// Get all Factures by Client ID
router.get('/client/:clientId', protect, factureController.getFactureByClientId);

// Get a single Facture by ID
router.get('/:id',protect, factureController.getFactureById); // Protect with auth

// Update a Facture by ID
router.put('/:id', protect,factureController.updateFacture); // Protect with auth

// Delete a Facture by ID
router.delete('/:id',protect, factureController.deleteFacture); // Protect with auth

module.exports = router;