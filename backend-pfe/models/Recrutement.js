const mongoose = require("mongoose");

const recrutementSchema = new mongoose.Schema({
    // RCUT_code: { type: String, unique: true }, // Sera ajouté si tu le souhaites
    RCUT_poste: { type: String, required: true }, // Poste à pourvoir
    RCUT_description: { type: String }, // Description du poste
    RCUT_dateLimite: { type: Date }, // Date limite pour postuler (renommé de date_limite)
    RCUT_statut: { type: String, enum: ["Ouvert", "Fermé"], default: "Ouvert" }, // Statut de l'offre
    RCUT_candidats: [ // Anciennement 'candidats'
        {
            _id: false, // Ne crée pas d'ObjectId pour chaque sous-document
            nom: { type: String, required: true }, // Nom du candidat
            courriel: { type: String, required: true }, // Adresse email du candidat (renommé de 'email')
            cheminCV: { type: String }, // URL ou chemin vers le fichier du CV (renommé de 'cv')
            statut: { type: String, enum: ["En attente", "Accepté", "Rejeté"], default: "En attente" }, // Statut de la candidature
            commentaires: { type: String } // Commentaires sur le candidat
        }
    ],
    RCUT_dateCreation: { type: Date, default: Date.now }, // Date de création de l'enregistrement
    RCUT_dateMiseAJour: { type: Date, default: Date.now } ,

       deleted_at: { // Ajout du champ
        type: Date,
        default: null
    }// Date de dernière mise à jour
}, {
    timestamps: false // Désactivé car RCUT_dateCreation et RCUT_dateMiseAJour sont gérés manuellement
});

recrutementSchema.pre('save', function(next) {
    this.RCUT_dateMiseAJour = new Date();
    next();
});

// Ajoutez un index pour optimiser le filtrage
recrutementSchema.index({ deleted_at: 1 });

module.exports = mongoose.model("Recrutement", recrutementSchema);