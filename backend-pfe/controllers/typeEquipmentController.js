const mongoose = require('mongoose');
const TypeEquipment = require("../models/TypeEquipment");
const Personnel = require("../models/Personnel");
const Notification = require("../models/Notification");
const { sendEmail } = require("../services/emailService");


async function sendCreationNotifications(typeEquipment) {
    try {
        const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] }, deleted_at: null });
        const subject = `[Solution Ticketing] Nouveau Type d'Équipement Créé`;

        for (const admin of admins) {
            if (admin.PERS_email) {
                const textMessage = `Bonjour ${admin.PERS_nom_prenom}, un nouveau type d'équipement a été ajouté : ${typeEquipment.TPEQ_libelle} (Code: ${typeEquipment.TPEQ_code}).`;
                const htmlMessage = `
                  <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                    <h2 style="color: #0056b3;">Nouveau Type d'Équipement</h2>
                    <p>Un nouveau type d'équipement a été ajouté au système :</p>
                    <ul style="list-style-type: none; padding: 0;">
                      <li><strong>Libellé :</strong> ${typeEquipment.TPEQ_libelle}</li>
                      <li><strong>Code :</strong> ${typeEquipment.TPEQ_code}</li>
                    </ul>
                  </div>`;
                
                await sendEmail(admin.PERS_email, subject, textMessage, htmlMessage);
                
                await Notification.create({
                    NOTF_user: admin._id,
                    NOTF_userModel: "Personnel",
                    NOTF_userType: admin.PERS_role_acces,
                    NOTF_type: "email",
                    NOTF_message: `Notification de création du type d'équipement '${typeEquipment.TPEQ_libelle}' envoyée.`
                });
            }
        }
    } catch (error) {
        console.error("❌ Erreur lors de l'envoi des notifications de création (TypeEquipment):", error);
    }
}


async function sendUpdateNotifications(typeEquipment) {
    try {
        const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] }, deleted_at: null });
        const subject = `[Solution Ticketing] Mise à Jour d'un Type d'Équipement`;

        for (const admin of admins) {
            if (admin.PERS_email) {
                const textMessage = `Le type d'équipement (Code: ${typeEquipment.TPEQ_code}) a été mis à jour. Nouveau libellé : ${typeEquipment.TPEQ_libelle}.`;
                const htmlMessage = `
                  <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                    <h2 style="color: #0056b3;">Mise à Jour d'un Type d'Équipement</h2>
                    <p>Le type d'équipement avec le code <strong>${typeEquipment.TPEQ_code}</strong> a été mis à jour. Le nouveau libellé est : <strong>${typeEquipment.TPEQ_libelle}</strong>.</p>
                  </div>`;
                
                await sendEmail(admin.PERS_email, subject, textMessage, htmlMessage);
                
                await Notification.create({
                    NOTF_user: admin._id,
                    NOTF_userModel: "Personnel",
                    NOTF_userType: admin.PERS_role_acces,
                    NOTF_type: "email",
                    NOTF_message: `Notification de mise à jour du type d'équipement '${typeEquipment.TPEQ_libelle}' envoyée.`
                });
            }
        }
    } catch (error) {
        console.error("❌ Erreur lors de l'envoi des notifications de mise à jour (TypeEquipment):", error);
    }
}


async function sendDeletionNotifications(typeEquipment) {
    try {
        const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] }, deleted_at: null });
        const subject = `[Solution Ticketing] Un Type d'Équipement a été désactivé`;

        for (const admin of admins) {
            if (admin.PERS_email) {
                const textMessage = `Le type d'équipement "${typeEquipment.TPEQ_libelle}" (Code: ${typeEquipment.TPEQ_code}) a été marqué comme inactif.`;
                const htmlMessage = `
                  <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                    <h2 style="color: #dc3545;">Alerte : Type d'Équipement Désactivé</h2>
                    <p>Le type d'équipement suivant a été marqué comme <strong>inactif</strong> :</p>
                    <ul style="list-style-type: none; padding: 0;">
                      <li><strong>Libellé :</strong> ${typeEquipment.TPEQ_libelle}</li>
                      <li><strong>Code :</strong> ${typeEquipment.TPEQ_code}</li>
                    </ul>
                  </div>`;
                
                await sendEmail(admin.PERS_email, subject, textMessage, htmlMessage);
                
                await Notification.create({
                    NOTF_user: admin._id,
                    NOTF_userModel: "Personnel",
                    NOTF_userType: admin.PERS_role_acces,
                    NOTF_type: "email",
                    NOTF_message: `Notification de désactivation du type d'équipement '${typeEquipment.TPEQ_libelle}' envoyée.`
                });
            }
        }
    } catch (error) {
        console.error("❌ Erreur lors de l'envoi des notifications de suppression (TypeEquipment):", error);
    }
}



const createTypeEquipment = async (req, res) => {
  try {
    const { TPEQ_libelle } = req.body;
    const existingType = await TypeEquipment.findOne({ TPEQ_libelle, deleted_at: null });
    if (existingType) {
      return res.status(400).json({ message: "Ce type d'équipement existe déjà !" });
    }

    const newTypeEquipment = new TypeEquipment({ TPEQ_libelle });
    await newTypeEquipment.save();

   
    sendCreationNotifications(newTypeEquipment);

    res.status(201).json({ message: "Type d'équipement créé avec succès", newTypeEquipment });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

const updateTypeEquipment = async (req, res) => {
  try {
    const { id } = req.params;
    const { TPEQ_libelle } = req.body;

    const updatedType = await TypeEquipment.findByIdAndUpdate(
      id, { TPEQ_libelle }, { new: true, runValidators: true }
    );

    if (!updatedType) {
      return res.status(404).json({ message: "Type d'équipement non trouvé" });
    }

   
    sendUpdateNotifications(updatedType);

    res.status(200).json({ message: "Type d'équipement mis à jour avec succès", updatedType });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

const deleteTypeEquipment = async (req, res) => {
  try {
    const { id } = req.params;
    const typeEquipment = await TypeEquipment.findById(id);

    if (!typeEquipment) {
      return res.status(404).json({ message: "Type d'équipement non trouvé" });
    }
    if (typeEquipment.deleted_at) {
      return res.status(400).json({ message: "Ce type d'équipement est déjà inactif." });
    }

    typeEquipment.deleted_at = new Date();
    await typeEquipment.save();

 
    sendDeletionNotifications(typeEquipment);

    res.status(200).json({ message: "Type d'équipement marqué comme inactif avec succès.", typeEquipment });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

const getTypeEquipments = async (req, res) => {
  try {
    const types = await TypeEquipment.find({ deleted_at: null });
    res.status(200).json(types);
  } catch (error) {
    res.status(500).json({
         message: "Erreur serveur lors de la récupération des types d'équipements.",
         error: error.message
    });
  }
};

module.exports = {
  createTypeEquipment,
  getTypeEquipments,
  updateTypeEquipment,
  deleteTypeEquipment,
};