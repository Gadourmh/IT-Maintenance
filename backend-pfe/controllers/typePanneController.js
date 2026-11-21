const mongoose = require('mongoose');
const TypePanne = require("../models/TypePanne");
const TypeEquipment = require("../models/TypeEquipment");
const Personnel = require("../models/Personnel");
const { sendEmail } = require("../services/emailService");
const Notification = require("../models/Notification");


async function sendCreationNotifications(typePanne, associatedEquipments) {
    try {
        const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] }, deleted_at: null });
        const subject = `[Solution Ticketing] Nouveau Type de Panne Créé`;
        
        const equipmentLibellesHtml = associatedEquipments.map(eq => `<li>${eq.TPEQ_libelle} (${eq.TPEQ_code})</li>`).join('');

        for (const admin of admins) {
            if (admin.PERS_email) {
                const textMessage = `Un nouveau type de panne "${typePanne.PANN_libelle}" a été ajouté. Il est associé aux équipements : ${associatedEquipments.map(e => e.TPEQ_libelle).join(', ')}.`;
                const htmlMessage = `
                  <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2 style="color: #0056b3;">Nouveau Type de Panne</h2>
                    <p>Un nouveau type de panne a été défini : <strong>${typePanne.PANN_libelle}</strong>.</p>
                    <p><strong>Associé aux équipements :</strong></p>
                    <ul>${equipmentLibellesHtml}</ul>
                  </div>`;
                
                await sendEmail(admin.PERS_email, subject, textMessage, htmlMessage);

                await Notification.create({
                    NOTF_user: admin._id,
                    NOTF_userModel: "Personnel",
                    NOTF_userType: admin.PERS_role_acces,
                    NOTF_type: "email",
                    NOTF_message: `Notification de création du type de panne '${typePanne.PANN_libelle}' envoyée.`
                });
            }
        }
    } catch (error) {
        console.error("❌ Erreur lors de l'envoi des notifications de création (TypePanne):", error);
    }
}


async function sendUpdateNotifications(typePanne) {
    try {
        const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] }, deleted_at: null });
        const subject = `[Solution Ticketing] Mise à Jour d'un Type de Panne`;
        
        const associatedEquipments = await TypeEquipment.find({ TPEQ_code: { $in: typePanne.PANN_TPEQ_codes } });
        const equipmentLibellesHtml = associatedEquipments.map(eq => `<li>${eq.TPEQ_libelle}</li>`).join('');

        for (const admin of admins) {
            if (admin.PERS_email) {
                const textMessage = `Le type de panne "${typePanne.PANN_libelle}" (Code: ${typePanne.PANN_code}) a été mis à jour.`;
                const htmlMessage = `
                  <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2 style="color: #0056b3;">Mise à Jour d'un Type de Panne</h2>
                    <p>Le type de panne <strong>${typePanne.PANN_libelle}</strong> a été mis à jour.</p>
                    <p><strong>Nouveaux équipements associés :</strong></p>
                    <ul>${equipmentLibellesHtml}</ul>
                  </div>`;
                
                await sendEmail(admin.PERS_email, subject, textMessage, htmlMessage);

                await Notification.create({
                    NOTF_user: admin._id,
                    NOTF_userModel: "Personnel",
                    NOTF_userType: admin.PERS_role_acces,
                    NOTF_type: "email",
                    NOTF_message: `Notification de mise à jour du type de panne '${typePanne.PANN_libelle}' envoyée.`
                });
            }
        }
    } catch (error) {
        console.error("❌ Erreur lors de l'envoi des notifications de mise à jour (TypePanne):", error);
    }
}


async function sendDeletionNotifications(typePanne) {
    try {
        const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] }, deleted_at: null });
        const subject = `[Solution Ticketing] Un Type de Panne a été désactivé`;

        for (const admin of admins) {
            if (admin.PERS_email) {
                const textMessage = `Le type de panne "${typePanne.PANN_libelle}" (Code: ${typePanne.PANN_code}) a été marqué comme inactif.`;
                const htmlMessage = `
                  <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2 style="color: #dc3545;">Alerte : Type de Panne Désactivé</h2>
                    <p>Le type de panne <strong>${typePanne.PANN_libelle}</strong> (Code: ${typePanne.PANN_code}) a été marqué comme <strong>inactif</strong>.</p>
                    <p>Il ne pourra plus être sélectionné pour de nouveaux tickets.</p>
                  </div>`;
                  
                await sendEmail(admin.PERS_email, subject, textMessage, htmlMessage);
                
                await Notification.create({
                    NOTF_user: admin._id,
                    NOTF_userModel: "Personnel",
                    NOTF_userType: admin.PERS_role_acces,
                    NOTF_type: "email",
                    NOTF_message: `Notification de désactivation du type de panne '${typePanne.PANN_libelle}' envoyée.`
                });
            }
        }
    } catch (error) {
        console.error("❌ Erreur lors de l'envoi des notifications de suppression (TypePanne):", error);
    }
}


