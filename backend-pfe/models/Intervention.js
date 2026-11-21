const mongoose = require("mongoose");
 const { generateUniqueCode } = require("../utils/generateUniqueCode");

 const interventionSchema = new mongoose.Schema({
  INTR_code: { type: String, unique: true },
  INTR_ticket: { type: String, required: true },
  INTR_techniciens: [{ type: mongoose.Schema.Types.ObjectId, ref: "Technicien", required: true }],
  INTR_description_panne: { type: String, required: true },
  INTR_cause_panne: { type: String },
  INTR_solution_apportée: { type: String },
  INTR_statut: { type: String, enum: ["en attente", "en cours", "terminé"], default: "en attente" },
  INTR_durée: { type: Number, default: 0 },
  INTR_dt_debut: { type: Date, required: true },
  INTR_dt_fin: { type: Date },
  Date_creation: { type: Date, default: Date.now },
  INTR_cost: { 
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
    deleted_at: {
    type: Date,
    default: null 
  }
 });

 interventionSchema.pre("save", async function (next) {
  if (!this.INTR_code) {
   this.INTR_code = await generateUniqueCode("Intervention", "INTR");
  }

  // Calculer la durée si les deux dates sont présentes
  if (this.INTR_dt_debut && this.INTR_dt_fin) {
   const startDate = new Date(this.INTR_dt_debut);
   const endDate = new Date(this.INTR_dt_fin);
   const durationInMinutes = Math.floor((endDate - startDate) / (1000 * 60)); // Conversion en minutes
   this.INTR_durée = durationInMinutes;
  }

  next();
 });

 module.exports = mongoose.model("Intervention", interventionSchema);