const mongoose = require("mongoose");
const { generateUniqueCode } = require("../utils/generateUniqueCode");

const ticketSchema = new mongoose.Schema({
  TCKT_code: { type: String, unique: true },
  TCKT_client: { type: String, required: true }, // Code du client (référence au client par son code)
  TCKT_cree_par: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true }, // ID Mongo du créateur (référence à l'ID client)
  TCKT_equipment: { type: String, required: true }, // Code de l’équipement (référence par son code)
  TCKT_assignee_a: [{ type: mongoose.Schema.Types.ObjectId, ref: "Technicien" }],
  TCKT_description: { type: String, required: true },
  TCKT_types_pannes: [{ type: mongoose.Schema.Types.ObjectId, ref: "TypePanne" }], // Liste des pannes
  TCKT_degre_urgence: { type: String, enum: ["faible", "moyenne", "élevée"], default: "moyenne" },
  TCKT_statut: { type: String, enum: ["ouvert", "en cours", "résolu", "fermé"], default: "ouvert" },
  TCKT_backlog: { type: Boolean, default: true },
  TCKT_sprint: { type: Boolean, default: false },
  TCKT_sprint_id: { type: mongoose.Schema.Types.ObjectId, default: null },
  TCKT_DT_resolution_demandee: { type: Date,default: null },
   TCKT_date_prevue_resolution: { type: Date,default: null },
  TCKT_DT_resolution_confirmee: { type: Date,default: null },
   deleted_at: {
    type: Date,
    default: null,
  },
  Date_creation: { type: Date, default: Date.now }
});

// 🔹 Génération du code unique avant la sauvegarde du ticket
ticketSchema.pre("save", async function (next) {
  if (!this.TCKT_code) {
    this.TCKT_code = await generateUniqueCode("Ticket", "TCKT");
  }

  // Vérification du client
  const clientExists = await mongoose.model("Client").findOne({ CLNT_code: this.TCKT_client });
  if (!clientExists) {
    return next(new Error(`Le client avec le code '${this.TCKT_client}' n'existe pas.`));
  }

  // Vérification de l’équipement
  const equipmentExists = await mongoose.model("Equipment").findOne({ EQPT_code: this.TCKT_equipment });
  if (!equipmentExists) {
    return next(new Error(`L'équipement avec le code '${this.TCKT_equipment}' n'existe pas.`));
  }

  // Vérification de chaque type de panne (ObjectId)
  for (const typePanneId of this.TCKT_types_pannes) {
    const typePanneExists = await mongoose.model("TypePanne").findById(typePanneId);
    if (!typePanneExists) {
      return next(new Error(`Type de panne introuvable pour l'ID '${typePanneId}'`));
    }
  }

  // Empêcher les doublons dans le tableau des techniciens assignés
  this.TCKT_assignee_a = [...new Set(this.TCKT_assignee_a)];

  next();
});

module.exports = mongoose.model("Ticket", ticketSchema);
