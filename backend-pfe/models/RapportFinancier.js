const mongoose = require("mongoose");

const rapportFinancierSchema = new mongoose.Schema({
    RPFT_titre: { type: String, required: true }, // Titre du rapport financier
    RPFT_periode: { type: String }, // ex: "T1 2025", "Année 2024"
    RPFT_revenuTotal: { type: Number, default: 0 }, // Revenu total
    RPFT_depensesTotales: { type: Number, default: 0 }, // Dépenses totales
    RPFT_profit: { type: Number, default: 0 }, // Bénéfice (revenu - dépenses)
    RPFT_montantPaye: { type: Number, default: 0 },
    RPFT_dateCreation: { type: Date, default: Date.now }, // Date de création du rapport
     deleted_at: { // Ajout du champ
        type: Date,
        default: null
    }

});

// Ajoutez un index pour optimiser le filtrage
rapportFinancierSchema.index({ deleted_at: 1 });

module.exports = mongoose.model("RapportFinancier", rapportFinancierSchema);