const Recrutement = require("../models/Recrutement");
const Personnel = require("../models/Personnel");
const Notification = require("../models/Notification");
const { sendEmail } = require("../services/emailService");
const mongoose = require('mongoose');



async function sendCreationNotifications(recrutement) {
    try {
        const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] }, deleted_at: null });
        for (const admin of admins) {
            if (admin.PERS_email) {
                const subject = `[Alerte Admin] 📢 Nouvelle Offre de Recrutement`;
                const text = `Une nouvelle offre de recrutement a été publiée pour le poste : ${recrutement.RCUT_poste}.`;
                const html = `
                  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px;">
                    <div style="background-color: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                      <h1>📢 Nouvelle Offre de Recrutement</h1>
                    </div>
                    <div style="padding: 20px;">
                      <p>Bonjour <strong>${admin.PERS_nom_prenom}</strong>,</p>
                      <p>Une nouvelle offre de recrutement vient d'être publiée :</p>
                      <div style="background-color: #f9f9f9; border: 1px solid #eee; padding: 15px; border-radius: 5px;">
                        <p style="margin: 0;"><strong>Poste :</strong> ${recrutement.RCUT_poste}</p>
                        <p style="margin: 5px 0 0;"><strong>ID de l'offre :</strong> ${recrutement._id}</p>
                      </div>
                    </div>
                    <div style="background-color: #f4f4f4; color: #888; padding: 15px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px;">
                      <p>&copy; ${new Date().getFullYear()} 2BINFO-SYS</p>
                    </div>
                  </div>`;
                
                await sendEmail(admin.PERS_email, subject, text, html);
                await Notification.create({
                    NOTF_user: admin._id,
                    NOTF_userModel: "Personnel",
                    NOTF_userType: admin.PERS_role_acces,
                    NOTF_type: "email",
                    NOTF_message: `Email notifié à ${admin.PERS_nom_prenom} pour création de l'offre : ${recrutement.RCUT_poste}.`
                });
            }
        }
    } catch (err) {
        console.error("❌ Erreur lors de l'envoi des notifications (création recrutement) :", err);
    }
}



async function sendUpdateNotifications(recrutement) {
    try {
        const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] }, deleted_at: null });
        for (const admin of admins) {
            if (admin.PERS_email) {
                const subject = `[Alerte Admin] ✏️ Offre de Recrutement Modifiée`;
                const text = `L'offre de recrutement pour le poste '${recrutement.RCUT_poste}' a été modifiée.`;
                const html = `
                  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px;">
                    <div style="background-color: #ffc107; color: #333; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                      <h1>✏️ Offre de Recrutement Modifiée</h1>
                    </div>
                    <div style="padding: 20px;">
                      <p>Bonjour <strong>${admin.PERS_nom_prenom}</strong>,</p>
                      <p>L'offre de recrutement suivante a été mise à jour :</p>
                       <p style="background-color: #f9f9f9; border: 1px solid #eee; padding: 15px; border-radius: 5px; text-align: center; font-size: 16px;">
                        <strong>Poste : ${recrutement.RCUT_poste}</strong>
                      </p>
                    </div>
                    <div style="background-color: #f4f4f4; color: #888; padding: 15px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px;">
                      <p>&copy; ${new Date().getFullYear()} 2BINFO-SYS</p>
                    </div>
                  </div>`;

                await sendEmail(admin.PERS_email, subject, text, html);
                await Notification.create({
                    NOTF_user: admin._id,
                    NOTF_userModel: "Personnel",
                    NOTF_userType: admin.PERS_role_acces,
                    NOTF_type: "email",
                    NOTF_message: `Email notifié à ${admin.PERS_nom_prenom} pour MàJ de l'offre : ${recrutement.RCUT_poste}.`
                });
            }
        }
    } catch (err) {
        console.error("❌ Erreur lors de l'envoi des notifications (MàJ recrutement) :", err);
    }
}



async function sendDeletionNotifications(recrutement) {
    try {
        const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] }, deleted_at: null });
        for (const admin of admins) {
            if (admin.PERS_email) {
                const subject = `[Alerte Admin] 🗑️ Offre de Recrutement Désactivée`;
                const text = `L'offre de recrutement pour le poste '${recrutement.RCUT_poste}' a été marquée comme inactive.`;
                const html = `
                  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px;">
                    <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                      <h1>🗑️ Offre de Recrutement Désactivée</h1>
                    </div>
                    <div style="padding: 20px;">
                      <p>Bonjour <strong>${admin.PERS_nom_prenom}</strong>,</p>
                      <p>L'offre de recrutement suivante a été marquée comme inactive et archivée :</p>
                      <p style="background-color: #f9f9f9; border: 1px solid #eee; padding: 15px; border-radius: 5px; text-align: center; font-size: 16px;">
                        <strong>Poste : ${recrutement.RCUT_poste}</strong>
                      </p>
                    </div>
                    <div style="background-color: #f4f4f4; color: #888; padding: 15px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px;">
                      <p>&copy; ${new Date().getFullYear()} 2BINFO-SYS</p>
                    </div>
                  </div>`;
                
                await sendEmail(admin.PERS_email, subject, text, html);
                await Notification.create({
                    NOTF_user: admin._id,
                    NOTF_userModel: "Personnel",
                    NOTF_userType: admin.PERS_role_acces,
                    NOTF_type: "email",
                    NOTF_message: `Email notifié à ${admin.PERS_nom_prenom} pour désactivation de l'offre : ${recrutement.RCUT_poste}.`
                });
            }
        }
    } catch (err) {
        console.error("❌ Erreur lors de l'envoi des notifications (suppression recrutement) :", err);
    }
}




