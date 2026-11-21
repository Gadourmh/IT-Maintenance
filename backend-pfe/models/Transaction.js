const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
    // TRNS_code: { type: String, unique: true }, // Sera ajouté si tu le souhaites
    TRNS_type: { type: String, enum: ["REVENU", "DEPENSE"], required: true }, // Type de transaction (revenu ou dépense)
    TRNS_description: { type: String }, // Description de la transaction
    TRNS_montant: { type: Number, required: true }, // Montant de la transaction
    TRNS_dateTransaction: { type: Date, default: Date.now }, // Date de la transaction
    TRNS_dateCreation: { type: Date, default: Date.now }, // Date de création de l'enregistrement
    TRNS_dateMiseAJour: { type: Date, default: Date.now },
      deleted_at: { // Ajout du champ
        type: Date,
        default: null
    } // Date de dernière mise à jour
}, {
    timestamps: false // Désactivé car TRNS_dateCreation et TRNS_dateMiseAJour sont gérés manuellement
});

// Hook pre-save pour mettre à jour la date de mise à jour
transactionSchema.pre('save', function(next) {
    this.TRNS_dateMiseAJour = new Date();
    next();
});

// Ajoutez un index pour optimiser le filtrage
transactionSchema.index({ deleted_at: 1 });

module.exports = mongoose.model("Transaction", transactionSchema);