const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { generateUniqueCode } = require("../utils/generateUniqueCode");

const personnelSchema = new mongoose.Schema({
  PERS_code: { type: String, unique: true }, // Code unique du personnel
  PERS_nom_prenom: { type: String, required: true }, // Nom complet
  PERS_email: { type: String, required: true }, // Email
  PERS_mot_passe: { type: String, required: true, select: false }, // Mot de passe (marqué select: false)
  PERS_telephone: { type: String }, // Téléphone

  PERS_role_acces: {
    type: String,
    enum: ["ADMIN", "SUPER_ADMIN", "NORMAL"],
    default: "NORMAL",
  }, // Rôle d'accès

  PERS_fonction: {
    type: String,
    enum: [
      "CHEF_SERVICE",
      "RESPONSABLE_MAINTENANCE",
      "GESTIONNAIRE_TICKETS",
      "SECRÉTAIRE",
      "COMPTABLE",
      "RH", // Ressources humaines
      "SUPPORT_CLIENT",
    ],
    default: "GESTIONNAIRE_TICKETS",
  }, // Fonction du personnel

  PERS_photo_profil: { type: String, default: "" },
  Date_creation: { type: Date, default: Date.now },
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
   
  },

});


// ✨ AJOUT D'UN INDEX POUR resetPasswordToken POUR UNE RECHERCHE RAPIDE ✨
personnelSchema.index({ resetPasswordToken: 1 });

// ✅ HOOK pre('save') AVEC LOGS DE DIAGNOSTIC
// Hash password before saving
personnelSchema.pre("save", async function (next) {
  console.log("➡️ Hook pre('save') Personnel déclenché pour l'ID:", this._id); // Log au début du hook
  console.log("✨ Champs modifiés sur l'objet Personnel:", this.modifiedPaths()); // Affiche tous les champs que Mongoose considère comme modifiés

  // Vérifie si le champ PERS_mot_passe a été modifié AVANT la sauvegarde
  if (this.isModified("PERS_mot_passe")) {
    console.log("🔑 PERS_mot_passe est marqué comme modifié. Tentative de hachage...");
    // Attention : Ne logguez PAS la valeur réelle du mot de passe pour des raisons de sécurité en production !
    // On vérifie juste si la valeur est présente (true/false)
    console.log("🔐 PERS_mot_passe (valeur) est présente:", !!this.PERS_mot_passe);

    try {
      const salt = await bcrypt.genSalt(10);
      this.PERS_mot_passe = await bcrypt.hash(this.PERS_mot_passe, salt);
      console.log("✅ PERS_mot_passe haché avec succès."); // Log après hachage réussi
    } catch (hashError) {
      console.error("❌ Erreur lors du hachage de PERS_mot_passe:", hashError); // Log si le hachage échoue
      // Il est crucial de passer l'erreur pour éviter une sauvegarde incorrecte
      return next(hashError);
    }

  } else {
    console.log("❌ PERS_mot_passe n'est PAS marqué comme modifié."); // Log si le champ n'est pas marqué comme modifié
  }
  next(); // Passer à la prochaine middleware pre-save ou à la sauvegarde réelle
});


// Generate unique code before saving
personnelSchema.pre("save", async function (next) {
  if (this.isNew && !this.PERS_code) {
    this.PERS_code = await generateUniqueCode("Personnel", "PERS"); // Assurez-vous que le préfixe est correct si utilisé
  }
  next();
});

// Method to compare passwords
personnelSchema.methods.matchPassword = async function (enteredPassword) {
  // ✅ Assurez-vous que le mot de passe haché (this.PERS_mot_passe) est bien chargé ici si select: false est utilisé
  // (Votre fonction login gère cela avec .select('+PERS_mot_passe'))
  return await bcrypt.compare(enteredPassword, this.PERS_mot_passe);
};

// Method to get client by email (for login and password reset)
// Note: Le champ PERS_mot_passe est marqué 'select: false', il faut le sélectionner explicitement ici pour la connexion.
personnelSchema.statics.findByEmail = async function (email) {
  return await this.findOne({ PERS_email: email });
};


const Personnel = mongoose.model("Personnel", personnelSchema);

module.exports = Personnel;