exports.createRecrutement = async (req, res) => {
    try {
        const recrutement = await Recrutement.create(req.body);

      
        sendCreationNotifications(recrutement);

        res.status(201).json(recrutement);
    } catch (err) {
        console.error("❌ Erreur lors de la création de recrutement :", err);
        res.status(400).json({ error: err.message });
    }
};

exports.getRecrutements = async (req, res) => {
    try {
        const recrutements = await Recrutement.find({ deleted_at: null });
        res.status(200).json(recrutements);
    } catch (err) {
        console.error("❌ Erreur lors de la récupération des offres de recrutement :", err);
        res.status(500).json({
             message: "Erreur serveur lors de la récupération des offres de recrutement.",
             error: err.message
        });
    }
};

exports.getRecrutementById = async (req, res) => {
    try {
        const recrutement = await Recrutement.findById(req.params.id);
        if (!recrutement) return res.status(404).json({ message: "Offre non trouvée" });
        res.status(200).json(recrutement);
    } catch (err) {
        res.status(404).json({ error: "Non trouvé" });
    }
};

exports.updateRecrutement = async (req, res) => {
    try {
        const updated = await Recrutement.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) 
            return res.status(404).json({ message: "Offre de recrutement non trouvée" });

     
        sendUpdateNotifications(updated);

        res.status(200).json(updated);
    } catch (err) {
        console.error("❌ Erreur lors de la mise à jour de recrutement :", err);
        res.status(400).json({ error: err.message });
    }
};

exports.deleteRecrutement = async (req, res) => {
    try {
        const recrutementId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(recrutementId)) {
            return res.status(400).json({ message: "ID de l'offre de recrutement invalide." });
        }

        const updatedRecrutement = await Recrutement.findByIdAndUpdate(
            recrutementId,
            { $set: { deleted_at: new Date() } },
            { new: true }
        );

        if (!updatedRecrutement) {
            return res.status(404).json({ message: "Offre de recrutement non trouvée." });
        }
        
       
        sendDeletionNotifications(updatedRecrutement);

        res.status(200).json({ message: "Offre de recrutement marquée comme inactive avec succès.", recrutement: updatedRecrutement });
    } catch (err) {
        console.error("❌ Erreur lors de la suppression logique de l'offre de recrutement :", err);
        res.status(500).json({
             message: "Erreur serveur lors de la suppression logique de l'offre de recrutement.",
             error: err.message
        });
    }
};




exports.addCandidatToRecrutement = async (req, res) => {
    try {
        const { id } = req.params;
        const newCandidat = req.body;

        const updatedRecrutement = await Recrutement.findByIdAndUpdate(
            id,
            { $push: { RCUT_candidats: newCandidat } },
            { new: true, runValidators: true }
        );

        if (!updatedRecrutement) return res.status(404).json({ message: "Offre de recrutement non trouvée" });

        res.status(200).json(updatedRecrutement);
    } catch (err) {
        console.error("❌ Erreur lors de l'ajout d'un candidat :", err);
        res.status(400).json({ error: err.message });
    }
};

exports.updateCandidatStatut = async (req, res) => {
    try {
        const { id, candidatId } = req.params;
        const { statut, commentaires } = req.body;

        const updatedRecrutement = await Recrutement.findOneAndUpdate(
            { "_id": id, "RCUT_candidats._id": candidatId },
            {
                "$set": {
                    "RCUT_candidats.$.statut": statut,
                    "RCUT_candidats.$.commentaires": commentaires
                }
            },
            { new: true, runValidators: true }
        );

        if (!updatedRecrutement) return res.status(404).json({ message: "Offre de recrutement ou candidat non trouvé" });

        res.status(200).json(updatedRecrutement);
    } catch (err) {
        console.error("❌ Erreur lors de la mise à jour du statut du candidat :", err);
        res.status(400).json({ error: err.message });
    }
};

exports.removeCandidatFromRecrutement = async (req, res) => {
    try {
        const { id, candidatId } = req.params;

         if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(candidatId)) {
             return res.status(400).json({ message: "IDs de l'offre ou du candidat invalides." });
         }

        const updatedRecrutement = await Recrutement.findByIdAndUpdate(
            id,
            { $pull: { RCUT_candidats: { _id: candidatId } } },
            { new: true }
        );

        if (!updatedRecrutement) {
            return res.status(404).json({ message: "Offre de recrutement non trouvée." });
        }

        res.status(200).json(updatedRecrutement);
    } catch (err) {
        console.error("❌ Erreur lors de la suppression physique d'un candidat :", err);
        res.status(500).json({
             message: "Erreur serveur lors de la suppression d'un candidat.",
             error: err.message
        });
    }
};