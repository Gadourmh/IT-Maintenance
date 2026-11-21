const mongoose = require("mongoose");
const { generateUniqueCode } = require("../utils/generateUniqueCode");


const commentSchema = new mongoose.Schema({
  CMMT_code: { type: String, unique: true },
  CMMT_ticket: { type: mongoose.Schema.Types.ObjectId, ref: "Ticket" },

  // Utilisateur lié au commentaire (Client ou Technicien)
  CMMT_utilisateur: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "CMMT_utilisateur_Type"
    
  },

  // Type d'utilisateur (Client ou Technicien)
  CMMT_utilisateur_Type: {
    type: String,
    enum: ["CLIENT", "TECHNICIEN"],
    required: true
  },

  // Nouveau champ pour stocker les informations du client ou technicien
  CMMT_utilisateur_nom: {
    type: String,
    required: true, // Le nom ou l'identifiant de l'utilisateur doit être fourni
  },

  CMMT_utilisateur_code: {
    type: String,
    required: true, // Le code ou identifiant de l'utilisateur doit être fourni
  },

  // Le message du commentaire
  CMMT_message: { type: String, required: true },
    
  
  deleted_at: {
    type: Date,
    default: null, // Par défaut, un client n'est pas supprimé logiquement
  },

  // Date de création du commentaire
  CMMT_Date_creation: { type: Date, default: Date.now }
}, {
  timestamps: true
});

commentSchema.pre("save", async function (next) {
  if (!this.CMMT_code) {
    this.CMMT_code = await generateUniqueCode("Commentaire", "CMMT");
  }
  next();
});

module.exports = mongoose.model("Commentaire", commentSchema);
