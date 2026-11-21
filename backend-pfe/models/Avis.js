// models/Avis.js
const mongoose = require("mongoose");

const avisSchema = new mongoose.Schema({
    // AVIS_code: { type: String, unique: true }, // Sera ajouté si tu le souhaites
    AVIS_nom: { type: String, required: true },      // Nom de la personne qui a laissé l'avis
    AVIS_message: { type: String, required: true },  // Contenu du message de l'avis
    AVIS_note: { type: Number, required: true, min: 1, max: 5 }, // Note donnée (ex: sur 5 étoiles)
   
    AVIS_client: { // ✨ NOUVEAU: Référence au client qui a créé l'avis
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client', // Assurez-vous que 'Client' est le nom de votre modèle Client
        required: true
    },
   
    AVIS_dateCreation: { type: Date, default: Date.now }, // Date de création de l'avis
    AVIS_dateMiseAJour: { type: Date, default: Date.now } ,// Date de dernière mise à jour (gérée manuellement)
     deleted_at: { // Ajout du champ
        type: Date,
        default: null
    }

}, {
    timestamps: false // Désactivé car AVIS_dateCreation et AVIS_dateMiseAJour sont gérés manuellement
});

// Hook pre-save pour mettre à jour la date de mise à jour
avisSchema.pre('save', function(next) {
    this.AVIS_dateMiseAJour = new Date();
    next();
});

// Ajoutez un index pour optimiser le filtrage
avisSchema.index({ deleted_at: 1 });
avisSchema.index({ AVIS_client: 1 }); // ✨ NOUVEAU: Index pour les requêtes par client


module.exports = mongoose.model("Avis", avisSchema);