const createTypePanne = async (req, res) => {
  const { PANN_libelle, PANN_TPEQ_codes } = req.body;

  if (!PANN_libelle || !PANN_TPEQ_codes || !Array.isArray(PANN_TPEQ_codes) || PANN_TPEQ_codes.length === 0) {
    return res.status(400).json({ message: "Les champs libellé et au moins un code d'équipement sont obligatoires." });
  }

  try {
    const existingEquipments = await TypeEquipment.find({ TPEQ_code: { $in: PANN_TPEQ_codes }, deleted_at: null });
    if (existingEquipments.length !== PANN_TPEQ_codes.length) {
      const foundCodes = existingEquipments.map(eq => eq.TPEQ_code);
      const missingCodes = PANN_TPEQ_codes.filter(code => !foundCodes.includes(code));
      return res.status(400).json({ message: `Un ou plusieurs types d'équipement spécifiés n'existent pas ou sont inactifs: ${missingCodes.join(', ')}.` });
    }

    const existingTypePanne = await TypePanne.findOne({ PANN_libelle, deleted_at: null });
    if (existingTypePanne) {
      return res.status(400).json({ message: "Ce type de panne existe déjà." });
    }

    const newTypePanne = new TypePanne({ PANN_libelle, PANN_TPEQ_codes });
    await newTypePanne.save();

   
    sendCreationNotifications(newTypePanne, existingEquipments);

    res.status(201).json({ message: "Type de panne créé avec succès", newTypePanne });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};


const updateTypePanne = async (req, res) => {
  try {
    const { id } = req.params;
    const { PANN_libelle, PANN_TPEQ_codes } = req.body;

    let typePanne = await TypePanne.findById(id);
    if (!typePanne) {
      return res.status(404).json({ message: "Type de panne non trouvé" });
    }

    if (PANN_TPEQ_codes !== undefined) {
      if (!Array.isArray(PANN_TPEQ_codes) || PANN_TPEQ_codes.length === 0) {
        return res.status(400).json({ message: "Au moins un code d'équipement est requis." });
      }
      const existingEquipments = await TypeEquipment.find({ TPEQ_code: { $in: PANN_TPEQ_codes }, deleted_at: null });
      if (existingEquipments.length !== PANN_TPEQ_codes.length) {
        return res.status(400).json({ message: `Un ou plusieurs types d'équipement sont invalides ou inactifs.` });
      }
      typePanne.PANN_TPEQ_codes = PANN_TPEQ_codes;
    }

    if (PANN_libelle !== undefined) {
        typePanne.PANN_libelle = PANN_libelle;
    }
    
    await typePanne.save();

   
    sendUpdateNotifications(typePanne);

    res.status(200).json({ message: "Type de panne mis à jour avec succès.", typePanne });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

const deleteTypePanne = async (req, res) => {
  try {
    const { id } = req.params;
    const typePanne = await TypePanne.findById(id);

    if (!typePanne) {
      return res.status(404).json({ message: "Type de panne non trouvé" });
    }
    if (typePanne.deleted_at) {
      return res.status(400).json({ message: "Ce type de panne est déjà inactif." });
    }

    typePanne.deleted_at = new Date();
    await typePanne.save();

  
    sendDeletionNotifications(typePanne);

    res.status(200).json({ message: "Type de panne marqué comme inactif avec succès." });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};



const getTypePannes = async (req, res) => {
  try {
    const query = { deleted_at: null };
    let typePannes = await TypePanne.find(query).lean();

    const typeEquipmentMap = {};
    const typeEquipments = await TypeEquipment.find({ deleted_at: null }, "TPEQ_code TPEQ_libelle").lean();
    typeEquipments.forEach((eq) => {
      typeEquipmentMap[eq.TPEQ_code] = eq.TPEQ_libelle;
    });

    typePannes = typePannes.map((panne) => {
      const associatedEquipmentsDetails = (panne.PANN_TPEQ_codes || []).map(code => ({
        code: code,
        libelle: typeEquipmentMap[code] || "Inconnu (ou inactif)",
      }));

      return {
        ...panne,
        PANN_TPEQ_codes_details: associatedEquipmentsDetails,
        PANN_TPEQ_libelles_display: associatedEquipmentsDetails.map(d => d.libelle).join(', ')
      };
    });

    res.status(200).json(typePannes);
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des types de pannes :", error);
    res.status(500).json({
      message: "Erreur serveur lors de la récupération des types de pannes.",
      error: error.message
    });
  }
};
   
const getTypePanneById = async (req, res) => {
  try {
    const typePanne = await TypePanne.findById(req.params.id).lean();
    if (!typePanne) {
      return res.status(404).json({ message: "Type de panne non trouvé" });
    }

    let associatedEquipmentsDetails = [];
    if (typePanne.PANN_TPEQ_codes && typePanne.PANN_TPEQ_codes.length > 0) {
       const linkedTypeEquipments = await TypeEquipment.find({
         TPEQ_code: { $in: typePanne.PANN_TPEQ_codes }
       }).lean();

       const typeEquipmentMap = {};
       linkedTypeEquipments.forEach(eq => {
           typeEquipmentMap[eq.TPEQ_code] = eq;
       });

       associatedEquipmentsDetails = typePanne.PANN_TPEQ_codes.map(code => {
           const eq = typeEquipmentMap[code];
           return {
               _id: eq ? eq._id : null,
               TPEQ_code: code,
               TPEQ_libelle: eq ? eq.TPEQ_libelle : "Inconnu",
               deleted_at: eq ? eq.deleted_at : new Date()
           };
       });
    }

    res.status(200).json({ ...typePanne, associatedEquipments: associatedEquipmentsDetails });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération du type de panne par ID :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

const getTypesPannesByTypeEquipmentCode = async (req, res) => {
  try {
    const { codeEquipment } = req.params;

    const typePannes = await TypePanne.find({ 
        PANN_TPEQ_codes: codeEquipment,
        deleted_at: null 
    });

    if (!typePannes || typePannes.length === 0) {
      return res.status(404).json({ message: "Aucun type de panne trouvé pour cet équipement." });
    }
    res.status(200).json(typePannes);
  } catch (error) {
    console.error("Erreur lors de la récupération des types de panne par type d'équipement :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};


module.exports = {
  createTypePanne,
  getTypePannes,
  getTypePanneById,
  getTypesPannesByTypeEquipmentCode,
  updateTypePanne,
  deleteTypePanne
};