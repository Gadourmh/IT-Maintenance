const mongoose = require("mongoose");
const { generateUniqueCode } = require("../utils/generateUniqueCode");
const TypeEquipment = require("./TypeEquipment");
const Schema = mongoose.Schema;

const equipmentSchema = new mongoose.Schema({
  EQPT_code: { type: String, unique: true },
  EQPT_CLNT_code: { type: String, required: true },
  EQPT_CLNT_adresse: { type: String, required: true },
  EQPT_marque: { type: String, required: true },
  EQPT_libelle: { type: String, required: true },
  EQPT_num_serie: { type: String, unique: true, required: true },
  EQPT_type: { type: Schema.Types.ObjectId, ref: 'TypeEquipment', required: true },  // Référence vers TypeEquipment
  EQPT_premiere_date_installation: { type: Date, required: true },
  EQPT_derniere_date_Maintenance: { type: Date },
  EQPT_date_debut_validite: { type: Date, required: true },
  EQPT_date_fin_validite: { type: Date, required: true },
  
  //EQPT_types_pannes: [{ type: mongoose.Schema.Types.ObjectId, ref: "TypePanne" }],
  deleted_at: {
    type: Date,
    default: null,
  },
  EQPT_date_creation: { type: Date, default: Date.now },
  

});


// Vérification avant sauvegarde du type d'équipement
equipmentSchema.pre("save", async function (next) {
  try {
    // Récupération du document TypeEquipment pour accéder à son TPEQ_code
    const typeEquipment = await TypeEquipment.findById(this.EQPT_type);
    if (!typeEquipment) {
      return next(new Error(`Le type d'équipement '${this.EQPT_type}' n'existe pas dans TypeEquipment.`));
    }

    if (!this.EQPT_code) {
      const prefix = typeEquipment.TPEQ_code.substring(0, 2).toUpperCase(); // Ex: "PC", "IM"
      this.EQPT_code = await generateUniqueCode("Equipment", prefix);
    }

    next();
  } catch (error) {
    next(error);
  }
});


module.exports = mongoose.model("Equipment", equipmentSchema);
