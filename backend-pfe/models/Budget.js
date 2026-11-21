const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema({
  BUDG_nom: { type: String, required: true },
  BUDG_montant: { type: Number, required: true },
  BUDG_periode: { type: String, enum: ["Mensuel", "Trimestriel", "Annuel"], required: true },
  BUDG_depenses: [{ type: Number }], // Liste de dépenses réelles
  BUDG_remarques: { type: String },
  BUDG_dateCreation: { type: Date, default: Date.now },
  deleted_at: { type: Date, default: null }
});

// Ajoutez un index pour optimiser le filtrage
budgetSchema.index({ deleted_at: 1 });

module.exports = mongoose.models.Budget || mongoose.model("Budget", budgetSchema);
