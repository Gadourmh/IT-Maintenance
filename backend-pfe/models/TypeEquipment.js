const mongoose = require("mongoose");
const { generateUniqueCode } = require("../utils/generateUniqueCode");

const typeEquipmentSchema = new mongoose.Schema({
  TPEQ_code: { type: String}, // ✅ Code unique
  TPEQ_libelle: { type: String, required: true } ,// ✅ Libellé (Nom du type d'équipement)
   deleted_at: {
    type: Date,
    default: null,
  },
  
  TPEQ_date_creation: { type: Date, default: Date.now }
  

});


// --- DÉFINITION DE L'INDEX UNIQUE AVEC FILTRE PARTIEL POUR TPEQ_code ---

// Index unique pour le code du type d'équipement, s'applique UNIQUEMENT si deleted_at est null
typeEquipmentSchema.index(
  { TPEQ_code: 1 }, // Index sur le champ TPEQ_code
  {
    unique: true, // L'index doit être unique
    // Appliquer l'unicité seulement quand deleted_at est null (ajustez le nom du champ si différent)
    partialFilterExpression: { deleted_at: { $eq: null } }
  }
);

// --- FIN DÉFINITION DE L'INDEX --

// 🔹 Génération du code unique avant la sauvegarde
typeEquipmentSchema.pre("save", async function (next) {
  if (!this.TPEQ_code) {
    this.TPEQ_code = await generateUniqueCode("TypeEquipment", "TPEQ");
  }
  next();
});

module.exports = mongoose.model("TypeEquipment", typeEquipmentSchema);
