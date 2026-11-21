const mongoose = require("mongoose");
const { generateUniqueCode } = require("../utils/generateUniqueCode");
const bcrypt = require("bcryptjs"); // Assurez-vous que bcryptjs est importé pour le hachage des mots de passe

const technicienSchema = new mongoose.Schema({
  TECH_code: { type: String, unique: true },
  TECH_nom_prenom: { type: String, required: true },
  TECH_email: { type: String, required: true,},
  TECH_mot_passe: { type: String, required: true },
  TECH_telephone: { type: String },
TECH_specialite: { type: [String], required: true }, 

  // ✅ Ajout du champ TECH_shift
  TECH_shift: {
    type: String,
    enum: ['MORNING', 'AFTERNOON', 'NIGHT'], // Les seules valeurs autorisées
    default: 'MORNING' // Valeur par défaut si non spécifiée lors de la création
  },

  TECH_disponibilite: { type: Boolean, default: true },
  Date_creation: { type: Date, default: Date.now },
  TECH_cree_par: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Personnel",
  },
  // Nouveaux champs pour le verrouillage de compte
  failedLoginAttempts: { // Nombre de tentatives de connexion échouées
    type: Number,
    required: true,
    default: 0,
  },
  lockUntil: { // Date et heure de déverrouillage du compte
    type: Date,
    default: null,
  },
   deleted_at: {
    type: Date,
    default: null,
  },
   // ✅ AJOUTEZ CE CHAMP : TECH_tickets_assignees
  TECH_tickets_assignees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket' // Assurez-vous que 'Ticket' correspond au nom de votre modèle de Ticket
  }],
    TECH_photo_profil: {
    type: String, // Le type String est approprié pour stocker la base64 ou une URL/chemin
    default: null // Ou une chaîne vide, selon votre préférence pour l'absence de photo
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

// Hash password before saving
technicienSchema.pre("save", async function (next) {
  if (this.isModified("TECH_mot_passe")) {
    const salt = await bcrypt.genSalt(10);
    this.TECH_mot_passe = await bcrypt.hash(this.TECH_mot_passe, salt);
  }
  next();
});

// Generate unique code before saving
technicienSchema.pre("save", async function (next) {
  // Vérifier si c'est une nouvelle entrée ET que TECH_code n'est pas défini ou est malformé
  if (this.isNew && (!this.TECH_code || !this.TECH_code.startsWith("TECH"))) {
    // Appel correct de la fonction avec le préfixe "TECH"
    this.TECH_code = await generateUniqueCode("Technicien", "TECH");
  }
  next();
});


// ✨ AJOUT D'UN INDEX POUR resetPasswordToken POUR UNE RECHERCHE RAPIDE ✨
technicienSchema.index({ resetPasswordToken: 1 });


// Method to compare passwords
technicienSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.TECH_mot_passe);
};

// Method to get client by email (for login and password reset)
technicienSchema.statics.findByEmail = async function (email) {
  return await this.findOne({ TECH_email: email });
};


const Technicien = mongoose.model("Technicien", technicienSchema);

module.exports = Technicien;