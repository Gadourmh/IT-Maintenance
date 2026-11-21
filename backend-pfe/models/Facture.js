// backend/models/Facture.js

const mongoose = require("mongoose");

const factureSchema = new mongoose.Schema({
    FACT_numeroFacture: {
        type: String,
        required: true,
        // unique: true, // <-- SUPPRIMEZ CETTE LIGNE
        trim: true,
    },
    // ... (le reste de vos champs reste identique)
    FACT_clientId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true,
    },
    FACT_dateEmission: {
        type: Date,
        default: Date.now,
        required: true,
    },
    FACT_dateEcheance: {
        type: Date,
        required: true,
    },
    FACT_montantTotal: {
        type: Number,
        required: true,
        default: 0,
    },
    FACT_montantPaye: {
        type: Number,
        default: 0,
    },
    FACT_statut: {
        type: String,
        enum: ['Pending', 'Paid', 'Overdue', 'Cancelled'],
        default: 'Pending',
        required: true,
    },
    FACT_description: {
        type: String,
        trim: true,
    },
    deleted_at: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});

// NOUVEAU : Index partiel pour une unicité conditionnelle
// Cet index garantit que FACT_numeroFacture est unique SEULEMENT pour les documents où deleted_at est null.
factureSchema.index(
    { FACT_numeroFacture: 1 }, 
    { unique: true, partialFilterExpression: { deleted_at: null } }
);

factureSchema.index({ FACT_clientId: 1 });
factureSchema.index({ deleted_at: 1 });

module.exports = mongoose.model("Facture", factureSchema);