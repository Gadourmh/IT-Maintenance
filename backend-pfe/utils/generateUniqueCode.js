const GlobalCounter = require("../models/GlobalCounter");

const generateUniqueCode = async (modelName, prefix) => {
  try {
    // Utilisation de findAndModify ou upsert pour gérer les conflits de concurrence
    const counter = await GlobalCounter.findOneAndUpdate(
      { model: modelName }, // Recherche du modèle
      { $inc: { count: 1 } }, // Incrémente le compteur
      { new: true, upsert: true } // Si le document n'existe pas, il est créé avec count à 1
    );

    // Format du code
    return `${prefix}${counter.count.toString().padStart(3, "0")}`;
  } catch (error) {
    console.error(`❌ Erreur génération code pour ${modelName}:`, error);
    throw new Error("Erreur de génération du code unique");
  }
};

module.exports = { generateUniqueCode };
