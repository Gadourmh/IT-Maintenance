// models/Performance.js
const mongoose = require("mongoose");

const performanceSchema = new mongoose.Schema({
  // CHAMP POLYMORPHE : PRF_employe peut référencer Personnel OU Technicien
  PRF_employe: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'PRF_type_entite' // Ce champ String va contenir le nom du modèle ('Personnel' ou 'Technicien')
  },
  PRF_type_entite: { // Ce champ définira le type de l'entité référencée par PRF_employe
    type: String,
    required: true,
    enum: ['Personnel', 'Technicien'] // Les seuls modèles possibles pour PRF_employe
  },

  PRF_periode: { type: String, required: true }, // Exemple : "Q1 2025", "Année 2024"
  PRF_objectifs: { type: String }, // Objectifs fixés pour la période
  PRF_realisations: { type: String }, // Réalisations pendant la période
  PRF_note: { type: Number, min: 0, max: 20 }, // Note de performance (ex: sur 20)
  PRF_commentaires: { type: String }, // Commentaires généraux
  PRF_dateCreation: { type: Date, default: Date.now }, // Date de création de l'enregistrement
  PRF_dateMiseAJour: { type: Date, default: Date.now }, // Date de dernière mise à jour
    deleted_at: {
    type: Date,
    default: null, // Par défaut, un client n'est pas supprimé logiquement
  },

}, 
{
    timestamps: false
});

// Hook pre-save pour mettre à jour la date de mise à jour
performanceSchema.pre('save', function(next) {
    this.PRF_dateMiseAJour = new Date();
    next();
});

// Ajoutez un index pour optimiser le filtrage
performanceSchema.index({ deleted_at: 1 });
// Ajoutez un index pour le champ polymorphe et l'employé si pertinent
performanceSchema.index({ PRF_employe: 1, PRF_type_entite: 1 });

module.exports = mongoose.model("Performance", performanceSchema);