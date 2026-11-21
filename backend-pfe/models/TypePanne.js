const mongoose = require("mongoose");
const { generateUniqueCode } = require("../utils/generateUniqueCode");

const typePanneSchema = new mongoose.Schema({
  PANN_code: { type: String },
  PANN_libelle: { type: String, required: true },

  // 🛑 MODIFICATION ICI: Changer en un tableau de Strings
  PANN_TPEQ_codes: { // Renommé pour clarté
    type: [String], // Maintenant un tableau de codes d'équipement
    required: true,
    validate: {
      validator: function(v) {
        return v && v.length > 0; // Ensure at least one equipment type is selected
      },
      message: 'Au moins un type d\'équipement est requis.'
    }
  },
   deleted_at: {
    type: Date,
    default: null,
  },
  PANN_date_creation: { type: Date, default: Date.now }
});

// --- DÉFINITION DE L'INDEX UNIQUE AVEC FILTRE PARTIEL POUR PANN_libelle ---
typePanneSchema.index(
  { PANN_libelle: 1 },
  {
    unique: true,
    partialFilterExpression: { deleted_at: { $eq: null } }
  }
);
// --- FIN DÉFINITION DE L'INDEX ---


// 🔹 Vérification avant d'enregistrer une panne
typePanneSchema.pre("save", async function (next) {
  try {
    if (!this.PANN_code) {
      this.PANN_code = await generateUniqueCode("TypePanne", "PANN");
    }

    const TypeEquipment = mongoose.model("TypeEquipment");

    // 🛑 NOUVELLE LOGIQUE POUR GÉRER PANN_TPEQ_CODES (tableau) et dé-référencer les inactifs
    if (this.PANN_TPEQ_codes && this.PANN_TPEQ_codes.length > 0) {
      const existingActiveTypeEquips = await TypeEquipment.find({
        TPEQ_code: { $in: this.PANN_TPEQ_codes },
        deleted_at: null // Vérifier qu'ils sont actifs
      });

      const validCodes = existingActiveTypeEquips.map(te => te.TPEQ_code);
      const invalidCodes = this.PANN_TPEQ_codes.filter(code => !validCodes.includes(code));

      if (invalidCodes.length > 0) {
        // Option 1B: Dé-référencer les codes invalides et CONTINUER la sauvegarde
        // Afficher un avertissement au lieu de jeter une erreur bloquante
        console.warn(`Attention: Les codes d'équipement invalides/inactifs suivants ont été retirés de la liste pour TypePanne "${this.PANN_libelle}" (${this._id}): ${invalidCodes.join(', ')}`);
        this.PANN_TPEQ_codes = validCodes; // Mettre à jour le tableau pour n'inclure que les codes valides et actifs
      }
    } else if (this.PANN_TPEQ_codes && this.PANN_TPEQ_codes.length === 0 && this.isNew) {
      // Si c'est un nouveau document et PANN_TPEQ_codes est vide, déclencher la validation required
      // (déjà gérée par le `validate` de la définition du schéma, mais utile pour clarté)
      return next(new Error('Au moins un type d\'équipement est requis.'));
    }
    // 🛑 FIN NOUVELLE LOGIQUE

    next();
  } catch (error) {
    next(error);
  }
});

const TypePanne = mongoose.model("TypePanne", typePanneSchema);

module.exports = TypePanne;