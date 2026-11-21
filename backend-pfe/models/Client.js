const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { generateUniqueCode } = require("../utils/generateUniqueCode");

const clientSchema = new mongoose.Schema({
  CLNT_code: { type: String, unique: true },
  CLNT_raison_sociale: { type: String, required: true, trim: true },
  CLNT_email: {
    type: String,
    required: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  CLNT_mot_passe: { type: String, required: true },
  CLNT_telephone: {
    type: String,
    trim: true,
    match: /^[0-9\-\+\s]+$/,
    minlength: 8,
    maxlength: 15,
  },
  CLNT_statut: {
    type: String,
    enum: ["actif", "bloqué"],
    default: "actif",
  },
  CLNT_MF: { type: String, required: true,trim: true },
  CLNT_addresses: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      address: { type: String, required: true, trim: true },
    },
  ],
  CLNT_contract: { type: String, default: null },
  CLNT_photo_profil: { type: String, default: "" },
  CLNT_cree_par: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Personnel",

  },
   // ✨ AJOUT DU CHAMP POUR LA SUPPRESSION LOGIQUE ✨
  deleted_at: {
    type: Date,
    default: null, // Par défaut, un client n'est pas supprimé logiquement
  },
  Date_creation: { type: Date, default: Date.now },
  // Nouveaux champs pour le verrouillage de compte
  failedLoginAttempts: {
    type: Number,
    required: true,
    default: 0,
  },
  lockUntil: {
    type: Date,
    default: null,
  },

  // ✨ AJOUT DES CHAMPS POUR LA RÉINITIALISATION DE MOT DE PASSE ✨
  resetPasswordToken: {
    type: String,
    default: null // Le jeton n'est présent que lors d'une demande de réinitialisation
  },
  resetPasswordExpire: {
    type: Date,
    default: null // La date d'expiration n'est présente que lors d'une demande de réinitialisation
  },

   faceDescriptor: {
    type: [Number], // Pour stocker l'encoding facial (tableau de flottants)
    required: false, // Pas obligatoire si l'utilisateur peut choisir de ne pas l'utiliser
    index: false // Pas besoin d'index pour ce type de donnée
  },
});


// --- DÉFINITION DES INDEX UNIQUES AVEC FILTRE PARTIEL ---

// Index unique pour l'email, s'applique UNIQUEMENT si deleted_at est null
clientSchema.index(
  { CLNT_email: 1 }, // Index sur le champ CLNT_email (1 pour ordre ascendant)
  {
    unique: true, // L'index doit être unique
    partialFilterExpression: { deleted_at: { $eq: null } } // Appliquer l'unicité seulement quand deleted_at est null
  }
);

// Index unique pour le matricule fiscal, s'applique UNIQUEMENT si deleted_at est null
clientSchema.index(
  { CLNT_MF: 1 }, // Index sur le champ CLNT_MF
  {
    unique: true, // L'index doit être unique
    partialFilterExpression: { deleted_at: { $eq: null } } // Appliquer l'unicité seulement quand deleted_at est null
  }
);


// ✨ AJOUT D'UN INDEX POUR resetPasswordToken POUR UNE RECHERCHE RAPIDE ✨
clientSchema.index({ resetPasswordToken: 1 });



// Hash password before saving
clientSchema.pre("save", async function (next) {
  if (this.isModified("CLNT_mot_passe")) {
    const salt = await bcrypt.genSalt(10);
    this.CLNT_mot_passe = await bcrypt.hash(this.CLNT_mot_passe, salt);
  }
  next();
});

// Generate unique code before saving
clientSchema.pre("save", async function (next) {
  // Vérifier si c'est une nouvelle entrée ET que CLNT_code n'est pas défini ou est malformé
  if (this.isNew && (!this.CLNT_code || !this.CLNT_code.startsWith("CLNT"))) {
    // Appel correct de la fonction avec le préfixe "CLNT"
    this.CLNT_code = await generateUniqueCode("Client", "CLNT");
  }
  next();
});

// Method to compare passwords
clientSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.CLNT_mot_passe);
};

// Method to get client by email (for login and password reset)
clientSchema.statics.findByEmail = async function (email) {
  return await this.findOne({ CLNT_email: email });
};

const Client = mongoose.model("Client", clientSchema);

module.exports = Client;